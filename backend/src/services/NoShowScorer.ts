import { PrismaClient } from '@prisma/client';
import type { 
  BookingRiskFactors, 
  RiskScoreResult, 
  MembershipType 
} from '../types/index.js';

const prisma = new PrismaClient();

/**
 * NoShowScorer Service
 * 
 * Calculates no-show risk scores for bookings based on multiple factors.
 * Runs as a scheduled job 3 hours before each class.
 */
export class NoShowScorer {
  private readonly AT_RISK_THRESHOLD = 60;

  /**
   * Calculate risk score for a single booking
   */
  calculateRisk(factors: BookingRiskFactors): RiskScoreResult {
    let score = 0;

    // Lead time: booked last-minute = higher risk
    if (factors.bookingLeadTime < 2) score += 25;
    else if (factors.bookingLeadTime < 6) score += 15;
    else if (factors.bookingLeadTime < 24) score += 8;

    // Member no-show history (0–100% → 0–30 pts)
    score += Math.round(factors.memberNoShowHistory * 30);

    // New member: < 5 lifetime bookings = higher risk
    if (factors.memberBookingCount < 5) score += 15;
    else if (factors.memberBookingCount < 10) score += 8;

    // Membership type
    const membershipRisk: Record<MembershipType, number> = {
      'drop-in': 20,
      'class-pack': 10,
      'monthly': 5,
      'annual': 2
    };
    score += membershipRisk[factors.membershipType] ?? 10;

    // Recency: hasn't attended in 2+ weeks
    if (factors.daysSinceLastAttendance > 21) score += 12;
    else if (factors.daysSinceLastAttendance > 14) score += 7;

    // Early morning class (before 7am) = higher risk
    if (factors.timeOfDay < 7) score += 8;

    // No payment on file
    if (!factors.hasCompletedPayment) score += 10;

    // Cap at 100
    const finalScore = Math.min(100, score);

    return {
      score: finalScore,
      factors,
      atRisk: finalScore >= this.AT_RISK_THRESHOLD
    };
  }

  /**
   * Build risk factors for a booking by querying member history
   */
  async buildRiskFactors(
    bookingId: string,
    classId: string,
    memberId: string
  ): Promise<BookingRiskFactors> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const classDetails = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classDetails) {
      throw new Error(`Class ${classId} not found`);
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    const bookingLeadTime = Math.max(
      0,
      (classDetails.startTime.getTime() - booking.bookedAt.getTime()) / (1000 * 60 * 60)
    );

    const memberHistory = await this.getMemberAttendanceHistory(memberId);

    const daysSinceLastAttendance = memberHistory.lastAttendanceDate
      ? Math.floor(
          (new Date().getTime() - memberHistory.lastAttendanceDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 999;

    const timeOfDay = classDetails.startTime.getHours();

    return {
      bookingLeadTime,
      memberNoShowHistory: memberHistory.noShowRate,
      memberBookingCount: memberHistory.totalBookings,
      dayOfWeek: classDetails.startTime.getDay(),
      timeOfDay,
      membershipType: member.membershipType as MembershipType,
      classType: classDetails.classType,
      daysSinceLastAttendance,
      hasCompletedPayment: booking.paymentStatus === 'completed'
    };
  }

  private async getMemberAttendanceHistory(memberId: string): Promise<{
    totalBookings: number;
    noShowRate: number;
    lastAttendanceDate: Date | null;
  }> {
    const bookings = await prisma.booking.findMany({
      where: { memberId },
      orderBy: { bookedAt: 'desc' }
    });

    const totalBookings = bookings.length;

    if (totalBookings === 0) {
      return {
        totalBookings: 0,
        noShowRate: 0.5,
        lastAttendanceDate: null
      };
    }

    const noShows = bookings.filter((b: any) => b.status === 'no_show').length;
    const noShowRate = totalBookings > 0 ? noShows / totalBookings : 0;

    const lastAttendance = bookings.find((b: any) => b.status === 'attended');
    const lastAttendanceDate = lastAttendance?.attendedAt || null;

    return {
      totalBookings,
      noShowRate,
      lastAttendanceDate
    };
  }

  async scoreClassBookings(classId: string): Promise<RiskScoreResult[]> {
    const bookings = await prisma.booking.findMany({
      where: {
        classId,
        status: 'confirmed'
      }
    });

    const results: RiskScoreResult[] = [];

    for (const booking of bookings) {
      try {
        const factors = await this.buildRiskFactors(
          booking.id,
          classId,
          booking.memberId
        );

        const result = this.calculateRisk(factors);
        results.push(result);

        await prisma.bookingRiskScore.create({
          data: {
            bookingId: booking.id,
            classId,
            memberId: booking.memberId,
            riskScore: result.score,
            riskFactors: JSON.parse(JSON.stringify(factors)),
            atRisk: result.atRisk
          }
        });
      } catch (error) {
        console.error(`Error scoring booking ${booking.id}:`, error);
      }
    }

    return results;
  }

  async getClassesToScore(): Promise<Array<{ id: string; startTime: Date }>> {
    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const threeHoursFifteenFromNow = new Date(now.getTime() + 3.25 * 60 * 60 * 1000);

    const classes = await prisma.class.findMany({
      where: {
        startTime: {
          gte: threeHoursFromNow,
          lte: threeHoursFifteenFromNow
        },
        status: 'scheduled'
      },
      select: {
        id: true,
        startTime: true
      }
    });

    return classes;
  }

  async getHighRiskBookings(classId: string): Promise<Array<{
    bookingId: string;
    memberId: string;
    riskScore: number;
  }>> {
    const scores = await prisma.bookingRiskScore.findMany({
      where: {
        classId,
        atRisk: true,
        scoredAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        riskScore: 'desc'
      }
    });

    return scores.map((s: any) => ({
      bookingId: s.bookingId,
      memberId: s.memberId,
      riskScore: s.riskScore
    }));
  }

  async shouldActivateWaitlist(classId: string): Promise<boolean> {
    const classDetails = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classDetails) return false;

    const highRiskBookings = await this.getHighRiskBookings(classId);
    const atRiskCount = highRiskBookings.length;
    const threshold = Math.ceil(classDetails.capacity * 0.2);

    return atRiskCount >= threshold;
  }

  async recordOutcome(
    bookingId: string,
    outcome: 'attended' | 'no_show' | 'cancelled'
  ): Promise<void> {
    await prisma.bookingRiskScore.updateMany({
      where: { bookingId },
      data: {
        outcome,
        outcomeRecordedAt: new Date()
      }
    });
  }
}

export const noShowScorer = new NoShowScorer();
