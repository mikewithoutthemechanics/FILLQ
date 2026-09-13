import { Router } from 'express';
import crypto from 'crypto';
import { WaitlistEngine } from '../services/WaitlistEngine.js';
import type { WABAWebhookPayload } from '../types/index.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * Verify Meta / WhatsApp webhook signature
 */
function verifyWebhookSignature(req: any): boolean {
  const appSecret = process.env.WABA_APP_SECRET;

  if (!appSecret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('WABA_APP_SECRET is not configured in production. Rejecting webhook.');
      return false;
    }
    // Allow unverified webhooks only in development testing when secret is unset
    return true;
  }

  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) return false;

  const expectedHex = crypto
    .createHmac('sha256', appSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  const expectedSignature = `sha256=${expectedHex}`;

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * POST /api/filliq/whatsapp/webhook
 * Inbound webhook from WABA provider
 */
router.post('/webhook', async (req: any, res: any) => {
  try {
    if (!verifyWebhookSignature(req)) {
      logger.warn('Invalid WhatsApp webhook signature');
      return res.status(401).send('Invalid signature');
    }

    const payload: WABAWebhookPayload = req.body;

    // Process each entry
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        // Process incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            if (message.type === 'text' && message.text) {
              const phone = message.from;
              const body = message.text.body;

              logger.info(`Received WhatsApp message from ${phone}: ${body}`);

              // Process through waitlist engine
              const engine = new WaitlistEngine('default-studio');
              await engine.initialize();
              await engine.processReply(phone, body);
            }
          }
        }

        // Process status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            logger.info(`Message ${status.id} status: ${status.status}`);
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(200).send('OK');
  }
});

/**
 * GET /api/filliq/whatsapp/webhook
 * Webhook verification endpoint (for Meta/WhatsApp verification)
 */
router.get('/webhook', (req: any, res: any) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WABA_VERIFY_TOKEN || 'filliq-verify-token';

  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('WhatsApp webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    logger.warn('WhatsApp webhook verification failed');
    res.status(403).send('Verification failed');
  }
});

export default router;
