import { PrismaClient } from '@prisma/client';
import type { ChurnFactors, ChurnScoreResult, FillIQSettings } from '../types/index.js';

const prisma = new PrismaClient();

/**
 * Churn Early-Warning System
 * 
 * Scores members on churn likelihood nightly.
 * Flags members with score >= 65 for studio owner attention.
 * Can auto-trigger retention nudges for highest risk members.
 */
export class ChurnScorer {
  private settings: FillIQSettings | null = null;
  private studioId: string;

  constructor(studioId: string) {
    this.studioId = studioId;
  }

  /**
   * Initialize with studio settings
   */
  async initialize(): Promise<void> {
    const dbSettings = await prisma.fillIQSettings.findUnique({
      where: { studioId: this.studioId }
    });

    if (dbSettings) {
      this.settings = dbSettings as unknown as FillIQSettings;
    }
  }

  /**
   * Calculate churn risk score
   */
  calculateChurnRisk(factors: ChurnFactors): ChurnScoreResult {
    let score = 0;

    // Days since last attendance — strongest signal
    if (factors.daysSinceLastAttendance > 21) score += 35;
    else if (factors.daysSinceLastAttendance > 14) score += 20;
    else if (factors.daysSinceLastAttendance > 10) score += 10;

    // Attendance rate decline
    const rateDrop = factors.attendanceRateLast90Days - factors.attendanceRateLast30Days;
    if (rateDrop > 0.4) score += 20;
    else if (rateDrop > 0.2) score += 10;

    // Consecutive missed classes (booked but didn't show, didn't cancel)
    if (factors.missedClassesInRow >= 3) score += 15;
    else if (factors.missedClassesInRow >= 2) score += 8;

    // New member (< 10 lifetime classes) is higher churn risk
    if (factors.lifetimeClassCount < 10) score += 10;

    // Payment failure
    score += factors.paymentFailures * 8;

    // Hasn't opened app in 14 days
    if (!factors.hasOpenedAppLast14Days) score += 10;

    const finalScore = Math.min(100, score);

    // Determine risk level
    let riskLevel: ChurnScoreResult['riskLevel'] = 'low';
    if (finalScore >= 80) riskLevel = 'critical';
    else if (finalScore >= 65) riskLevel = 'high';
    else if (finalScore >= 50) riskLevel = 'medium';

    return {
      score: finalScore,
      factors,
      riskLevel
    };
  }

  /**
   * Build churn factors for a member
   */
  async buildChurnFactors(memberId: string): Promise<ChurnFactors> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get member details
    const member = await prisma.member.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    // Get all bookings
    const allBookings = await prisma.booking.findMany({
      where: { memberId }
    });

    // Get last 90 days bookings
    const recentBookings = allBookings.filter(
      b => b.bookedAt >= ninetyDaysAgo
    );

    // Get last 30 days bookings
    const last30DaysBookings = allBookings.filter(
      b => b.bookedAt >= thirtyDaysAgo
    );

    // Calculate attendance rates
    const calculateRate = (bookings: typeof allBookings) => {
      if (bookings.length === 0) return 0;
      const attended = bookings.filter(b => b.status === 'attended').length;
      return attended / bookings.length;
    };

    const attendanceRateLast30Days = calculateRate(last30DaysBookings);
    const attendanceRateLast90Days = calculateRate(recentBookings);

    // Find last attendance
    const lastAttendance = allBookings
      .filter(b => b.status === 'attended')
      .sort((a, b) => (b.attendedAt?.getTime() || 0) - (a.attendedAt?.getTime() || 0))[0];

