import { Router } from 'express';
import { body } from 'express-validator';
import { integrationService } from '../services/IntegrationService.js';
import { validateRequest } from '../middleware/validation.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * POST /api/filliq/integrations/webhook
 * Universal webhook endpoint for Mindbody, Walla, Momence, Mariana Tek
 */
router.post(
  '/webhook',
  [
    body('platform').isIn(['mindbody', 'walla', 'momence', 'marianatek']),
    body('eventType').isIn(['booking.created', 'booking.cancelled', 'class.created']),
    body('studioId').isString().trim().notEmpty(),
    body('data').isObject()
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      await integrationService.processExternalEvent(req.body);

      res.status(200).json({
        success: true,
        message: 'External webhook processed successfully'
      });
    } catch (error) {
      logger.error('Error processing integration webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process integration webhook'
      });
    }
  }
);

export default router;
