# Social Login — Active Plan (Google + Apple)

**Status:** ACTIVE / LAUNCH SCOPE (as of 31 May 2026, second decision).
**Target release:** v1.2.0 (current launch scope).
**Decision rule:** Apple Guideline 4.8 — if Google Sign-In is offered on
iOS, Apple Sign-In MUST also be offered. Google alone is forbidden.

## Decision history

### 31 May 2026 — first decision: DEFER to v1.3+
Reasons (preserved for reality-trail):
1. Codebase audit confirmed zero social login code in rituel_v2.
2. Email/password auth implemented and working; technically sufficient.
3. Apple Guideline 4.8 forces Google + Apple together — feature creep
   at launch time.
4. Apple Sign-In requires native dep (`expo-apple-authentication`),
   new EAS build, App Review risk.
5. Real launch blockers framed as: RevenueCat real-device test, device
   QA, App Store metadata + screenshots, production build, submission.

Commit: `def7dc8`.

### 31 May 2026 — second decision (this update): MOVE INTO LAUNCH SCOPE
Reasons:
- Goal is not fastest submit; goal is shipping Rituel as a finished
  premium consumer beauty app.
- Email/password works technically but social login is the consumer
  expectation for fast onboarding in this product category.
- Reducing signup friction is part of product quality, not feature creep.
- Apple Guideline 4.8 still binds: Google and Apple must ship together.

The first decision's reality check (audit, dependency state, external
config) remains valid and is the starting point for implementation.

## Reality check — current auth state (audit, 31 May 2026)

**Code:**
- `app/(tabs)/auth.tsx` (965 lines) — single screen for signIn + signUp +
  profile + premium. No social login UI, no OAuth handler.
- `supabase.auth.*` used in ~40 places (screens + hooks) — all rely on
  `getSession` / `onAuthStateChange`. A future OAuth flow would propagate
  through this surface automatically (low risk per-call, broad surface).
- No `hooks/useAuth*.ts`. Auth state lives directly via supabase listeners.
- `utils/authErrors.ts` localizes auth errors (FR/EN/TR) — already covers
  generic auth errors; would need extension for OAuth-specific cases.

**Config:**
- `app.json` scheme: `rituel`. Bundle: `com.mfkparis.rituel`. Android
  package: `com.mfkparis.rituel`. No `associatedDomains`, no Android
  `intentFilters`, no manual `CFBundleURLSchemes` — Expo derives these
  from `scheme`, sufficient for basic deep-link OAuth flow.

**Dependencies (package.json):**
- Installed: `expo-linking ~8.0.12`, `expo-web-browser ~15.0.11`.
- NOT installed: `expo-apple-authentication`, `expo-auth-session`,
  `@react-native-google-signin/google-signin`.

**External config (Supabase / Google Cloud) — verified 31 May 2026:**
- Supabase Auth -> Providers -> Google: **Enabled**, Client ID + Secret filled.
- Supabase Auth -> URL Configuration:
  - Site URL: `rituel://auth/callback`
  - Redirect URLs: `rituel://auth/callback`,
    `com.mfkparis.rituel://auth/callback`
- Google Cloud Console (project `rituel-492921`): one OAuth client exists,
  type **Web application** ("Rituel", created 10 Apr 2026). Authorized
  redirect URI: `https://nhosncnripenjgpmyhwr.supabase.co/auth/v1/callback`.
- **No iOS OAuth client, no Android OAuth client.** Web client alone is
  sufficient for Supabase-mediated web-flow OAuth, but native sign-in
  SDKs would need iOS/Android clients added.
- **Apple side: not yet configured.** Apple Developer Service ID, key,
  and Supabase Apple provider all need setup before Slice 3.

**Summary:** Google web-flow dashboard config is ready. Apple side needs
full configuration. Code side has zero implementation. Implementation
order is locale-first (build-free) -> Google handler (build-free) ->
Apple Sign-In (native dep, new build).

## Active implementation plan

Slices are ordered to push native-dep / build work as late as possible,
so locale and Google handler can land while EAS quota is unavailable.

### Slice 1 — Locale keys (FR/EN/TR)
- Add `auth.google.*`, `auth.apple.*`, `auth.alerts.oauth.*` to all
  three locales. Match Phase 19 conventions; FR canonical, TS LocaleDict
  parity enforced.
- Pure JS, no build. Risk class A.

### Slice 2 — Google OAuth handler + button
- `supabase.auth.signInWithOAuth({ provider: 'google', options: {
  redirectTo: Linking.createURL('auth/callback'),
  skipBrowserRedirect: true } })` followed by
  `WebBrowser.openAuthSessionAsync(...)`.
- New button in auth screen (signIn + signUp share the same OAuth path).
- Existing dependencies (`expo-linking`, `expo-web-browser`) sufficient.
- Pure JS, no build. Runs in current dev build if redirect config is
  correct; must still be verified on real device.
- Risk class B (auth surface, but no native dep).

### Slice 3 — Apple Sign-In (native dependency)
- Add `expo-apple-authentication`.
- iOS-only guard (`Platform.OS === 'ios'`).
- Apple Developer side: Service ID + key + Supabase Apple provider enable.
- New EAS build required. Earliest practical: after 1 Jun 2026 quota reset.
- Risk class C (native dep + App Review impact).

### Slice 4 — Redirect config + real-device QA checklist
- Re-confirm Supabase Site URL + Redirect URLs.
- Re-confirm Google Cloud Web Client redirect URI.
- Document Apple Service ID redirect URL.
- Build the QA matrix: Google new-user, Google existing-user, Apple
  new-user, Apple existing-user, session persistence across reload,
  sign-out, error states, language switch mid-flow, deep-link return
  on cold start.
- Risk class B (no new code, but validates the chain).

## Non-goals (still enforced)

- Do NOT commit Google Sign-In alone (Apple Guideline 4.8 violation
  if shipped without Apple). Slices 1+2 may land independently as
  build-free preparation, BUT Slice 2 must not produce a shipped binary
  without Slice 3 also implemented.
- Do NOT submit any build to App Store Review with social login until
  Apple Sign-In is implemented and tested on a real device.
- Do NOT remove the parked Supabase / Google Cloud external config.

## Open items before implementation

Before Slice 2 starts, re-inspect:
- `app/(tabs)/auth.tsx` button layout (where Google button goes relative
  to email/password form on both signIn and signUp views).
- `components/ui/PillButton` variants (does an "outline" or "secondary"
  variant exist for the Google button, or is a new variant needed?).
- Whether OAuth callback needs explicit handling in `onAuthStateChange`
  or whether Supabase auto-injects the session on deep link return.

## When to declare this plan obsolete

When all four slices are landed, Apple Service ID configured, full QA
matrix passed on real device, and v1.2.0 (or whichever version ships)
includes both providers visible in the auth UI.
