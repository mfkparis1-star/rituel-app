# Phase 19D — i18n Deferred Cleanup (Work Log)

**Sprint type:** build-free · no native dep · no AI API call · no DB migration
**Branch push target:** `main:phase15-rebuild`
**Status:** in progress (19D.1 + 19D.2a done; 19D.3 + 19D.4 pending)

## Goal
Close the intentional deferred items left by Phase 19 (i18n). String/format
helper cleanup only — no behavior drift beyond localization.

## Working method (every slice)
inspection-first → single-shot python3 heredoc patch → VERIFY + STILL +
`npx tsc --noEmit` (EXIT 0 required) → atomic commit (`-F -` heredoc) →
push. Commit/push only after explicit approval.

## Slices

### 19D.1 — date/time helpers (DONE)
- **19D.1a** `b11ee8b` — lang-aware helpers + dict.
  - `utils/format.ts`: import `{ Lang, t, localeToBcp47 }` from i18n; add
    `relativeTime(iso, lang)` and `formatDate(iso, lang)`.
  - `common.time` namespace (fr/en/tr): justNow, minutesAgo, hoursAgo,
    daysAgo — all with `{n}` placeholder.
  - Thresholds: `<60s` justNow / `<1h` min / `<24h` h / `<7d` days /
    `>=7d` locale short date via `localeToBcp47(lang)`.
  - `formatDateFR` kept for backward compat (auth.tsx still uses it).
- **19D.1b** `9e29228` — caller migration.
  - Removed 3 divergent local `relativeTime` copies (community, saved,
    product-discovery); import shared util; pass `lang` at call sites.
  - Fixed saved.tsx bug: local `relativeTime` accepted `justNowLabel` param
    but never used it (returned FR literal). Resolved by deletion.
  - Behavior note: `>=7d` now falls to locale short date for ALL three
    screens; saved + product-discovery previously had no upper bound.

### 19D.2a — member/anonymous name fallback (DONE)
- `58b35ab`
  - `community.memberFallback` + `community.anonymous` added (fr/en/tr).
  - community.tsx: `displayName(post)` → `displayName(post, memberLabel)`;
    call site passes `t('community.memberFallback')`. `handleAuthorPress`
    `'Anonyme'` literal → `t('community.anonymous')`.
  - product-discovery: `authorName` call sites (avatar + name) pass
    `t('productDiscovery.memberFallback')` (existing key reused, dict
    untouched). Default param `"Membre"` kept as safety net.

### 19D.3 — plural cleanup (PENDING — inspection)
- Target: community author-profile line `N publication(s) · M mention(s)`,
  likes label. FR/EN/TR plural rules differ (TR usually no plural suffix).
  Needs decision on i18n parametric/plural support vs `{n}` + singular/plural
  keys vs keep deferred.

### 19D.4 — community translate() direction (PENDING — inspection only)
- community PostCard `translate(post.caption, 'en', 'fr')` is reversed/
  hardcoded (source en, target fr). This is a behavior issue, not string
  extraction. Inspection only; ask before any behavior change.

## Deferred (carried forward — see PHASE_19_STATUS.md)
- **skin_type display localization** — value source inconsistent: AI analysis
  writes English canonical (dry/oily/combination/normal/sensitive); skin-quiz
  writes FR canonical (mixte/sèche/...). `getSkinTypeLabel(value, lang)` maps
  ONLY English keys → global wiring would silently fall back to raw FR on
  quiz-sourced values. Future cleanup (NO DB migration): (1)
  `normalizeSkinTypeValue(raw)` mapping English + FR legacy to one key;
  (2) extend/wrap getSkinTypeLabel; (3) wire callsites. skin-analysis screen
  already uses getSkinTypeLabel correctly (AI source).
- Dynamic AI output localization: `optimizeRoutine(...,'fr')`,
  `generateMakeupLooks(...,'fr')`, skin-analysis AI output — stay FR (needs
  quota + output-quality testing; out of build-free sprint scope).
- `formatDateFR` still used in auth.tsx (not migrated to `formatDate(iso, lang)`).

## Commit ledger (this sprint)
- `b11ee8b` phase 19D.1a — relativeTime/formatDate helpers + common.time dict
- `9e29228` phase 19D.1b — migrate relativeTime callers to lang-aware util
- `58b35ab` phase 19D.2a — localize member/anonymous name fallbacks
- `c7eaebc` docs — update Phase 19D deferred (relativeTime/displayName done)
