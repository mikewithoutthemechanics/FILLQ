import { prisma } from '../lib/supabase.js';

export interface YieldPricingQuote {
  originalPrice: number;
  offeredPrice: number;
  discountPercentage: number;
  priorityClaimFee: number;
  reason: 'standby_discount' | 'priority_surge' | 'standard';
}

export interface YieldConfig {
  standbyDiscountPercentage: number;
  priorityClaimFeeAmount: number;
  highDemandWaitlistThreshold: number;
  standbyWindowHours: number;
}

/**
 * Dynamic Revenue & Yield Optimization Engine
 * Calculates variable pricing for last-minute waitlist fills and high-demand class slots.
 */
export class YieldOptimizationService {
  private studioId: string;

  constructor(studioId: string = 'default-studio') {
    this.studioId = studioId;
  }

  /**
   * Get dynamic yield configuration for studio or default parameters
   */
  async getYieldConfig(): Promise<YieldConfig> {
    const settings = await prisma.fillIQSettings.findUnique({
      where: { studioId: this.studioId }
    });

    return {
      standbyDiscountPercentage: Number(process.env.STANDBY_DISCOUNT_PERCENTAGE) || 20,
      priorityClaimFeeAmount: Number(process.env.PRIORITY_CLAIM_FEE) || 25.0,
      highDemandWaitlistThreshold: Number(process.env.HIGH_DEMAND_WAITLIST_THRESHOLD) || 5,
      standbyWindowHours: Number(process.env.STANDBY_WINDOW_HOURS) || 2
    };
  }

  /**
   * Calculate optimized price and fees for a waitlist fill
   */
  async calculateDynamicPrice(classId: string): Promise<YieldPricingQuote> {
    const config = await this.getYieldConfig();
    const classDetails = await prisma.class.findUnique({
      where: { id: classId }
    });

    const defaultPrice = classDetails ? Number(classDetails.price) : 150.0;

    if (!classDetails) {
      return {
        originalPrice: defaultPrice,
        offeredPrice: defaultPrice,
        discountPercentage: 0,
        priorityClaimFee: 0,
        reason: 'standard'
      };
    }

    const now = new Date();
    const hoursUntilClass = (classDetails.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const waitlistCount = await prisma.waitlistEntry.count({
      where: { classId, status: 'waiting' }
    });

    // High demand slot -> Priority Claim Surge Fee
    if (waitlistCount >= config.highDemandWaitlistThreshold && classDetails.availableSpots <= 1) {
      return {
        originalPrice: defaultPrice,
        offeredPrice: defaultPrice,
        discountPercentage: 0,
        priorityClaimFee: config.priorityClaimFeeAmount,
        reason: 'priority_surge'
      };
    }

    // Last minute cancellation (< standby window hours) -> Standby Discount to guarantee fill
    if (hoursUntilClass < config.standbyWindowHours && hoursUntilClass > 0) {
      const discountMultiplier = (100 - config.standbyDiscountPercentage) / 100;
      const discountedPrice = Math.round(defaultPrice * discountMultiplier * 100) / 100;
      return {
        originalPrice: defaultPrice,
        offeredPrice: discountedPrice,
        discountPercentage: config.standbyDiscountPercentage,
        priorityClaimFee: 0,
        reason: 'standby_discount'
      };
    }

    return {
      originalPrice: defaultPrice,
      offeredPrice: defaultPrice,
      discountPercentage: 0,
      priorityClaimFee: 0,
      reason: 'standard'
    };
  }
}

export const yieldOptimizationService = new YieldOptimizationService();
