-- Phase 16E E1 — harden skin_checkins RLS to authenticated role.
--
-- Existing policies (migration 0002) had `to public` which technically
-- works because the auth.uid() = user_id expression returns false for
-- anonymous requests, but defense-in-depth requires the role to be
-- restricted to authenticated. Same hardening pattern applied to
-- posts / post_likes in migration 0003.
--
-- Behavior change: NONE. Anonymous requests already failed the row
-- check; this commit just makes the role boundary explicit.
--
-- Update policy intentionally NOT added: a check-in is an immutable
-- diary snapshot. Editing past entries would erode timeline
-- trustworthiness. The supported correction flow is delete + new
-- check-in.

drop policy if exists "skin_checkins_select_own" on public.skin_checkins;
create policy "skin_checkins_select_own"
  on public.skin_checkins for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "skin_checkins_insert_own" on public.skin_checkins;
create policy "skin_checkins_insert_own"
  on public.skin_checkins for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "skin_checkins_delete_own" on public.skin_checkins;
create policy "skin_checkins_delete_own"
  on public.skin_checkins for delete
  to authenticated
  using (auth.uid() = user_id);
