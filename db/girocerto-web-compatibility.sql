-- Compatibilidade com o app web sem apagar os registros existentes.
create table if not exists public.entries (
 id text primary key,
 user_id uuid not null references public.profiles(id) on delete cascade,
 date date not null,
 earnings jsonb not null default '[]'::jsonb check (jsonb_typeof(earnings)='array'),
 expenses jsonb not null default '[]'::jsonb check (jsonb_typeof(expenses)='array'),
 hours_worked numeric not null default 0 check(hours_worked>=0),
 fuel_used numeric,
 status text not null default 'work' check(status in ('work','off')),
 notes text,
 unique(user_id,date)
);
alter table public.entries enable row level security;
create policy entries_owner on public.entries for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
grant select,insert,update,delete on public.entries to authenticated;
revoke all on public.entries from anon;
alter table public.debts add column if not exists status text;
alter table public.my_bike add column if not exists license_plate text;
alter table public.my_bike add column if not exists fipe_value numeric;
alter table public.my_bike add column if not exists fipe_date text;
alter table public.my_bike add column if not exists manual_value numeric;
alter table public.vehicle_goals add column if not exists target_year integer;
alter table public.vehicle_goals add column if not exists down_payment numeric;
create unique index if not exists vehicle_goals_one_per_user on public.vehicle_goals(user_id);
create index if not exists maintenance_items_user_idx on public.maintenance_items(user_id);
create index if not exists debts_user_idx on public.debts(user_id);
insert into public.profiles(id,name,email,plan_expiry_date)
select id,coalesce(raw_user_meta_data->>'full_name',''),email,created_at+interval '30 days' from auth.users on conflict(id) do nothing;
-- Importa o histórico do banco atual para os registros diários usados no app.
insert into public.entries(id,user_id,date,earnings,expenses,hours_worked,status,notes)
select 'legacy-'||user_id::text||'-'||(date at time zone 'America/Sao_Paulo')::date::text,user_id,(date at time zone 'America/Sao_Paulo')::date,
coalesce(jsonb_agg(jsonb_build_object('app',coalesce(app,'Outros'),'amount',amount)) filter(where type='EARNING'),'[]'::jsonb),
coalesce(jsonb_agg(jsonb_build_object('category',coalesce(category,'Outros'),'amount',amount)) filter(where type='EXPENSE'),'[]'::jsonb),
coalesce(max(hours_worked),0),'work',string_agg(notes,E'\n')
from public.transactions group by user_id,(date at time zone 'America/Sao_Paulo')::date on conflict(user_id,date) do nothing;
insert into public.entries(id,user_id,date,status,notes)
select 'plan-'||id::text,user_id,date,case when will_work then 'work' else 'off' end,notes from public.plans on conflict(user_id,date) do nothing;
-- Grava listas em uma transação: qualquer erro desfaz toda a operação.
create or replace function public.gc_save_maintenance(items jsonb) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
 if jsonb_typeof(items)<>'array' then raise exception 'Lista inválida'; end if;
 insert into public.maintenance_items(id,user_id,name,qty_per_year,unit_value)
 select (x->>'id')::uuid,auth.uid(),x->>'name',(x->>'qtyPerYear')::integer,(x->>'unitValue')::numeric from jsonb_array_elements(items) x
 on conflict(id) do update set name=excluded.name,qty_per_year=excluded.qty_per_year,unit_value=excluded.unit_value;
 delete from public.maintenance_items where user_id=auth.uid() and id not in(select (x->>'id')::uuid from jsonb_array_elements(items) x);
end $$;
create or replace function public.gc_save_debts(items jsonb) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
 if jsonb_typeof(items)<>'array' then raise exception 'Lista inválida'; end if;
 insert into public.debts(id,user_id,name,type,payment_method,total_value,installment_value,total_installments,paid_installments,due_day,is_paid,start_date,status)
 select (x->>'id')::uuid,auth.uid(),x->>'name',x->>'type',x->>'paymentMethod',(x->>'totalValue')::numeric,(x->>'installmentValue')::numeric,(x->>'totalInstallments')::integer,(x->>'paidInstallments')::integer,(x->>'dueDay')::integer,(x->>'status')='paid',(x->>'startDate')::date,x->>'status' from jsonb_array_elements(items) x
 on conflict(id) do update set name=excluded.name,type=excluded.type,payment_method=excluded.payment_method,total_value=excluded.total_value,installment_value=excluded.installment_value,total_installments=excluded.total_installments,paid_installments=excluded.paid_installments,due_day=excluded.due_day,is_paid=excluded.is_paid,start_date=excluded.start_date,status=excluded.status;
 delete from public.debts where user_id=auth.uid() and id not in(select (x->>'id')::uuid from jsonb_array_elements(items) x);
end $$;
revoke all on function public.gc_save_maintenance(jsonb), public.gc_save_debts(jsonb) from public,anon;
grant execute on function public.gc_save_maintenance(jsonb), public.gc_save_debts(jsonb) to authenticated;
-- O perfil é criado pelo trigger; o navegador só altera campos do usuário.
revoke insert,update on public.profiles from authenticated;
grant update(name,email,main_app,daily_goal,work_days_per_month,onboarding_completed,updated_at) on public.profiles to authenticated;
-- Corrige a view indicada pelo Advisor, preservando sua definição.
alter view public.user_statistics set(security_invoker=true);
notify pgrst,'reload schema';
