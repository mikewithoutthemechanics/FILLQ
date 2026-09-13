import { prisma } from '../lib/supabase.js';

export interface YieldPricingQuote {
  originalPrice: number;
  offeredPrice: number;
  discountPercentage: number;
  priorityClaimFee: number;
  reason: 'standby_discount' | 'priority_surge' | 'standard';
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
   * Calculate optimized price and fees for a waitlist fill
   */
  async calculateDynamicPrice(classId: string): Promise<YieldPricingQuote> {
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

    // Get waitlist count
    const waitlistCount = await prisma.waitlistEntry.count({
      where: { classId, status: 'waiting' }
    });

    // High demand slot -> Priority Claim Surge Fee (+ R25)
    if (waitlistCount >= 5 && classDetails.availableSpots <= 1) {
      return {
        originalPrice: defaultPrice,
        offeredPrice: defaultPrice,
        discountPercentage: 0,
        priorityClaimFee: 25.0,
        reason: 'priority_surge'
      };
    }

    // Last minute cancellation (< 2 hours before class) -> 20% Standby Discount to guarantee fill
    if (hoursUntilClass < 2 && hoursUntilClass > 0) {
      const discountedPrice = Math.round(defaultPrice * 0.8 * 100) / 100;
      return {
        originalPrice: defaultPrice,
        offeredPrice: discountedPrice,
        discountPercentage: 20,
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
