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
   * Process inbound webhook from external platforms
   */
  async processExternalEvent(payload: ExternalWebhookPayload): Promise<boolean> {
    logger.info(`Received external ${payload.platform} webhook event: ${payload.eventType}`);

    const { eventType, studioId, data } = payload;

    if (eventType === 'booking.cancelled') {
      if (data.externalClassId && data.externalBookingId) {
        // Trigger FillIQ AI waitlist fill
        await waitlistEngine.trigger(data.externalClassId, data.externalBookingId);
        logger.info(`Triggered FillIQ waitlist fill for external cancellation on class ${data.externalClassId}`);
        return true;
      }
    }

    if (eventType === 'booking.created') {
      if (data.memberEmail && data.memberFirstName && data.memberLastName) {
        // Upsert member into local database
        await prisma.member.upsert({
          where: { email: data.memberEmail },
          update: {
            phone: data.memberPhone || '+27830000000',
            firstName: data.memberFirstName,
            lastName: data.memberLastName
          },
          create: {
            email: data.memberEmail,
            phone: data.memberPhone || '+27830000000',
            firstName: data.memberFirstName,
            lastName: data.memberLastName,
            membershipType: 'monthly',
            membershipStatus: 'active'
          }
        });
        return true;
      }
    }

    return true;
  }
}

export const integrationService = new IntegrationService();
