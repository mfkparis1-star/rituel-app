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
- ~~`relativeTime()` FR default~~ -> DONE (19D.1): consolidated into lang-aware utils/format.ts relativeTime(iso, lang) via common.time.* keys; 3 local copies removed; >=7d threshold standardized to locale short date.
- ~~`displayName()` member/anonymous fallback FR default~~ -> DONE (19D.2a): community.memberFallback/anonymous + productDiscovery.memberFallback wired through t() at call sites.
- Community author-profile plural line (`N publication(s) · M mention(s)`):
  pluralization/format work.
- skin_type display localization -- DEFERRED (needs value-source normalization). Raw skin_type rendered in: community author alert (Peau {skin_type}), post/new chip, home about value, auth profile, glow-timeline. Lang-aware helper getSkinTypeLabel(value, lang) exists in utils/skinAnalysis.ts but maps ONLY English canonical keys (dry/oily/combination/normal/sensitive). Value source inconsistent: AI analysis writes English canonical; skin-quiz writes FR canonical (mixte/seche/...). Global wiring now would silently fall back to raw FR on quiz-sourced values. Required future cleanup (NO DB migration): (1) normalizeSkinTypeValue(raw) mapping both English canonical AND FR legacy to one key; (2) extend/wrap getSkinTypeLabel to consume normalized keys; (3) then wire all raw callsites safely. (skin-analysis screen already uses getSkinTypeLabel correctly.)
- `formatDateFR` not locale-aware; `weekSummary`.
- `translate()` call direction in community PostCard (en→fr hardcoded):
  behavior preserved, separate fix.
