# Launch Readiness Checklist — Rituel 1.3.0

Last updated: 2026-05-11

## Phase 16C (M1-M6) — ✓ COMPLETE
- [x] M1 Profile identity + avatar bucket + M1.1 Settings shortcut
- [x] M2 profiles.memory + useMemory hook
- [x] M3 AI history in memory
- [x] M4 Adaptive home + M4.1 polish
- [x] M5 Daily check-in + skin_checkins table
- [x] M6 Product detail + edit

## Phase 16D (D1-D6) — ✓ COMPLETE
- [x] D1 Community V1 (posts + image + likes + FAB)
- [x] D1.1 Pull-to-refresh + focus-refresh + invalidate flag
- [x] D2 Save/favorite (post_saves table + Mes favoris screen)
- [x] D3 Glow Timeline
- [x] D4 Rituel Score
- [x] D6 Discovery filters (Pour toi / Récents + author tap)
- [ ] D5 Viral cards — moved to E2 + E3 (shipped)

## Phase 16E (E1-E5) — ✓ COMPLETE
- [x] E1 Skin checkins RLS hardening + journal entry delete
- [x] E1.1 Community post edit and delete
- [x] E1.2 Timeline post edit and delete
- [x] E2 Shareable compatibility card (view-shot + sharing)
- [x] E3 Luxury routine share card
- [x] E4 App Store screenshot and story plan (docs/APP_STORE_SCREENSHOT_PLAN.md)
- [x] E5 This checklist updated

## Production smoke tests — ✓ PASS on preview bf96d78f
- [x] App opens without crash
- [x] Home tab renders adaptive content
- [x] Check-in submission works
- [x] AI Studio screens load
- [x] Compatibility check returns result
- [x] Compatibility share button visible and shares via iOS sheet
- [x] Routine tab opens (was crashing before fix)
- [x] Routine matin/soir switch works
- [x] Routine share button visible and shares via iOS sheet
- [x] Community feed loads and shows posts
- [x] Like + save on community post
- [x] Author tap shows Alert with stats
- [x] Create post (image + caption) works
- [x] Glow Timeline renders check-ins + analysis milestone + own posts
- [x] Long-press to delete check-in works
- [x] Long-press to edit/delete own timeline post works
- [x] Community post edit (caption) via "···" menu works
- [x] Community post delete via "···" menu works
- [x] Saved screen shows bookmarked posts
- [x] Rituel Score screen renders big number + 5-signal breakdown
- [x] Profile avatar upload
- [x] Sign out + sign in flow
- [x] Account deletion full cascade (Apple Guideline 5.1.1(v))

## Database migrations applied to production
- [x] 0001 delete_user_data RPC initial
- [x] 0002 profiles.memory + skin_checkins + RLS
- [x] 0003 posts/post_likes hardening + UNIQUE + delete_user_data cascade
- [x] 0004 post-images storage bucket + 4 policies
- [x] 0005 post_saves table + UNIQUE + RLS + cascade
- [x] 0006 skin_checkins RLS to authenticated role

## Storage buckets
- [x] avatars (public read, 2 MB, jpeg/png/webp, RLS folder-bound)
- [x] post-images (public read, 5 MB, jpeg/png/webp, RLS folder-bound)

## Edge Functions
- [x] claude-proxy (AI requests routed via Supabase Edge Function, never EXPO_PUBLIC_ANTHROPIC_API_KEY)
- [x] delete-user (Apple Guideline 5.1.1(v) cascade)

## RevenueCat
- [x] 5 products configured (3 premium + 2 credit packs)
- [x] Apple In-App Purchase agreement signed
- [x] iOS SDK key in EAS env (preview + production)
- [x] Restore purchases tested
- [x] Manage subscription deep-link works

## Final build sequence
- [ ] Version bump 1.2.0 → 1.3.0 in app.json
- [ ] Production EAS build (autoIncrement build number)
- [ ] Binary uploaded to App Store Connect
- [ ] All 8 screenshots prepared per APP_STORE_SCREENSHOT_PLAN.md
- [ ] App Store Connect metadata updated:
  - [ ] Subtitle
  - [ ] Promotional Text
  - [ ] Description (1.3.0 paragraphs added)
  - [ ] Release Notes
  - [ ] Screenshots uploaded for 6.7" and 6.5"
- [ ] Submit for Review

## Post-launch
- [ ] Monitor TestFlight crash reports for 24h after release
- [ ] Watch App Store rejection reasons (if any) in 1-3 day review window
- [ ] EN + TR localization of metadata (after FR launch validated)
- [ ] EN + TR screenshots
- [ ] Google Play store launch (identity verified, build separate)

## Strategic notes
- D5 viral cards were initially deferred from Phase 16D, then shipped as E2 + E3 in Phase 16E. The viral share surface is now in 1.3.0.
- E2/E3 had a runtime crash on launch due to slot type mismatch in RoutineShareCard. Fixed in commit c86d6c1 with defensive fallback, lazy mount, and simpler share path.
- Moderation (report/block/hide), comment threads, push notifications, and Realtime subscriptions remain deferred. No commit on these until post-launch user feedback justifies them.
