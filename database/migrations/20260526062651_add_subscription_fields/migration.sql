-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "membershipType" TEXT NOT NULL,
    "membershipStatus" TEXT NOT NULL DEFAULT 'active',
    "membershipExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classType" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "availableSpots" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "attendedAt" TIMESTAMP(3),
    "amountPaid" DECIMAL(10,2),
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'waiting',

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_risk_scores" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskFactors" JSONB NOT NULL,
    "atRisk" BOOLEAN NOT NULL DEFAULT false,
    "scoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" TEXT,
    "outcomeRecordedAt" TIMESTAMP(3),

    CONSTRAINT "booking_risk_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist_fill_events" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "triggeredByBookingId" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitesSent" INTEGER NOT NULL DEFAULT 0,
    "invitesResponded" INTEGER NOT NULL DEFAULT 0,
    "filled" BOOLEAN NOT NULL DEFAULT false,
    "filledByMemberId" TEXT,
    "fillTimeSeconds" INTEGER,
    "revenueRecovered" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'active',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "waitlist_fill_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_churn_signals" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "churnScore" INTEGER NOT NULL,
    "lastAttendanceDate" TIMESTAMP(3),
    "daysSinceLastBooking" INTEGER NOT NULL,
    "membershipType" TEXT NOT NULL,
    "membershipDaysRemaining" INTEGER,
    "attendanceRate30Days" DOUBLE PRECISION,
    "attendanceRate90Days" DOUBLE PRECISION,
    "missedClassesInRow" INTEGER NOT NULL DEFAULT 0,
    "hasOpenedAppLast14Days" BOOLEAN NOT NULL DEFAULT true,
    "paymentFailures" INTEGER NOT NULL DEFAULT 0,
    "signalDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionTaken" TEXT,
    "actionTakenAt" TIMESTAMP(3),
    "outcome" TEXT,

    CONSTRAINT "member_churn_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_invites" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "response" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "pending_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filliq_settings" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "maxSimultaneousInvites" INTEGER NOT NULL DEFAULT 3,
    "inviteExpiryMinutes" INTEGER NOT NULL DEFAULT 30,
    "autoExpandAfterMinutes" INTEGER NOT NULL DEFAULT 30,
    "autoFillEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rebookNudgeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rebookNudgeDelayMinutes" INTEGER NOT NULL DEFAULT 45,
    "churnScoreThreshold" INTEGER NOT NULL DEFAULT 65,
    "autoNudgeThreshold" INTEGER NOT NULL DEFAULT 80,
    "autoNudgeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "churnNudgeCooldownDays" INTEGER NOT NULL DEFAULT 14,
    "wabaProvider" TEXT NOT NULL DEFAULT '360dialog',
    "wabaPhoneNumberId" TEXT,
    "wabaAccessTokenEncrypted" TEXT,
    "studioWhatsAppNumber" TEXT,
    "defaultClassPrice" DECIMAL(10,2) NOT NULL DEFAULT 150.00,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'starter',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "subscriptionStartedAt" TIMESTAMP(3),
    "subscriptionEndsAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filliq_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_templates" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rebook_nudge_logs" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "nudgedClassId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded" BOOLEAN NOT NULL DEFAULT false,
    "booked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "rebook_nudge_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_reports" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "revenueRecovered" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "spotsFilled" INTEGER NOT NULL DEFAULT 0,
    "avgFillTimeMinutes" DOUBLE PRECISION,
    "churnsPrevented" INTEGER NOT NULL DEFAULT 0,
    "atRiskMembersFlagged" INTEGER NOT NULL DEFAULT 0,
    "nudgesSent" INTEGER NOT NULL DEFAULT 0,
    "rebookNudgesSent" INTEGER NOT NULL DEFAULT 0,
    "rebookNudgesConverted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE INDEX "booking_risk_scores_bookingId_idx" ON "booking_risk_scores"("bookingId");

-- CreateIndex
CREATE INDEX "booking_risk_scores_classId_idx" ON "booking_risk_scores"("classId");

-- CreateIndex
CREATE INDEX "booking_risk_scores_memberId_idx" ON "booking_risk_scores"("memberId");

-- CreateIndex
CREATE INDEX "booking_risk_scores_scoredAt_idx" ON "booking_risk_scores"("scoredAt");

-- CreateIndex
CREATE INDEX "waitlist_fill_events_classId_idx" ON "waitlist_fill_events"("classId");

-- CreateIndex
CREATE INDEX "waitlist_fill_events_triggeredAt_idx" ON "waitlist_fill_events"("triggeredAt");

-- CreateIndex
CREATE INDEX "waitlist_fill_events_filled_idx" ON "waitlist_fill_events"("filled");

-- CreateIndex
CREATE INDEX "member_churn_signals_memberId_idx" ON "member_churn_signals"("memberId");

-- CreateIndex
CREATE INDEX "member_churn_signals_signalDate_idx" ON "member_churn_signals"("signalDate");

-- CreateIndex
CREATE INDEX "member_churn_signals_churnScore_idx" ON "member_churn_signals"("churnScore");

-- CreateIndex
CREATE INDEX "pending_invites_classId_status_idx" ON "pending_invites"("classId", "status");

-- CreateIndex
CREATE INDEX "pending_invites_phone_status_idx" ON "pending_invites"("phone", "status");

-- CreateIndex
CREATE UNIQUE INDEX "filliq_settings_studioId_key" ON "filliq_settings"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_templates_studioId_name_key" ON "whatsapp_templates"("studioId", "name");

-- CreateIndex
CREATE INDEX "rebook_nudge_logs_memberId_idx" ON "rebook_nudge_logs"("memberId");

-- CreateIndex
CREATE INDEX "rebook_nudge_logs_sentAt_idx" ON "rebook_nudge_logs"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_reports_studioId_year_month_key" ON "monthly_reports"("studioId", "year", "month");

-- AddForeignKey
ALTER TABLE "booking_risk_scores" ADD CONSTRAINT "booking_risk_scores_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_risk_scores" ADD CONSTRAINT "booking_risk_scores_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_fill_events" ADD CONSTRAINT "waitlist_fill_events_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_fill_events" ADD CONSTRAINT "waitlist_fill_events_filledByMemberId_fkey" FOREIGN KEY ("filledByMemberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_churn_signals" ADD CONSTRAINT "member_churn_signals_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_invites" ADD CONSTRAINT "pending_invites_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_invites" ADD CONSTRAINT "pending_invites_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
