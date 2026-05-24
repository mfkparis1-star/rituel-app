# Phase 19D — i18n Deferred Cleanup (Work Log)

**Sprint type:** build-free · no native dep · no AI API call · no DB migration
**Branch push target:** `main:phase15-rebuild`
**Status:** 19D.1 + 19D.2a + 19D.4 + 19D.5 done; 19D.3 deferred (plural)

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

### 19D.3 — plural cleanup (DEFERRED)
- Target: community author-profile composite line `N publication(s) · M
  mention(s) J'aime` and home weekSummary `N check-in(s)`. FR/EN/TR plural
  rules differ; t() has no parametric/plural/interpolation support.
- Decision: DEFERRED. A proper fix needs a count-aware formatting helper or
  i18n interpolation/plural support; not a quick ternary patch. Exceeds the
  string/format cleanup boundary of Phase 19D.

### 19D.4 — community translate() direction (DONE)
- Was `translate(post.caption, 'en', 'fr')` — hardcoded wrong source (en) and
  fixed target (fr), meaningless for EN/TR users.
- Fix: `translate(post.caption, 'fr', lang)` — source = app FR-dominant
  content, target = active user lang. Added lang to CommunityScreen hook.
  No auto-detect (out of scope). If lang==='fr', translate util returns the
  original (sourceLang===targetLang short-circuit) — acceptable, behavior not
  expanded.

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

### 19D.5 — i18n QA/audit + lang-aware callsite fixes (DONE)
- Full cross-check before closing Phase 19 + 19D.
- Findings:
  - Hardcoded JSX FR string scan: CLEAN (no leaks).
  - Locale namespace parity fr/en/tr: CLEAN; TS LocaleDict enforces parity.
  - 9 `.fr` lang-aware util callsites still hardcoded -> fixed to `[lang]`:
    - makeup.tsx occasion labels (selfie + result headers, 2)
    - routine.tsx disclaimers (AI + cosmetic, 2; added lang to hook)
    - compatibility.tsx disclaimer (1)
    - skin-analysis.tsx disclaimers (4)
  - auth.tsx `formatDateFR(iso)` migrated to `formatDate(iso, currentLang)`.
  - Total: 10 user-facing callsites fixed (EN/TR users were seeing FR text).
- Still deferred (reported, not patched):
  - AI output hardcoded 'fr' in routine (optimizeRoutine) + makeup
    (generateMakeupLooks) — needs quota + output-quality testing.
  - Plural cleanup (community author alert, home weekSummary) — needs
    count-aware format helper / i18n interpolation.
  - skin_type display — needs normalizeSkinTypeValue (value-source mismatch).

## Commit ledger (this sprint)
- `b11ee8b` phase 19D.1a — relativeTime/formatDate helpers + common.time dict
- `9e29228` phase 19D.1b — migrate relativeTime callers to lang-aware util
- `58b35ab` phase 19D.2a — localize member/anonymous name fallbacks
- `c7eaebc` docs — update Phase 19D deferred (relativeTime/displayName done)
- `(this commit)` phase 19D.4 — fix community translate target language
- `1797653` phase 19D.4 — fix community translate target language
- `3307afd` phase 19D.5 — fix lang-aware util .fr callsite leaks (audit)
