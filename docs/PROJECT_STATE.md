# Rituel — Project State Snapshot

**Repo:** github.com/mfkparis1-star/rituel-app
**Active branch push target:** `main:phase15-rebuild`
**Path:** `/Users/ceresparis/rituel_v2`
**Stack:** RN 0.81.5 + Expo SDK 54 + TS 5.9.2 + Supabase
**HEAD:** `44e6528`
**App Store:** Build 17 v1.1.2 live. Build 20 v1.2.0 TestFlight-ready, submission
deferred during Phase work.

> This document and git/GitHub history are the source of truth, above chat memory.

## Current sprint
- **Phase 19 (i18n localization): ✅ COMPLETE.** See `PHASE_19_STATUS.md`.
- Build-free sprint: no native deps, no DB migration. API quota reset 1 June.

## Phase status
- 14.5 / 14.5.1 / 14.5.2 / 14.5.3 — v2 rebuild to production parity ✅
- 15.1 — RevenueCat config scaffold ✅ (15.2–15.8 pending: utils/purchases,
  usePremium, CreditPackModal/paywall real wire, useAIUnlock gating, sandbox test)
- 16 roadmap — hybrid intelligence (daily skin check, profiles.memory JSONB,
  personalized home, hybrid AI guide, gradual onboarding) — planned
- 19 — full FR/EN/TR localization of all string-bearing screens ✅

## i18n
- Infra: `utils/i18n/`, `hooks/useLanguage.ts`. fr source of truth, TS-enforced parity.
- 9/9 string-bearing tab screens localized + non-tab screens through 19.1–19.12.
- No-migration strategy: DB canonical FR, display-only translation.

## Key recent commits
- `44e6528` phase 19.15 (12b) makeup screen
- `f9e12b2` phase 19.15 (12a) makeup dict
- `f407cb8` phase 19.14 (11b) routine screen
- `ffcb362` phase 19.14 (11a) routine dict
- `1b2ef05` phase 19.13 (10c) community card+alerts
- `6944503` phase 19.13 (10b) community chrome
- `3f0d198` phase 19.13 (10a) community dict

## Deferred / next
- i18n deferred items: see `PHASE_19_STATUS.md` (AI output, relativeTime, plural,
  skin_type raw, formatDate locale, translate() direction).
- Next major: Phase 15.2+ RevenueCat full integration (needs dashboard config:
  product import, entitlement, iOS SDK key).
- Phase 20/21 planned: Optical Intelligence Layer (silent optical accuracy
  layer, no new screen) — see docs/OPTICAL_INTELLIGENCE_LAYER.md.
- Other deferred: journal photo upload (skin-journal bucket), affiliate expansion,
  EN+TR App Store screenshots (v1.1.3+), Google Play upload, Build 18 viral share port.
