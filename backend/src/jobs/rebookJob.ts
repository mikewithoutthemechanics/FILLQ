import cron from 'node-cron';
import { WaitlistEngine } from '../services/WaitlistEngine.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Rebook Nudge Job
 * 
 * Runs every 30 minutes to check for recently ended classes
 * and send rebook nudges to attendees
 */
export function startRebookJob(): void {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('[RebookJob] Checking for rebook nudges...');

    try {
      const now = new Date();
      const fortyFiveMinutesAgo = new Date(now.getTime() - 45 * 60 * 1000);
      const fiftyMinutesAgo = new Date(now.getTime() - 50 * 60 * 1000);

      // Find classes that ended 45-50 minutes ago
      const recentlyEndedClasses = await prisma.class.findMany({
        where: {
          endTime: {
            gte: fiftyMinutesAgo,
            lte: fortyFiveMinutesAgo
          },
          status: 'completed'
        }
      });

      console.log(`[RebookJob] Found ${recentlyEndedClasses.length} recently ended classes`);

      for (const classItem of recentlyEndedClasses) {
        try {
          const engine = new WaitlistEngine('default-studio');
          await engine.initialize();
          await engine.sendRebookNudges(classItem.id);
          
          console.log(`[RebookJob] Rebook nudges sent for class ${classItem.id}`);
        } catch (error) {
          console.error(`[RebookJob] Error sending rebook nudges for class ${classItem.id}:`, error);
        }
      }
    } catch (error) {
      console.error('[RebookJob] Error in rebook job:', error);
    }
  });

  console.log('[RebookJob] Rebook nudge job scheduled (every 30 minutes)');
}
