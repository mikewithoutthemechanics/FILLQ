// ============================================
// No-Show Predictor Types
// ============================================

export interface BookingRiskFactors {
  bookingLeadTime: number;        // hours between booking made and class start
  memberNoShowHistory: number;    // % of past classes this member no-showed
  memberBookingCount: number;     // total classes booked lifetime
  dayOfWeek: number;              // 0=Sun, 6=Sat
  timeOfDay: number;              // class start hour
  membershipType: MembershipType;
  classType: string;              // 'yoga' | 'pilates' | 'barre' | 'reformer'
  daysSinceLastAttendance: number;
  hasCompletedPayment: boolean;
}

export type MembershipType = 'drop-in' | 'monthly' | 'annual' | 'class-pack';

export interface RiskScoreResult {
  score: number;
  factors: BookingRiskFactors;
  atRisk: boolean;
}

// ============================================
// Churn Types
// ============================================

export interface ChurnFactors {
  daysSinceLastAttendance: number;
  attendanceRateLast30Days: number;
  attendanceRateLast90Days: number;
  membershipDaysRemaining: number;
  lifetimeClassCount: number;
  avgWeeklyAttendance: number;
  missedClassesInRow: number;
  hasOpenedAppLast14Days: boolean;
  paymentFailures: number;
}

export interface ChurnScoreResult {
  score: number;
  factors: ChurnFactors;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================
// WhatsApp Types
// ============================================

export interface WhatsAppMessage {
  to: string;           // E.164 format: +27831234567
  templateName: string;
  params: string[];
}

export interface WABAWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          wa_id: string;
          profile: { name: string };
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: { body: string };
          type: string;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface InboundReply {
  from: string;
  body: string;
  timestamp: Date;
  messageId: string;
}

// ============================================
// Dashboard Types
// ============================================

export interface RecoverySummary {
  revenueRecoveredThisMonth: number;
  spotsFilledThisMonth: number;
  avgFillTimeMinutes: number;
  churnsPreventedThisMonth: number;
  fillRatePercentage: number;
}

export interface FillChartData {
  date: string;
  spotsEmpty: number;
  spotsFilled: number;
  fillRate: number;
}

export interface TeacherClassBrief {
  classId: string;
  className: string;
  startTime: string;
  confirmedCount: number;
  highRiskCount: number;
  waitlistCount: number;
  newMembersCount: number;
  note: string;
}

export interface AtRiskMember {
  memberId: string;
  firstName: string;
  lastName: string;
  lastSeen: string;
  churnScore: number;
  riskLevel: 'medium' | 'high' | 'critical';
  daysSinceLastAttendance: number;
}

// ============================================
// Settings Types
// ============================================

export interface FillIQSettings {
  id: string;
  studioId: string;
  maxSimultaneousInvites: number;
  inviteExpiryMinutes: number;
  autoExpandAfterMinutes: number;
  autoFillEnabled: boolean;
  rebookNudgeEnabled: boolean;
  rebookNudgeDelayMinutes: number;
  churnScoreThreshold: number;
  autoNudgeThreshold: number;
  autoNudgeEnabled: boolean;
  churnNudgeCooldownDays: number;
  wabaProvider: '360dialog' | 'vonage';
  wabaPhoneNumberId?: string;
  wabaAccessTokenEncrypted?: string;
  studioWhatsAppNumber?: string;
  defaultClassPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Claim Types
// ============================================

export interface ClaimResult {
  success: boolean;
  bookingId?: string;
  reason?: 'spot_taken' | 'already_booked' | 'class_full' | 'invalid_invite' | 'error';
}

// ============================================
// Waitlist Types
// ============================================

export interface WaitlistMember {
  memberId: string;
  position: number;
  phone: string;
  firstName: string;
  responseLikelihood: number;
}
