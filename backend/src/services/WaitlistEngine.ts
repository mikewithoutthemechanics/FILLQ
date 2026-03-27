import { PrismaClient } from '@prisma/client';
import { WhatsAppService, WHATSAPP_TEMPLATES, createWhatsAppService } from './WhatsAppService.js';
import { noShowScorer } from './NoShowScorer.js';
import type { 
  WaitlistMember, 
  ClaimResult,
  FillIQSettings 
} from '../types/index.js';

const prisma = new PrismaClient();

/**
 * Waitlist Fill Engine
 * 
 * Automatically fills cancelled spots by:
 * 1. Detecting cancellation
 * 2. Scoring waitlist members for response likelihood
 * 3. Sending WhatsApp invites to top candidates
 * 4. Processing first reply and auto-booking
 * 5. Managing retry/expiry logic
 */
export class WaitlistEngine {
  private whatsapp: WhatsAppService | null = null;
  private settings: FillIQSettings | null = null;
  private studioId: string;

  constructor(studioId: string) {
    this.studioId = studioId;
  }

  /**
   * Initialize with studio settings
   */
  async initialize(): Promise<void> {
    this.whatsapp = await createWhatsAppService(this.studioId);
    
    // Load settings from DB
    const dbSettings = await prisma.fillIQSettings.findUnique({
      where: { studioId: this.studioId }
    });

    if (dbSettings) {
      this.settings = dbSettings as unknown as FillIQSettings;
    }
  }

  /**
   * Trigger waitlist fill process when a booking is cancelled
   */
  async trigger(classId: string, cancelledBookingId: string): Promise<void> {
    if (!this.settings?.autoFillEnabled) {
      console.log(`Auto-fill disabled for studio ${this.studioId}`);
      return;
    }

    // Create fill event
    const fillEvent = await prisma.waitlistFillEvent.create({
      data: {
        classId,
        triggeredByBookingId: cancelledBookingId,
        status: 'active'
      }
    });

    // Get available spot count
    const classDetails = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classDetails || classDetails.availableSpots < 1) {
      console.log(`No spots available for class ${classId}`);
      await this.updateFillEvent(fillEvent.id, { status: 'cancelled' });
      return;
    }

    // Get and score waitlist
    const waitlist = await this.getScoredWaitlist(classId);

    if (waitlist.length === 0) {
      console.log(`No waitlist entries for class ${classId}`);
      await this.updateFillEvent(fillEvent.id, { status: 'expired' });
      return;
    }

    // Send invites to top N candidates
    const inviteCount = Math.min(
      this.settings.maxSimultaneousInvites,
      waitlist.length
    );

    const topCandidates = waitlist.slice(0, inviteCount);
    
    await this.sendInvites(topCandidates, classId, fillEvent.id);

    // Update fill event
    await this.updateFillEvent(fillEvent.id, {
      invitesSent: inviteCount
    });

