import { Router } from 'express';
import { param, body } from 'express-validator';
import { prisma } from '../lib/supabase.js';
import { noShowScorer } from '../services/NoShowScorer.js';
import { optionalAuthMiddleware } from '../middleware/supabaseAuth.js';
import { validateRequest } from '../middleware/validation.js';
import { logger } from '../lib/logger.js';

const router = Router();

router.use(optionalAuthMiddleware);

/**
 * GET /api/filliq/scores/class/:classId
 * Get risk scores for all bookings in a class
 */
router.get(
  '/class/:classId',
  [param('classId').isString().trim().notEmpty().withMessage('classId is required')],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const { classId } = req.params;

      const scores = await prisma.bookingRiskScore.findMany({
        where: { classId },
        orderBy: { riskScore: 'desc' },
        include: {
          bookingMember: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: scores.map((s: any) => ({
          bookingId: s.bookingId,
          memberId: s.memberId,
          memberName: s.bookingMember ? `${s.bookingMember.firstName} ${s.bookingMember.lastName}` : 'Unknown Member',
          riskScore: s.riskScore,
          atRisk: s.atRisk,
          riskFactors: s.riskFactors,
          scoredAt: s.scoredAt,
          outcome: s.outcome
        }))
      });
    } catch (error) {
      logger.error('Error fetching class scores:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch risk scores'
      });
    }
  }
);

/**
 * GET /api/filliq/scores/member/:memberId
 * Get risk score history for a member
 */
router.get(
  '/member/:memberId',
  [param('memberId').isString().trim().notEmpty().withMessage('memberId is required')],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const { memberId } = req.params;

      const scores = await prisma.bookingRiskScore.findMany({
        where: { memberId },
        orderBy: { scoredAt: 'desc' },
        include: {
          bookingClass: {
            select: {
              name: true,
              startTime: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: scores.map((s: any) => ({
          bookingId: s.bookingId,
          classId: s.classId,
          className: s.bookingClass?.name || 'Unknown Class',
          classDate: s.bookingClass?.startTime,
          riskScore: s.riskScore,
          atRisk: s.atRisk,
          scoredAt: s.scoredAt,
          outcome: s.outcome
        }))
      });
    } catch (error) {
      logger.error('Error fetching member scores:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch member risk history'
      });
    }
  }
);

/**
 * POST /api/filliq/scores/calculate
 * Manually trigger scoring for a class (for testing)
 */
router.post(
  '/calculate',
  [body('classId').isString().trim().notEmpty().withMessage('classId is required')],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const { classId } = req.body;

      const results = await noShowScorer.scoreClassBookings(classId);

      res.json({
        success: true,
        data: {
          classId,
          bookingsScored: results.length,
          highRiskCount: results.filter(r => r.atRisk).length,
          scores: results
        }
      });
    } catch (error) {
      logger.error('Error calculating scores:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate risk scores'
      });
    }
  }
);

export default router;
