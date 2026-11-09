-- The app can check its own purchase without reading the grant ledger.
create function public.verified_rituel_credit_delivered(
  purchase_environment text,
  store_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.verified_credit_grants as grants
    where grants.user_id = auth.uid()
      and grants.environment = purchase_environment
      and grants.store_transaction_id = store_id
  );
$$;

revoke all on function public.verified_rituel_credit_delivered(text, text)
  from public, anon;
grant execute on function public.verified_rituel_credit_delivered(text, text)
  to authenticated;

-- Credit spending must not overwrite a grant that arrived after the read.
create function public.spend_rituel_credits(expected_purchaser uuid, credit_amount integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchaser uuid := auth.uid();
  new_balance integer;
begin
  if purchaser is null or purchaser is distinct from expected_purchaser or credit_amount is null or credit_amount <= 0 then
    raise exception 'Invalid credit spend' using errcode = '22023';
  end if;

  update public.user_credits
    set balance = balance - credit_amount
    where user_id = purchaser and balance >= credit_amount
    returning balance into new_balance;
  if not found then
    return null;
  end if;

  insert into public.credit_transactions (user_id, amount, source, kind)
    values (purchaser, -credit_amount, 'spend', 'spend');
  return new_balance;
end;
$$;

revoke all on function public.spend_rituel_credits(uuid, integer) from public, anon;
grant execute on function public.spend_rituel_credits(uuid, integer) to authenticated;
