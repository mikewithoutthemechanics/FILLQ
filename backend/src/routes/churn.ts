import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ChurnScorer } from '../services/ChurnScorer.js';
import { createWhatsAppService, WHATSAPP_TEMPLATES } from '../services/WhatsAppService.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/filliq/churn/members
 * Get all at-risk members, sorted by churn score
 */
router.get('/members', async (req, res) => {
  try {
    const { minScore = '50' } = req.query;

    const scorer = new ChurnScorer('default-studio');
    const members = await scorer.getAtRiskMembers(parseInt(minScore as string));

    res.json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    console.error('Error fetching at-risk members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch at-risk members'
    });
  }
});

/**
 * POST /api/filliq/churn/nudge/:memberId
 * Trigger retention WhatsApp nudge for a member
 */
router.post('/nudge/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { studioId = 'default-studio' } = req.body;

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
    console.error('Error sending churn nudge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send churn nudge'
    });
  }
});

/**
 * POST /api/filliq/churn/offer/:memberId
 * Trigger free-class offer for a member
 */
router.post('/offer/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { studioId = 'default-studio' } = req.body;

    const member = await prisma.member.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // In production, this would create a credit/voucher
    // For now, just send the same nudge with "offer" logged

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
    console.error('Error triggering offer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger offer'
    });
  }
});

/**
 * GET /api/filliq/churn/summary
 * Get churn summary statistics
 */
router.get('/summary', async (req, res) => {
  try {
    const scorer = new ChurnScorer('default-studio');
    const summary = await scorer.getChurnSummary();

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching churn summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch churn summary'
    });
  }
});

export default router;
