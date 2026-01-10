# Stripe Integration Setup Guide

## 🔑 Your Stripe Credentials

**Live Secret Key:** `sk_live_REDACTED_FOR_SECURITY`

---

## 📋 Setup Steps

### Step 1: Configure Supabase Secrets

Run these commands in your terminal (from the project root):

```bash
# Set the Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_live_REDACTED_FOR_SECURITY

# You'll also need to set the webhook secret after creating the webhook (see Step 3)
# supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 2: Create Stripe Products & Prices

In your [Stripe Dashboard](https://dashboard.stripe.com/products):

1. **Create Product: Professional Plan**
   - Name: "ComplyFlow Professional"
   - Price: £49/month (recurring)
   - Copy the Price ID (starts with `price_...`)

2. **Create Product: Corporate Plan**
   - Name: "ComplyFlow Corporate"  
   - Price: Custom (or £199/month)
   - Copy the Price ID

3. **Update the Price IDs in the Edge Function:**
   
   Edit `supabase/functions/create-checkout-session/index.ts`:
   ```typescript
   const priceMap: Record<string, string> = {
       "tier_pro": "price_XXXXX",      // Replace with your Professional price ID
       "tier_enterprise": "price_XXXXX" // Replace with your Corporate price ID
   }
   ```

### Step 3: Configure Stripe Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set the endpoint URL to:
   ```
   https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_...`)
7. Set it in Supabase:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Step 4: Get Your Publishable Key

From [Stripe API Keys](https://dashboard.stripe.com/apikeys):

1. Copy your "Publishable key" (starts with `pk_live_...`)
2. Add it to your `.env` file:
   ```
   VITE_STRIPE_PUBLIC_KEY=pk_live_...
   ```

### Step 5: Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy create-checkout-session --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
```

---

## 🧪 Testing the Integration

### Test Checkout Flow:
1. Go to `/pricing` in your app
2. Click "Upgrade to Pro"
3. You should be redirected to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
5. Complete the payment
6. You should be redirected back to `/dashboard?payment=success`

### Check Webhook:
1. After payment, check Supabase Dashboard → Edge Functions → Logs
2. You should see `🔔 Received event: checkout.session.completed`
3. Check your `organizations` table for `subscription_tier` update

---

## 📁 Files Involved

| File | Purpose |
|------|---------|
| `supabase/functions/create-checkout-session/index.ts` | Creates Stripe Checkout session |
| `supabase/functions/stripe-webhook/index.ts` | Handles payment confirmation |
| `src/pages/Pricing.tsx` | Frontend upgrade buttons |
| `.env` | `VITE_STRIPE_PUBLIC_KEY` (frontend) |

---

## 🔐 Security Notes

- ⚠️ **NEVER commit the secret key to Git**
- The secret key should only be in Supabase Secrets
- The publishable key (pk_...) is safe to use in frontend code
- Make sure `.env` is in `.gitignore`

---

## 🆘 Troubleshooting

**"Invalid API Key" error:**
- Verify the secret key is correctly set in Supabase secrets
- Run `supabase secrets list` to check

**Webhook not receiving events:**
- Check the endpoint URL is correct
- Verify the webhook signing secret matches
- Check Stripe Dashboard → Webhooks → Recent events

**Checkout redirects but payment fails:**
- Check browser console for errors
- Verify the Price IDs exist in Stripe
- Check Edge Function logs in Supabase

---

*Document created: 2026-01-09*
