-- New signups only; preserve every existing account's granted expiry.
alter table public.profiles alter column plan_expiry_date set default (now() + interval '72 hours');

alter table public.gc_payments drop constraint gc_payments_amount_check;
alter table public.gc_payments add constraint gc_payments_amount_check check (amount in (10.00,12.99));
alter table public.gc_payments add column pricing_kind text not null default 'regular'
  check (pricing_kind in ('regular','early_renewal'));
alter table public.gc_payments add column renewal_base_expiry timestamptz;
alter table public.gc_payments add column paid_at timestamptz;

create function public.gc_payment_quote(p_user_id uuid)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare profile public.profiles; early boolean;
begin
  if current_user not in ('service_role','postgres') then raise exception 'Server only'; end if;
  select * into profile from public.profiles where id=p_user_id;
  if not found then raise exception 'Unknown user'; end if;
  early := not coalesce(profile.is_first_month,true)
    and profile.plan_expiry_date > now()
    and profile.plan_expiry_date <= now() + interval '48 hours';
  return jsonb_build_object('amount',case when early then 10.00 else 12.99 end,
    'earlyRenewal',coalesce(early,false),'planExpiresAt',profile.plan_expiry_date,
    'isTrial',coalesce(profile.is_first_month,true),'serverTime',now());
end;
$$;
revoke all on function public.gc_payment_quote(uuid) from public,anon,authenticated;
grant execute on function public.gc_payment_quote(uuid) to service_role;

create or replace function public.gc_get_payment_intent(p_user_id uuid)
returns public.gc_payments language plpgsql security invoker set search_path = '' as $$
declare charge public.gc_payments; quote jsonb; profile public.profiles;
begin
  if current_user not in ('service_role','postgres') then raise exception 'Server only'; end if;
  select * into profile from public.profiles where id=p_user_id for update;
  if not found then raise exception 'Unknown user'; end if;
  quote:=public.gc_payment_quote(p_user_id);
  -- Never create another intent during a live quote. Its displayed amount is
  -- guaranteed for its 30-minute validity, even if a pricing boundary passes.
  select * into charge from public.gc_payments where user_id=p_user_id
    and expires_at>now() and activated_at is null and status not in ('canceled','failed','expired')
    order by created_at desc limit 1;
  if found then return charge; end if;
  insert into public.gc_payments(user_id,amount,pricing_kind,renewal_base_expiry)
    values(p_user_id,(quote->>'amount')::numeric,
      case when (quote->>'earlyRenewal')::boolean then 'early_renewal' else 'regular' end,
      case when not coalesce(profile.is_first_month,true) then profile.plan_expiry_date end)
    returning * into charge;
  return charge;
end;
$$;

create or replace function public.gc_activate_payment(p_id uuid, p_order_id text)
returns timestamptz language plpgsql security invoker set search_path = '' as $$
declare charge public.gc_payments; profile public.profiles; expiry timestamptz; payment_time timestamptz;
begin
  if current_user not in ('service_role','postgres') then raise exception 'Server only'; end if;
  select * into charge from public.gc_payments where id=p_id for update;
  if not found or charge.provider_order_id is distinct from p_order_id
     or charge.amount not in (10.00,12.99) or charge.currency <> 'BRL'
     or charge.webhook_received_at is null then raise exception 'Invalid charge'; end if;
  if charge.amount=10.00 and (charge.pricing_kind <> 'early_renewal'
     or charge.renewal_base_expiry is null or charge.created_at >= charge.renewal_base_expiry
     or charge.created_at < charge.renewal_base_expiry - interval '48 hours')
     then raise exception 'Invalid discounted charge'; end if;
  select * into profile from public.profiles where id=charge.user_id for update;
  if charge.activated_at is not null then return profile.plan_expiry_date; end if;
  payment_time:=coalesce(charge.paid_at,now());
  if payment_time < charge.created_at - interval '5 minutes' or payment_time > now() + interval '5 minutes'
    then raise exception 'Invalid payment time'; end if;
  -- First payment starts a paid cycle; early renewal extends the current cycle.
  expiry:=case when coalesce(profile.is_first_month,true) then payment_time
    else greatest(coalesce(profile.plan_expiry_date,payment_time),payment_time) end + interval '720 hours';
  update public.profiles set plan_status='active',plan_expiry_date=expiry,
    is_first_month=false,updated_at=now() where id=charge.user_id;
  update public.gc_payments set activated_at=now(),status='approved',paid_at=payment_time where id=p_id;
  return expiry;
end;
$$;

-- Enforce expiry on business-data writes, while allowing users to read history
-- and pay for renewal. SECURITY INVOKER respects the profile ownership policy.
create function public.gc_has_active_plan() returns boolean language sql stable
security invoker set search_path = '' as $$
  select exists(select 1 from public.profiles where id=(select auth.uid()) and plan_expiry_date>now());
$$;
revoke all on function public.gc_has_active_plan() from public,anon;
grant execute on function public.gc_has_active_plan() to authenticated;
do $$ declare t text; begin
  foreach t in array array['entries','transactions','plans','goals','maintenance_items','debts','my_bike','vehicle_goals'] loop
    execute format('create policy gc_plan_insert on public.%I as restrictive for insert to authenticated with check ((select public.gc_has_active_plan()))',t);
    execute format('create policy gc_plan_update on public.%I as restrictive for update to authenticated using ((select public.gc_has_active_plan())) with check ((select public.gc_has_active_plan()))',t);
    execute format('create policy gc_plan_delete on public.%I as restrictive for delete to authenticated using ((select public.gc_has_active_plan()))',t);
  end loop;
end $$;
