# FILLQ Deployment Contract

**Date:** 2026-03-27
**Status:** ⏳ PENDING APPROVAL
**Project:** FILLQ — AI No-Show Optimizer for Yoga & Pilates Studios

---

## Current State

| Component | Status | Details |
|-----------|--------|---------|
| Database (Supabase) | ✅ Ready | `zlanegnamrsrphcvxtcf` — 13 tables, RLS, views, seed data |
| Backend (Express/TS) | 📦 Code ready | Needs env config + hosting |
| Frontend (React/Vite) | 📦 Code ready | Needs env config + hosting |
| WhatsApp (360dialog) | ❌ Not configured | Needs credentials |
| Redis (BullMQ) | ❌ Not provisioned | Required for scheduled jobs |

---

## What's Needed to Go Live

### 1. Hosting — Backend API
The backend needs a persistent server (Express + BullMQ cron jobs).

**Options:**
| Platform | Cost | Pros | Cons |
|----------|------|------|------|
| **Railway** | ~$5/mo + usage | Simple, built-in Redis, cron support | Costs scale with usage |
| **Fly.io** | ~$3-5/mo | Fast, great DX, free tier | Slightly more setup |
| **VPS (Hetzner/Contabo)** | ~$4-6/mo | Full control, cheapest | We manage everything |
| **Vercel** | Free tier | We already use it | No persistent server, bad for BullMQ cron |

**Recommendation:** Railway — one-click deploys, built-in Redis, handles BullMQ workers.

### 2. Redis
Required for BullMQ job queues (no-show scoring, churn, rebook nudges).

| Option | Cost | Notes |
|--------|------|-------|
| **Railway Redis** | Included | Comes with Railway backend |
| **Upstash** | Free tier (10K cmds/day) | Serverless, easy |
| **Self-hosted** | Free | On VPS, more management |

### 3. Hosting — Frontend
Static React app, any CDN works.

| Platform | Cost | Notes |
|----------|------|-------|
| **Vercel** | Free | Already in use, one-click deploy |
| **Netlify** | Free | Equally good |
| **Railway** | Included | If going all-Railway |

**Recommendation:** Vercel — you already have the workflow.

### 4. WhatsApp Business API (360dialog)
Required for waitlist fills, rebook nudges, churn nudges.

**You need:**
- `WABA_PHONE_NUMBER_ID`
- `WABA_ACCESS_TOKEN`
- `WABA_VERIFY_TOKEN`

**Action:** Michael obtains 360dialog account + approved message templates.

### 5. Environment Variables

**Backend (.env):**
```env
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASS]@db.zlanegnamrsrphcvxtcf.supabase.co:5432/postgres"
SUPABASE_URL=https://zlanegnamrsrphcvxtcf.supabase.co
SUPABASE_ANON_KEY=[from project settings]
SUPABASE_SERVICE_ROLE_KEY=[already have]
PORT=3001
NODE_ENV=production
FRONTEND_URL=[frontend domain]
WABA_PROVIDER=360dialog
WABA_PHONE_NUMBER_ID=[from michael]
WABA_ACCESS_TOKEN=[from michael]
WABA_VERIFY_TOKEN=[generate]
REDIS_URL=[from hosting provider]
JWT_SECRET=[generate]
```

**Frontend (.env):**
```env
VITE_SUPABASE_URL=https://zlanegnamrsrphcvxtcf.supabase.co
VITE_SUPABASE_ANON_KEY=[from project settings]
VITE_API_URL=[backend domain]/api/filliq
```

---

## Deployment Steps (Once Approved)

1. **Provision Redis** (Railway or Upstash)
2. **Configure backend .env** with all credentials
3. **Build & deploy backend** to Railway/Fly.io
4. **Run Prisma generate** on the server
5. **Configure frontend .env** with API URL + Supabase keys
6. **Deploy frontend** to Vercel
7. **Set up WhatsApp webhook** pointing to backend
8. **Test flow:** booking → risk score → cancellation → WhatsApp → rebook
9. **Verify cron jobs** running (scoring, churn, rebook, monthly report)

---

## Decisions Needed from Michael

| # | Question | Options |
|---|----------|---------|
| 1 | Backend hosting? | Railway / Fly.io / VPS |
| 2 | Redis provider? | Railway (bundled) / Upstash (free tier) |
| 3 | 360dialog account ready? | Yes → provide creds / No → I'll wait |
| 4 | Custom domain? | filliq.co.za / use platform defaults |
| 5 | Deploy to production or staging first? | Production / Staging |

---

## Estimated Monthly Cost

| Component | Cost |
|-----------|------|
| Supabase (FILLQ project) | Free tier (500MB) |
| Backend hosting (Railway) | ~$5-10/mo |
| Redis | Included / Free |
| Frontend (Vercel) | Free |
| WhatsApp (360dialog) | ~$5-15/mo (depends on volume) |
| **Total** | **~$10-25/mo** |

---

## Timeline

| Step | Time |
|------|------|
| Michael provides decisions + creds | — |
| Backend deploy | ~30 min |
| Frontend deploy | ~15 min |
| WhatsApp webhook setup | ~15 min |
| End-to-end testing | ~30 min |
| **Total (after approvals)** | **~2 hours** |

---

*Ready to deploy once you approve and provide the missing pieces.*
