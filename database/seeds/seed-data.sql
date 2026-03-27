-- ============================================================
-- FillIQ Seed Data for Testing
-- Run this after creating the schema to populate test data
-- ============================================================

-- Test Members
INSERT INTO members (id, email, phone, first_name, last_name, membership_type, membership_status) VALUES
('11111111-1111-1111-1111-111111111111', 'sarah@email.com', '+27831234567', 'Sarah', 'Johnson', 'monthly', 'active'),
('22222222-2222-2222-2222-222222222222', 'mike@email.com', '+27831234568', 'Mike', 'Smith', 'annual', 'active'),
('33333333-3333-3333-3333-333333333333', 'emma@email.com', '+27831234569', 'Emma', 'Williams', 'drop-in', 'active'),
('44444444-4444-4444-4444-444444444444', 'john@email.com', '+27831234570', 'John', 'Brown', 'class-pack', 'active'),
('55555555-5555-5555-5555-555555555555', 'lisa@email.com', '+27831234571', 'Lisa', 'Davis', 'monthly', 'active')
ON CONFLICT (id) DO NOTHING;

-- Test Classes (Next 3 days)
INSERT INTO classes (id, name, class_type, start_time, end_time, capacity, available_spots, price, teacher_id, studio_id, status) VALUES
-- Today
('c1111111-1111-1111-1111-111111111111', 'Morning Yoga Flow', 'yoga', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 20, 15, 150.00, 'teacher-1', 'default-studio', 'scheduled'),
('c2222222-2222-2222-2222-222222222222', 'Pilates Core', 'pilates', NOW() + INTERVAL '5 hours', NOW() + INTERVAL '6 hours', 15, 10, 180.00, 'teacher-2', 'default-studio', 'scheduled'),
('c3333333-3333-3333-3333-333333333333', 'Evening Vinyasa', 'yoga', NOW() + INTERVAL '8 hours', NOW() + INTERVAL '9 hours', 25, 20, 150.00, 'teacher-1', 'default-studio', 'scheduled'),

