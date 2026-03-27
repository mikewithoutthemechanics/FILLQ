import { PrismaClient } from '@prisma/client';
import type { 
  RecoverySummary, 
  FillChartData, 
  TeacherClassBrief,
  AtRiskMember 
} from '../types/index.js';
import { churnScorer } from './ChurnScorer.js';
import { noShowScorer } from './NoShowScorer.js';

const prisma = new PrismaClient();

/**
 * Revenue Recovery Dashboard Service
 * 
 * Provides analytics and metrics for studio owners:
 * - Revenue recovered from waitlist fills
 * - Fill rates and timing
 * - Churn prevention metrics
 * - Teacher class briefs
 */
export class DashboardService {
  private studioId: string;

  constructor(studioId: string) {
    this.studioId = studioId;
  }

  /**
   * Get recovery summary for current month
   */
  async getRecoverySummary(): Promise<RecoverySummary> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get fill events for this month
    const fillEvents = await prisma.waitlistFillEvent.findMany({
      where: {
        triggeredAt: {
          gte: startOfMonth
        },
        filled: true
      }
    });

    // Calculate metrics
    const revenueRecovered = fillEvents.reduce(
      (sum, e) => sum + Number(e.revenueRecovered || 0),
      0
    );

    const spotsFilled = fillEvents.length;

    // Calculate average fill time
    const fillTimes = fillEvents
      .map(e => e.fillTimeSeconds)
      .filter((t): t is number => t !== null && t !== undefined);
    
    const avgFillTimeSeconds = fillTimes.length > 0
      ? fillTimes.reduce((a, b) => a + b, 0) / fillTimes.length
      : 0;
    
    const avgFillTimeMinutes = Math.round(avgFillTimeSeconds / 60);

    // Get churn prevention metrics
    const churnMetrics = await churnScorer.getChurnSummary();

    // Calculate fill rate (filled spots / total cancellations)
    const totalCancellations = await prisma.waitlistFillEvent.count({
      where: {
        triggeredAt: {
          gte: startOfMonth
        }
      }
    });

    const fillRatePercentage = totalCancellations > 0
      ? Math.round((spotsFilled / totalCancellations) * 100)
      : 0;

