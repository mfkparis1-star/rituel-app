-- Only a server that has verified the store transaction can grant credits.
-- Use separate SKUs so older builds cannot also grant the same purchase.
create table public.verified_credit_grants (
  environment text not null check (environment in ('production', 'sandbox')),
  store_transaction_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  product_id text not null,
  granted_at timestamptz not null default now(),
  primary key (environment, store_transaction_id)
);

alter table public.verified_credit_grants enable row level security;
revoke all on public.verified_credit_grants from public, anon, authenticated;

create function public.grant_verified_rituel_credits(
  purchaser uuid,
  purchase_environment text,
  store_id text,
  store_product text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  credit_amount integer;
begin
  credit_amount := case store_product
    when 'com.mfkparis.rituel.credits.1.v2' then 1
    when 'com.mfkparis.rituel.credits.5.v2' then 5
    when 'com.mfkparis.rituel.credits.15.v2' then 15
  end;

  if purchaser is null or credit_amount is null
      or purchase_environment is null or purchase_environment not in ('production', 'sandbox')
      or store_id is null or store_id !~ '^[0-9]{1,32}$' then
    raise exception 'Invalid verified credit purchase' using errcode = '22023';
  end if;

  insert into public.verified_credit_grants (environment, store_transaction_id, user_id, product_id)
    values (purchase_environment, store_id, purchaser, store_product)
    on conflict (environment, store_transaction_id) do nothing;

  if not found then
    if exists (
      select 1 from public.verified_credit_grants
      where environment = purchase_environment and store_transaction_id = store_id
        and user_id = purchaser and product_id = store_product
    ) then
      return false;
    end if;
    raise exception 'Credit purchase already claimed' using errcode = '23505';
  end if;

  insert into public.user_credits (user_id, balance)
    values (purchaser, credit_amount)
    on conflict (user_id) do update
    set balance = public.user_credits.balance + excluded.balance;

  insert into public.credit_transactions (user_id, amount, source, kind)
    values (purchaser, credit_amount, store_product, 'add');

  return true;
end;
$$;

revoke all on function public.grant_verified_rituel_credits(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.grant_verified_rituel_credits(uuid, text, text, text)
  to service_role;
