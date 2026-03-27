import cron from 'node-cron';
import { ChurnScorer } from '../services/ChurnScorer.js';
import { createWhatsAppService, WHATSAPP_TEMPLATES } from '../services/WhatsAppService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Churn Scoring Job
 * 
 * Runs nightly at 2 AM SAST to score all members for churn risk
 */
export function startChurnJob(): void {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[ChurnJob] Running churn scoring...');

    try {
      // In production, iterate through all studios
      const studioId = 'default-studio';
      
      const scorer = new ChurnScorer(studioId);
      await scorer.initialize();

      const results = await scorer.runChurnScoring();

      console.log('[ChurnJob] Churn scoring complete:', {
        totalScored: results.totalScored,
        highRiskCount: results.highRiskCount,
        criticalCount: results.criticalCount,
        autoNudgedCount: results.autoNudgedCount
      });

      // Send auto-nudges for critical members
      if (results.autoNudgedCount > 0) {
        await sendAutoNudges(studioId);
      }
    } catch (error) {
      console.error('[ChurnJob] Error in churn job:', error);
    }
  }, {
    timezone: 'Africa/Johannesburg' // SAST
  });

  console.log('[ChurnJob] Churn scoring job scheduled (daily at 02:00 SAST)');
}

/**
 * Send auto-nudges to critical churn risk members
 */
async function sendAutoNudges(studioId: string): Promise<void> {
  try {
    const whatsapp = await createWhatsAppService(studioId);
    if (!whatsapp) {
      console.log('[ChurnJob] WhatsApp not configured, skipping auto-nudges');
      return;
    }

    // Get critical members who need nudges
    const criticalSignals = await prisma.memberChurnSignal.findMany({
      where: {
        churnScore: { gte: 80 },
        actionTaken: null,
        signalDate: new Date()
      },
      include: {
        member: true
      }
    });

    for (const signal of criticalSignals) {
      try {
        const member = signal.member;
        
        // Send WhatsApp nudge
        await whatsapp.sendMessage({
          to: member.phone,
          templateName: WHATSAPP_TEMPLATES.CHURN_NUDGE,
          params: [member.firstName, 'the studio']
        });

        // Update signal
        await prisma.memberChurnSignal.update({
          where: { id: signal.id },
          data: {
            actionTaken: 'nudge_sent',
            actionTakenAt: new Date()
          }
        });

        console.log(`[ChurnJob] Auto-nudge sent to ${member.firstName} ${member.lastName}`);
      } catch (error) {
        console.error(`[ChurnJob] Error sending nudge to ${signal.memberId}:`, error);
      }
    }
  } catch (error) {
    console.error('[ChurnJob] Error sending auto-nudges:', error);
  }
}

/**
 * Churn Outcome Tracking Job
 * 
 * Runs weekly to track which at-risk members were retained vs churned
 */
export function startChurnOutcomeJob(): void {
  // Run weekly on Sunday at 3 AM
  cron.schedule('0 3 * * 0', async () => {
    console.log('[ChurnJob] Tracking churn outcomes...');

    try {
      // Find members who were flagged 30+ days ago
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const oldSignals = await prisma.memberChurnSignal.findMany({
        where: {
          signalDate: { lte: thirtyDaysAgo },
          outcome: 'pending'
        },
        include: {
          member: true
        }
      });

      for (const signal of oldSignals) {
        // Check if member is still active
        const isStillActive = signal.member.membershipStatus === 'active';
        
        // Check if they've attended since the signal
        const recentBooking = await prisma.booking.findFirst({
          where: {
            memberId: signal.memberId,
            status: 'attended',
            attendedAt: {
              gte: signal.signalDate
            }
          }
        });

        const outcome = isStillActive && recentBooking ? 'retained' : 'churned';

        await prisma.memberChurnSignal.update({
          where: { id: signal.id },
          data: { outcome }
        });

        console.log(`[ChurnJob] Member ${signal.memberId} outcome: ${outcome}`);
      }

      console.log(`[ChurnJob] Tracked ${oldSignals.length} churn outcomes`);
    } catch (error) {
      console.error('[ChurnJob] Error tracking churn outcomes:', error);
    }
  }, {
    timezone: 'Africa/Johannesburg'
  });

  console.log('[ChurnJob] Churn outcome tracking job scheduled (weekly on Sunday 03:00 SAST)');
}
