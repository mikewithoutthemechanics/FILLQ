import cron from 'node-cron';
import { noShowScorer } from '../services/NoShowScorer.js';
import { prisma } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

/**
 * No-Show Scoring Job
 * 
 * Runs every 15 minutes to score bookings for classes starting in ~3 hours
 */
export function startScoringJob(): void {
  cron.schedule('*/15 * * * *', async () => {
    logger.info('[ScoringJob] Running no-show scoring check...');

    try {
      const classesToScore = await noShowScorer.getClassesToScore();
      logger.info(`[ScoringJob] Found ${classesToScore.length} classes to score`);

      for (const classItem of classesToScore) {
        try {
          const results = await noShowScorer.scoreClassBookings(classItem.id);
          const highRiskCount = results.filter(r => r.atRisk).length;

          logger.info(`[ScoringJob] Class ${classItem.id}: ${results.length} bookings scored, ${highRiskCount} high risk`);

          const shouldActivate = await noShowScorer.shouldActivateWaitlist(classItem.id);
          
          if (shouldActivate) {
            logger.info(`[ScoringJob] Class ${classItem.id}: High risk threshold met, waitlist on standby`);
          }
        } catch (error) {
          logger.error(`[ScoringJob] Error scoring class ${classItem.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('[ScoringJob] Error in scoring job:', error);
    }
  });

  logger.info('[ScoringJob] No-show scoring job scheduled (every 15 minutes)');
}

/**
 * Outcome Recording Job
 * 
 * Runs daily at 11 PM to record actual outcomes for scored bookings
 */
export function startOutcomeRecordingJob(): void {
  cron.schedule('0 23 * * *', async () => {
    logger.info('[OutcomeJob] Recording booking outcomes...');

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Find classes that ended today
      const endedClasses = await prisma.class.findMany({
        where: {
          endTime: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        select: { id: true }
      });

      let recordedCount = 0;

      for (const classItem of endedClasses) {
        const bookings = await prisma.booking.findMany({
          where: { classId: classItem.id }
        });

        for (const booking of bookings) {
          if (['attended', 'no_show', 'cancelled'].includes(booking.status)) {
            await noShowScorer.recordOutcome(
              booking.id,
              booking.status as 'attended' | 'no_show' | 'cancelled'
            );
            recordedCount++;
          }
        }
      }

      logger.info(`[OutcomeJob] Recorded outcomes for ${recordedCount} bookings`);
    } catch (error) {
      logger.error('[OutcomeJob] Error recording outcomes:', error);
    }
  });

  logger.info('[OutcomeJob] Outcome recording job scheduled (daily at 23:00)');
}
