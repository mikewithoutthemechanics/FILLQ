import cron from 'node-cron';
import { WaitlistEngine } from '../services/WaitlistEngine.js';
import { prisma } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

/**
 * Rebook Nudge Job
 * 
 * Runs every 30 minutes to check for recently ended classes
 * and send rebook nudges to attendees
 */
export function startRebookJob(): void {
  cron.schedule('*/30 * * * *', async () => {
    logger.info('[RebookJob] Checking for rebook nudges...');

    try {
      const now = new Date();
      const fortyFiveMinutesAgo = new Date(now.getTime() - 45 * 60 * 1000);
      const fiftyMinutesAgo = new Date(now.getTime() - 50 * 60 * 1000);

      const recentlyEndedClasses = await prisma.class.findMany({
        where: {
          endTime: {
            gte: fiftyMinutesAgo,
            lte: fortyFiveMinutesAgo
          },
          status: 'completed'
        }
      });

      logger.info(`[RebookJob] Found ${recentlyEndedClasses.length} recently ended classes`);

      for (const classItem of recentlyEndedClasses) {
        try {
          const engine = new WaitlistEngine('default-studio');
          await engine.initialize();
          await engine.sendRebookNudges(classItem.id);
          
          logger.info(`[RebookJob] Rebook nudges sent for class ${classItem.id}`);
        } catch (error) {
          logger.error(`[RebookJob] Error sending rebook nudges for class ${classItem.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('[RebookJob] Error in rebook job:', error);
    }
  });

  logger.info('[RebookJob] Rebook nudge job scheduled (every 30 minutes)');
}
