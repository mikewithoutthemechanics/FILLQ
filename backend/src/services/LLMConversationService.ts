import axios from 'axios';
import { prisma } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

export interface LLMConversationResponse {
  replyMessage: string;
  actionTaken?: 'claimed' | 'alternative_suggested' | 'question_answered' | 'none';
  targetClassId?: string;
}

/**
 * Conversational LLM Engine
 * Connects with OpenAI API (or intelligent fallback) for multi-turn conversations on WhatsApp.
 */
export class LLMConversationService {
  private studioId: string;

  constructor(studioId: string = 'default-studio') {
    this.studioId = studioId;
  }

  /**
   * Process natural language inbound message from a member using LLM or rule-based intelligence
   */
  async processInboundMessage(
    phone: string,
    messageBody: string,
    activeInvite: any
  ): Promise<LLMConversationResponse> {
    const text = messageBody.trim().toLowerCase();

    // Affirmation to claim
    if (['yes', 'book', 'claim', 'yep', 'yeah', 'sure', 'please'].includes(text)) {
      return {
        replyMessage: 'YES',
        actionTaken: 'claimed',
        targetClassId: activeInvite?.classId
      };
    }

    // Call OpenAI completion if OPENAI_API_KEY is configured
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are an AI studio assistant for FillIQ fitness studio on WhatsApp. Answer member questions concisely in 1-2 sentences. Always invite them to reply YES to confirm their spot.'
              },
              {
                role: 'user',
                content: messageBody
              }
            ],
            max_tokens: 100
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const aiReply = response.data?.choices?.[0]?.message?.content?.trim();
        if (aiReply) {
          return {
            replyMessage: aiReply,
            actionTaken: 'question_answered'
          };
        }
      } catch (err) {
        logger.warn('OpenAI API completion fallback triggered:', err);
      }
    }

    // Intelligence fallback handlers
    if (text.includes('park') || text.includes('parking')) {
      return {
        replyMessage: "Yes, free studio parking is available behind the building! Would you like me to confirm your spot in the class now? Reply YES to book.",
        actionTaken: 'question_answered'
      };
    }

    if (text.includes('mat') || text.includes('bring')) {
      return {
        replyMessage: "We provide mats and towels at the studio! Would you like me to reserve your spot now? Reply YES to confirm.",
        actionTaken: 'question_answered'
      };
    }

    if (text.includes('friend') || text.includes('guest') || text.includes('+1')) {
      return {
        replyMessage: "You are welcome to bring a friend! I can lock in your spot first. Reply YES to confirm your booking.",
        actionTaken: 'question_answered'
      };
    }

    if (text.includes('cant') || text.includes("can't") || text.includes('no') || text.includes('busy') || text.includes('full')) {
      const nextAlternative = await this.findAlternativeClass(activeInvite?.classId);
      if (nextAlternative) {
        return {
          replyMessage: `No problem at all! Would you like to book the next ${nextAlternative.name} on ${this.formatDate(nextAlternative.startTime)} at ${this.formatTime(nextAlternative.startTime)} instead? Reply YES to confirm.`,
          actionTaken: 'alternative_suggested',
          targetClassId: nextAlternative.id
        };
      }
      return {
        replyMessage: "No problem! We'll keep you posted on the next available class. Have a great day!",
        actionTaken: 'none'
      };
    }

    return {
      replyMessage: "Thanks for reaching out! To lock in your spot for the class, simply reply YES.",
      actionTaken: 'question_answered'
    };
  }

  private async findAlternativeClass(currentClassId?: string) {
    if (!currentClassId) return null;

    const currentClass = await prisma.class.findUnique({
      where: { id: currentClassId }
    });

    if (!currentClass) return null;

    return prisma.class.findFirst({
      where: {
        classType: currentClass.classType,
        startTime: { gt: new Date() },
        availableSpots: { gt: 0 },
        id: { not: currentClassId }
      },
      orderBy: { startTime: 'asc' }
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  }
}

export const llmConversationService = new LLMConversationService();
