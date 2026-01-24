# Growth Experiments Log

This document tracks all A/B tests and growth experiments conducted on ComplyFlow.

## Experiment: `landing-page-hero`
**Status:** Active (Running)
**Start Date:** 2026-01-23
**Goal:** Increase Landing Page "Start Free Trial" conversion rate.

### Variants

| Variant | Headline | Subheadline |
|---------|----------|-------------|
| **Control** | "Compliance Without The Complexity." | "Stay CQC-Ready, 24/7. ComplyFlow is the AI shield..." |
| **Test A** | "Protect Your Rating. Automate Your Compliance." | "The only AI assistant that identifies policy gaps before CQC does. Join 147+ care homes reducing stress and ensuring safety today." |

### Tracking
- **View Event:** `landing-page-hero_viewed` (with `variant` property)
- **Conversion Event:** `lp_conversion` (with `ab_test_variant`, `ab_test_flag`, and `location` properties)

### Implementation Details
- Handled via `abTestService.ts` in `src/lib/abTest.ts`.
- Integrated into `LandingPage.tsx`.
- PostHog is used for flag delivery and event collection.

---

## Future Experiments (Ideas)
- **Pricing Table:** Test 3-tier vs 2-tier layout.
- **Support Widget CTA:** Test "Need Help?" vs "Talk to an Expert".
- **Email Drip:** Test "Helpful Tips" vs "Product Updates" as subject lines for onboarding.