-- Tomorrow
('c4444444-4444-4444-4444-444444444444', 'Power Yoga', 'yoga', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 1 hour', 20, 18, 150.00, 'teacher-1', 'default-studio', 'scheduled'),
('c5555555-5555-5555-5555-555555555555', 'Reformer Basics', 'reformer', NOW() + INTERVAL '1 day 3 hours', NOW() + INTERVAL '1 day 4 hours', 8, 6, 250.00, 'teacher-3', 'default-studio', 'scheduled'),

-- Day after
('c6666666-6666-6666-6666-666666666666', 'Barre Sculpt', 'barre', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 1 hour', 18, 15, 180.00, 'teacher-2', 'default-studio', 'scheduled')
ON CONFLICT (id) DO NOTHING;

-- Test Bookings
INSERT INTO bookings (id, member_id, class_id, status, booked_at, payment_status, amount_paid) VALUES
('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '2 days', 'completed', 150.00),
('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '1 day', 'completed', 150.00),
('b3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '1 hour', 'completed', 150.00),
('b4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '3 hours', 'pending', 150.00),
('b5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'c1111111-1111-1111-1111-111111111111', 'confirmed', NOW() - INTERVAL '5 hours', 'completed', 150.00),

-- Past bookings for churn analysis
('b6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'attended', NOW() - INTERVAL '5 days', 'completed', 180.00),
('b7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 'attended', NOW() - INTERVAL '10 days', 'completed', 150.00),
('b8888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'no_show', NOW() - INTERVAL '3 days', 'completed', 180.00),
('b9999999-9999-9999-9999-999999999999', '44444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 'cancelled', NOW() - INTERVAL '2 days', 'refunded', 150.00)
ON CONFLICT (id) DO NOTHING;

-- Test Waitlist Entries
INSERT INTO waitlist_entries (id, class_id, member_id, position, created_at, status) VALUES
('w1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 1, NOW() - INTERVAL '1 hour', 'waiting'),
('w2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 2, NOW() - INTERVAL '30 minutes', 'waiting'),
('w3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 3, NOW() - INTERVAL '15 minutes', 'waiting')
ON CONFLICT (id) DO NOTHING;

-- Test Risk Scores
INSERT INTO booking_risk_scores (id, booking_id, class_id, member_id, risk_score, at_risk, risk_factors, scored_at) VALUES
('r1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 25, FALSE, '{"bookingLeadTime": 48, "memberNoShowHistory": 0, "membershipType": "monthly"}'::jsonb, NOW()),
('r2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 15, FALSE, '{"bookingLeadTime": 24, "memberNoShowHistory": 0, "membershipType": "annual"}'::jsonb, NOW()),
('r3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 75, TRUE, '{"bookingLeadTime": 1, "memberNoShowHistory": 0.5, "membershipType": "drop-in"}'::jsonb, NOW()),
('r4444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 85, TRUE, '{"bookingLeadTime": 3, "memberNoShowHistory": 0.3, "membershipType": "class-pack", "hasCompletedPayment": false}'::jsonb, NOW()),
('r5555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'c1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 45, FALSE, '{"bookingLeadTime": 5, "memberNoShowHistory": 0.1, "membershipType": "monthly"}'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

-- Test Churn Signals
INSERT INTO member_churn_signals (id, member_id, churn_score, last_attendance_date, days_since_last_booking, membership_type, membership_days_remaining, attendance_rate_30_days, attendance_rate_90_days, missed_classes_in_row, has_opened_app_last_14_days, payment_failures, signal_date, outcome) VALUES
('cs111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 35, NOW() - INTERVAL '3 days', 3, 'monthly', 25, 0.8, 0.9, 0, TRUE, 0, CURRENT_DATE, 'pending'),
('cs222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 20, NOW() - INTERVAL '2 days', 2, 'annual', 300, 0.9, 0.95, 0, TRUE, 0, CURRENT_DATE, 'pending'),
('cs333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 75, NOW() - INTERVAL '18 days', 18, 'drop-in', NULL, 0.2, 0.4, 2, FALSE, 1, CURRENT_DATE, 'pending'),
('cs444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 85, NOW() - INTERVAL '25 days', 25, 'class-pack', NULL, 0.1, 0.3, 3, FALSE, 0, CURRENT_DATE, 'pending'),
('cs555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 92, NOW() - INTERVAL '30 days', 30, 'monthly', 5, 0.0, 0.2, 4, FALSE, 2, CURRENT_DATE, 'pending')
ON CONFLICT (id) DO NOTHING;

-- Test Fill Events
INSERT INTO waitlist_fill_events (id, class_id, triggered_by_booking_id, triggered_at, invites_sent, filled, filled_by_member_id, fill_time_seconds, revenue_recovered, status, completed_at) VALUES
('f1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'b6666666-6666-6666-6666-666666666666', NOW() - INTERVAL '2 days', 3, TRUE, '11111111-1111-1111-1111-111111111111', 480, 180.00, 'filled', NOW() - INTERVAL '2 days' + INTERVAL '8 minutes'),
('f2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 'b7777777-7777-7777-7777-777777777777', NOW() - INTERVAL '1 day', 3, TRUE, '22222222-2222-2222-2222-222222222222', 320, 150.00, 'filled', NOW() - INTERVAL '1 day' + INTERVAL '5 minutes'),
('f3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'b9999999-9999-9999-9999-999999999999', NOW() - INTERVAL '3 days', 2, FALSE, NULL, NULL, NULL, 'expired', NOW() - INTERVAL '3 days' + INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- Test Monthly Report
INSERT INTO monthly_reports (id, studio_id, year, month, revenue_recovered, spots_filled, avg_fill_time_minutes, churns_prevented, at_risk_members_flagged, nudges_sent, rebook_nudges_sent, rebook_nudges_converted) VALUES
('mr111111-1111-1111-1111-111111111111', 'default-studio', EXTRACT(YEAR FROM NOW())::INT, EXTRACT(MONTH FROM NOW())::INT, 4320.00, 18, 8.5, 3, 12, 8, 25, 7)
ON CONFLICT (studio_id, year, month) DO NOTHING;

-- WhatsApp Templates
INSERT INTO whatsapp_templates (id, studio_id, name, category, language, status) VALUES
('wt111111-1111-1111-1111-111111111111', 'default-studio', 'filiq_spot_available', 'UTILITY', 'en', 'approved'),
('wt222222-2222-2222-2222-222222222222', 'default-studio', 'filiq_spot_confirmed', 'UTILITY', 'en', 'approved'),
('wt333333-3333-3333-3333-333333333333', 'default-studio', 'filiq_spot_taken', 'UTILITY', 'en', 'approved'),
('wt444444-4444-4444-4444-444444444444', 'default-studio', 'filiq_rebook_nudge', 'UTILITY', 'en', 'approved'),
('wt555555-5555-5555-5555-555555555555', 'default-studio', 'filiq_churn_nudge', 'MARKETING', 'en', 'approved')
ON CONFLICT (id) DO NOTHING;

-- Update FillIQ Settings with test data
UPDATE filliq_settings SET
  max_simultaneous_invites = 3,
  invite_expiry_minutes = 30,
  auto_fill_enabled = TRUE,
  rebook_nudge_enabled = TRUE,
  churn_score_threshold = 65,
  auto_nudge_threshold = 80,
  auto_nudge_enabled = FALSE,
  churn_nudge_cooldown_days = 14,
  waba_provider = '360dialog',
  default_class_price = 150.00
WHERE studio_id = 'default-studio';

-- Verify data
SELECT 'Members' as table_name, COUNT(*) as count FROM members
UNION ALL
SELECT 'Classes', COUNT(*) FROM classes
UNION ALL
SELECT 'Bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'Risk Scores', COUNT(*) FROM booking_risk_scores
UNION ALL
SELECT 'Churn Signals', COUNT(*) FROM member_churn_signals
UNION ALL
SELECT 'Fill Events', COUNT(*) FROM waitlist_fill_events;
