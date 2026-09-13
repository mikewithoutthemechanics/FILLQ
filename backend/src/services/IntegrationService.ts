import { prisma } from '../lib/supabase.js';
import { waitlistEngine } from './WaitlistEngine.js';
import { logger } from '../lib/logger.js';

export interface ExternalWebhookPayload {
  platform: 'mindbody' | 'walla' | 'momence' | 'marianatek';
  eventType: 'booking.created' | 'booking.cancelled' | 'class.created';
  studioId: string;
  data: {
    externalBookingId?: string;
    externalClassId?: string;
    externalMemberId?: string;
    memberEmail?: string;
    memberPhone?: string;
    memberFirstName?: string;
    memberLastName?: string;
    className?: string;
    startTime?: string;
  };
}

/**
 * Universal External Integration Adapter Service
 * Connects external studio management platforms (Mindbody, Walla, Momence, Mariana Tek) with FillIQ.
 */
export class IntegrationService {
  /**
   * Process inbound webhook from external platforms with strict validation
   */
  async processExternalEvent(payload: ExternalWebhookPayload): Promise<boolean> {
    logger.info(`Received external ${payload.platform} webhook event: ${payload.eventType} for studio ${payload.studioId}`);

    const { eventType, studioId, data, platform } = payload;

    if (!data || typeof data !== 'object') {
      throw new Error(`Invalid data payload received from ${platform}`);
    }

    if (eventType === 'booking.cancelled') {
      if (!data.externalClassId || !data.externalBookingId) {
        throw new Error(`Missing required fields externalClassId or externalBookingId for ${platform} cancellation`);
      }

      // Trigger FillIQ AI waitlist fill
      await waitlistEngine.trigger(data.externalClassId, data.externalBookingId);
      logger.info(`Triggered FillIQ waitlist fill for external cancellation on class ${data.externalClassId}`);
      return true;
    }

    if (eventType === 'booking.created') {
      if (!data.memberEmail || !data.memberFirstName || !data.memberLastName) {
        throw new Error(`Missing required member details (email, firstName, lastName) for ${platform} booking.created`);
      }

      if (!data.memberPhone) {
        logger.warn(`Skipping member auto-provisioning for ${data.memberEmail}: missing phone number`);
        return false;
      }

      // Upsert member into local database
      await prisma.member.upsert({
        where: { email: data.memberEmail },
        update: {
          phone: data.memberPhone,
          firstName: data.memberFirstName,
          lastName: data.memberLastName
        },
        create: {
          email: data.memberEmail,
          phone: data.memberPhone,
          firstName: data.memberFirstName,
          lastName: data.memberLastName,
          membershipType: 'monthly',
          membershipStatus: 'active'
        }
      });
      return true;
    }

    return true;
  }
}

export const integrationService = new IntegrationService();
