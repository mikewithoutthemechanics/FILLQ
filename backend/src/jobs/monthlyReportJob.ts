import cron from 'node-cron';
import { DashboardService } from '../services/DashboardService.js';
import { logger } from '../lib/logger.js';

/**
 * Monthly Report Generation Job
 * 
 * Runs on the 1st of each month at 6 AM
 * Generates and saves monthly report for previous month
 */
export function startMonthlyReportJob(): void {
  cron.schedule('0 6 1 * *', async () => {
    logger.info('[MonthlyReportJob] Generating monthly report...');

    try {
      const now = new Date();
      const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

      const studioId = 'default-studio';
      const service = new DashboardService(studioId);
      
      await service.saveMonthlyReport(year, prevMonth, studioId);
      const report = await service.generateMonthlyReport(year, prevMonth);

      logger.info('[MonthlyReportJob] Monthly report generated:', {
        year,
        month: prevMonth,
        revenueRecovered: report.revenueRecovered,
        spotsFilled: report.spotsFilled,
        fillRate: report.fillRate
      });

    } catch (error) {
      logger.error('[MonthlyReportJob] Error generating monthly report:', error);
    }
  }, {
    timezone: 'Africa/Johannesburg'
  });

  logger.info('[MonthlyReportJob] Monthly report job scheduled (1st of month at 06:00 SAST)');
}
