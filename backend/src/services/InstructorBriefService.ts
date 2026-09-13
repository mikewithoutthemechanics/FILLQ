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

    const memberInsights: AIInstructorBrief['memberInsights'] = [];
    let newMembersCount = 0;
    let returningMembersCount = 0;

    for (const booking of confirmedBookings) {
      const member = await prisma.member.findUnique({
        where: { id: booking.memberId }
      });

      if (!member) continue;

      const totalBookings = await prisma.booking.count({
        where: { memberId: member.id, status: 'attended' }
      });

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

      // Check if returning after 21+ days absence
      const churnSignal = await prisma.memberChurnSignal.findFirst({
        where: { memberId: member.id, churnScore: { gte: 65 } },
        orderBy: { signalDate: 'desc' }
      });

      if (churnSignal) {
        returningMembersCount++;
        memberInsights.push({
          memberName: `${member.firstName} ${member.lastName}`,
          type: 'returning_risk',
          note: `Returning after a break — make them feel right at home!`
        });
      }
    }

    const highRiskCount = await prisma.bookingRiskScore.count({
      where: { classId, atRisk: true }
    });

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
