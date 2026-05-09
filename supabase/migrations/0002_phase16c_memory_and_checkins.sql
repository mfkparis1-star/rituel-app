-- Phase 16C migration: memory primitives + daily skin check-ins
--
-- 1) profiles.memory (JSONB) — flexible per-user memory primitives:
--    last_analysis_summary, routine_preference, archive_signals,
--    concerns_extracted, etc. Schema kept in app code (utils/memory.ts),
--    DB stores free-form JSON. Allows fast iteration without migrations.
--
-- 2) public.skin_checkins — time-series table for daily 5-emoji check-ins.
--    Powers Adaptive Home signals, retention loop, future Glow Timeline.
--    Per-user RLS (user reads/inserts own rows only).
--
-- 3) delete_user_data RPC updated to cascade-delete from skin_checkins
--    so account deletion (Apple Guideline 5.1.1(v)) remains complete.
--
-- Storage bucket 'avatars' is deployed separately (not in this migration).
-- profiles.is_premium drop is deferred (separate audit + commit).

-- ---- 1. profiles.memory ----------------------------------------------------
alter table public.profiles
  add column if not exists memory jsonb not null default '{}'::jsonb;

-- ---- 2. skin_checkins ------------------------------------------------------
create table if not exists public.skin_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists skin_checkins_user_created_idx
  on public.skin_checkins (user_id, created_at desc);

alter table public.skin_checkins enable row level security;

drop policy if exists "skin_checkins_select_own" on public.skin_checkins;
create policy "skin_checkins_select_own"
  on public.skin_checkins for select
  using (auth.uid() = user_id);

drop policy if exists "skin_checkins_insert_own" on public.skin_checkins;
create policy "skin_checkins_insert_own"
  on public.skin_checkins for insert
  with check (auth.uid() = user_id);

drop policy if exists "skin_checkins_delete_own" on public.skin_checkins;
create policy "skin_checkins_delete_own"
  on public.skin_checkins for delete
  using (auth.uid() = user_id);

-- update is intentionally not allowed: a check-in is an immutable snapshot.

-- ---- 3. update delete_user_data RPC ---------------------------------------
-- Adds skin_checkins to the cascade. profiles.memory is dropped automatically
-- when the profile row is deleted.

create or replace function public.delete_user_data(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.skin_checkins        where user_id = target_user_id;
  delete from public.credit_transactions  where user_id = target_user_id;
  delete from public.user_credits         where user_id = target_user_id;
  delete from public.rate_limits          where user_id = target_user_id;
  delete from public.routine_steps        where user_id = target_user_id;
  delete from public.posts                where user_id = target_user_id;
  delete from public.products             where user_id = target_user_id;
  delete from public.profiles             where id = target_user_id;
end;
$$;

revoke execute on function public.delete_user_data(uuid) from public;
revoke execute on function public.delete_user_data(uuid) from anon;
revoke execute on function public.delete_user_data(uuid) from authenticated;
grant execute on function public.delete_user_data(uuid) to service_role;
