import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { FillIQSettings } from '../types/index.js';

const prisma = new PrismaClient();

// Initialize Stripe with secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export class SubscriptionService {
  private studioId: string;

  constructor(studioId: string) {
    this.studioId = studioId;
  }

  /**
   * Get or create Stripe customer for the studio
   */
  async getOrCreateCustomer(): Promise<Stripe.Customer> {
    const settings = await prisma.fillIQSettings.findUnique({
      where: { studioId: this.studioId },
    });

    if (settings?.stripeCustomerId) {
      // Retrieve existing customer
      return await stripe.customers.retrieve(settings.stripeCustomerId);
    }

    // Create new customer
    const customer = await stripe.customers.create({
      metadata: {
        studioId: this.studioId,
      },
    });

    // Save customer ID to settings
    await prisma.fillIQSettings.upsert({
      where: { studioId: this.studioId },
      update: { stripeCustomerId: customer.id },
      create: {
        studioId: this.studioId,
        stripeCustomerId: customer.id,
      },
    });

    return customer;
  }

  /**
   * Create a subscription for the studio
   */
  async createSubscription(
    priceId: string,
    trialPeriodDays?: number
  ): Promise<Stripe.Subscription> {
    const customer = await this.getOrCreateCustomer();

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: trialPeriodDays,
      metadata: {
        studioId: this.studioId,
      },
    });

    // Update settings with subscription ID
    await prisma.fillIQSettings.update({
      where: { studioId: this.studioId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      },
    });

    return subscription;
  }

  /**
   * Update subscription to a new price (tier)
   */
  async updateSubscription(newPriceId: string): Promise<Stripe.Subscription> {
    const settings = await prisma.fillIQSettings.findUnique({
      where: { studioId: this.studioId },
    });

    if (!settings?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    const subscription = await stripe.subscriptions.retrieve(
      settings.stripeSubscriptionId
    );

    // Update subscription items
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      }
    );

    // Update subscription tier in settings
    await prisma.fillIQSettings.update({
      where: { studioId: this.studioId },
      data: {
        subscriptionTier: this.priceIdToTier(newPriceId),
      },
    });

    return updatedSubscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<Stripe.Subscription> {
    const settings = await prisma.fillIQSettings.findUnique({
      where: { studioId: this.studioId },
    });

    if (!settings?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    const subscription = await stripe.subscriptions.del(
      settings.stripeSubscriptionId
    );

    // Update settings
    await prisma.fillIQSettings.update({
      where: { studioId: this.studioId },
      data: {
        subscriptionStatus: subscription.status,
        stripeSubscriptionId: null,
      },
    });

    return subscription;
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    const customer = await this.getOrCreateCustomer();

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        studioId: this.studioId,
      },
    });

    return session;
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(
    payload: Buffer,
    sig: string
  ): Promise<Stripe.Event> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed.`, err);
      throw err;
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice
        );
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return event;
  }

  // Webhook handlers
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    if (session.metadata?.studioId !== this.studioId) {
      return; // Not for our studio
    }

    const subscriptionId = session.subscription as string;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await prisma.fillIQSettings.update({
      where: { studioId: this.studioId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionTier: this.priceIdToTier(
          subscription.items.data[0].price.id
        ),
        subscriptionStartedAt: new Date(
          subscription.current_period_start * 1000
        ),
        subscriptionEndsAt: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });
  }

  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice
  ): Promise<void> {
    // Update subscription status if needed
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription as string
      );

      await prisma.fillIQSettings.update({
        where: { studioId: this.studioId },
        data: {
          subscriptionStatus: subscription.status,
        },
      });
    }
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice
  ): Promise<void> {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription as string
      );

      await prisma.fillIQSettings.update({
        where: { studioId: this.studioId },
        data: {
          subscriptionStatus: subscription.status,
        },
      });
    }
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription
  ): Promise<void> {
    await prisma.fillIQSettings.update({
      where: { studioId: this.studioId },
      data: {
        subscriptionStatus: subscription.status,
        stripeSubscriptionId: null,
      },
    });
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    await prisma.fillIQSettings.update({
      where: { studioId: this.studioId },
      data: {
        subscriptionStatus: subscription.status,
        subscriptionTier: this.priceIdToTier(
          subscription.items.data[0].price.id
        ),
        subscriptionEndsAt: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });
  }

  /**
   * Convert Stripe price ID to subscription tier
   */
  private priceIdToTier(priceId: string): string {
    // Map price IDs to tiers - in production, these would come from environment or config
    const priceIdMap: Record<string, string> = {
      // Starter tier
      'price_starter_monthly': 'starter',
      'price_starter_yearly': 'starter',
      // Growth tier
      'price_growth_monthly': 'growth',
      'price_growth_yearly': 'growth',
      // Professional tier
      'price_professional_monthly': 'professional',
      'price_professional_yearly': 'professional',
      // Enterprise tier (custom)
      'price_enterprise': 'enterprise',
    };

    return priceIdMap[priceId] || 'starter';
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<{
    tier: string;
    status: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  } | null> {
    const settings = await prisma.fillIQSettings.findUnique({
      where: { studioId: this.studioId },
    });

    if (!settings?.stripeSubscriptionId) {
      return null;
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(
        settings.stripeSubscriptionId
      );

      return {
        tier: settings.subscriptionTier,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      console.error('Error retrieving subscription status:', error);
      return null;
    }
  }
}

export const subscriptionService = new SubscriptionService('default-studio');