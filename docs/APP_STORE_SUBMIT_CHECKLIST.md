# App Store Submit Checklist — Rituel v1.2.0

**Status:** active checklist. Update inline as items complete.
**Current store version:** v1.1.2 (Build 17, live).
**Target submission:** v1.2.0 (incorporates Phase 15-19D work).
**EAS Free build quota resets:** 1 June 2026.

## Reality anchor
Auth = email/password only (no social login this release per
`docs/AUTH_SOCIAL_LOGIN_PLAN.md`). RevenueCat code appears largely
implemented from prior audit; dashboard/config and real-device purchase
flow still require confirmation. Phase 19 / 19D i18n completed across
major app surfaces; final real-device language QA still required.

---

## 1. RevenueCat preflight
- [ ] verify: `utils/purchases.ts` configurePurchases idempotent + iOS guard
- [ ] verify: Entitlement `Rituel Pro` matches dashboard + code
- [ ] verify: Offering `default` active, 5 packages
- [ ] verify: In-app purchase key (P8, StoreKit 2) uploaded to RevenueCat
- [ ] verify: `.env` EXPO_PUBLIC_REVENUECAT_IOS_KEY filled (appl_…)
- [ ] verify: Sandbox transactions observed (subs + credits + renewals)
- [ ] Real-device test on production build (not preview)
- [ ] Restore Purchases works on clean install
- [ ] Gating: makeup_full / routine_optimize / skin_analysis
- [ ] Credit pack purchase increments balance

## 2. EAS build readiness
- [ ] EAS quota available (resets 1 Jun 2026, Free plan)
- [ ] `eas.json` production profile reviewed
- [ ] `app.json` version + iOS buildNumber bumped
- [ ] Apple Team ID / ASC App ID in eas.json verified
- [ ] Provisioning profile current (device list, expiry)

## 3. Real-device QA matrix
Test on registered device, every language (FR/EN/TR):
- [ ] Onboarding flow + skin quiz
- [ ] Sign up + email confirm + sign in + sign out + reset password
- [ ] Home: reflection, quota, score
- [ ] Routine: add/optimize/delete steps, modal flows
- [ ] Makeup AI: camera + gallery + result + locked card
- [ ] Skin Analysis: capture + result + disclaimer
- [ ] Compatibility: ingredient lookup (rule-based, free)
- [ ] Archive: add/edit/delete, PAO indicator
- [ ] Community: feed, post, save, edit, delete, share card
- [ ] Saved screen + product discovery
- [ ] Paywall: open, purchase monthly, purchase yearly, restore
- [ ] Credits: pack purchase, balance, spend on AI
- [ ] Language switcher (dev) + locale persistence
- [ ] Deep back navigation on hidden screens
- [ ] Offline / 429 / error states surface localized messages

## 4. App Store metadata (per locale: FR primary, EN, TR)
- [ ] App name, subtitle (per locale)
- [ ] Description (per locale)
- [ ] Keywords (per locale, 100 chars)
- [ ] Promotional text (per locale, optional)
- [ ] Support URL
- [ ] Marketing URL (rituel.beauty)
- [ ] Privacy Policy URL (current, accessible)
- [ ] Category: primary + secondary
- [ ] Age rating answered
- [ ] Copyright string

## 5. Screenshots (per locale where required)
- [ ] iPhone 6.9" (iPhone 16 Pro Max class) — required
- [ ] iPhone 6.5" (iPhone 14 Plus class) — required for legacy
- [ ] FR set (primary)
- [ ] EN set
- [ ] TR set
- [ ] App Preview video (optional, defer if not ready)

## 6. Privacy / data collection (App Privacy questions)
Audit all data collected and declare in App Store Connect:
- [ ] Contact info (email — auth)
- [ ] User content (photos — skin journal, posts)
- [ ] Identifiers (user ID — Supabase, RevenueCat)
- [ ] Purchases (RevenueCat)
- [ ] Usage data (analytics events) — confirm what trackEvent sends
- [ ] Diagnostics (crash logs, if any)
- [ ] Third parties: Supabase, RevenueCat, Anthropic (via edge function)
- [ ] Anthropic / AI disclosure in privacy policy
- [ ] Data deletion path documented (sign-out + account deletion)

## 7. TestFlight
- [ ] Build uploaded via `eas submit` or Transporter
- [ ] Export compliance answered (no encryption beyond HTTPS = exempt)
- [ ] Internal testers added
- [ ] Self-install + smoke test (sections 1, 3 above)
- [ ] Optional: external testers (requires Beta App Review, ~1 day)

## 8. Production submission
- [ ] Build selected in App Store Connect
- [ ] Release method: manual / automatic
- [ ] Phased release: yes (recommended for risk reduction)
- [ ] App Review notes filled (test account, AI disclosure note,
      RevenueCat sandbox note if reviewer needs to test purchase)
- [ ] Submit for Review

## 9. AI feature review risk (Anthropic / claude-proxy)
- [ ] Privacy policy mentions AI processing + provider
- [ ] App Review notes explain AI use (skincare guidance, no medical advice)
- [ ] Content moderation: 429 / safety fallback localized
- [ ] No medical claims in copy (review FR/EN/TR strings)

## 10. Rollback / blocker policy
- [ ] If RevenueCat fails on production: pull from sale (RevenueCat
      dashboard offering deactivate is fastest; submit hotfix without
      purchases temporarily)
- [ ] If crash spike >1%: phased release pause from App Store Connect
- [ ] If reviewer rejects: log reason in `docs/APP_REVIEW_LOG.md`
      (create on first rejection), address, resubmit
- [ ] Known acceptable defects to document and ship anyway: list here

## 11. Post-submission
- [ ] Monitor App Store Connect status daily
- [ ] Monitor RevenueCat dashboard for real transactions
- [ ] Monitor Supabase logs for auth / RLS errors
- [ ] Plan v1.3 backlog (social login, deferred i18n plural, skin_type
      normalize, journal photo upload, etc.)

---

## Non-goals for v1.2.0
- Social login (deferred per AUTH_SOCIAL_LOGIN_PLAN.md)
- Phase 16 hybrid intelligence (not started in code)
- Android Google Play launch (separate track, identity verified, deferred)
- i18n plural engine (deferred per PHASE_19D_WORKLOG.md)
- skin_type display normalization (deferred)
- AI output language dynamic ('fr' hardcoded in routine/makeup, deferred
  pending API quota + output quality testing)

## When to update this file
Tick boxes as items complete. Add notes inline under each item if a
blocker is found. Bump "Status" line at top when phase changes
(checklist active -> in submission -> approved -> live).
