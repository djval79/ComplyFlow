# ComplyFlow: Staying Current with Regulatory Information

## 📊 Current State Analysis

### What Was Hardcoded (Before):
| Component | Data Source | Update Method |
|-----------|-------------|---------------|
| CQC Quality Statements | `cqcInspectionData.ts` (47KB) | Manual code update |
| CQC Regulations | `cqcKnowledgeBase.ts` (8KB) | Manual code update |
| Mock Inspection Questions | Static array | Manual code update |
| Regulatory Intelligence Widget | Fake "42 new notes" text | None |
| AI Prompts | Embedded in service files | Manual code update |

### ⚠️ Risk of Outdated Information:
- CQC frameworks change annually
- Immigration rules update frequently
- NICE guidelines are revised regularly
- No mechanism to alert users of changes

---

## ✅ New Regulatory Intelligence System

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SOURCES                          │
│  ┌─────────┐  ┌─────────────┐  ┌──────┐  ┌─────────┐        │
│  │   CQC   │  │ Home Office │  │ NICE │  │  DHSC   │        │
│  │  (RSS)  │  │ (Gov.uk API)│  │(RSS) │  │(Gov.uk) │        │
│  └────┬────┘  └──────┬──────┘  └──┬───┘  └────┬────┘        │
│       │              │            │           │              │
└───────┼──────────────┼────────────┼───────────┼──────────────┘
        │              │            │           │
        └──────────────┴────────────┴───────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │    Supabase Edge Function     │
        │    "regulatory-feed"          │
        │  ─────────────────────────    │
        │  • Fetches from all sources   │
        │  • AI relevance scoring       │
        │  • Deduplication              │
        │  • Daily scheduled run        │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │     Supabase Database         │
        │  ─────────────────────────    │
        │  • regulatory_updates         │
        │  • regulatory_update_reads    │
        │  • regulatory_subscriptions   │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │     Frontend Components       │
        │  ─────────────────────────    │
        │  • RegulatoryIntelligenceHub  │
        │  • Dashboard widget           │
        │  • Email notifications        │
        └───────────────────────────────┘
```

---

## 🔧 Implementation Components

### 1. Database Tables (`migrations/020_regulatory_intelligence.sql`)

| Table | Purpose |
|-------|---------|
| `regulatory_updates` | Stores fetched updates with metadata |
| `regulatory_update_reads` | Tracks which user has read which update |
| `regulatory_subscriptions` | Per-org alert preferences |

### 2. Edge Function (`functions/regulatory-feed/index.ts`)

**Features:**
- Fetches from CQC RSS feed
- Fetches from Gov.uk API (Home Office, DHSC)
- Calculates relevance score using keyword matching
- Stores to Supabase with deduplication
- Can be triggered daily via Supabase CRON

**Schedule Setup:**
```sql
-- In Supabase SQL Editor:
SELECT cron.schedule(
  'fetch-regulatory-updates',
  '0 6 * * *',  -- Daily at 6 AM
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/regulatory-feed',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  )
  $$
);
```

### 3. Frontend Service (`services/regulatoryIntelligence.ts`)

**Functions:**
- `fetchCQCUpdates()` - Get real-time updates
- `getCachedUpdates()` - Get from database cache
- `markUpdateAsRead()` - Track read status
- `getUnreadCount()` - For badge display
- `scoreUpdateRelevance()` - AI-powered scoring

### 4. UI Component (`components/RegulatoryIntelligenceHub.tsx`)

**Features:**
- Displays updates with source badges
- Filter by source (CQC, Home Office, NICE, DHSC)
- Unread indicator badges
- High-relevance warnings
- Refresh button
- External link to source

---

## 📡 Data Sources

### CQC (Care Quality Commission)
- **Feed:** https://www.cqc.org.uk/news/releases/rss.xml
- **Content:** News releases, guidance updates, enforcement actions
- **Update Frequency:** Multiple times per week

### Home Office
- **API:** Gov.uk Search API
- **Content:** Immigration rules, sponsor licence updates, RTW changes
- **Update Frequency:** Several times per month

### NICE (National Institute for Health and Care Excellence)
- **Feed:** https://www.nice.org.uk/rss/nicepdfs.xml
- **Content:** Clinical guidelines, quality standards
- **Update Frequency:** Weekly

### DHSC (Department of Health and Social Care)
- **API:** Gov.uk Search API
- **Content:** Policy announcements, funding, workforce updates
- **Update Frequency:** Multiple times per week

---

## 🎯 Relevance Scoring Algorithm

Updates are scored 0-100 based on keyword matching:

```typescript
const RELEVANCE_KEYWORDS = [
    { term: 'care home', weight: 20 },
    { term: 'residential care', weight: 20 },
    { term: 'cqc', weight: 15 },
    { term: 'safeguarding', weight: 15 },
    { term: 'sponsor licence', weight: 15 },
    { term: 'right to work', weight: 15 },
    { term: 'inspection', weight: 12 },
    // ... more keywords
]
```

**Score Interpretation:**
- **90-100:** Critical - Direct impact on compliance
- **70-89:** High - Likely affects operations
- **50-69:** Medium - Worth reviewing
- **<50:** Low - Not stored

---

## 🔔 Notification System

### In-App Notifications
- Badge count on Regulatory Intelligence menu item
- Highlight unread updates in hub
- High-relevance warning banners

### Email Alerts (Future Enhancement)
```typescript
// Trigger via Resend when relevance >= 90
if (update.relevance_score >= 90) {
    await sendEmail({
        to: orgAdminEmails,
        subject: `[Action Required] ${update.title}`,
        template: 'regulatory-alert'
    });
}
```

---

## 🚀 Deployment Steps

### 1. Apply Database Migration
```bash
supabase db push
# or manually run the SQL in Supabase Dashboard
```

### 2. Deploy Edge Function
```bash
supabase functions deploy regulatory-feed --no-verify-jwt
```

### 3. Set Up Daily CRON
```sql
-- In Supabase Dashboard → SQL Editor
SELECT cron.schedule(
  'daily-regulatory-fetch',
  '0 6 * * *',
  $$ SELECT net.http_post('https://arcyjifubkqihfkewovf.supabase.co/functions/v1/regulatory-feed') $$
);
```

### 4. Test the Function
```bash
curl -X POST https://arcyjifubkqihfkewovf.supabase.co/functions/v1/regulatory-feed \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 📈 Future Enhancements

### Phase 2: AI-Powered Analysis
- Use Gemini to summarize regulatory changes
- Generate action items from updates
- Create compliance impact assessments

### Phase 3: Policy Auto-Update
- Detect when policies need updating based on regulatory changes
- Generate suggested policy amendments
- Track policy-to-regulation mapping

### Phase 4: Predictive Intelligence
- Analyze patterns in regulatory enforcement
- Predict areas likely to face increased scrutiny
- Proactive compliance recommendations

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `src/services/regulatoryIntelligence.ts` | Service layer for fetching/caching |
| `src/components/RegulatoryIntelligenceHub.tsx` | UI component |
| `supabase/migrations/020_regulatory_intelligence.sql` | Database tables |
| `supabase/functions/regulatory-feed/index.ts` | Edge function for fetching |
| `REGULATORY_INTELLIGENCE.md` | This documentation |

---

*Document created: 2026-01-09*
*ComplyFlow by NovumSolvo*