    return {
      revenueRecovered,
      spotsFilled,
      avgFillTimeMinutes,
      churnsPreventedThisMonth: churnMetrics.churnsPrevented,
      fillRatePercentage
    };
  }

  /**
   * Get fill rate chart data for last 30 days
   */
  async getFillChartData(): Promise<FillChartData[]> {
    const days: FillChartData[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Get fill events for this day
      const fillEvents = await prisma.waitlistFillEvent.findMany({
        where: {
          triggeredAt: {
            gte: date,
            lt: nextDate
          }
        }
      });

      const spotsFilled = fillEvents.filter(e => e.filled).length;
      const totalEvents = fillEvents.length;
      const spotsEmpty = totalEvents - spotsFilled;
      const fillRate = totalEvents > 0 ? Math.round((spotsFilled / totalEvents) * 100) : 0;

      days.push({
        date: date.toISOString().split('T')[0],
        spotsEmpty,
        spotsFilled,
        fillRate
      });
    }

    return days;
  }

  /**
   * Get at-risk members for churn panel
   */
  async getAtRiskMembers(): Promise<AtRiskMember[]> {
    const members = await churnScorer.getAtRiskMembers(50);

    return members.map(m => ({
      memberId: m.memberId,
      firstName: m.firstName,
      lastName: m.lastName,
      lastSeen: m.lastSeen?.toISOString() || '',
      churnScore: m.churnScore,
      riskLevel: m.riskLevel as 'medium' | 'high' | 'critical',
      daysSinceLastAttendance: m.daysSinceLastAttendance
    }));
  }

  /**
   * Get teacher class brief for upcoming classes
   */
  async getTeacherClassBrief(teacherId: string): Promise<TeacherClassBrief[]> {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Get today's upcoming classes for this teacher
    const classes = await prisma.class.findMany({
      where: {
        teacherId,
        startTime: {
          gte: now,
          lte: endOfDay
        },
        status: 'scheduled'
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    const briefs: TeacherClassBrief[] = [];

    for (const classItem of classes) {
      // Get confirmed bookings
      const confirmedBookings = await prisma.booking.findMany({
        where: {
          classId: classItem.id,
          status: 'confirmed'
        }
      });

      // Get high risk bookings
      const highRiskCount = await prisma.bookingRiskScore.count({
        where: {
          classId: classItem.id,
          atRisk: true,
          scoredAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      // Get waitlist count
      const waitlistCount = await prisma.waitlistEntry.count({
        where: {
          classId: classItem.id,
          status: 'waiting'
        }
      });

      // Count new members (less than 3 lifetime bookings)
      let newMembersCount = 0;
      for (const booking of confirmedBookings) {
        const bookingCount = await prisma.booking.count({
          where: {
            memberId: booking.memberId,
            status: 'confirmed'
          }
        });
        if (bookingCount <= 2) {
          newMembersCount++;
        }
      }

      // Generate note
      let note = '';
      if (highRiskCount >= 2) {
        note = `${highRiskCount} high no-show risk — waitlist on standby`;
      } else if (newMembersCount >= 3) {
        note = `${newMembersCount} new members — welcome them!`;
      } else if (waitlistCount > 0 && classItem.availableSpots < 3) {
        note = `Nearly full, ${waitlistCount} on waitlist`;
      } else {
        note = 'Class on track';
      }

      briefs.push({
        classId: classItem.id,
        className: classItem.name,
        startTime: classItem.startTime.toISOString(),
        confirmedCount: confirmedBookings.length,
        highRiskCount,
        waitlistCount,
        newMembersCount,
        note
      });
    }

    return briefs;
  }

  /**
   * Get specific class brief
   */
  async getClassBrief(classId: string): Promise<TeacherClassBrief | null> {
    const classItem = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classItem) return null;

    const confirmedBookings = await prisma.booking.findMany({
      where: {
        classId,
        status: 'confirmed'
      }
    });

    const highRiskCount = await prisma.bookingRiskScore.count({
      where: {
        classId,
        atRisk: true
      }
    });

    const waitlistCount = await prisma.waitlistEntry.count({
      where: {
        classId,
        status: 'waiting'
      }
    });

    let newMembersCount = 0;
    for (const booking of confirmedBookings) {
      const bookingCount = await prisma.booking.count({
        where: {
          memberId: booking.memberId,
          status: 'confirmed'
        }
      });
      if (bookingCount <= 2) {
        newMembersCount++;
      }
    }

    let note = '';
    if (highRiskCount >= 2) {
      note = `${highRiskCount} high no-show risk — waitlist on standby`;
    } else if (newMembersCount >= 3) {
      note = `${newMembersCount} new members — welcome them!`;
    } else if (waitlistCount > 0 && classItem.availableSpots < 3) {
      note = `Nearly full, ${waitlistCount} on waitlist`;
    } else {
      note = 'Class on track';
    }

    return {
      classId: classItem.id,
      className: classItem.name,
      startTime: classItem.startTime.toISOString(),
      confirmedCount: confirmedBookings.length,
      highRiskCount,
      waitlistCount,
      newMembersCount,
      note
    };
  }

  /**
   * Generate monthly report
   */
  async generateMonthlyReport(year: number, month: number): Promise<{
    year: number;
    month: number;
    revenueRecovered: number;
    spotsFilled: number;
    avgFillTimeMinutes: number;
    churnsPrevented: number;
    atRiskMembersFlagged: number;
    nudgesSent: number;
    rebookNudgesSent: number;
    rebookNudgesConverted: number;
    fillRate: number;
  }> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    // Get fill events
    const fillEvents = await prisma.waitlistFillEvent.findMany({
      where: {
        triggeredAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const filledEvents = fillEvents.filter(e => e.filled);
    const revenueRecovered = filledEvents.reduce(
      (sum, e) => sum + Number(e.revenueRecovered || 0),
      0
    );

    const fillTimes = filledEvents
      .map(e => e.fillTimeSeconds)
      .filter((t): t is number => t !== null && t !== undefined);
    
    const avgFillTimeSeconds = fillTimes.length > 0
      ? fillTimes.reduce((a, b) => a + b, 0) / fillTimes.length
      : 0;

    // Get churn metrics
    const churnSignals = await prisma.memberChurnSignal.findMany({
      where: {
        signalDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const churnsPrevented = churnSignals.filter(s => s.outcome === 'retained').length;
    const atRiskMembersFlagged = new Set(churnSignals.map(s => s.memberId)).size;
    const nudgesSent = churnSignals.filter(
      s => s.actionTaken === 'nudge_sent' || s.actionTaken === 'offer_sent'
    ).length;

    // Get rebook nudges
    const rebookNudges = await prisma.rebookNudgeLog.findMany({
      where: {
        sentAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const rebookNudgesConverted = rebookNudges.filter(n => n.booked).length;

    const fillRate = fillEvents.length > 0
      ? Math.round((filledEvents.length / fillEvents.length) * 100)
      : 0;

    return {
      year,
      month,
      revenueRecovered,
      spotsFilled: filledEvents.length,
      avgFillTimeMinutes: Math.round(avgFillTimeSeconds / 60),
      churnsPrevented,
      atRiskMembersFlagged,
      nudgesSent,
      rebookNudgesSent: rebookNudges.length,
      rebookNudgesConverted,
      fillRate
    };
  }

  /**
   * Save monthly report to database
   */
  async saveMonthlyReport(
    year: number,
    month: number,
    studioId: string
  ): Promise<void> {
    const report = await this.generateMonthlyReport(year, month);

    await prisma.monthlyReport.upsert({
      where: {
        studioId_year_month: {
          studioId,
          year,
          month
        }
      },
      update: {
        revenueRecovered: report.revenueRecovered,
        spotsFilled: report.spotsFilled,
        avgFillTimeMinutes: report.avgFillTimeMinutes,
        churnsPrevented: report.churnsPrevented,
        atRiskMembersFlagged: report.atRiskMembersFlagged,
        nudgesSent: report.nudgesSent,
        rebookNudgesSent: report.rebookNudgesSent,
        rebookNudgesConverted: report.rebookNudgesConverted
      },
      create: {
        studioId,
        year,
        month,
        revenueRecovered: report.revenueRecovered,
        spotsFilled: report.spotsFilled,
        avgFillTimeMinutes: report.avgFillTimeMinutes,
        churnsPrevented: report.churnsPrevented,
        atRiskMembersFlagged: report.atRiskMembersFlagged,
        nudgesSent: report.nudgesSent,
        rebookNudgesSent: report.rebookNudgesSent,
        rebookNudgesConverted: report.rebookNudgesConverted
      }
    });
  }
}

export const dashboardService = new DashboardService('default-studio');
