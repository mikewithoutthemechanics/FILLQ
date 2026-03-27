-- ============================================================
-- FillIQ Database Schema for Supabase
-- Run this in Supabase SQL Editor after creating project
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- EXISTING TABLES (Reference Only - These come from your existing platform)
-- ============================================================

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  membership_type TEXT NOT NULL CHECK (membership_type IN ('drop-in', 'monthly', 'annual', 'class-pack')),
  membership_status TEXT DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'cancelled')),
  membership_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  class_type TEXT NOT NULL CHECK (class_type IN ('yoga', 'pilates', 'barre', 'reformer')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL,
  available_spots INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  teacher_id TEXT NOT NULL,
  studio_id TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('confirmed', 'cancelled', 'no_show', 'attended')),
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,
  amount_paid DECIMAL(10,2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'))
);

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'invited', 'filled', 'expired'))
);

-- ============================================================
-- NEW FILLIQ TABLES
-- ============================================================

-- Booking Risk Scores
CREATE TABLE IF NOT EXISTS booking_risk_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_factors JSONB,
  at_risk BOOLEAN DEFAULT FALSE,
  scored_at TIMESTAMPTZ DEFAULT NOW(),
  outcome TEXT CHECK (outcome IN ('attended', 'no_show', 'cancelled')),
  outcome_recorded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_risk_scores_booking ON booking_risk_scores(booking_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_class ON booking_risk_scores(class_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_member ON booking_risk_scores(member_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_scored_at ON booking_risk_scores(scored_at);

-- Waitlist Fill Events
CREATE TABLE IF NOT EXISTS waitlist_fill_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  triggered_by_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  invites_sent INTEGER DEFAULT 0,
  invites_responded INTEGER DEFAULT 0,
  filled BOOLEAN DEFAULT FALSE,
  filled_by_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  fill_time_seconds INTEGER,
  revenue_recovered DECIMAL(10,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'filled', 'expired', 'cancelled')),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fill_events_class ON waitlist_fill_events(class_id);
CREATE INDEX IF NOT EXISTS idx_fill_events_triggered ON waitlist_fill_events(triggered_at);
CREATE INDEX IF NOT EXISTS idx_fill_events_filled ON waitlist_fill_events(filled);

-- Member Churn Signals
CREATE TABLE IF NOT EXISTS member_churn_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  churn_score INTEGER CHECK (churn_score >= 0 AND churn_score <= 100),
  last_attendance_date DATE,
  days_since_last_booking INTEGER,
  membership_type TEXT,
  membership_days_remaining INTEGER,
  attendance_rate_30_days DECIMAL(5,4),
  attendance_rate_90_days DECIMAL(5,4),
  missed_classes_in_row INTEGER DEFAULT 0,
  has_opened_app_last_14_days BOOLEAN DEFAULT TRUE,
  payment_failures INTEGER DEFAULT 0,
  signal_date DATE DEFAULT CURRENT_DATE,
  action_taken TEXT CHECK (action_taken IN ('nudge_sent', 'offer_sent', 'ignored')),
  action_taken_at TIMESTAMPTZ,
  outcome TEXT CHECK (outcome IN ('retained', 'churned', 'pending'))
);

CREATE INDEX IF NOT EXISTS idx_churn_member ON member_churn_signals(member_id);
CREATE INDEX IF NOT EXISTS idx_churn_signal_date ON member_churn_signals(signal_date);
CREATE INDEX IF NOT EXISTS idx_churn_score ON member_churn_signals(churn_score);

-- Pending Invites
CREATE TABLE IF NOT EXISTS pending_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'responded', 'taken', 'expired')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  response TEXT,
  position INTEGER
);

CREATE INDEX IF NOT EXISTS idx_invites_class_status ON pending_invites(class_id, status);
CREATE INDEX IF NOT EXISTS idx_invites_phone ON pending_invites(phone, status);

-- FillIQ Settings
CREATE TABLE IF NOT EXISTS filliq_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id TEXT UNIQUE NOT NULL,
  max_simultaneous_invites INTEGER DEFAULT 3,
  invite_expiry_minutes INTEGER DEFAULT 30,
  auto_expand_after_minutes INTEGER DEFAULT 30,
  auto_fill_enabled BOOLEAN DEFAULT TRUE,
  rebook_nudge_enabled BOOLEAN DEFAULT TRUE,
  rebook_nudge_delay_minutes INTEGER DEFAULT 45,
  churn_score_threshold INTEGER DEFAULT 65,
  auto_nudge_threshold INTEGER DEFAULT 80,
  auto_nudge_enabled BOOLEAN DEFAULT FALSE,
  churn_nudge_cooldown_days INTEGER DEFAULT 14,
  waba_provider TEXT DEFAULT '360dialog' CHECK (waba_provider IN ('360dialog', 'vonage')),
  waba_phone_number_id TEXT,
  waba_access_token_encrypted TEXT,
  studio_whatsapp_number TEXT,
  default_class_price DECIMAL(10,2) DEFAULT 150.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_studio ON filliq_settings(studio_id);