    const lastAttendanceDate = lastAttendance?.attendedAt;
    const daysSinceLastAttendance = lastAttendanceDate
      ? Math.floor((now.getTime() - lastAttendanceDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Calculate membership days remaining
    const membershipDaysRemaining = member.membershipExpiresAt
      ? Math.max(0, Math.floor((member.membershipExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    // Calculate lifetime classes
    const lifetimeClassCount = allBookings.filter(
      b => b.status === 'attended'
    ).length;

    // Calculate average weekly attendance (8-week rolling)
    const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);
    const eightWeekBookings = allBookings.filter(
      b => b.bookedAt >= eightWeeksAgo && b.status === 'attended'
    );
    const avgWeeklyAttendance = eightWeekBookings.length / 8;

    // Calculate consecutive missed classes
    const missedClassesInRow = this.calculateConsecutiveMisses(allBookings);

    // Get payment failures
    const paymentFailures = allBookings.filter(
      b => b.paymentStatus === 'failed'
    ).length;

    // Check app usage (would come from session logs in real implementation)
    // For now, assume true if attended recently
    const hasOpenedAppLast14Days = daysSinceLastAttendance <= 14;

    return {
      daysSinceLastAttendance,
      attendanceRateLast30Days,
      attendanceRateLast90Days,
      membershipDaysRemaining,
      lifetimeClassCount,
      avgWeeklyAttendance,
      missedClassesInRow,
      hasOpenedAppLast14Days,
      paymentFailures
    };
  }

  /**
   * Calculate consecutive missed classes
   */
  private calculateConsecutiveMisses(bookings: Array<{ status: string; bookedAt: Date }>): number {
    // Sort by date descending
    const sorted = [...bookings].sort(
      (a, b) => b.bookedAt.getTime() - a.bookedAt.getTime()
    );

    let consecutiveMisses = 0;
    for (const booking of sorted) {
      if (booking.status === 'no_show' || booking.status === 'cancelled') {
        consecutiveMisses++;
      } else if (booking.status === 'attended') {
        break;
      }
    }

    return consecutiveMisses;
  }

  /**
   * Run churn scoring for all active members
   */
  async runChurnScoring(): Promise<{
    totalScored: number;
    highRiskCount: number;
    criticalCount: number;
    autoNudgedCount: number;
  }> {
    // Get active members
    const activeMembers = await prisma.member.findMany({
      where: {
        membershipStatus: 'active'
      }
    });

    let highRiskCount = 0;
    let criticalCount = 0;
    let autoNudgedCount = 0;

    for (const member of activeMembers) {
      try {
        const factors = await this.buildChurnFactors(member.id);
        const result = this.calculateChurnRisk(factors);

        // Save churn signal
        await prisma.memberChurnSignal.create({
          data: {
            memberId: member.id,
            churnScore: result.score,
            lastAttendanceDate: factors.daysSinceLastAttendance < 999 
              ? new Date(Date.now() - factors.daysSinceLastAttendance * 24 * 60 * 60 * 1000)
              : null,
            daysSinceLastBooking: factors.daysSinceLastAttendance,
            membershipType: member.membershipType,
            membershipDaysRemaining: factors.membershipDaysRemaining,
            attendanceRate30Days: factors.attendanceRateLast30Days,
            attendanceRate90Days: factors.attendanceRateLast90Days,
            missedClassesInRow: factors.missedClassesInRow,
            hasOpenedAppLast14Days: factors.hasOpenedAppLast14Days,
            paymentFailures: factors.paymentFailures,
            signalDate: new Date(),
            outcome: 'pending'
          }
        });

        // Track counts
        if (result.riskLevel === 'high') highRiskCount++;
        if (result.riskLevel === 'critical') {
          criticalCount++;
          
          // Auto-trigger nudge if enabled and score >= threshold
          if (this.shouldAutoNudge(result.score)) {
            await this.queueChurnNudge(member.id);
            autoNudgedCount++;
          }
        }
      } catch (error) {
        console.error(`Error scoring member ${member.id}:`, error);
      }
    }

    return {
      totalScored: activeMembers.length,
      highRiskCount,
      criticalCount,
      autoNudgedCount
    };
  }

  /**
   * Check if auto-nudge should be triggered
   */
  private shouldAutoNudge(score: number): boolean {
    if (!this.settings?.autoNudgeEnabled) return false;
    if (score < (this.settings?.autoNudgeThreshold || 80)) return false;
    return true;
  }

  /**
   * Queue a churn nudge for a member
   */
  async queueChurnNudge(memberId: string): Promise<boolean> {
    // Check cooldown period
    const cooldownDays = this.settings?.churnNudgeCooldownDays || 14;
    const cooldownDate = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000);

    const recentNudge = await prisma.memberChurnSignal.findFirst({
      where: {
        memberId,
        actionTaken: {
          in: ['nudge_sent', 'offer_sent']
        },
        actionTakenAt: {
          gte: cooldownDate
        }
      }
    });

    if (recentNudge) {
      console.log(`Nudge cooldown active for member ${memberId}`);
      return false;
    }

    // Update signal record
    await prisma.memberChurnSignal.updateMany({
      where: {
        memberId,
        signalDate: new Date()
      },
      data: {
        actionTaken: 'nudge_sent',
        actionTakenAt: new Date()
      }
    });

    // In production, this would queue a job for WhatsApp service
    console.log(`Churn nudge queued for member ${memberId}`);
    return true;
  }

  /**
   * Get at-risk members for dashboard
   */
  async getAtRiskMembers(minScore: number = 50): Promise<Array<{
    memberId: string;
    firstName: string;
    lastName: string;
    phone: string;
    lastSeen: Date | null;
    churnScore: number;
    riskLevel: string;
    daysSinceLastAttendance: number;
    signalDate: Date;
  }>> {
    const signals = await prisma.memberChurnSignal.findMany({
      where: {
        churnScore: {
          gte: minScore
        },
        signalDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: {
        churnScore: 'desc'
      },
      distinct: ['memberId']
    });

    const results = [];

    for (const signal of signals) {
      const member = await prisma.member.findUnique({
        where: { id: signal.memberId }
      });

      if (!member) continue;

      let riskLevel = 'medium';
      if (signal.churnScore >= 80) riskLevel = 'critical';
      else if (signal.churnScore >= 65) riskLevel = 'high';

      results.push({
        memberId: signal.memberId,
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        lastSeen: signal.lastAttendanceDate,
        churnScore: signal.churnScore,
        riskLevel,
        daysSinceLastAttendance: signal.daysSinceLastBooking,
        signalDate: signal.signalDate
      });
    }

    return results;
  }

  /**
   * Record outcome of churn intervention
   */
  async recordOutcome(
    memberId: string,
    outcome: 'retained' | 'churned'
  ): Promise<void> {
    await prisma.memberChurnSignal.updateMany({
      where: {
        memberId,
        outcome: 'pending'
      },
      data: { outcome }
    });
  }

  /**
   * Get churn summary for dashboard
   */
  async getChurnSummary(): Promise<{
    totalAtRisk: number;
    highRisk: number;
    criticalRisk: number;
    churnsPrevented: number;
    nudgesSent: number;
  }> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalAtRisk,
      highRisk,
      criticalRisk,
      churnsPrevented,
      nudgesSent
    ] = await Promise.all([
      // Total at risk (score >= 50)
      prisma.memberChurnSignal.count({
        where: {
          churnScore: { gte: 50 },
          signalDate: { gte: weekAgo }
        }
      }),
      // High risk (score >= 65)
      prisma.memberChurnSignal.count({
        where: {
          churnScore: { gte: 65 },
          signalDate: { gte: weekAgo }
        }
      }),
      // Critical risk (score >= 80)
      prisma.memberChurnSignal.count({
        where: {
          churnScore: { gte: 80 },
          signalDate: { gte: weekAgo }
        }
      }),
      // Churns prevented (outcome = retained)
      prisma.memberChurnSignal.count({
        where: {
          outcome: 'retained',
          signalDate: { gte: weekAgo }
        }
      }),
      // Nudges sent
      prisma.memberChurnSignal.count({
        where: {
          actionTaken: { in: ['nudge_sent', 'offer_sent'] },
          actionTakenAt: { gte: weekAgo }
        }
      })
    ]);

    return {
      totalAtRisk,
      highRisk,
      criticalRisk,
      churnsPrevented,
      nudgesSent
    };
  }
}

export const churnScorer = new ChurnScorer('default-studio');
