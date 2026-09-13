import { Router } from 'express';
import { body, query } from 'express-validator';
import { prisma } from '../lib/supabase.js';
import { WaitlistEngine } from '../services/WaitlistEngine.js';
import { optionalAuthMiddleware } from '../middleware/supabaseAuth.js';
import { validateRequest } from '../middleware/validation.js';
import { logger } from '../lib/logger.js';

const router = Router();

router.use(optionalAuthMiddleware);

/**
 * POST /api/filliq/waitlist/trigger
 * Manually trigger waitlist fill (for testing)
 */
router.post(
  '/trigger',
  [
    body('classId').isString().trim().notEmpty().withMessage('classId is required'),
    body('cancelledBookingId').isString().trim().notEmpty().withMessage('cancelledBookingId is required'),
    body('studioId').optional().isString().trim()
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const { classId, cancelledBookingId } = req.body;
      const studioId = req.body.studioId || req.user?.studioId || 'default-studio';

      const engine = new WaitlistEngine(studioId);
      await engine.initialize();
      await engine.trigger(classId, cancelledBookingId);

      res.json({
        success: true,
        message: 'Waitlist fill triggered'
      });
    } catch (error) {
      logger.error('Error triggering waitlist:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger waitlist fill'
      });
    }
  }
);

/**
 * GET /api/filliq/waitlist/events
 * Get fill event log
 */
router.get(
  '/events',
  [
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    query('classId').optional().isString().trim()
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const limit = req.query.limit || 50;
      const { classId } = req.query;

      const where: any = {};
      if (classId) where.classId = classId;

      const events = await prisma.waitlistFillEvent.findMany({
        where,
        orderBy: { triggeredAt: 'desc' },
        take: Number(limit),
        include: {
          fillEventClass: {
            select: {
              name: true,
              startTime: true
            }
          },
          fillEventMember: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: events.map((e: any) => ({
          id: e.id,
          classId: e.classId,
          className: e.fillEventClass?.name || 'Unknown Class',
          classDate: e.fillEventClass?.startTime,
          triggeredAt: e.triggeredAt,
          invitesSent: e.invitesSent,
          filled: e.filled,
          filledByMember: e.fillEventMember
            ? `${e.fillEventMember.firstName} ${e.fillEventMember.lastName}`
            : null,
          fillTimeSeconds: e.fillTimeSeconds,
          revenueRecovered: e.revenueRecovered,
          status: e.status
        }))
      });
    } catch (error) {
      logger.error('Error fetching fill events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch fill events'
      });
    }
  }
);

/**
 * GET /api/filliq/waitlist/pending
 * Get pending invites for monitoring
 */
router.get(
  '/pending',
  [query('classId').optional().isString().trim()],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const { classId } = req.query;

      const where: any = { status: 'sent' };
      if (classId) where.classId = classId;

      const invites = await prisma.pendingInvite.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        include: {
          inviteMember: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          inviteClass: {
            select: {
              name: true,
              startTime: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: invites.map((i: any) => ({
          id: i.id,
          classId: i.classId,
          className: i.inviteClass?.name || 'Unknown Class',
          memberId: i.memberId,
          memberName: i.inviteMember ? `${i.inviteMember.firstName} ${i.inviteMember.lastName}` : 'Unknown Member',
          phone: i.phone,
          position: i.position,
          sentAt: i.sentAt,
          status: i.status
        }))
      });
    } catch (error) {
      logger.error('Error fetching pending invites:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pending invites'
      });
    }
  }
);

export default router;
