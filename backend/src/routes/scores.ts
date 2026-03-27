import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { noShowScorer } from '../services/NoShowScorer.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/filliq/scores/class/:classId
 * Get risk scores for all bookings in a class
 */
router.get('/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;

    const scores = await prisma.bookingRiskScore.findMany({
      where: { classId },
      orderBy: { riskScore: 'desc' },
      include: {
        member: {
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
      data: scores.map(s => ({
        bookingId: s.bookingId,
        memberId: s.memberId,
        memberName: `${s.member.firstName} ${s.member.lastName}`,
        riskScore: s.riskScore,
        atRisk: s.atRisk,
        riskFactors: s.riskFactors,
        scoredAt: s.scoredAt,
        outcome: s.outcome
      }))
    });
  } catch (error) {
    console.error('Error fetching class scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch risk scores'
    });
  }
});

/**
 * GET /api/filliq/scores/member/:memberId
 * Get risk score history for a member
 */
router.get('/member/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;

    const scores = await prisma.bookingRiskScore.findMany({
      where: { memberId },
      orderBy: { scoredAt: 'desc' },
      include: {
        class: {
          select: {
            name: true,
            startTime: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: scores.map(s => ({
        bookingId: s.bookingId,
        classId: s.classId,
        className: s.class.name,
        classDate: s.class.startTime,
        riskScore: s.riskScore,
        atRisk: s.atRisk,
        scoredAt: s.scoredAt,
        outcome: s.outcome
      }))
    });
  } catch (error) {
    console.error('Error fetching member scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member risk history'
    });
  }
});

/**
 * POST /api/filliq/scores/calculate
 * Manually trigger scoring for a class (for testing)
 */
router.post('/calculate', async (req, res) => {
  try {
    const { classId } = req.body;

    if (!classId) {
      return res.status(400).json({
        success: false,
        error: 'classId is required'
      });
    }

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
    console.error('Error calculating scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate risk scores'
    });
  }
});

export default router;
