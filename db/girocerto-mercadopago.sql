-- Only the server can create or settle charges. Clients can read their own charges.
create table public.gc_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  provider_order_id text unique,
  amount numeric(10,2) not null default 12.99 check (amount = 12.99),
  currency text not null default 'BRL' check (currency = 'BRL'),
  status text not null default 'creating',
  qr_code text,
  qr_code_base64 text,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  webhook_received_at timestamptz
);
create index gc_payments_user_created on public.gc_payments(user_id,created_at desc);
alter table public.gc_payments enable row level security;
revoke all on public.gc_payments from anon, authenticated;
grant select on public.gc_payments to authenticated;
grant all on public.gc_payments to service_role;
create policy gc_payments_owner_read on public.gc_payments for select to authenticated
using ((select auth.uid()) = user_id);

-- Called only after the Edge Function verifies the provider signature and fetches
-- the order from Mercado Pago. Row locks make duplicate callbacks idempotent.
create function public.gc_activate_payment(p_id uuid, p_order_id text)
returns timestamptz language plpgsql security invoker set search_path = '' as $$
declare charge public.gc_payments; expiry timestamptz;
begin
  if current_user not in ('service_role','postgres') then raise exception 'Server only'; end if;
  select * into charge from public.gc_payments where id=p_id for update;
  if not found or charge.provider_order_id is distinct from p_order_id
     or charge.amount <> 12.99 or charge.currency <> 'BRL'
     or charge.webhook_received_at is null then raise exception 'Invalid charge'; end if;
  select plan_expiry_date into expiry from public.profiles where id=charge.user_id for update;
  if charge.activated_at is not null then return expiry; end if;
  expiry := greatest(coalesce(expiry,now()),now()) + interval '30 days';
  update public.profiles set plan_status='active', plan_expiry_date=expiry,
    is_first_month=false, updated_at=now() where id=charge.user_id;
  update public.gc_payments set activated_at=now(),status='approved' where id=p_id;
  return expiry;
end;
$$;
revoke all on function public.gc_activate_payment(uuid,text) from public,anon,authenticated;
grant execute on function public.gc_activate_payment(uuid,text) to service_role;

create function public.gc_get_payment_intent(p_user_id uuid)
returns public.gc_payments language plpgsql security invoker set search_path = '' as $$
declare charge public.gc_payments;
begin
  if current_user not in ('service_role','postgres') then raise exception 'Server only'; end if;
  perform id from public.profiles where id=p_user_id for update;
  if not found then raise exception 'Unknown user'; end if;
  select * into charge from public.gc_payments where user_id=p_user_id
    and expires_at>now() and activated_at is null and status not in ('canceled','failed','expired')
    order by created_at desc limit 1;
  if found then return charge; end if;
  insert into public.gc_payments(user_id) values(p_user_id) returning * into charge;
  return charge;
end;
$$;
revoke all on function public.gc_get_payment_intent(uuid) from public,anon,authenticated;
grant execute on function public.gc_get_payment_intent(uuid) to service_role;
