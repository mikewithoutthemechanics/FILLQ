import cron from 'node-cron';
import { ChurnScorer } from '../services/ChurnScorer.js';
import { createWhatsAppService, WHATSAPP_TEMPLATES } from '../services/WhatsAppService.js';
import { prisma } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

/**
 * Churn Scoring Job
 * 
 * Runs nightly at 2 AM SAST to score all members for churn risk
 */
export function startChurnJob(): void {
  cron.schedule('0 2 * * *', async () => {
    logger.info('[ChurnJob] Running churn scoring...');

    try {
      const studioId = 'default-studio';
      
      const scorer = new ChurnScorer(studioId);
      await scorer.initialize();

      const results = await scorer.runChurnScoring();

      logger.info('[ChurnJob] Churn scoring complete:', results);

      if (results.autoNudgedCount > 0) {
        await sendAutoNudges(studioId);
      }
    } catch (error) {
      logger.error('[ChurnJob] Error in churn job:', error);
    }
  }, {
    timezone: 'Africa/Johannesburg'
  });

  logger.info('[ChurnJob] Churn scoring job scheduled (daily at 02:00 SAST)');
}

async function sendAutoNudges(studioId: string): Promise<void> {
  try {
    const whatsapp = await createWhatsAppService(studioId);
    if (!whatsapp) {
      logger.info('[ChurnJob] WhatsApp not configured, skipping auto-nudges');
      return;
    }

    const criticalSignals = await prisma.memberChurnSignal.findMany({
      where: {
        churnScore: { gte: 80 },
        actionTaken: null,
        signalDate: new Date()
      },
      include: {
        churnMember: true
      }
    });

    for (const signal of criticalSignals) {
      try {
        const member = signal.churnMember;
        
        await whatsapp.sendMessage({
          to: member.phone,
          templateName: WHATSAPP_TEMPLATES.CHURN_NUDGE,
          params: [member.firstName, 'the studio']
        });

        await prisma.memberChurnSignal.update({
          where: { id: signal.id },
          data: {
            actionTaken: 'nudge_sent',
            actionTakenAt: new Date()
          }
        });

        logger.info(`[ChurnJob] Auto-nudge sent to ${member.firstName} ${member.lastName}`);
      } catch (error) {
        logger.error(`[ChurnJob] Error sending nudge to ${signal.memberId}:`, error);
      }
    }
  } catch (error) {
    logger.error('[ChurnJob] Error sending auto-nudges:', error);
  }
}

/**
 * Churn Outcome Tracking Job
 * 
 * Runs weekly to track which at-risk members were retained vs churned
 */
export function startChurnOutcomeJob(): void {
  cron.schedule('0 3 * * 0', async () => {
    logger.info('[ChurnJob] Tracking churn outcomes...');

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const oldSignals = await prisma.memberChurnSignal.findMany({
        where: {
          signalDate: { lte: thirtyDaysAgo },
          outcome: 'pending'
        },
        include: {
          churnMember: true
        }
      });

      for (const signal of oldSignals) {
        const isStillActive = signal.churnMember.membershipStatus === 'active';
        
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

        logger.info(`[ChurnJob] Member ${signal.memberId} outcome: ${outcome}`);
      }

      logger.info(`[ChurnJob] Tracked ${oldSignals.length} churn outcomes`);
    } catch (error) {
      logger.error('[ChurnJob] Error tracking churn outcomes:', error);
    }
  }, {
    timezone: 'Africa/Johannesburg'
  });

  logger.info('[ChurnJob] Churn outcome tracking job scheduled (weekly on Sunday 03:00 SAST)');
}
