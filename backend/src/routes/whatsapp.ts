import { Router } from 'express';
import { WaitlistEngine } from '../services/WaitlistEngine.js';
import type { WABAWebhookPayload } from '../types/index.js';

const router = Router();

/**
 * POST /api/filliq/whatsapp/webhook
 * Inbound webhook from WABA provider
 */
router.post('/webhook', async (req, res) => {
  try {
    const payload: WABAWebhookPayload = req.body;

    // Verify webhook signature (implementation depends on provider)
    // const signature = req.headers['x-hub-signature-256'];
    // const isValid = verifySignature(payload, signature);

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

              console.log(`Received message from ${phone}: ${body}`);

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
            console.log(`Message ${status.id} status: ${status.status}`);
            // Update message delivery status in database if needed
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent retries
    res.status(200).send('OK');
  }
});

/**
 * GET /api/filliq/whatsapp/webhook
 * Webhook verification endpoint (for Meta/WhatsApp verification)
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify token matches expected value
  const verifyToken = process.env.WABA_VERIFY_TOKEN || 'filliq-verify-token';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Verification failed');
  }
});

export default router;
