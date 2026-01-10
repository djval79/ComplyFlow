# ComplyFlow Email System

## Overview

ComplyFlow uses **Resend** for transactional email delivery, integrated via Supabase Edge Functions.

---

## 📧 Email Types

| Type | Purpose | Trigger |
|------|---------|---------|
| `welcome` | Welcome new users | User signup |
| `payment_success` | Confirm payment | Stripe webhook (checkout.session.completed) |
| `payment_failed` | Alert failed payment | Stripe webhook |
| `compliance_alert` | Critical compliance issues | Gap analysis / automated checks |
| `weekly_digest` | Weekly summary | GitHub Action (Mondays 8 AM) |
| `trial_expiring` | Trial reminder | 3 days before expiry |
| `team_invite` | Invite new team members | Manual invite |
| `password_reset` | Password reset link | Supabase Auth |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Email Triggers                      │
│  ┌─────────────┐  ┌─────────┐  ┌────────────────┐   │
│  │ User Signup │  │ Stripe  │  │ GitHub Actions │   │
│  └──────┬──────┘  └────┬────┘  └───────┬────────┘   │
│         │              │               │             │
└─────────┼──────────────┼───────────────┼─────────────┘
          │              │               │
          ▼              ▼               ▼
┌─────────────────────────────────────────────────────┐
│           Supabase Edge Functions                    │
│  ┌─────────────────────────────────────────────┐    │
│  │  send-email/index.ts                        │    │
│  │  • Receives email requests                  │    │
│  │  • Selects template by type                 │    │
│  │  • Renders HTML email                       │    │
│  │  • Sends via Resend API                     │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  weekly-digest/index.ts                     │    │
│  │  • Queries all active organizations         │    │
│  │  • Gathers compliance stats                 │    │
│  │  • Calls send-email for each user           │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────┐
│                Resend API                            │
│  • API Key: RESEND_API_KEY (Supabase Secret)        │
│  • From: noreply@complyflow.uk                      │
│  • Professional HTML templates                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### Required Secrets (Supabase)

| Secret | Description |
|--------|-------------|
| `RESEND_API_KEY` | Resend API key (re_xxxxxxxx) |

### Domain Setup (Resend Dashboard)

1. Add domain `complyflow.uk` in Resend
2. Add DNS records (DKIM, SPF, DMARC)
3. Verify domain
4. Update `from` address in send-email function

---

## 📋 Usage

### Frontend (src/services/emailService.ts)

```typescript
import { 
  sendWelcomeEmail, 
  sendComplianceAlertEmail,
  sendWeeklyDigestEmail 
} from './services/emailService';

// Send welcome email
await sendWelcomeEmail(
  'user@example.com',
  'John Smith',
  'https://app.complyflow.uk/dashboard'
);

// Send compliance alert
await sendComplianceAlertEmail(
  'manager@carehome.com',
  'Missing DBS Check',
  'Staff member John Doe has an expired DBS certificate.',
  'critical',
  'Staff Compliance'
);
```

### Direct Edge Function Call

```bash
curl -X POST https://arcyjifubkqihfkewovf.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "to": "user@example.com",
    "data": {
      "name": "John Smith",
      "trialDays": 14
    }
  }'
```

---

## 📅 Automated Emails

### Scheduled via GitHub Actions

| Workflow | Schedule | Function |
|----------|----------|----------|
| `regulatory-feed.yml` | Daily 6 AM UTC | Fetch regulatory updates |
| `weekly-digest.yml` | Mondays 8 AM UTC | Send weekly summaries |

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `SUPABASE_ANON_KEY` | For regulatory feed |
| `SUPABASE_SERVICE_ROLE_KEY` | For weekly digest (needs DB access) |

---

## 🎨 Email Template Design

All emails feature:
- ✅ Professional corporate design
- ✅ ComplyFlow branding (blue gradient header)
- ✅ Mobile-responsive layout
- ✅ Clear CTAs (buttons)
- ✅ Proper footer with unsubscribe info
- ✅ Plain text fallback (via Resend)

### Color Palette

| Use | Color |
|-----|-------|
| Primary | #1e40af |
| Success | #059669 |
| Warning | #f59e0b |
| Danger | #dc2626 |
| Background | #f8fafc |

---

## 🧪 Testing

### Test Welcome Email

```bash
# Via GitHub Actions (manual trigger)
gh workflow run regulatory-feed.yml

# Or directly
curl -X POST https://arcyjifubkqihfkewovf.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"type":"welcome","to":"your@email.com","data":{"name":"Test User"}}'
```

---

## 📁 Files

| File | Purpose |
|------|---------|
| `supabase/functions/send-email/index.ts` | Main email sending function |
| `supabase/functions/weekly-digest/index.ts` | Weekly digest automation |
| `src/services/emailService.ts` | Frontend email service |
| `.github/workflows/weekly-digest.yml` | Scheduled digest workflow |

---

*Document created: 2026-01-10*
*ComplyFlow by NovumSolvo*
