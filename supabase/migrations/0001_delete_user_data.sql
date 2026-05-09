-- Migration: delete_user_data RPC function
-- Purpose: Cascade-delete all rows in public schema belonging to a given user.
-- Called by: supabase/functions/delete-user Edge Function (server-side only).
-- Security: SECURITY DEFINER means function runs with the creator's privileges,
--           bypassing RLS so it can delete from any of the listed tables.
--           The Edge Function is responsible for authenticating the caller and
--           passing the correct user_id (extracted from a verified JWT, never
--           from client-provided params).
--
-- Tables in scope (have user_id and contain personal data):
--   credit_transactions
--   user_credits
--   rate_limits
--   routine_steps
--   posts
--   products
--   profiles  (uses 'id' as FK to auth.users.id, not 'user_id')
--
-- Tables NOT touched (no user_id / shared):
--   affiliate_products  (public catalog)
--   translations        (shared cache)

create or replace function public.delete_user_data(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.credit_transactions where user_id = target_user_id;
  delete from public.user_credits        where user_id = target_user_id;
  delete from public.rate_limits         where user_id = target_user_id;
  delete from public.routine_steps       where user_id = target_user_id;
  delete from public.posts               where user_id = target_user_id;
  delete from public.products            where user_id = target_user_id;
  -- profiles uses 'id' (FK to auth.users.id), not 'user_id'
  delete from public.profiles            where id = target_user_id;
end;
$$;

-- Lock down execution: only service_role (used by our Edge Function) may call.
-- Client-side roles (anon, authenticated) cannot invoke this RPC directly,
-- preventing accidental or malicious mass-deletion via the public API.
revoke execute on function public.delete_user_data(uuid) from public;
revoke execute on function public.delete_user_data(uuid) from anon;
revoke execute on function public.delete_user_data(uuid) from authenticated;

grant execute on function public.delete_user_data(uuid) to service_role;