-- WhatsApp Templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('UTILITY', 'MARKETING')),
  language TEXT DEFAULT 'en',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(studio_id, name)
);

-- Rebook Nudge Log
CREATE TABLE IF NOT EXISTS rebook_nudge_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  nudged_class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded BOOLEAN DEFAULT FALSE,
  booked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_rebook_member ON rebook_nudge_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_rebook_sent ON rebook_nudge_logs(sent_at);

-- Monthly Reports
CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  revenue_recovered DECIMAL(10,2) DEFAULT 0,
  spots_filled INTEGER DEFAULT 0,
  avg_fill_time_minutes DECIMAL(10,2),
  churns_prevented INTEGER DEFAULT 0,
  at_risk_members_flagged INTEGER DEFAULT 0,
  nudges_sent INTEGER DEFAULT 0,
  rebook_nudges_sent INTEGER DEFAULT 0,
  rebook_nudges_converted INTEGER DEFAULT 0,
  UNIQUE(studio_id, year, month)
);

-- Studio Owners (for auth)
CREATE TABLE IF NOT EXISTS studio_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  studio_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, studio_id)
);

CREATE INDEX IF NOT EXISTS idx_owners_user ON studio_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_owners_studio ON studio_owners(studio_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on FillIQ tables
ALTER TABLE filliq_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_fill_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_churn_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rebook_nudge_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

-- Create helper function to get current studio
CREATE OR REPLACE FUNCTION current_studio_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_studio_id', true);
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policy: Settings - Studios see only their settings
CREATE POLICY settings_studio_isolation ON filliq_settings
  FOR ALL
  USING (studio_id = current_studio_id());

-- RLS Policy: Risk Scores - Based on class studio
CREATE POLICY risk_scores_studio_isolation ON booking_risk_scores
  FOR ALL
  USING (
    class_id IN (
      SELECT id FROM classes WHERE studio_id = current_studio_id()
    )
  );

-- RLS Policy: Fill Events - Based on class studio
CREATE POLICY fill_events_studio_isolation ON waitlist_fill_events
  FOR ALL
  USING (
    class_id IN (
      SELECT id FROM classes WHERE studio_id = current_studio_id()
    )
  );

-- RLS Policy: Churn Signals - Based on member's studio
CREATE POLICY churn_signals_studio_isolation ON member_churn_signals
  FOR ALL
  USING (
    member_id IN (
      SELECT id FROM members m
      JOIN bookings b ON b.member_id = m.id
      JOIN classes c ON c.id = b.class_id
      WHERE c.studio_id = current_studio_id()
    )
  );

-- RLS Policy: Pending Invites - Based on class studio
CREATE POLICY pending_invites_studio_isolation ON pending_invites
  FOR ALL
  USING (
    class_id IN (
      SELECT id FROM classes WHERE studio_id = current_studio_id()
    )
  );

-- RLS Policy: Monthly Reports - Studio isolation
CREATE POLICY monthly_reports_studio_isolation ON monthly_reports
  FOR ALL
  USING (studio_id = current_studio_id());

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_filliq_settings_updated_at
  BEFORE UPDATE ON filliq_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VIEWS
-- ============================================================

-- View: Today's at-risk classes
CREATE OR REPLACE VIEW today_at_risk_classes AS
SELECT 
  c.id as class_id,
  c.name as class_name,
  c.start_time,
  COUNT(brs.id) as at_risk_count
FROM classes c
LEFT JOIN booking_risk_scores brs ON brs.class_id = c.id AND brs.at_risk = TRUE
WHERE c.start_time::DATE = CURRENT_DATE
  AND c.status = 'scheduled'
GROUP BY c.id, c.name, c.start_time;

-- View: Churn summary by studio
CREATE OR REPLACE VIEW churn_summary AS
SELECT 
  mcs.signal_date,
  COUNT(*) as total_scored,
  COUNT(*) FILTER (WHERE mcs.churn_score >= 65) as high_risk_count,
  COUNT(*) FILTER (WHERE mcs.churn_score >= 80) as critical_count,
  COUNT(*) FILTER (WHERE mcs.action_taken IS NOT NULL) as nudges_sent
FROM member_churn_signals mcs
GROUP BY mcs.signal_date
ORDER BY mcs.signal_date DESC;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert default settings for a test studio
INSERT INTO filliq_settings (studio_id) VALUES ('default-studio')
ON CONFLICT (studio_id) DO NOTHING;

-- Insert test studio owner
INSERT INTO studio_owners (user_id, studio_id, email)
VALUES ('00000000-0000-0000-0000-000000000000', 'default-studio', 'admin@studio.com')
ON CONFLICT DO NOTHING;
