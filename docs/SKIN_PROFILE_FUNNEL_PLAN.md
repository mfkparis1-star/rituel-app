# Skin Profile Funnel — Product Plan

**Status:** IN PROGRESS — Slices 2, 3a, 3b.1, 3b.2 shipped (4 Jun 2026).
**Date authored:** 1 June 2026. **Last updated:** 4 June 2026.

## Implementation status

What has shipped (in order, commits on `phase15-rebuild`):

- ~~**Slice 1 — Quiz pre-fill bug fix**~~ — **CANCELLED 4 Jun 2026.**
  Diagnostic logging on device confirmed pre-fill works correctly:
  `useMemory` loads `memory.skin_profile`, `useEffect` fires, `setAnswers`
  is called with the full saved object, and the render code reads
  `answers[current.id]` correctly. The user's earlier perception of
  "data lost" was actually the absence of the profile summary card —
  resolved by Slice 2.

- **Slice 2 — Dynamic profile summary card** — commit `92152b5`.
  Profile section card now reads `memory.skin_profile` via `useMemory`,
  shows 3-line summary (skin_type / sensitivity / goal) when filled,
  stronger empty-state CTA copy in FR/EN/TR. Value labels reuse the
  existing `skinQuiz.q.{id}.choices.{val}` translations. 3 new styles
  on `auth.tsx`. On-device verified.

- **Slice 3a — Quiz summary AI CTA** — commit `a509292`.
  Primary CTA "Analyse complète avec l'IA" / "Full AI analysis" /
  "Kapsamlı AI analizi" added above the Save button in quiz summary.
  Tapping persists answers to `memory.skin_profile`, fires
  `skin_quiz_ai_cta_tapped`, navigates to `/paywall?source=skin_quiz_ai`.
  Save and Later behaviors preserved. On-device verified.

- **Slice 3b.1 — AI analysis infrastructure + result screen** — commit
  `e44d28e`. New `utils/skinProfileAnalysis.ts` with
  `analyzeSkinFromQuiz()` (text-only, no photo, 5-parameter output).
  New `'skin_profile_analysis'` endpoint on the AI proxy. New
  `SkinProfileAnalysis` type on `Memory` (`memory.skin_profile_analysis`).
  New route `app/profile/skin-analysis-result.tsx` with loading,
  result, error, empty states, 7-day cache, manual refresh.
  Locale subtree `skinProfileAnalysis.*` in FR/EN/TR.

- **Slice 3b.2 — Paywall + quiz CTA wiring** — commit `8d74b3f`.
  `app/paywall.tsx` reads `useLocalSearchParams<{ source?: string }>()`;
  on `purchase_success` with `source === 'skin_quiz_ai'`, redirects via
  `router.replace('/profile/skin-analysis-result')` instead of
  `safeBack('/(tabs)/auth')`. Default behavior preserved for callers
  without `source`. `skin-quiz.tsx` `handleAiAnalysis` now uses
  `usePremium()`: premium users skip paywall and go directly to the
  result screen; free users hit paywall as before. On-device verified
  (premium path: quiz → CTA → loading → 5-parameter analysis →
  cache → reopen instant).
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

### 1. ~~Skin quiz pre-fill bug fix~~ — CANCELLED 4 Jun 2026
Diagnostic showed pre-fill already works correctly. The perceived
data loss was the absence of a profile summary card (resolved by
Slice 2). No code change needed for the quiz itself.

### 2. ✅ Skin profile summary card on profile — SHIPPED (`92152b5`)
Profile card replaced with dynamic summary reading
`memory.skin_profile`. Empty-state uses stronger CTA copy.
Localized FR/EN/TR. On-device verified.

### 3a. ✅ Quiz summary AI CTA — SHIPPED (`a509292`)
Primary AI CTA above Save in the quiz summary. Tap saves answers,
fires analytics, opens `/paywall?source=skin_quiz_ai`.

### 3b.1. ✅ AI analysis infrastructure + result screen — SHIPPED
(`e44d28e`). `utils/skinProfileAnalysis.ts`, new endpoint, new
`Memory.skin_profile_analysis`, `app/profile/skin-analysis-result.tsx`
with full state machine + 7-day cache.

### 3b.2. ✅ Paywall + quiz CTA wiring — SHIPPED (`8d74b3f`)
Paywall reads `source` param and routes purchase_success to result
screen when `source === 'skin_quiz_ai'`. Quiz CTA branches on
`usePremium()`: premium → result directly, free → paywall.

### 4. Apple Sign-In (Slice 3 from auth plan) — NEXT
- Slice scope: `expo-apple-authentication` native dep, Apple Developer
  Service ID + key, Supabase Apple provider, `auth.tsx` button + handler
  next to the existing Google button (locale keys already shipped in
  Slice 1 of auth — `auth.apple.button`).
- Risk: C — native dep, App Review impact, blocks Guideline 4.8.
- Requires new EAS build. Quota reset on 1 Jun; one dev build was
  completed 4 Jun. Earliest practical: next session.
- HARD GATE: do not submit to App Store Review until Apple Sign-In
  ships alongside the visible Google button (Apple Guideline 4.8).

### 5. Broader audit (UI/UX consistency, navigation, i18n parity)
- Slice scope: full app sweep for inconsistencies, missing
  empty/loading/error states, hardcoded strings, navigation pattern
  divergences.
- Risk: A/B per finding.

## Deferred follow-up slices (post-MVP funnel)

Documented but not scheduled. Pick up after Apple Sign-In + audit.

- **Slice 3b.3 — Profile card "Ton analyse personnalisée" row.**
  When `memory.skin_profile_analysis` is present, add a row under
  the skin profile card linking to `/profile/skin-analysis-result`.
  Shows last-updated date. Re-entry path for users who closed the
  result screen and want to revisit.

- **Slice 3c — Visual report layer (S4 part c).**
  Numeric scores per parameter, simple chart/bar visualization,
  before/after framing where applicable. Heavier lift, premium
  polish layer, not required for funnel function.

- **Slice 3d — Paywall copy customization for `source=skin_quiz_ai`.**
  When the paywall is opened from the quiz CTA, swap the hero label/
  title/subtitle for analysis-specific copy that mirrors the just-
  completed quiz context ("Tu as partagé X. Maintenant l'IA peut
  l'interpréter."). Conversion uplift hypothesis.

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
