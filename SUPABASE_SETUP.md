# FillIQ + Supabase Setup Guide

## Why Supabase for FillIQ?

✅ **PostgreSQL** - Full compatibility with Prisma schema  
✅ **Built-in Auth** - Studio owner authentication ready  
✅ **Row Level Security** - Multi-tenant studio isolation  
✅ **Real-time** - Live dashboard updates  
✅ **Edge Functions** - Can replace some cron jobs  
✅ **Free Tier** - Perfect for testing (500MB DB, 2GB bandwidth)

---

## 1. Create Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Initialize in project
supabase init
```

Or use the dashboard: https://app.supabase.com

---

## 2. Database Connection

### Update Backend `.env`:
```env
# Supabase PostgreSQL connection
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase Auth (optional - for studio owner auth)
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE-ROLE-KEY]"
```

### Get credentials from Supabase Dashboard:
1. Go to **Project Settings** → **Database**
2. Copy **Connection string** (URI tab)
3. Go to **Project Settings** → **API**
4. Copy **URL** and **anon/service_role keys**

---

## 3. Run Migrations

```bash
cd database

# Generate Prisma client for Supabase
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Or use Supabase CLI migrations
supabase db push
```

---

## 4. Row Level Security (RLS)

Enable RLS on FillIQ tables for multi-studio support:

```sql
-- Enable RLS
ALTER TABLE filliq_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_fill_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_churn_signals ENABLE ROW LEVEL SECURITY;

-- Policy: Studios can only see their own data
CREATE POLICY "Studio isolation" ON filliq_settings
  FOR ALL USING (studio_id = current_setting('app.current_studio_id')::text);

-- Policy: Members can only see their own churn signals
CREATE POLICY "Member data isolation" ON member_churn_signals
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM members WHERE studio_id = current_setting('app.current_studio_id')::text
    )
  );
```

---

## 5. Supabase Edge Functions (Optional)

Replace cron jobs with Edge Functions for serverless execution:

### Create Edge Function:
```bash
supabase functions new no-show-scorer
```

### `supabase/functions/no-show-scorer/index.ts`:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Run no-show scoring logic
  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .gte('start_time', new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString())
    .lte('start_time', new Date(Date.now() + 3.25 * 60 * 60 * 1000).toISOString())

  // Score each class...
  
  return new Response(JSON.stringify({ scored: classes?.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### Schedule with Supabase Cron:
```sql
SELECT cron.schedule(
  'no-show-scoring',
  '*/15 * * * *',  -- Every 15 minutes
  $$
    SELECT net.http_get(
      url:='https://[PROJECT-REF].supabase.co/functions/v1/no-show-scorer',
      headers:='{"Authorization": "Bearer [ANON-KEY]"}'::jsonb
    ) AS request_id;
  $$
);
```

---

## 6. Real-time Dashboard Updates

### Frontend subscription:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Subscribe to new fill events
const subscription = supabase
  .channel('fill-events')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'waitlist_fill_events' },
    (payload) => {
      console.log('New fill event:', payload.new)
      // Update dashboard in real-time
    }
  )
  .subscribe()
```

---

## 7. Auth Integration

### Protect API routes with Supabase Auth:
```typescript
import { createClient } from '@supabase/supabase-js'

// Middleware to verify JWT
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  req.user = user
  next()
}

// Apply to routes
app.use('/api/filliq', authMiddleware)
```

---

## 8. Storage for Reports

Store monthly PDF reports in Supabase Storage:
```typescript
const { data, error } = await supabase
  .storage
  .from('reports')
  .upload(`studio-${studioId}/report-${year}-${month}.pdf`, pdfBlob)
```

---

## 9. Deployment

### Deploy Backend to Supabase Edge Functions:
```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy no-show-scorer
supabase functions deploy churn-scorer
supabase functions deploy waitlist-engine
```

### Deploy Frontend to Supabase Hosting:
```bash
# Build frontend
npm run build

# Deploy to Supabase
supabase hosting publish
```

---

## 10. Environment Variables for Production

```env
# Database
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE-ROLE-KEY]"

# Frontend
VITE_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
VITE_SUPABASE_ANON_KEY="[ANON-KEY]"
```

**Note**: Use `DATABASE_URL` with connection pooling for serverless, `DIRECT_URL` for migrations.

---

## Pricing (as of 2025)

| Feature | Free Tier | Pro ($25/mo) |
|---------|-----------|--------------|
| Database | 500MB | 8GB |
| Bandwidth | 2GB | 100GB |
| Edge Functions | 500K invocations | 2M |
| Auth Users | Unlimited | Unlimited |
| Real-time | 200 concurrent | 500 concurrent |

**FillIQ fits comfortably in Free Tier for small studios!**

---

## Quick Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Reset database
supabase db reset

# Generate types from schema
supabase gen types typescript --local > src/types/supabase.ts

# Link to remote project
supabase link --project-ref [PROJECT-REF]
```

---

## Migration from Local PostgreSQL to Supabase

```bash
# 1. Export local data
pg_dump -h localhost -U postgres filliq > filliq_backup.sql

# 2. Import to Supabase
psql -h db.[PROJECT-REF].supabase.co -U postgres -d postgres < filliq_backup.sql

# 3. Update connection strings
# 4. Deploy
```

---

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Prisma + Supabase: https://supabase.com/partners/integrations/prisma
- Connection Pooling: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
