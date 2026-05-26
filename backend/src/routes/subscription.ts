import { Router } from 'express';
import { SubscriptionService } from '../services/SubscriptionService.js';

const router = Router();

/**
 * GET /api/filliq/subscription/status
 * Get current subscription status
 */
router.get('/status', async (req, res) => {
  try {
    const { studioId = 'default-studio' } = req.query;

    const service = new SubscriptionService(studioId as string);
    const status = await service.getSubscriptionStatus();

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription status'
    });
  }
});

/**
 * POST /api/filliq/subscription/create-checkout-session
 * Create a checkout session for subscription
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { 
      studioId = 'default-studio',
      priceId,
      successUrl,
      cancelUrl
    } = req.body;

    if (!priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: priceId, successUrl, cancelUrl'
      });
    }

    const service = new SubscriptionService(studioId as string);
    const session = await service.createCheckoutSession(
      priceId,
      successUrl,
      cancelUrl
    );

    res.json({
      success: true,
      data: { url: session.url }
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session'
    });
  }
});

/**
 * POST /api/filliq/subscription/update
 * Update subscription to a new tier
 */
router.post('/update', async (req, res) => {
  try {
    const { studioId = 'default-studio', priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: priceId'
      });
    }

    const service = new SubscriptionService(studioId as string);
    const subscription = await service.updateSubscription(priceId);

    res.json({
      success: true,
      data: {
        id: subscription.id,
        status: subscription.status,
        items: subscription.items.data
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update subscription'
    });
  }
});

/**
 * POST /api/filliq/subscription/cancel
 * Cancel subscription
 */
router.post('/cancel', async (req, res) => {
  try {
    const { studioId = 'default-studio' } = req.body;

    const service = new SubscriptionService(studioId as string);
    const subscription = await service.cancelSubscription();

    res.json({
      success: true,
      data: {
        id: subscription.id,
        status: subscription.status
      }
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel subscription'
    });
  }
});

/**
 * POST /api/filliq/subscription/webhook
 * Handle Stripe webhook events
 */
router.post('/webhook', async (req, res) => {
  try {
    const { studioId = 'default-studio' } = req.query;
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      return res.status(400).json({
        success: false,
        error: 'Missing stripe-signature header'
      });
    }

    const service = new SubscriptionService(studioId as string);
    const event = await service.handleWebhookEvent(
      JSON.stringify(req.body),
      sig
    );

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(400).json({
      success: false,
      error: `Webhook Error: ${error.message}`
    });
  }
});

export default router;