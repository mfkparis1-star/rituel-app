# Skin Profile Funnel — Product Plan

**Status:** PLANNED. No implementation yet. Documentation-only.
**Date:** 1 June 2026.
**Decision rule:** Model 1 (Quiz → Summary → AI CTA → Paywall + Later
fallback). Quiz is the high-intent moment; AI CTA capitalizes on it.

## Product decision

Two models considered. Model 1 chosen.

### Model 1 (CHOSEN) — Quiz → Paywall → AI Analysis
- User completes the 6-question skin quiz.
- Summary screen shows their answers.
- A primary CTA "AI ile kapsamlı analiz" / "Comprehensive AI analysis"
  appears.
- CTA opens paywall.
- "Daha sonra" / "Later" link saves quiz answers and sends user home
  without forcing premium.

Why: quiz completion is the highest-intent moment in the new-user
journey. The user has just disclosed skin type, sensitivity, concerns,
routine level, and a goal. Asking "now let AI synthesize this for you"
is a natural, non-coercive premium pitch. The fallback preserves the
free path so no user is lost.

### Model 2 (REJECTED) — Quiz free, AI elsewhere
- Quiz fills profile.
- AI CTAs live in home/profile organically.
- Paywall triggered by usage, not onboarding.
- Less aggressive; lower conversion; loses the post-quiz moment.

## Decisions

Six product questions resolved.

**S1 — Quiz enforcement: semi-required (b)**
Quiz screen appears after onboarding but offers a "Daha sonra" link.
Users who skip see a soft reminder badge on the profile card. Not
hard-blocked because premium beauty apps lose users to hard gates.

**S2 — AI position: summary CTA (b)**
AI is offered as a button on the quiz summary screen, after the user
sees their own answers. Not a 7th question (would feel coerced), not a
separate screen entry (would dilute conversion).

**S3 — AI vs quiz overlap: both saved (b)**
If quiz says "combination" and AI says "oily T-zone", both are stored
in `memory.skin_profile` (user answer) and `memory.skin_analysis` (AI
output) with timestamps. Downstream consumers (reflection, routine,
recommendations) can use either or both. Future slice may add a UI to
reconcile.

**S4 — "Comprehensive" definition: all of (a) + (b) + (c) — d**
- (a) More parameters: skin type, hydration, luminosity, pore visibility,
  pigmentation, environmental sensitivity, dehydration markers.
- (b) Longer narrative explanation in user's language.
- (c) Visual report: numeric scores, simple chart elements, before/after
  framing where applicable.

(c) is heavier; may be split into a second slice. (a) and (b) are
prompt-side changes and ship together.

**S5 — Editing UX: summary + "Anketi güncelle" (c)**
Profile card shows current summary (skin type, sensitivity, goal as
short row), with a single "Anketi güncelle" / "Update quiz" button.
Tapping reopens the quiz pre-filled with current answers (requires the
pre-fill bug fix first). Per-row inline editing rejected for now —
value/effort ratio too low.

**S6 — Monetization trigger: paywall + Later fallback (d)**
The "AI kapsamlı analiz" CTA always opens the paywall first (no free
first try). "Daha sonra" link saves quiz answers and lets user proceed
home. User can return any time from profile and trigger the same CTA
again. This is consistent with the existing `useAIUnlock` per-result
pattern but explicit at the funnel level.

## Reality check — current code state (audit 1 June 2026)

What exists:
- `app/profile/skin-quiz.tsx` (561 lines) — 6-question quiz, writes to
  `profiles.memory.skin_profile` via `useMemory.patch`. Verified writes
  to DB correctly.
- `app/(tabs)/skin-analysis.tsx` — separate photo-based AI analysis
  screen, already gated by `useAIUnlock('skin_analysis')`.
- `hooks/useMemory.ts` — read/patch the `profiles.memory` JSONB.
- `app/paywall.tsx` (397 lines) — RevenueCat paywall, wired to
  `Rituel Pro` entitlement.

What is missing (this plan addresses):
- Onboarding → quiz handoff (currently goes straight to `/(tabs)`).
- Quiz summary AI CTA (currently summary just has "Save" button).
- Paywall trigger from quiz summary specifically.
- Profile summary card (currently the card just says "Mon profil de peau",
  no current values shown, no completion state).
- Pre-fill bug when re-opening quiz with existing data (observed during
  testing on 1 June 2026; DB value correct, UI shows empty).
- "Comprehensive" AI prompt — current `analyzeSkin` returns short output.

## Implementation order

Sequenced to stabilize bugs before building new flow on top.

### 1. Skin quiz pre-fill bug fix (NEXT)
- Slice scope: `app/profile/skin-quiz.tsx` pre-fill `useEffect` not
  populating state on re-open. DB write is correct; only display fails.
- Risk: A — display-only.
- Build-free. Hot reload testable.

### 2. Skin profile summary card on profile
- Slice scope: `app/(tabs)/auth.tsx` profile section. Replace the static
  "Mon profil de peau" card with a dynamic one that shows current
  `memory.skin_profile` values (or empty state if none) plus
  "Anketi güncelle" button.
- Risk: A/B — UI work, reads existing data.
- Build-free.

### 3. Quiz → AI CTA → paywall funnel
- Slice scope: `app/profile/skin-quiz.tsx` summary screen — add primary
  AI CTA + secondary "Daha sonra" link. CTA opens `/paywall`. Later
  link calls existing save + safeBack flow.
- Risk: B — new navigation, paywall integration.
- Build-free for the wiring; AI prompt depth (S4 a+b) needs quota,
  test post-1-June-quota-reset (already past).

### 4. Apple Sign-In (Slice 3, from existing plan)
- Slice scope: `expo-apple-authentication` native dep, Apple Developer
  Service ID, Supabase Apple provider, auth.tsx button + handler.
- Risk: C — native dep, App Review impact.
- Requires new EAS build. Earliest practical: any time after 1 Jun
  (quota now reset; one dev build already completed today).

### 5. Broader audit (UI/UX consistency, navigation, i18n parity)
- Slice scope: full app sweep for inconsistencies, missing
  empty/loading/error states, hardcoded strings, navigation pattern
  divergences.
- Risk: A/B per finding.

## Apple Sign-In sequencing note

Step 4 position is conditional:
- If App Store submission is the priority: Apple Sign-In moves to step 2
  (immediately after pre-fill fix) because Google is already visible in
  the auth UI and Guideline 4.8 blocks submission without Apple.
- If onboarding conversion optimization is the priority: funnel (steps 2-3)
  ships first, Apple follows.

Default: as ordered above (funnel first). Reassess after step 3.

## Non-goals

- No DB schema migration. `profiles.memory` JSONB is sufficient.
- No new tables. AI analysis results go into `memory.skin_analysis`.
- No removal of free path. "Daha sonra" must always exist as a fallback.
- No making the quiz mandatory (S1 = semi-required, not hard).
- No per-row inline editing of skin profile (deferred indefinitely).
