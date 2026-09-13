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

    const fillEvent = await prisma.waitlistFillEvent.create({
      data: {
        classId,
        triggeredByBookingId: cancelledBookingId,
        status: 'active'
      }
    });

    const classDetails = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classDetails || classDetails.availableSpots < 1) {
      console.log(`No spots available for class ${classId}`);
      await this.updateFillEvent(fillEvent.id, { status: 'cancelled' });
      return;
    }

    const waitlist = await this.getScoredWaitlist(classId);

    if (waitlist.length === 0) {
      console.log(`No waitlist entries for class ${classId}`);
      await this.updateFillEvent(fillEvent.id, { status: 'expired' });
      return;
    }

    const inviteCount = Math.min(
      this.settings.maxSimultaneousInvites,
      waitlist.length
    );

    const topCandidates = waitlist.slice(0, inviteCount);
    
    await this.sendInvites(topCandidates, classId, fillEvent.id);

    await this.updateFillEvent(fillEvent.id, {
      invitesSent: inviteCount
    });

    if (this.settings.autoExpandAfterMinutes > 0) {
      setTimeout(
        () => this.expandInvites(classId, fillEvent.id, waitlist.slice(inviteCount)),
        this.settings!.autoExpandAfterMinutes * 60 * 1000
      );
    }
  }

  private async getScoredWaitlist(classId: string): Promise<WaitlistMember[]> {
    const entries = await prisma.waitlistEntry.findMany({
      where: {
        classId,
        status: 'waiting'
      },
      orderBy: {
        position: 'asc'
      }
    });

    const scoredMembers: WaitlistMember[] = [];

    for (const entry of entries) {
      const member = await prisma.member.findUnique({
        where: { id: entry.memberId }
      });

      if (!member) continue;

      const hasConflictingBooking = await this.hasConflictingBooking(
        entry.memberId,
        classId
      );

      if (hasConflictingBooking) continue;

      const responseLikelihood = await this.scoreResponseLikelihood(entry.memberId);

      scoredMembers.push({
        memberId: entry.memberId,
        position: entry.position,
        phone: member.phone,
        firstName: member.firstName,
        responseLikelihood
      });
    }

    return scoredMembers.sort((a, b) => b.responseLikelihood - a.responseLikelihood);
  }

  private async scoreResponseLikelihood(memberId: string): Promise<number> {
    let score = 50;

    const pastFills = await prisma.waitlistFillEvent.findMany({
      where: {
        filledByMemberId: memberId
      }
    });

    if (pastFills.length > 0) {
      score += Math.min(20, pastFills.length * 5);
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId }
    });

    if (member) {
      if (member.membershipType === 'monthly') score += 10;
      if (member.membershipType === 'annual') score += 15;
      
      const bookingCount = await prisma.booking.count({
        where: { memberId }
      });
      
      if (bookingCount < 5) score += 10;
    }

    return Math.min(100, score);
  }

  private async hasConflictingBooking(memberId: string, classId: string): Promise<boolean> {
    const targetClass = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!targetClass) return false;

    // Check for confirmed bookings during the target class window (+/- 30 mins)
    const windowStart = new Date(targetClass.startTime.getTime() - 30 * 60 * 1000);
    const windowEnd = new Date(targetClass.endTime.getTime() + 30 * 60 * 1000);

    const conflictingBookings = await prisma.booking.findMany({
      where: {
        memberId,
        status: 'confirmed'
      }
    });

    // Check if any of member's confirmed bookings fall into target class time window
    for (const booking of conflictingBookings) {
      const bookedClass = await prisma.class.findUnique({
        where: { id: booking.classId },
        select: { startTime: true }
      });

      if (bookedClass && bookedClass.startTime >= windowStart && bookedClass.startTime <= windowEnd) {
        return true;
      }
    }

    return false;
  }

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
      await prisma.pendingInvite.create({
        data: {
          classId,
          memberId: candidate.memberId,
          phone: candidate.phone,
          position: candidate.position,
          status: 'sent'
        }
      });

      const message = {
        to: candidate.phone,
        templateName: WHATSAPP_TEMPLATES.SPOT_AVAILABLE,
        params: [
          candidate.firstName,
          teacher,
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

  private async expandInvites(
    classId: string,
    fillEventId: string,
    remainingCandidates: WaitlistMember[]
  ): Promise<void> {
    const fillEvent = await prisma.waitlistFillEvent.findUnique({
      where: { id: fillEventId }
    });

    if (!fillEvent || fillEvent.filled) return;

    const batchSize = this.settings?.maxSimultaneousInvites || 3;
    const nextBatch = remainingCandidates.slice(0, batchSize);

    if (nextBatch.length === 0) {
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

  async processReply(phone: string, reply: string): Promise<void> {
    const normalizedReply = reply.trim().toUpperCase();

    if (normalizedReply !== 'YES' && normalizedReply !== 'BOOK') {
      return;
    }

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

    const result = await this.claimSpot(
      pendingInvite.classId,
      pendingInvite.memberId,
      pendingInvite.id
    );

    if (!this.whatsapp) return;

    const member = await prisma.member.findUnique({
      where: { id: pendingInvite.memberId }
    });

    const classDetails = await prisma.class.findUnique({
      where: { id: pendingInvite.classId }
    });

    if (!member || !classDetails) return;

    if (result.success) {
      await this.whatsapp.sendMessage({
        to: phone,
        templateName: WHATSAPP_TEMPLATES.SPOT_CONFIRMED,
        params: [
          classDetails.name,
          this.formatTime(classDetails.startTime)
        ]
      });

      await this.markOtherInvitesTaken(pendingInvite.classId, pendingInvite.id);
    } else {
      await this.whatsapp.sendMessage({
        to: phone,
        templateName: WHATSAPP_TEMPLATES.SPOT_TAKEN,
        params: [
          member.firstName,
          classDetails.name
        ]
      });
    }

    await prisma.pendingInvite.update({
      where: { id: pendingInvite.id },
      data: {
        status: result.success ? 'responded' : 'taken',
        respondedAt: new Date(),
        response: reply
      }
    });
  }

  async claimSpot(
    classId: string,
    memberId: string,
    inviteId: string
  ): Promise<ClaimResult> {
    try {
      const result = await prisma.$transaction(async (trx: any) => {
        const classDetails = await trx.class.findUnique({
          where: { id: classId },
          select: { availableSpots: true, price: true }
        });

        if (!classDetails || classDetails.availableSpots < 1) {
          return { success: false, reason: 'spot_taken' as const };
        }

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

        await trx.class.update({
          where: { id: classId },
          data: { availableSpots: { decrement: 1 } }
        });

        const booking = await trx.booking.create({
          data: {
            classId,
            memberId,
            status: 'confirmed',
            paymentStatus: 'completed',
            amountPaid: classDetails.price
          }
        });

        await trx.waitlistEntry.updateMany({
          where: {
            classId,
            memberId
          },
          data: { status: 'filled' }
        });

        return { success: true, bookingId: booking.id };
      });

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

  async sendRebookNudges(classId: string): Promise<void> {
    if (!this.settings?.rebookNudgeEnabled) return;
    if (!this.whatsapp) return;

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

      const recentNudge = await prisma.rebookNudgeLog.findFirst({
        where: {
          memberId: attendee.memberId,
          sentAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });

      if (recentNudge) continue;

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

      await prisma.rebookNudgeLog.create({
        data: {
          memberId: attendee.memberId,
          classId,
          nudgedClassId: nextClass.id
        }
      });
    }
  }

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

  private async getTeacherName(teacherId: string): Promise<string> {
    return 'the instructor';
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

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
