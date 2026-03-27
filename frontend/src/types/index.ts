export interface RecoverySummary {
  revenueRecoveredThisMonth: number
  spotsFilledThisMonth: number
  avgFillTimeMinutes: number
  churnsPreventedThisMonth: number
  fillRatePercentage: number
}

export interface FillChartData {
  date: string
  spotsEmpty: number
  spotsFilled: number
  fillRate: number
}

export interface AtRiskMember {
  memberId: string
  firstName: string
  lastName: string
  lastSeen: string
  churnScore: number
  riskLevel: 'medium' | 'high' | 'critical'
  daysSinceLastAttendance: number
}

export interface TeacherClassBrief {
  classId: string
  className: string
  startTime: string
  confirmedCount: number
  highRiskCount: number
  waitlistCount: number
  newMembersCount: number
  note: string
}

export interface FillIQSettings {
  id: string
  studioId: string
  maxSimultaneousInvites: number
  inviteExpiryMinutes: number
  autoExpandAfterMinutes: number
  autoFillEnabled: boolean
  rebookNudgeEnabled: boolean
  rebookNudgeDelayMinutes: number
  churnScoreThreshold: number
  autoNudgeThreshold: number
  autoNudgeEnabled: boolean
  churnNudgeCooldownDays: number
  wabaProvider: '360dialog' | 'vonage'
  wabaPhoneNumberId?: string
  studioWhatsAppNumber?: string
  defaultClassPrice: number
  createdAt: string
  updatedAt: string
}

export interface RiskScore {
  bookingId: string
  memberId: string
  memberName: string
  riskScore: number
  atRisk: boolean
  riskFactors: Record<string, any>
  scoredAt: string
  outcome?: string
}

export interface WaitlistEvent {
  id: string
  classId: string
  className: string
  classDate: string
  triggeredAt: string
  invitesSent: number
  filled: boolean
  filledByMember?: string
  fillTimeSeconds?: number
  revenueRecovered?: number
  status: string
}
