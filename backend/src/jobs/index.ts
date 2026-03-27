import { startScoringJob, startOutcomeRecordingJob } from './scoringJob.js';
import { startChurnJob, startChurnOutcomeJob } from './churnJob.js';
import { startRebookJob } from './rebookJob.js';
import { startMonthlyReportJob } from './monthlyReportJob.js';

/**
 * Start all scheduled jobs
 */
export function startAllJobs(): void {
  console.log('[Jobs] Starting all scheduled jobs...');

  // No-show scoring jobs
  startScoringJob();
  startOutcomeRecordingJob();

  // Churn jobs
  startChurnJob();
  startChurnOutcomeJob();

  // Rebook nudge job
  startRebookJob();

  // Monthly report job
  startMonthlyReportJob();

  console.log('[Jobs] All jobs started successfully');
}

export {
  startScoringJob,
  startOutcomeRecordingJob,
  startChurnJob,
  startChurnOutcomeJob,
  startRebookJob,
  startMonthlyReportJob
};
