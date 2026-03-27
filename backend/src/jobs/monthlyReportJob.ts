import cron from 'node-cron';
import { DashboardService } from '../services/DashboardService.js';

/**
 * Monthly Report Generation Job
 * 
 * Runs on the 1st of each month at 6 AM
 * Generates and saves monthly report for previous month
 */
export function startMonthlyReportJob(): void {
  // Run at 6:00 AM on the 1st of each month
  cron.schedule('0 6 1 * *', async () => {
    console.log('[MonthlyReportJob] Generating monthly report...');

    try {
      // Calculate previous month
      const now = new Date();
      const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

      // In production, iterate through all studios
      const studioId = 'default-studio';

      const service = new DashboardService(studioId);
      
      // Generate and save report
      await service.saveMonthlyReport(year, prevMonth, studioId);

      // Get report for email
      const report = await service.generateMonthlyReport(year, prevMonth);

      // In production, send email to studio owner
      console.log('[MonthlyReportJob] Monthly report generated:', {
        year,
        month: prevMonth,
        revenueRecovered: report.revenueRecovered,
        spotsFilled: report.spotsFilled,
        fillRate: report.fillRate
      });

      // TODO: Send email notification
      // await sendMonthlyReportEmail(studioId, report);

    } catch (error) {
      console.error('[MonthlyReportJob] Error generating monthly report:', error);
    }
  }, {
    timezone: 'Africa/Johannesburg'
  });

  console.log('[MonthlyReportJob] Monthly report job scheduled (1st of month at 06:00 SAST)');
}

/**
 * Monthly Report Email Template
 */
function generateReportEmail(report: {
  year: number;
  month: number;
  revenueRecovered: number;
  spotsFilled: number;
  avgFillTimeMinutes: number;
  churnsPrevented: number;
  fillRate: number;
}): string {
  const monthName = new Date(report.year, report.month - 1).toLocaleString('en-ZA', { month: 'long' });

  return `
Subject: FillIQ recovered R${report.revenueRecovered.toFixed(2)} for your studio in ${monthName}

Hi there,

Your FillIQ monthly report for ${monthName} ${report.year} is ready:

📊 THIS MONTH'S RECOVERY
━━━━━━━━━━━━━━━━━━━━━━━
• Revenue Recovered: R${report.revenueRecovered.toFixed(2)}
• Spots Filled: ${report.spotsFilled}
• Fill Rate: ${report.fillRate}%
• Average Fill Time: ${report.avgFillTimeMinutes} minutes

🎯 CHURN PREVENTION
━━━━━━━━━━━━━━━━━━━━━━━
• Members Retained: ${report.churnsPrevented}
• At-Risk Members Identified: ${report.atRiskMembersFlagged || 'N/A'}

💡 INSIGHTS
━━━━━━━━━━━━━━━━━━━━━━━
${report.fillRate >= 70 
  ? '🎉 Great job! Your fill rate is above 70%.' 
  : report.fillRate >= 50 
    ? '📈 Good progress! Your fill rate is improving.' 
    : '💪 Let\'s work on improving your fill rate together.'}

View your full dashboard: [Dashboard Link]

Best regards,
The FillIQ Team
  `.trim();
}
