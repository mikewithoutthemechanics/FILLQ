import { Router } from 'express';
import { body } from 'express-validator';
import crypto from 'crypto';
import { integrationService } from '../services/IntegrationService.js';
import { validateRequest } from '../middleware/validation.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * Verify external integration webhook signature or secret header
 */
function verifyIntegrationSecret(req: any): boolean {
  const secret = process.env.INTEGRATION_WEBHOOK_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('INTEGRATION_WEBHOOK_SECRET is not configured in production. Rejecting webhook.');
      return false;
    }
    return true;
  }

  // Check header token or HMAC signature
  const authHeader = req.headers['x-integration-secret'] || req.headers['authorization'];
  if (authHeader && authHeader.replace('Bearer ', '') === secret) {
    return true;
  }

  const signature = req.headers['x-hub-signature-256'] as string;
  if (signature) {
    const rawBodyBuffer = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const expectedHex = crypto.createHmac('sha256', secret).update(rawBodyBuffer).digest('hex');
    const expectedSignature = `sha256=${expectedHex}`;

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
      return true;
    }
  }

  return false;
}

/**
 * POST /api/filliq/integrations/webhook
 * Universal authenticated webhook endpoint for Mindbody, Walla, Momence, Mariana Tek
 */
router.post(
  '/webhook',
  [
    body('platform').isIn(['mindbody', 'walla', 'momence', 'marianatek']).withMessage('Invalid integration platform'),
    body('eventType').isIn(['booking.created', 'booking.cancelled', 'class.created']).withMessage('Invalid event type'),
    body('studioId').isString().trim().notEmpty().withMessage('studioId is required'),
    body('data').isObject().withMessage('data payload must be an object')
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      if (!verifyIntegrationSecret(req)) {
        logger.warn(`Unauthorized external integration webhook request for platform: ${req.body.platform}`);
        return res.status(401).json({
          success: false,
          error: 'Unauthorized integration webhook request'
        });
      }

      await integrationService.processExternalEvent(req.body);

      res.status(200).json({
        success: true,
        message: 'External webhook processed successfully'
      });
    } catch (error: any) {
      logger.error('Error processing integration webhook:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to process integration webhook'
      });
    }
  }
);

export default router;
