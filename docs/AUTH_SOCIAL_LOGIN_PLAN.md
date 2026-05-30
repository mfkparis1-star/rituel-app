# Social Login — Deferred Plan (Google + Apple)

**Status:** DEFERRED to post-launch (v1.3+). No code in repo. No build planned.
**Date of this plan:** 31 May 2026.
**Decision rule:** Apple Guideline 4.8 — if Google Sign-In is offered on
iOS, Apple Sign-In MUST also be offered. Therefore Google cannot ship alone.

## Why deferred
1. Codebase inspection (31 May 2026): social login is **zero code**. No
   `signInWithOAuth`, no `WebBrowser.openAuth`, no `expo-apple-authentication`,
   no provider keys in locales, no `.bak` traces. Auth.tsx git history shows
   only i18n + UI commits — social login was never added in rituel_v2.
2. Email/password auth is implemented and works (`signInWithPassword`,
   `signUp`, `resetPasswordForEmail`, `signOut`). Sufficient for launch.
3. Adding Google alone would trigger Apple Sign-In requirement (Apple
   Guideline 4.8) -> native dependency (`expo-apple-authentication`) -> new
   EAS build -> App Review risk -> feature creep at the worst time.
4. Real launch blockers right now: RevenueCat real-device test, device QA,
   App Store metadata + screenshots, production build, submission.

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

**Summary:** dashboard side is ready for a web-flow Google OAuth. Code
side has zero implementation. Apple Sign-In needs both native dep and
its own provider setup (Apple Developer Service ID, key, Supabase).

## Future implementation plan (v1.3+)

Order is intentional — locale + UI first (build-free), native dep last.

1. **Locale keys** (FR/EN/TR) — `auth.google.*`, `auth.apple.*`,
   `auth.alerts.oauth.*`. Pure JS, no build.
2. **Google OAuth handler + button** — `signInWithOAuth({ provider:
   'google', options: { redirectTo: Linking.createURL('auth/callback'),
   skipBrowserRedirect: true } })` + `WebBrowser.openAuthSessionAsync`.
   Pure JS, no build. Uses existing deps. May run in current dev build if
   redirect config is correct; must be verified on real device.
3. **Apple Sign-In** — add `expo-apple-authentication`, iOS-only guard
   (`Platform.OS === 'ios'`), Apple Service ID + key in Apple Developer,
   Supabase Apple provider enable. **Requires new EAS build.**
4. **Supabase redirect verification** — confirm Site URL + Redirect URLs
   list still includes both `rituel://auth/callback` and
   `com.mfkparis.rituel://auth/callback`. (Currently configured, may need
   re-check before shipping.)
5. **Real-device QA** — both providers, both flows (new user / existing
   user), session persistence, sign-out, error states, language switch.
6. **App Review compliance check** — Apple Guideline 4.8 satisfied
   (Apple Sign-In offered with Google), privacy nutrition labels updated
   (auth data collection), App Privacy questions answered.

## Non-goals (explicit)

- Do NOT add any social login code before launch.
- Do NOT commit Google Sign-In alone (Guideline 4.8 violation if shipped).
- Do NOT submit social login without Apple Sign-In implemented.
- Do NOT remove the Supabase / Google Cloud external config — it stays
  parked and ready, costs nothing.

## When to revisit

After v1.2.0 ships and stabilizes. Earliest practical window: post-launch
sprint with EAS quota available and Phase 16/17 stabilized.
