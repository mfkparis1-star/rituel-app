-- Phase 16D D2 — post_saves table for community save/favorite action.
--
-- Mirror of post_likes (Phase 16D D1):
--   - per-user save list, immutable rows
--   - UNIQUE(user_id, post_id) — a user can only save a post once
--   - RLS: select own + insert own + delete own
--   - posts table untouched
--   - delete_user_data RPC updated to cascade post_saves

-- ---- 1. table -----------------------------------------------------------
create table if not exists public.post_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists post_saves_user_post_unique
  on public.post_saves (user_id, post_id);

create index if not exists post_saves_user_created_idx
  on public.post_saves (user_id, created_at desc);

-- ---- 2. RLS -------------------------------------------------------------
alter table public.post_saves enable row level security;

drop policy if exists "post_saves_select_own" on public.post_saves;
create policy "post_saves_select_own"
  on public.post_saves for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "post_saves_insert_own" on public.post_saves;
create policy "post_saves_insert_own"
  on public.post_saves for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "post_saves_delete_own" on public.post_saves;
create policy "post_saves_delete_own"
  on public.post_saves for delete to authenticated
  using (auth.uid() = user_id);

-- update intentionally not allowed (saves are atomic on/off)

-- ---- 3. delete_user_data RPC update — cascade post_saves ---------------
create or replace function public.delete_user_data(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.post_saves           where user_id = target_user_id;
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
