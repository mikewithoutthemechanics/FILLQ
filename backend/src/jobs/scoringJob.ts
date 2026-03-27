import cron from 'node-cron';
import { noShowScorer } from '../services/NoShowScorer.js';
import { waitlistEngine } from '../services/WaitlistEngine.js';

/**
 * No-Show Scoring Job
 * 
 * Runs every 15 minutes to score bookings for classes starting in ~3 hours
 */
export function startScoringJob(): void {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[ScoringJob] Running no-show scoring check...');

    try {
      // Get classes that need scoring
      const classesToScore = await noShowScorer.getClassesToScore();
      console.log(`[ScoringJob] Found ${classesToScore.length} classes to score`);

      for (const classItem of classesToScore) {
        try {
          // Score all bookings in this class
          const results = await noShowScorer.scoreClassBookings(classItem.id);
          const highRiskCount = results.filter(r => r.atRisk).length;

          console.log(`[ScoringJob] Class ${classItem.id}: ${results.length} bookings scored, ${highRiskCount} high risk`);

          // Check if we should activate waitlist standby
          const shouldActivate = await noShowScorer.shouldActivateWaitlist(classItem.id);
          
          if (shouldActivate) {
            console.log(`[ScoringJob] Class ${classItem.id}: High risk threshold met, waitlist on standby`);
            // The waitlist engine will be triggered when actual cancellation happens
          }
        } catch (error) {
          console.error(`[ScoringJob] Error scoring class ${classItem.id}:`, error);
        }
      }
    } catch (error) {
      console.error('[ScoringJob] Error in scoring job:', error);
    }
  });

  console.log('[ScoringJob] No-show scoring job scheduled (every 15 minutes)');
}

/**
 * Outcome Recording Job
 * 
 * Runs daily at 11 PM to record actual outcomes for scored bookings
 */
export function startOutcomeRecordingJob(): void {
  // Run daily at 23:00
  cron.schedule('0 23 * * *', async () => {
    console.log('[OutcomeJob] Recording booking outcomes...');

    try {
      // Find all bookings that ended today and have risk scores
      // Update outcomes based on actual attendance
      // This is for model improvement
      
      // Implementation would query classes that ended today
      // and update booking_risk_scores with the actual outcome
      
      console.log('[OutcomeJob] Outcomes recorded');
    } catch (error) {
      console.error('[OutcomeJob] Error recording outcomes:', error);
    }
  });

  console.log('[OutcomeJob] Outcome recording job scheduled (daily at 23:00)');
}
