# Phase 15 — RevenueCat Setup Checklist

**Code status:** ~done (all files exist & wired). Blockers are dashboard
config + EAS build, NOT code. See "Code state" below.

> CRITICAL: the entitlement identifier is exactly **`Rituel Pro`** (with a
> space). The code reads `customerInfo.entitlements.active['Rituel Pro']`
> (utils/purchases.ts ENTITLEMENT_ID). If the dashboard entitlement is named
> anything else (e.g. "premium"), `hasActivePremium()` always returns false
> and NO user is ever recognized as premium. Do not rename in code.

## Code state (preflight verified)
- `utils/purchases.ts` (168) — configurePurchases (idempotent via module
  `configured` flag + logIn on user change), getOfferings, purchaseProduct,
  restorePurchases, getCustomerInfo, hasActivePremium, pending-grant helpers.
  ENTITLEMENT_ID = 'Rituel Pro'. iOS-only guard + appl_ key validation.
- `hooks/usePremium.ts` (109) — configure on mount (Supabase uid), customerInfo
  listener, isPremium, restore. No profiles.is_premium, no webhook.
- `hooks/useAIUnlock.ts` (105) — per-result unlock + isPremium.
- `app/paywall.tsx` (397), `components/credits/{CreditPackModal,LockedAICard}.tsx`,
  `components/paywall/PaywallModal.tsx` — present & wired.
- Gating live in makeup ('makeup_full'), routine ('routine_optimize'),
  skin-analysis ('skin_analysis'); index uses usePremium for quota.
- Restore present (auth.tsx + paywall.tsx). Configure init lives in usePremium
  (no separate _layout init — fine in practice, Home mounts usePremium).

## 1. App Store Connect — products (5)
- `com.mfkparis.rituel.credits.1`  — consumable
- `com.mfkparis.rituel.credits.5`  — consumable
- `com.mfkparis.rituel.credits.15` — consumable
- `com.mfkparis.rituel.premium.monthly` — auto-renewable subscription
- `com.mfkparis.rituel.premium.yearly`  — auto-renewable subscription
- Generate an App-Specific Shared Secret (for RevenueCat).

## 2. RevenueCat dashboard
- Create project, add iOS app (bundle `com.mfkparis.rituel`).
- Import the 5 products above.
- Create entitlement **`Rituel Pro`** (exact). Attach BOTH subscriptions
  (monthly + yearly) to it. (Consumable credits are NOT attached to the
  entitlement — they top up the credits balance, separate flow.)
- Create offering **`default`**, mark as current, add the 5 packages.
- Paste the App Store Shared Secret into RevenueCat.
- Copy the iOS Public SDK Key (starts `appl_`).

## 3. Local env
- Add to `.env` (gitignored, never commit, never paste in chat):
  `EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...`

## 4. App Store Connect — sandbox
- Create a Sandbox tester account (Users & Access > Sandbox).

## 5. Build (leaves build-free sprint)
- `react-native-purchases ^10.0.1` is a native module → requires a dev build.
- `eas build --profile development --platform ios` (~30 min cloud).
- Install on device, sign in with sandbox tester.

## 6. Test flow (sandbox)
- App launch → configure runs (check no "instance already set" warning).
- Paywall: offerings load, packages show correct localized prices.
- Purchase monthly → isPremium becomes true → AI screens unlock.
- Force-quit, relaunch → still premium (customerInfo persists).
- Restore purchases (auth profile) → premium restored on a clean install.
- Buy a credits pack → balance increments (credits ≠ entitlement).
- Verify a non-premium account sees LockedAICard on result 2+ (makeup) and
  routine optimize gate.

## Notes
- Manage-subscription deep link not implemented (restore exists). App Review
  may ask for it; consider adding later.
- AI output language still hardcoded 'fr' in routine/makeup (separate deferred,
  not a RevenueCat item).
