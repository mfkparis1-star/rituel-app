# Phase 16A — App Store Launch Eligibility Checklist

This document is the pre-submit checklist for Rituel iOS app builds going to App Store Connect. Run through every section below before tagging a build for review. Anything that fails goes back to development as a `phase 16a:` follow-up commit; do not submit a build with unresolved items.

Last updated: May 2026
Phase 16A baseline: commits `2286fe9` through `c021f23` (12 commits)

---

## 1. Automated checks

Run from repo root before every submit.

```bash
cd /Users/ceresparis/rituel_v2

# typescript: must be 100% clean
npx tsc --noEmit

# legal URLs must return HTTP 200
curl -s -o /dev/null -w "terms:   %{http_code}\n" "https://rituel.beauty/terms?v=$(date +%s)"
curl -s -o /dev/null -w "privacy: %{http_code}\n" "https://rituel.beauty/privacy?v=$(date +%s)"

# placeholders must be zero in active screens
grep -rn "Bient\u00f4t" app/ components/ | grep -v ".disabled" | grep -v "node_modules"
```

Expected:
- TS check: empty output
- terms: 200
- privacy: 200
- Bient\u00f4t grep: empty (or only inside `_*.disabled` archived files)

---

## 2. Backend deployment status

Verify before every build that the production database has the deletion RPC and the Edge Function is deployed.

### Supabase SQL function

Open Supabase Dashboard > SQL Editor, run:

```sql
select proname, pronargs, prosecdef
from pg_proc
where proname = 'delete_user_data';
```

Expected: 1 row, `prosecdef = true`.

### Edge Function

```bash
curl -i -X POST 'https://nhosncnripenjgpmyhwr.supabase.co/functions/v1/delete-user' \
  -H 'Content-Type: application/json' \
  -d '{}' 2>&1 | head -3
```

Expected: `HTTP/2 401` (gateway rejects missing auth header). A 404 means the function is not deployed.

---

## 3. Manual smoke tests (real device or Expo Go)

These cannot be automated. Run all four flows on a real device and confirm each step. Test against the production Supabase project (no separate staging).

### 3.1 Archive CRUD

1. Sign in with a test account
2. Add a product via manual form (name, brand, category)
3. Open the product, edit one field, save
4. Pull-to-refresh on archive screen
5. Tap the X on a product, confirm deletion in Alert
6. Verify the product disappears from the list

Pass criteria: each step works without crash; the deleted product does not reappear after a pull-to-refresh or app restart.

### 3.2 Makeup AI full flow

1. Open AI Studio > Maquillage
2. Select an event from the chips
3. Tap the hero CTA (Continuer)
4. Choose camera or gallery, supply a face photo
5. Wait for AI result; confirm the disclaimer text appears at the bottom
6. Verify the result references the chosen event

Pass criteria: AI returns a coherent suggestion; the FR + cosmetic disclaimer is visible; no crash on long-press, swipe-back, or app backgrounding mid-call.

### 3.3 Routine AI Optimize

1. Open AI Studio > Routine > Optimiser
2. Confirm the modal opens with a placeholder routine
3. Tap Optimiser
4. Wait for AI result; confirm the disclaimer text appears at the bottom

Pass criteria: AI returns a structured routine; disclaimer is visible; back navigation returns to AI Studio (not to a stale tab).

### 3.4 Account deletion end-to-end

WARNING: this destroys a real user. Use a throwaway account, never your primary login.

1. Create a fresh test account (signup, accept legal acknowledgment via taps on Conditions and Politique links to verify they open in browser)
2. Add at least one product, one routine step, and trigger one AI flow (so there is data to delete)
3. Profile > Supprimer mon compte
4. Confirm the first Alert (info + warning), then the second Alert (final confirm)
5. Wait for the success Alert
6. Verify the app returns to signin mode and the credit balance / archive are reset
7. Try to sign in with the same email + password: must fail with `invalid_credentials`
8. In Supabase Dashboard > Authentication > Users: the test user should be gone
9. In Supabase Dashboard > Table Editor > profiles: no row with that user_id

Pass criteria: every step succeeds; the user is fully removed from auth.users and from public schema tables.

---

## 4. App Store Connect metadata

Manual checks in App Store Connect before promoting the build to review.

- App Privacy section: URL points to `https://rituel.beauty/privacy`
- App Information > Privacy Policy URL: `https://rituel.beauty/privacy`
- App Information > License Agreement: default Apple EULA OR custom URL `https://rituel.beauty/terms` (set whichever is preferred; if custom, the URL must already be live)
- Subscription Group: `Rituel Premium` exists with monthly + yearly products
- In-App Purchase items: 5 products approved (`credits.1`, `credits.5`, `credits.15`, `premium.monthly`, `premium.yearly`)
- App Review Information: explain the AI flow + the throwaway test credentials in the notes field
- Sandbox tester account: created and active

---

## 5. Things explicitly NOT in Phase 16A scope

The following are deferred to Phase 16+ and are NOT blockers for this submit. Do not let scope creep delay the launch.

- Memory engine (`profiles.memory` JSONB)
- Adaptive home (3 time horizons)
- Daily check-in (5 emoji)
- Rituel Score / Glow Timeline
- Community V1 (post create, like, save, report/block)
- Viral layer (Ingredient Compat Card, Luxury Routine Cards)
- Pricing repositioning
- Edge Function admin API hardening
- Privacy contact email rituel.app vs rituel.beauty consistency
- Privacy article 9 "16+" age check vs App Store rating consistency

---

## 6. Build + submit sequence

Once all sections above are green:

```bash
# 1. Tag the commit (optional but recommended)
git tag -a v1.1.4-phase16a -m "Phase 16A complete - launch eligibility"

# 2. Build with EAS production profile
cd /Users/ceresparis/rituel_v2
eas build --platform ios --profile production

# 3. Wait for build to finish (~20-30 min cloud build)
# 4. Submit
eas submit --platform ios --latest

# 5. In App Store Connect: promote the new build to In Review
```

After submit, watch the App Review queue (typical wait: 24-48 hours). If rejected, capture the rejection reason verbatim and create a `phase 16a.X:` follow-up commit.
