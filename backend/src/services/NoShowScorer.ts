import { prisma } from '../lib/supabase.js';
import { weatherFactorService } from './WeatherFactorService.js';
import type { 
  BookingRiskFactors, 
  RiskScoreResult, 
  MembershipType 
} from '../types/index.js';

/**
 * NoShowScorer Service
 * 
 * Calculates no-show risk scores for bookings incorporating weather/ambient factors and accuracy feedback.
 */
export class NoShowScorer {
  private readonly AT_RISK_THRESHOLD = 60;

  calculateRisk(
    factors: BookingRiskFactors,
    accuracyAdjustment: number = 0,
    weatherAdjustment: number = 0
  ): RiskScoreResult {
    let score = 0;

    if (factors.bookingLeadTime < 2) score += 25;
    else if (factors.bookingLeadTime < 6) score += 15;
    else if (factors.bookingLeadTime < 24) score += 8;

    score += Math.round(factors.memberNoShowHistory * 30);

    if (factors.memberBookingCount < 5) score += 15;
    else if (factors.memberBookingCount < 10) score += 8;

    const membershipRisk: Record<MembershipType, number> = {
      'drop-in': 20,
      'class-pack': 10,
      'monthly': 5,
      'annual': 2
    };
    score += membershipRisk[factors.membershipType] ?? 10;

    if (factors.daysSinceLastAttendance > 21) score += 12;
    else if (factors.daysSinceLastAttendance > 14) score += 7;

    if (factors.timeOfDay < 7) score += 8;

    if (!factors.hasCompletedPayment) score += 10;

    score += accuracyAdjustment;
    score += weatherAdjustment;

    const finalScore = Math.min(100, Math.max(0, score));

    return {
      score: finalScore,
      factors,
      atRisk: finalScore >= this.AT_RISK_THRESHOLD
    };
  }

  async getStudioAccuracyAdjustment(memberId: string): Promise<number> {
    try {
      const recordedScores = await prisma.bookingRiskScore.findMany({
        where: {
          memberId,
          outcomeRecordedAt: { not: null },
          outcome: { in: ['no_show', 'attended'] }
        },
        take: 20,
        orderBy: { scoredAt: 'desc' }
      });

      if (recordedScores.length === 0) return 0;

      const falsePositives = recordedScores.filter(s => s.atRisk && s.outcome === 'attended').length;
      const truePositives = recordedScores.filter(s => s.atRisk && s.outcome === 'no_show').length;

      if (truePositives > falsePositives) return 5;
      if (falsePositives > truePositives) return -5;
    } catch (err) {
      // Fallback
    }
    return 0;
  }

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

    const classDetails = await prisma.class.findUnique({
      where: { id: classId }
    });

    const weatherFactor = classDetails
      ? await weatherFactorService.getWeatherFactor(classDetails.startTime)
      : { riskAdjustmentPoints: 0 };

    const results: RiskScoreResult[] = [];

    for (const booking of bookings) {
      try {
        const factors = await this.buildRiskFactors(
          booking.id,
          classId,
          booking.memberId
        );

        const accuracyAdjustment = await this.getStudioAccuracyAdjustment(booking.memberId);
        const result = this.calculateRisk(factors, accuracyAdjustment, weatherFactor.riskAdjustmentPoints);
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
