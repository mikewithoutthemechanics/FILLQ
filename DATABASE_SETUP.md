# FillIQ Database Setup Guide

## Quick Setup (Choose One)

### Option 1: Supabase (Recommended)

1. **Create Supabase Project**
   - Go to https://app.supabase.com
   - Create new project
   - Save your password

2. **Get Connection Info**
   - Project Settings → Database → Connection string
   - Project Settings → API → Anon & Service Role keys

3. **Run Schema**
   - Open Supabase SQL Editor
   - Copy contents of `database/supabase-schema.sql`
   - Paste and Run

4. **Add Seed Data (Optional)**
   - Run `database/seeds/seed-data.sql` in SQL Editor

5. **Update Backend .env**
   ```env
   DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres"
   ```

### Option 2: Local PostgreSQL

1. **Install PostgreSQL** (14+)
   ```bash
   # macOS
   brew install postgresql@14
   
   # Windows
   # Download from postgresql.org
   
   # Ubuntu
   sudo apt install postgresql-14
   ```

2. **Create Database**
   ```bash
   createdb filliq
   ```

3. **Run Schema**
   ```bash
   psql -d filliq -f database/supabase-schema.sql
   ```

4. **Update Backend .env**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/filliq"
   ```

---

## Schema Overview

### Tables Created

| Table | Purpose | Records |
|-------|---------|---------|
| `members` | Studio members | Member profiles |
| `classes` | Scheduled classes | Class schedules |
| `bookings` | Class bookings | Booking records |
| `waitlist_entries` | Waitlist queue | Waiting members |
| `booking_risk_scores` | ⭐ No-show predictions | Risk scores |
| `waitlist_fill_events` | ⭐ Auto-fill tracking | Fill history |
| `member_churn_signals` | ⭐ Churn predictions | Risk signals |
| `pending_invites` | Active WhatsApp invites | Current invites |
| `filliq_settings` | Studio configuration | Settings |
| `whatsapp_templates` | WABA templates | Templates |
| `rebook_nudge_logs` | Rebooking history | Nudge logs |
| `monthly_reports` | Analytics reports | Reports |
| `studio_owners` | Auth users | Owner accounts |

⭐ = New FillIQ tables

---

## Row Level Security (RLS)

Supabase has RLS enabled for multi-tenant security. Each studio only sees their own data.

### Set Studio Context

Before queries, set the current studio:

```sql
SET app.current_studio_id = 'your-studio-id';
```

### Bypass RLS (Admin)

```sql
-- As service role
ALTER TABLE filliq_settings FORCE ROW LEVEL SECURITY;

-- Or use service_role key in API calls
```

---

## Common Queries

### Get Today's Risk Scores
```sql
SELECT 
  c.name as class_name,
  c.start_time,
  m.first_name || ' ' || m.last_name as member,
  brs.risk_score,
  brs.at_risk
FROM booking_risk_scores brs
JOIN classes c ON c.id = brs.class_id
JOIN members m ON m.id = brs.member_id
WHERE c.start_time::DATE = CURRENT_DATE
ORDER BY brs.risk_score DESC;
```

### Get At-Risk Members
```sql
SELECT 
  m.first_name,
  m.last_name,
  m.phone,
  mcs.churn_score,
  mcs.days_since_last_booking,
  mcs.signal_date
FROM member_churn_signals mcs
JOIN members m ON m.id = mcs.member_id
WHERE mcs.churn_score >= 65
  AND mcs.signal_date = CURRENT_DATE
ORDER BY mcs.churn_score DESC;
```

### Get Monthly Recovery Stats
```sql
SELECT 
  year,
  month,
  revenue_recovered,
  spots_filled,
  avg_fill_time_minutes,
  churns_prevented
FROM monthly_reports
WHERE studio_id = 'default-studio'
ORDER BY year DESC, month DESC
LIMIT 12;
```

### Get Fill Rate by Day
```sql
SELECT 
  DATE(triggered_at) as date,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE filled = TRUE) as filled_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE filled = TRUE) / COUNT(*), 2) as fill_rate
FROM waitlist_fill_events
WHERE triggered_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(triggered_at)
ORDER BY date DESC;
```

---

## Prisma Commands

```bash
# Generate Prisma Client
cd backend
npx prisma generate --schema=../database/schema.prisma

# Create Migration
npx prisma migrate dev --name init --schema=../database/schema.prisma

# Deploy Migration (production)
npx prisma migrate deploy --schema=../database/schema.prisma

# Reset Database (CAREFUL!)
npx prisma migrate reset --schema=../database/schema.prisma

# Open Prisma Studio
npx prisma studio --schema=../database/schema.prisma
```

---

## Troubleshooting

### Connection Pooling Error
```
Error: connection pooler
```
**Fix**: Use `DATABASE_URL` with `pgbouncer=true` for app, `DIRECT_URL` for migrations

### RLS Policy Error
```
Error: new row violates row-level security policy
```
**Fix**: Set `app.current_studio_id` before inserts, or use Service Role Key

### Missing Tables
```
Error: relation "X" does not exist
```
**Fix**: Run schema SQL in correct database/schema

### Prisma Generate Fails
```
Error: schema not found
```
**Fix**: 
```bash
cd backend
npx prisma generate --schema=../database/schema.prisma
```

---

## Database Size Estimates

| Records | Size |
|---------|------|
| 1,000 members + bookings | ~10 MB |
| 10,000 members + bookings | ~50 MB |
| 100,000 members + bookings | ~300 MB |

**Supabase Free Tier**: 500 MB (handles ~50,000 members comfortably)

---

## Backup & Restore

### Backup (Supabase)
```bash
# Via Dashboard
# Database → Backups → Download

# Via pg_dump
pg_dump -h db.[REF].supabase.co -U postgres filliq > backup.sql
```

### Restore
```bash
psql -h db.[REF].supabase.co -U postgres -d postgres < backup.sql
```

---

## Need Help?

- Prisma Docs: https://prisma.io/docs
- Supabase Docs: https://supabase.com/docs
- PostgreSQL: https://postgresql.org/docs
