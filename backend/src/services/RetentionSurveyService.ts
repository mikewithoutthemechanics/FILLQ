import { prisma } from '../lib/supabase.js';
import { createWhatsAppService, WHATSAPP_TEMPLATES } from './WhatsAppService.js';
import { logger } from '../lib/logger.js';

export interface MicroSurveyResponse {
  memberId: string;
  reason: 'busy' | 'injury' | 'travel' | 'cost' | 'other';
  perkOffered?: string;
}

/**
 * Hyper-Personalized Retention Engine & WhatsApp Micro-Surveys
 */
export class RetentionSurveyService {
  private studioId: string;

  constructor(studioId: string = 'default-studio') {
    this.studioId = studioId;
  }

  /**
   * Dispatch a 1-tap WhatsApp retention poll to a churning member
   */
  async dispatchMicroSurvey(memberId: string): Promise<boolean> {
    const member = await prisma.member.findUnique({
      where: { id: memberId }
    });

    if (!member) return false;

    const whatsapp = await createWhatsAppService(this.studioId);
    if (!whatsapp) return false;

    const studioSettings = await prisma.fillIQSettings.findUnique({
      where: { studioId: this.studioId }
    });

    const studioName = studioSettings?.studioWhatsAppNumber || 'the studio';

    const result = await whatsapp.sendMessage({
      to: member.phone,
      templateName: WHATSAPP_TEMPLATES.CHURN_NUDGE,
      params: [member.firstName, studioName]
    });

    return result.success;
  }

  /**
   * Process 1-tap poll response and offer adaptive perk
   */
  async processSurveyResponse(memberId: string, responseInput: string): Promise<MicroSurveyResponse> {
    const text = responseInput.trim().toLowerCase();
    let reason: MicroSurveyResponse['reason'] = 'other';
    let perkOffered = 'Complimentary Guest Pass';

    if (text.includes('1') || text.includes('busy')) {
      reason = 'busy';
      perkOffered = 'Flexible Express 30-Min Class Pass';
    } else if (text.includes('2') || text.includes('injury')) {
      reason = 'injury';
      perkOffered = 'Free Gentle Recovery Session Voucher';
    } else if (text.includes('3') || text.includes('travel')) {
      reason = 'travel';
      perkOffered = '14-Day Membership Freeze & On-Demand Access';
    } else if (text.includes('4') || text.includes('cost')) {
      reason = 'cost';
      perkOffered = '20% Discount on Next Class Pack';
    }

    await prisma.memberChurnSignal.updateMany({
      where: { memberId, outcome: 'pending' },
      data: {
        actionTaken: `survey_responded_${reason}`,
        actionTakenAt: new Date()
      }
    });

    logger.info(`Recorded retention survey response for member ${memberId}: ${reason}, offered: ${perkOffered}`);

    return {
      memberId,
      reason,
      perkOffered
    };
  }
}

export const retentionSurveyService = new RetentionSurveyService();