    // Schedule expansion if needed
    if (this.settings.autoExpandAfterMinutes > 0) {
      setTimeout(
        () => this.expandInvites(classId, fillEvent.id, waitlist.slice(inviteCount)),
        this.settings!.autoExpandAfterMinutes * 60 * 1000
      );
    }
  }

  /**
   * Get waitlist members scored by response likelihood
   */
  private async getScoredWaitlist(classId: string): Promise<WaitlistMember[]> {
    const entries = await prisma.waitlistEntry.findMany({
      where: {
        classId,
        status: 'waiting'
      },
      orderBy: {
        position: 'asc'
      },
      include: {
        // Join with member to get phone and name
        // Note: In real implementation, this would use a proper relation
      }
    });

    // Score each member
    const scoredMembers: WaitlistMember[] = [];

    for (const entry of entries) {
      const member = await prisma.member.findUnique({
        where: { id: entry.memberId }
      });

      if (!member) continue;

      // Skip if member already has booking at same time
      const hasConflictingBooking = await this.hasConflictingBooking(
        entry.memberId,
        classId
      );

      if (hasConflictingBooking) continue;

      // Score based on position, past response rate, membership type
      const responseLikelihood = await this.scoreResponseLikelihood(entry.memberId);

      scoredMembers.push({
        memberId: entry.memberId,
        position: entry.position,
        phone: member.phone,
        firstName: member.firstName,
        responseLikelihood
      });
    }

    // Sort by response likelihood (highest first)
    return scoredMembers.sort((a, b) => b.responseLikelihood - a.responseLikelihood);
  }

  /**
   * Score a member's likelihood to respond quickly
   */
  private async scoreResponseLikelihood(memberId: string): Promise<number> {
    let score = 50; // Base score

    // Check past fill event response rate
    const pastFills = await prisma.waitlistFillEvent.findMany({
      where: {
        filledByMemberId: memberId
      }
    });

    if (pastFills.length > 0) {
      // Past success increases score
      score += Math.min(20, pastFills.length * 5);
    }

    // Check member engagement level
    const member = await prisma.member.findUnique({
      where: { id: memberId }
    });

    if (member) {
      // Monthly/annual members more likely to respond
      if (member.membershipType === 'monthly') score += 10;
      if (member.membershipType === 'annual') score += 15;
      
      // New members very responsive
      const bookingCount = await prisma.booking.count({
        where: { memberId }
      });
      
      if (bookingCount < 5) score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Check if member has a booking at the same time
   */
  private async hasConflictingBooking(memberId: string, classId: string): Promise<boolean> {
    const targetClass = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!targetClass) return false;

    const conflictingBookings = await prisma.booking.findMany({
      where: {
        memberId,
        status: 'confirmed',
        class: {
          startTime: {
            gte: new Date(targetClass.startTime.getTime() - 30 * 60 * 1000), // 30 min before
            lte: new Date(targetClass.endTime.getTime() + 30 * 60 * 1000)    // 30 min after
          }
        }
      },
      include: {
        class: true
      }
    });

    return conflictingBookings.length > 0;
  }

  /**
   * Send WhatsApp invites to candidates
   */
  private async sendInvites(
    candidates: WaitlistMember[],
    classId: string,
    fillEventId: string
  ): Promise<void> {
    if (!this.whatsapp) {
      console.error('WhatsApp service not initialized');
      return;
    }

    const classDetails = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classDetails) return;

    const teacher = await this.getTeacherName(classDetails.teacherId);

    for (const candidate of candidates) {
      // Create pending invite record
      await prisma.pendingInvite.create({
        data: {
          classId,
          memberId: candidate.memberId,
          phone: candidate.phone,
          position: candidate.position,
          status: 'sent'
        }
      });

      // Send WhatsApp
      const message = {
        to: candidate.phone,
        templateName: WHATSAPP_TEMPLATES.SPOT_AVAILABLE,
        params: [
          candidate.firstName,
          teacher, // Person who cancelled (we'd need to track this)
          classDetails.name,
          this.formatTime(classDetails.startTime)
        ]
      };

      const result = await this.whatsapp.sendMessage(message);

      if (!result.success) {
        console.error(`Failed to send invite to ${candidate.phone}:`, result.error);
      }
    }
  }

  /**
   * Expand invites to next batch if first batch didn't fill
   */
  private async expandInvites(
    classId: string,
    fillEventId: string,
    remainingCandidates: WaitlistMember[]
  ): Promise<void> {
    // Check if already filled
    const fillEvent = await prisma.waitlistFillEvent.findUnique({
      where: { id: fillEventId }
    });

    if (!fillEvent || fillEvent.filled) return;

    // Send to next batch
    const batchSize = this.settings?.maxSimultaneousInvites || 3;
    const nextBatch = remainingCandidates.slice(0, batchSize);

    if (nextBatch.length === 0) {
      // No more candidates, mark as expired
      await this.updateFillEvent(fillEventId, { 
        status: 'expired',
        completedAt: new Date()
      });
      return;
    }

    await this.sendInvites(nextBatch, classId, fillEventId);

    await this.updateFillEvent(fillEventId, {
      invitesSent: fillEvent.invitesSent + nextBatch.length
    });
  }

  /**
   * Process inbound reply from WhatsApp
   */
  async processReply(phone: string, reply: string): Promise<void> {
    const normalizedReply = reply.trim().toUpperCase();

    if (normalizedReply !== 'YES' && normalizedReply !== 'BOOK') {
      return; // Not a claim attempt
    }

    // Find active pending invite
    const pendingInvite = await prisma.pendingInvite.findFirst({
      where: {
        phone,
        status: 'sent'
      },
      orderBy: {
        sentAt: 'desc'
      }
    });

    if (!pendingInvite) {
      console.log(`No pending invite found for ${phone}`);
      return;
    }

    // Attempt claim
    const result = await this.claimSpot(
      pendingInvite.classId,
      pendingInvite.memberId,
      pendingInvite.id
    );

    // Send response
    if (!this.whatsapp) return;

    const member = await prisma.member.findUnique({
      where: { id: pendingInvite.memberId }
    });

    const classDetails = await prisma.class.findUnique({
      where: { id: pendingInvite.classId }
    });

    if (!member || !classDetails) return;

    if (result.success) {
      // Send confirmation
      await this.whatsapp.sendMessage({
        to: phone,
        templateName: WHATSAPP_TEMPLATES.SPOT_CONFIRMED,
        params: [
          classDetails.name,
          this.formatTime(classDetails.startTime)
        ]
      });

      // Mark other invites as taken
      await this.markOtherInvitesTaken(pendingInvite.classId, pendingInvite.id);
    } else {
      // Send "spot taken" message
      await this.whatsapp.sendMessage({
        to: phone,
        templateName: WHATSAPP_TEMPLATES.SPOT_TAKEN,
        params: [
          member.firstName,
          classDetails.name
        ]
      });
    }

    // Update pending invite
    await prisma.pendingInvite.update({
      where: { id: pendingInvite.id },
      data: {
        status: result.success ? 'responded' : 'taken',
        respondedAt: new Date(),
        response: reply
      }
    });
  }

  /**
   * Claim a spot for a member (atomic operation)
   */
  async claimSpot(
    classId: string,
    memberId: string,
    inviteId: string
  ): Promise<ClaimResult> {
    try {
      // Use database transaction for atomicity
      const result = await prisma.$transaction(async (trx) => {
        // Lock the class row
        const classDetails = await trx.class.findUnique({
          where: { id: classId },
          select: { availableSpots: true, price: true }
        });

        if (!classDetails || classDetails.availableSpots < 1) {
          return { success: false, reason: 'spot_taken' as const };
        }

        // Check if member already booked
        const existingBooking = await trx.booking.findFirst({
          where: {
            classId,
            memberId,
            status: 'confirmed'
          }
        });

        if (existingBooking) {
          return { success: false, reason: 'already_booked' as const };
        }

        // Decrement available spots
        await trx.class.update({
          where: { id: classId },
          data: { availableSpots: { decrement: 1 } }
        });

        // Create booking
        const booking = await trx.booking.create({
          data: {
            classId,
            memberId,
            status: 'confirmed',
            paymentStatus: 'completed', // Assume paid via waitlist fill
            amountPaid: classDetails.price
          }
        });

        // Update waitlist entry
        await trx.waitlistEntry.updateMany({
          where: {
            classId,
            memberId
          },
          data: { status: 'filled' }
        });

        return { success: true, bookingId: booking.id };
      });

      // Update fill event if successful
      if (result.success && result.bookingId) {
        const fillEvent = await prisma.waitlistFillEvent.findFirst({
          where: {
            classId,
            status: 'active'
          }
        });

        if (fillEvent) {
          const classDetails = await prisma.class.findUnique({
            where: { id: classId }
          });

          await prisma.waitlistFillEvent.update({
            where: { id: fillEvent.id },
            data: {
              filled: true,
              filledByMemberId: memberId,
              fillTimeSeconds: Math.floor(
                (Date.now() - fillEvent.triggeredAt.getTime()) / 1000
              ),
              revenueRecovered: classDetails?.price || 0,
              status: 'filled',
              completedAt: new Date()
            }
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Claim spot error:', error);
      return { success: false, reason: 'error' };
    }
  }

  /**
   * Mark other pending invites as taken for a class
   */
  private async markOtherInvitesTaken(classId: string, winningInviteId: string): Promise<void> {
    await prisma.pendingInvite.updateMany({
      where: {
        classId,
        id: { not: winningInviteId },
        status: 'sent'
      },
      data: { status: 'taken' }
    });
  }

  /**
   * Send rebook nudges after class ends
   */
  async sendRebookNudges(classId: string): Promise<void> {
    if (!this.settings?.rebookNudgeEnabled) return;
    if (!this.whatsapp) return;

    // Get attendees
    const attendees = await prisma.booking.findMany({
      where: {
        classId,
        status: 'attended'
      }
    });

    const classDetails = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classDetails) return;

    // Find next occurrence of same class type
    const nextClass = await prisma.class.findFirst({
      where: {
        classType: classDetails.classType,
        startTime: {
          gt: new Date()
        },
        availableSpots: { gt: 0 },
        status: 'scheduled'
      },
      orderBy: { startTime: 'asc' }
    });

    if (!nextClass) return;

    const teacher = await this.getTeacherName(nextClass.teacherId);

    for (const attendee of attendees) {
      // Check if already booked for next class
      const hasNextBooking = await prisma.booking.findFirst({
        where: {
          memberId: attendee.memberId,
          classId: nextClass.id,
          status: 'confirmed'
        }
      });

      if (hasNextBooking) continue;

      const member = await prisma.member.findUnique({
        where: { id: attendee.memberId }
      });

      if (!member) continue;

      // Check for recent nudge
      const recentNudge = await prisma.rebookNudgeLog.findFirst({
        where: {
          memberId: attendee.memberId,
          sentAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });

      if (recentNudge) continue;

      // Send nudge
      await this.whatsapp.sendMessage({
        to: member.phone,
        templateName: WHATSAPP_TEMPLATES.REBOOK_NUDGE,
        params: [
          member.firstName,
          classDetails.name,
          this.formatDate(classDetails.startTime),
          teacher,
          this.formatDateTime(nextClass.startTime)
        ]
      });

      // Log nudge
      await prisma.rebookNudgeLog.create({
        data: {
          memberId: attendee.memberId,
          classId,
          nudgedClassId: nextClass.id
        }
      });
    }
  }

  /**
   * Update fill event
   */
  private async updateFillEvent(
    eventId: string,
    data: Partial<{
      invitesSent: number;
      status: string;
      completedAt: Date;
    }>
  ): Promise<void> {
    await prisma.waitlistFillEvent.update({
      where: { id: eventId },
      data
    });
  }

  /**
   * Get teacher name
   */
  private async getTeacherName(teacherId: string): Promise<string> {
    // In real implementation, query teacher table
    // For now, return generic
    return 'the instructor';
  }

  /**
   * Format time
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  /**
   * Format datetime
   */
  private formatDateTime(date: Date): string {
    return date.toLocaleString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}

export const waitlistEngine = new WaitlistEngine('default-studio');
