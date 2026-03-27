import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { WaitlistEngine } from '../services/WaitlistEngine.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/filliq/waitlist/trigger
 * Manually trigger waitlist fill (for testing)
 */
router.post('/trigger', async (req, res) => {
  try {
    const { classId, cancelledBookingId, studioId = 'default-studio' } = req.body;

    if (!classId || !cancelledBookingId) {
      return res.status(400).json({
        success: false,
        error: 'classId and cancelledBookingId are required'
      });
    }

    const engine = new WaitlistEngine(studioId);
    await engine.initialize();
    await engine.trigger(classId, cancelledBookingId);

    res.json({
      success: true,
      message: 'Waitlist fill triggered'
    });
  } catch (error) {
    console.error('Error triggering waitlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger waitlist fill'
    });
  }
});

/**
 * GET /api/filliq/waitlist/events
 * Get fill event log
 */
router.get('/events', async (req, res) => {
  try {
    const { limit = '50', classId } = req.query;

    const where: any = {};
    if (classId) where.classId = classId;

    const events = await prisma.waitlistFillEvent.findMany({
      where,
      orderBy: { triggeredAt: 'desc' },
      take: parseInt(limit as string),
      include: {
        class: {
          select: {
            name: true,
            startTime: true
          }
        },
        filledByMember: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: events.map(e => ({
        id: e.id,
        classId: e.classId,
        className: e.class.name,
        classDate: e.class.startTime,
        triggeredAt: e.triggeredAt,
        invitesSent: e.invitesSent,
        filled: e.filled,
        filledByMember: e.filledByMember 
          ? `${e.filledByMember.firstName} ${e.filledByMember.lastName}`
          : null,
        fillTimeSeconds: e.fillTimeSeconds,
        revenueRecovered: e.revenueRecovered,
        status: e.status
      }))
    });
  } catch (error) {
    console.error('Error fetching fill events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fill events'
    });
  }
});

/**
 * GET /api/filliq/waitlist/pending
 * Get pending invites for monitoring
 */
router.get('/pending', async (req, res) => {
  try {
    const { classId } = req.query;

    const where: any = { status: 'sent' };
    if (classId) where.classId = classId;

    const invites = await prisma.pendingInvite.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true
          }
        },
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
      data: invites.map(i => ({
        id: i.id,
        classId: i.classId,
        className: i.class.name,
        memberId: i.memberId,
        memberName: `${i.member.firstName} ${i.member.lastName}`,
        phone: i.phone,
        position: i.position,
        sentAt: i.sentAt,
        status: i.status
      }))
    });
  } catch (error) {
    console.error('Error fetching pending invites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending invites'
    });
  }
});

export default router;
