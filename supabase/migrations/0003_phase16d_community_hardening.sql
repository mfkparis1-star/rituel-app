-- Phase 16D Community V1 — RLS hardening + post_likes uniqueness
--
-- Context:
--   - posts table active, used by community.tsx feed
--   - post_likes table exists but had ALL-public policy (no ownership check)
--   - social_posts is legacy (Camille Rousseau marketing automation),
--     not used by Rituel app code; tighten its policy without dropping
--   - Apple compliance + privacy require row-level ownership enforcement
--
-- Changes:
--   1. Drop all permissive ALL-public policies on posts / post_likes
--   2. Replace with tight per-cmd policies (read public, write own only)
--   3. Tighten social_posts (legacy) to service_role only
--   4. UNIQUE(user_id, post_id) on post_likes (no double-likes)
--   5. delete_user_data RPC update: cascade posts + post_likes

-- ---- 1. POSTS — drop permissive policies ---------------------------------
drop policy if exists "posts_all" on public.posts;
drop policy if exists "posts_select" on public.posts;
drop policy if exists "posts_insert" on public.posts;
drop policy if exists "posts_update" on public.posts;
drop policy if exists "posts_delete" on public.posts;

-- ---- 2. POSTS — tight per-cmd policies -----------------------------------
alter table public.posts enable row level security;

create policy "posts_select_public"
  on public.posts for select
  to public
  using (true);

create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "posts_update_own"
  on public.posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---- 3. POST_LIKES — drop permissive ----------------------------------
drop policy if exists "likes_all" on public.post_likes;

-- ---- 4. POST_LIKES — uniqueness + tight policies -----------------------
-- Ensure no NULL user_id/post_id rows that would block the unique index
delete from public.post_likes where user_id is null or post_id is null;

-- One like per user per post
create unique index if not exists post_likes_user_post_unique
  on public.post_likes (user_id, post_id);

alter table public.post_likes enable row level security;

create policy "post_likes_select_public"
  on public.post_likes for select
  to public
  using (true);

create policy "post_likes_insert_own"
  on public.post_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "post_likes_delete_own"
  on public.post_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- update intentionally not allowed (likes are atomic on/off)

-- ---- 5. SOCIAL_POSTS — tighten legacy table ----------------------------
drop policy if exists "admin_all_posts" on public.social_posts;
alter table public.social_posts enable row level security;

create policy "social_posts_service_role_only"
  on public.social_posts for all
  to service_role
  using (true)
  with check (true);

-- ---- 6. delete_user_data RPC — cascade posts + post_likes --------------
create or replace function public.delete_user_data(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.post_likes           where user_id = target_user_id;
  delete from public.posts                where user_id = target_user_id;
  delete from public.skin_checkins        where user_id = target_user_id;
  delete from public.credit_transactions  where user_id = target_user_id;
  delete from public.user_credits         where user_id = target_user_id;
  delete from public.rate_limits          where user_id = target_user_id;
  delete from public.routine_steps        where user_id = target_user_id;
  delete from public.products             where user_id = target_user_id;
  delete from public.profiles             where id = target_user_id;
end;
$$;

revoke execute on function public.delete_user_data(uuid) from public;
revoke execute on function public.delete_user_data(uuid) from anon;
revoke execute on function public.delete_user_data(uuid) from authenticated;
grant execute on function public.delete_user_data(uuid) to service_role;
