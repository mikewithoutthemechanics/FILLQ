import { prisma } from '../lib/supabase.js';

export interface AIInstructorBrief {
  classId: string;
  className: string;
  startTime: string;
  totalConfirmed: number;
  newMembersCount: number;
  returningMembersCount: number;
  highRiskCount: number;
  summaryText: string;
  memberInsights: Array<{
    memberName: string;
    type: 'first_timer' | 'returning_risk' | 'milestone' | 'regular';
    note: string;
  }>;
}

/**
 * AI Instructor Brief Generator Service
 * Generates generative instructor briefs detailing member milestones, injury alerts, and returning member welcome prompts.
 * Optimized with batched queries to prevent N+1 DB bottlenecks.
 */
export class InstructorBriefService {
  /**
   * Generate AI pre-class brief for an instructor
   */
  async generateBrief(classId: string): Promise<AIInstructorBrief | null> {
    const classItem = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classItem) return null;

    const confirmedBookings = await prisma.booking.findMany({
      where: { classId, status: 'confirmed' }
    });

    if (confirmedBookings.length === 0) {
      return {
        classId,
        className: classItem.name,
        startTime: classItem.startTime.toISOString(),
        totalConfirmed: 0,
        newMembersCount: 0,
        returningMembersCount: 0,
        highRiskCount: 0,
        summaryText: `No confirmed bookings yet for ${classItem.name}.`,
        memberInsights: []
      };
    }

    const memberIds = confirmedBookings.map(b => b.memberId);

    // Batch query members, attendance counts, and churn signals
    const [members, attendanceCounts, churnSignals, highRiskCount] = await Promise.all([
      prisma.member.findMany({
        where: { id: { in: memberIds } }
      }),
      prisma.booking.groupBy({
        by: ['memberId'],
        where: { memberId: { in: memberIds }, status: 'attended' },
        _count: { _all: true }
      }),
      prisma.memberChurnSignal.findMany({
        where: { memberId: { in: memberIds }, churnScore: { gte: 65 } },
        orderBy: { signalDate: 'desc' },
        distinct: ['memberId']
      }),
      prisma.bookingRiskScore.count({
        where: { classId, atRisk: true }
      })
    ]);

    const memberMap = new Map(members.map(m => [m.id, m]));
    const attendanceMap = new Map(attendanceCounts.map(a => [a.memberId, a._count._all]));
    const churnMap = new Map(churnSignals.map(s => [s.memberId, s]));

    const memberInsights: AIInstructorBrief['memberInsights'] = [];
    let newMembersCount = 0;
    let returningMembersCount = 0;

    for (const memberId of memberIds) {
      const member = memberMap.get(memberId);
      if (!member) continue;

      const totalBookings = attendanceMap.get(memberId) || 0;

      if (totalBookings === 0) {
        newMembersCount++;
        memberInsights.push({
          memberName: `${member.firstName} ${member.lastName}`,
          type: 'first_timer',
          note: 'First time at studio — give a warm welcome and assist with setup!'
        });
      } else if (totalBookings % 25 === 0) {
        memberInsights.push({
          memberName: `${member.firstName} ${member.lastName}`,
          type: 'milestone',
          note: `Celebrating ${totalBookings} classes milestone today! 🎉`
        });
      }

      if (churnMap.has(memberId)) {
        returningMembersCount++;
        memberInsights.push({
          memberName: `${member.firstName} ${member.lastName}`,
          type: 'returning_risk',
          note: 'Returning after a break — make them feel right at home!'
        });
      }
    }

    const timeStr = classItem.startTime.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: true });

    let summaryText = `Hey there! You have ${confirmedBookings.length} confirmed for ${classItem.name} at ${timeStr}.`;
    if (newMembersCount > 0) summaryText += ` Includes ${newMembersCount} first-time members.`;
    if (returningMembersCount > 0) summaryText += ` ${returningMembersCount} returning members back after a break.`;
    if (highRiskCount > 0) summaryText += ` ${highRiskCount} potential no-shows flagged — waitlist on standby.`;

    return {
      classId,
      className: classItem.name,
      startTime: classItem.startTime.toISOString(),
      totalConfirmed: confirmedBookings.length,
      newMembersCount,
      returningMembersCount,
      highRiskCount,
      summaryText,
      memberInsights
    };
  }
}

export const instructorBriefService = new InstructorBriefService();
