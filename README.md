# FillIQ — AI Agent Build

## Yoga & Pilates Studio No-Show Optimizer · South Africa

FillIQ is an intelligent extension module for existing studio management platforms that reduces no-shows, fills cancelled spots automatically, and prevents member churn.

---

## 🏗️ Architecture

### Backend (Node.js/Express + TypeScript)
```
backend/
├── src/
│   ├── services/           # Core business logic
│   │   ├── NoShowScorer.ts      # Risk scoring algorithm
│   │   ├── WaitlistEngine.ts    # Auto-fill engine
│   │   ├── ChurnScorer.ts       # Churn prediction
│   │   ├── WhatsAppService.ts   # WABA integration
│   │   └── DashboardService.ts  # Analytics
│   ├── routes/             # API endpoints
│   ├── jobs/               # Scheduled cron jobs
│   ├── types/              # TypeScript types
│   └── index.ts           # Entry point
```

### Frontend (React + TypeScript + Tailwind)
```
frontend/
├── src/
│   ├── pages/              # Dashboard, Churn Panel, Settings
│   ├── components/         # Reusable UI components
│   ├── services/           # API client
│   └── types/              # Frontend types
```

### Database (PostgreSQL + Prisma)
New tables added to existing schema:
- `booking_risk_scores` — Risk scores per booking
- `waitlist_fill_events` — Fill event tracking
- `member_churn_signals` — Churn risk data
- `pending_invites` — Active WhatsApp invites
- `filliq_settings` — Studio configuration

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (for BullMQ queues)

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment
```bash
# Backend
cp backend/.env.example backend/.env
# Edit with your database URL and WhatsApp credentials

# Database
cp database/.env.example database/.env
```

### 3. Setup Database
```bash
# Generate Prisma client
cd database && npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

### 4. Start Development
```bash
# Start both backend and frontend
npm run dev

# Or separately
npm run dev:backend   # Port 3001
npm run dev:frontend  # Port 5173
```

---

## 📋 Core Features

### 1. No-Show Predictor
- Scores every booking 0-100 for cancel risk
- Runs 3 hours before class
- Flags bookings with score ≥ 60
- Activates waitlist standby when at-risk count ≥ 20% of capacity

### 2. AI Waitlist Fill Engine
- Detects cancellations instantly
- Scores waitlist members for response likelihood
- Sends WhatsApp to top 3 simultaneously
- First "YES" reply auto-books the spot
- 30-minute expiry with auto-expansion

### 3. Churn Early-Warning System
- Runs nightly at 2 AM SAST
- Scores all active members
- Flags members with score ≥ 65
- Auto-nudges critical members (score ≥ 80)
- 14-day cooldown between nudges

### 4. Revenue Recovery Dashboard
- Real-time revenue recovered
- Fill rate trends
- At-risk member list
- Teacher class briefs
- Monthly reports

---

## 📡 API Routes

### Scoring
- `GET /api/filliq/scores/class/:classId` — Risk scores for class
- `GET /api/filliq/scores/member/:memberId` — Member risk history
- `POST /api/filliq/scores/calculate` — Manual trigger

### Waitlist
- `POST /api/filliq/waitlist/trigger` — Trigger fill
- `GET /api/filliq/waitlist/events` — Fill event log
- `GET /api/filliq/waitlist/pending` — Pending invites

### Churn
- `GET /api/filliq/churn/members` — At-risk members
- `POST /api/filliq/churn/nudge/:memberId` — Send nudge
- `POST /api/filliq/churn/offer/:memberId` — Free class offer
- `GET /api/filliq/churn/summary` — Churn stats

### Dashboard
- `GET /api/filliq/dashboard/summary` — Recovery summary
- `GET /api/filliq/dashboard/fill-chart` — 30-day chart
- `GET /api/filliq/dashboard/teacher-brief/:classId` — Class brief
- `GET /api/filliq/dashboard/at-risk-members` — At-risk list

### Settings
- `GET /api/filliq/settings` — Get settings
- `PUT /api/filliq/settings` — Update settings

### WhatsApp Webhook
- `POST /api/filliq/whatsapp/webhook` — Inbound messages
- `GET /api/filliq/whatsapp/webhook` — Verification

---

## ⏰ Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| No-Show Scoring | Every 15 min | Score bookings for classes in ~3hrs |
| Churn Scoring | Daily 2 AM SAST | Score all active members |
| Rebook Nudges | Every 30 min | Send post-class rebook invites |
| Monthly Report | 1st of month 6 AM | Generate and email monthly report |

---

## 💬 WhatsApp Templates

Required templates (submit to Meta for approval):

| Template | Purpose |
|----------|---------|
| `filiq_spot_available` | Notify waitlist of open spot |
| `filiq_spot_confirmed` | Confirm successful booking |
| `filiq_spot_taken` | Inform of missed opportunity |
| `filiq_rebook_nudge` | Post-class rebooking prompt |
| `filiq_churn_nudge` | Retention offer for at-risk |

---

## 🔐 Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/filliq"

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173

# WhatsApp Business API
WABA_PROVIDER=360dialog
WABA_PHONE_NUMBER_ID=
WABA_ACCESS_TOKEN=
WABA_VERIFY_TOKEN=filliq-verify-token

# Redis
REDIS_URL=redis://localhost:6379
```

---

## 🧪 Testing Checklist

- [ ] Score a test booking — verify output matches expected
- [ ] Simulate cancellation → WhatsApp fires within 60s
- [ ] Reply YES from two phones → only first wins
- [ ] Verify no-reply after 30min → expands to next batch
- [ ] Attend class → rebook nudge fires 45min after
- [ ] Dashboard figures match manual DB count
- [ ] Teacher brief shows correct risk counts
- [ ] Settings changes persist and affect jobs

---

## 📁 Project Structure

```
FILLQ/
├── backend/          # Express API
├── frontend/         # React dashboard
├── database/         # Prisma schema
├── shared/           # Shared types
├── package.json      # Root workspace config
└── README.md
```

---

## 🤝 Integration Notes

**FillIQ is a module, not a replacement.**

- Reads from existing `bookings`, `classes`, `members` tables
- Writes only to new FillIQ tables
- Uses existing booking service for actual bookings
- Uses existing auth system
- Integrates via internal API or direct DB

---

Built for South African yoga & pilates studios 🇿🇦
