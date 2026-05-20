# Phase 19 — i18n Localization Status

**Status:** ✅ COMPLETE (all in-scope screens localized)
**Branch:** push target `main:phase15-rebuild`
**Last commit:** `44e6528` (phase 19.15 (12b) makeup)
**Build:** build-free sprint (no native deps added, no DB migration). Quota reset 1 June.
**TS:** `npx tsc --noEmit` → EXIT 0 on every slice.

## i18n infrastructure (installed, stable)
- `utils/i18n/index.ts`: `t(key, lang)`, `Lang='fr'|'en'|'tr'`, `DEFAULT_LANG='fr'`,
  `normalizeDeviceLocale()`, `localeToBcp47()`. Missing-key fallback: requested
  lang → FR fallback → returns key string (echo).
- `utils/i18n/locales/{fr,en,tr}.ts` — fr source of truth (`as const`),
  `LocaleDict = DeepWidenStrings<typeof fr>` (TS enforces EN/TR key parity).
- `hooks/useLanguage.ts` → `{ lang, t, setLanguage }`.
- Hidden DEV language switcher under auth.tsx profile (`__DEV__` only).

## Tab screens localized (9/9 string-bearing)
ai-studio · archive · auth · community · compatibility · index (home) ·
makeup · routine · skin-analysis
- `_layout.tsx`: navigator only, no UI strings — out of scope.

## Phase 19 slice history
- 19.1–19.12: foundation, onboarding, score, skin-quiz, check-in, glow-timeline,
  auth (signin/signup/profile/alerts), saved, archive, product-discovery,
  add-product, paywall, ai-studio, compatibility, home (10a/b/c), skin-analysis,
  post-create.
- 19.13 community — `3f0d198` (10a dict) / `6944503` (10b chrome) / `1b2ef05` (10c card+alerts)
- 19.14 routine — `ffcb362` (11a dict) / `f407cb8` (11b screen)
- 19.15 makeup — `f9e12b2` (12a dict) / `44e6528` (12b screen)

## Localization strategy (no-migration)
- DB canonical values (emotion, category, skin_type, occasion id, slot) stay FR;
  only display labels translated via `t()`.
- emotion display: `post.emotion` raw FR reused through `postNew.emotions.*` keys.
  Safe wrapper — canonical 6 → localized; unknown/legacy value → raw (never leaks key).
- Lang-aware utils passed `[lang]` at call site, never modified:
  `MAKEUP_OCCASIONS.labels[lang]`, `AI_DISCLAIMER[lang]`, `COSMETIC_DISCLAIMER[lang]`.

## Guardrails honored (every slice)
- String extraction only — no state/navigation/layout/visual-hierarchy change.
- Behavior preserved — no API/RPC/Supabase/handler logic change.
- No DB migration, no native dependency added.
- Tone: FR "tu" (vous only legal), TR "sen", EN warm/present-tense.
- Atomic commit per slice; TS clean (EXIT 0) required before commit; push after.

## Deferred (not done — intentional)
- Dynamic AI-generated output localization: `optimizeRoutine(...,'fr')`,
  `generateMakeupLooks(...,'fr')`, skin-analysis AI output — all stay FR for now.
- `relativeTime()` (community): "à l'instant"/"il y a … min/h/j" FR default.
- `displayName()` fallback ('Membre'/'Anonyme') FR default.
- Community author-profile plural line (`N publication(s) · M mention(s)`):
  pluralization/format work.
- `Peau ${post.skin_type}` raw value (community) and skin_type raw FR generally.
- `formatDateFR` not locale-aware; `weekSummary`.
- `translate()` call direction in community PostCard (en→fr hardcoded):
  behavior preserved, separate fix.
