# ComplyFlow - AI-Powered Healthcare Compliance

ComplyFlow is a high-performance regulatory management platform designed for the UK healthcare sector. It combines AI-driven policy analysis with automated tracking for CQC regulations and Home Office sponsorship compliance.

## 🚀 Features

- **CQC Gap Analyzer**: Upload documents and use Google Gemini AI to identify compliance gaps.
- **Sponsor Guardian**: Track international worker visas, CoS usage, and right-to-work checks.
- **Inspection Simulator**: Mock inspection tool to prepare staff for regulatory visits.
- **Governance Dashboard**: Centralized oversight for multi-site care organizations.
- **Training Modules**: Integrated training for Home Office e-Visa changes.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Lucide Icons.
- **Backend**: Supabase (Auth, Database, Edge Functions).
- **AI**: Google Gemini Pro (Reasoning Engine).
- **Payments**: Stripe (Subscription Management).

## 📋 Setup Instructions

### 1. Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_pk
```

### 2. Database Setup
Run the migrations found in `supabase/migrations` in your Supabase SQL Editor.

### 3. Stripe Integration (Edge Functions)
You must deploy the following functions to Supabase:
```bash
# Set your secrets first
supabase secrets set STRIPE_SECRET_KEY=rk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Deploy functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

### 4. Local Development
```bash
npm install
npm run dev
```

## 🏗️ Production Deployment
Deploy the frontend to **Vercel** or **Netlify**. Ensure all `VITE_` environment variables are added to your hosting provider's dashboard.

## 📱 Mobile App (iOS & Android)

ComplyFlow is mobile-ready using **Capacitor**. You can build it into a native app for the Apple App Store or Google Play Store.

### Native Dependencies
- **iOS**: Requires **Xcode** on macOS.
- **Android**: Requires **Android Studio**.

### Mobile Commands
```bash
# Build the web app and sync it to native platforms
npm run mobile:build

# Open the project in Xcode
npm run mobile:ios

# Open the project in Android Studio
npm run mobile:android
```

### App Store Submission
1. Build the production bundle: `npm run build`.
2. Sync to native: `npx cap sync ios`.
3. Open in Xcode: `npm run mobile:ios`.
4. Configure your **App Icon**, **Splash Screen**, and **Bundle Identifier** in Xcode.
5. Archive and Upload to App Store Connect.

---
