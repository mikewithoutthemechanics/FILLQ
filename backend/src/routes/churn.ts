import { Router } from 'express';
import { param, query, body } from 'express-validator';
import { prisma } from '../lib/supabase.js';
import { ChurnScorer } from '../services/ChurnScorer.js';
import { createWhatsAppService, WHATSAPP_TEMPLATES } from '../services/WhatsAppService.js';
import { optionalAuthMiddleware } from '../middleware/supabaseAuth.js';
import { validateRequest } from '../middleware/validation.js';
import { logger } from '../lib/logger.js';

const router = Router();

router.use(optionalAuthMiddleware);

/**
 * GET /api/filliq/churn/members
 * Get all at-risk members, sorted by churn score
 */
router.get(
  '/members',
  [
    query('minScore').optional().isInt({ min: 0, max: 100 }).toInt(),
    query('studioId').optional().isString().trim()
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const minScore = req.query.minScore !== undefined ? req.query.minScore : 50;
      const studioId = (req.query.studioId as string) || req.user?.studioId || 'default-studio';

      const scorer = new ChurnScorer(studioId);
      await scorer.initialize();
      const members = await scorer.getAtRiskMembers(Number(minScore));

      res.json({
        success: true,
        count: members.length,
        data: members
      });
    } catch (error) {
      logger.error('Error fetching at-risk members:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch at-risk members'
      });
    }
  }
);

/**
 * POST /api/filliq/churn/nudge/:memberId
 * Trigger retention WhatsApp nudge for a member
 */
router.post(
  '/nudge/:memberId',
  [
    param('memberId').isString().trim().notEmpty().withMessage('memberId is required'),
    body('studioId').optional().isString().trim()
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const { memberId } = req.params;
      const studioId = req.body.studioId || req.user?.studioId || 'default-studio';

      const member = await prisma.member.findUnique({
        where: { id: memberId }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'Member not found'
        });
      }

      // Get studio settings
      const settings = await prisma.fillIQSettings.findUnique({
        where: { studioId }
      });

      const studioName = settings?.studioWhatsAppNumber || 'the studio';

      // Send WhatsApp nudge
      const whatsapp = await createWhatsAppService(studioId);

      if (!whatsapp) {
        return res.status(500).json({
          success: false,
          error: 'WhatsApp service not configured'
        });
      }

      const result = await whatsapp.sendMessage({
        to: member.phone,
        templateName: WHATSAPP_TEMPLATES.CHURN_NUDGE,
        params: [member.firstName, studioName]
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to send nudge',
          details: result.error
        });
      }

      // Update churn signal
      await prisma.memberChurnSignal.updateMany({
        where: {
          memberId,
          outcome: 'pending'
        },
        data: {
          actionTaken: 'nudge_sent',
          actionTakenAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Churn nudge sent',
        messageId: result.messageId
      });
    } catch (error) {
      logger.error('Error sending churn nudge:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send churn nudge'
      });
    }
  }
);

/**
 * POST /api/filliq/churn/offer/:memberId
 * Trigger free-class offer for a member
 */
router.post(
  '/offer/:memberId',
  [
    param('memberId').isString().trim().notEmpty().withMessage('memberId is required'),
    body('studioId').optional().isString().trim()
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const { memberId } = req.params;

      const member = await prisma.member.findUnique({
        where: { id: memberId }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'Member not found'
        });
      }

      // Update churn signal
      await prisma.memberChurnSignal.updateMany({
        where: {
          memberId,
          outcome: 'pending'
        },
        data: {
          actionTaken: 'offer_sent',
          actionTakenAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Free class offer triggered for member'
      });
    } catch (error) {
      logger.error('Error triggering offer:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger offer'
      });
    }
  }
);

/**
 * GET /api/filliq/churn/summary
 * Get churn summary statistics
 */
router.get(
  '/summary',
  [query('studioId').optional().isString().trim()],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const studioId = (req.query.studioId as string) || req.user?.studioId || 'default-studio';
      const scorer = new ChurnScorer(studioId);
      await scorer.initialize();
      const summary = await scorer.getChurnSummary();

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error fetching churn summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch churn summary'
      });
    }
  }
);

export default router;
