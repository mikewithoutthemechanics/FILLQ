import axios from 'axios';
import type { WhatsAppMessage, WABAWebhookPayload, InboundReply } from '../types/index.js';

interface WhatsAppConfig {
  provider: '360dialog' | 'vonage';
  phoneNumberId: string;
  accessToken: string;
  apiVersion?: string;
}

/**
 * WhatsApp Business API Service
 * 
 * Handles sending templated messages and receiving webhook callbacks
 * Supports 360dialog and Vonage providers
 */
export class WhatsAppService {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  /**
   * Send a templated WhatsApp message
   */
  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      let response;

      if (this.config.provider === '360dialog') {
        response = await this.send360Dialog(message);
      } else {
        response = await this.sendVonage(message);
      }

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id
      };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send via 360dialog API
   */
  private async send360Dialog(message: WhatsAppMessage) {
    const url = `https://waba.360dialog.io/v1/messages`;
    
    return axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatPhoneNumber(message.to),
        type: 'template',
        template: {
          name: message.templateName,
          language: {
            code: 'en'
          },
          components: [
            {
              type: 'body',
              parameters: message.params.map((param, index) => ({
                type: 'text',
                text: param
              }))
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  /**
   * Send via Vonage API
   */
  private async sendVonage(message: WhatsAppMessage) {
    const url = `https://messages-sandbox.nexmo.com/v1/messages`;
    
    return axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatPhoneNumber(message.to),
        type: 'template',
        template: {
          name: message.templateName,
          language: {
            code: 'en'
          },
          components: [
            {
              type: 'body',
              parameters: message.params.map(param => ({
                type: 'text',
                text: param
              }))
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  /**
   * Format phone number to E.164
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Ensure it starts with country code
    if (cleaned.startsWith('0')) {
      // South Africa number starting with 0
      cleaned = '27' + cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Parse webhook payload and extract replies
   */
  parseWebhook(payload: WABAWebhookPayload): InboundReply[] {
    const replies: InboundReply[] = [];

    if (!payload.entry) return replies;

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const value = change.value;
        
        if (value.messages) {
          for (const message of value.messages) {
            if (message.type === 'text' && message.text) {
              replies.push({
                from: message.from,
                body: message.text.body,
                timestamp: new Date(parseInt(message.timestamp) * 1000),
                messageId: message.id
              });
            }
          }
        }
      }
    }

    return replies;
  }

  /**
   * Verify webhook signature (security)
   */
  verifyWebhookSignature(payload: string, signature: string, appSecret: string): boolean {
    // Implementation depends on provider
    // 360dialog and Vonage have different signature methods
    // This is a simplified placeholder
    return true; // Implement actual verification based on provider docs
  }
}

/**
 * Factory to create WhatsApp service with studio settings
 */
export async function createWhatsAppService(studioId: string): Promise<WhatsAppService | null> {
  // In production, fetch from database with decrypted token
  // For now, return from environment variables
  const provider = process.env.WABA_PROVIDER as '360dialog' | 'vonage' || '360dialog';
  const phoneNumberId = process.env.WABA_PHONE_NUMBER_ID || '';
  const accessToken = process.env.WABA_ACCESS_TOKEN || '';

  if (!accessToken || !phoneNumberId) {
    console.warn('WhatsApp not configured');
    return null;
  }

  return new WhatsAppService({
    provider,
    phoneNumberId,
    accessToken
  });
}

// Template definitions for FillIQ
export const WHATSAPP_TEMPLATES = {
  SPOT_AVAILABLE: 'filiq_spot_available',
  SPOT_CONFIRMED: 'filiq_spot_confirmed',
  SPOT_TAKEN: 'filiq_spot_taken',
  REBOOK_NUDGE: 'filiq_rebook_nudge',
  CHURN_NUDGE: 'filiq_churn_nudge'
} as const;
