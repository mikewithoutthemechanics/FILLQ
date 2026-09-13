import cron from 'node-cron';
import { DashboardService } from '../services/DashboardService.js';
import { prisma } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

/**
 * Monthly Report Generation Job
 * 
 * Runs on the 1st of each month at 6 AM
 * Generates and saves monthly report for previous month across all registered studios
 */
export function startMonthlyReportJob(): void {
  cron.schedule('0 6 1 * *', async () => {
    logger.info('[MonthlyReportJob] Generating monthly reports across all studios...');

    try {
      const now = new Date();
      const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

      // Query distinct studio IDs from filliq_settings
      const settings = await prisma.fillIQSettings.findMany({
        select: { studioId: true }
      });

      const studioIds = settings.length > 0
        ? settings.map(s => s.studioId)
        : ['default-studio'];

      for (const studioId of studioIds) {
        try {
          const service = new DashboardService(studioId);

          await service.saveMonthlyReport(year, prevMonth, studioId);
          const report = await service.generateMonthlyReport(year, prevMonth);

          logger.info(`[MonthlyReportJob] Studio ${studioId} monthly report generated:`, {
            year,
            month: prevMonth,
            revenueRecovered: report.revenueRecovered,
            spotsFilled: report.spotsFilled,
            fillRate: report.fillRate
          });
        } catch (studioErr) {
          logger.error(`[MonthlyReportJob] Error generating report for studio ${studioId}:`, studioErr);
        }
      }

    } catch (error) {
      logger.error('[MonthlyReportJob] Error generating monthly report:', error);
    }
  }, {
    timezone: 'Africa/Johannesburg'
  });

  logger.info('[MonthlyReportJob] Monthly report job scheduled (1st of month at 06:00 SAST)');
}
