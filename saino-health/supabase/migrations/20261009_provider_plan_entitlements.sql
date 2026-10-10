begin;

alter table public.providers
  add column if not exists marketplace_priority smallint not null default 0
    check (marketplace_priority >= 0);

alter table public.provider_offers
  add column if not exists campaign_type text not null default 'offer'
    check (campaign_type in ('offer', 'search_campaign'));

alter table public.provider_plan_catalog
  add column if not exists service_limit integer not null default 2
    check (service_limit > 0),
  add column if not exists trust_badge text,
  add column if not exists search_priority smallint not null default 0
    check (search_priority >= 0);

insert into public.provider_plan_catalog
  (plan, display_name, description, service_limit, trust_badge, search_priority, monthly_price, features)
values
  ('saino_listed', 'Free Listing', 'Create a complete hospital or clinic profile with basic patient contact and booking tools.', 2, null, 0, null,
    '["Provider profile, logo, cover and facility photos","Address, contact number and opening hours","Up to 2 basic services","Limited patient booking and comments","Standard marketplace visibility"]'::jsonb),
  ('saino_pro', 'SAINO Verified (VIP)', 'Build patient trust with a verified badge, five services and review replies.', 5, 'SAINO Verified', 1, null,
    '["Everything in Free Listing","Up to 5 services","Patient reviews and comments","Reply to patient reviews","SAINO Verified Trust Badge"]'::jsonb),
  ('saino_prime', 'SAINO VVIP', 'Grow your marketplace reach with expanded services, advanced insights and campaigns.', 15, 'SAINO VVIP', 2, null,
    '["Everything in SAINO Verified (VIP)","Up to 15 services","Advanced marketplace analytics","Search campaigns","Higher marketplace visibility","SAINO VVIP Trust Badge"]'::jsonb)
on conflict (plan) do update
set display_name = excluded.display_name,
    description = excluded.description,
    service_limit = excluded.service_limit,
    trust_badge = excluded.trust_badge,
    search_priority = excluded.search_priority,
    features = excluded.features,
    active = true;

create or replace function public.provider_plan_level(target_provider_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case p.plan
    when 'saino_pro' then 1
    when 'saino_prime' then 2
    else 0
  end
  from public.providers p
  where p.id = target_provider_id;
$$;

create or replace function public.provider_has_review_access(target_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_saino_admin()
    or (
      (select auth.uid()) is not null
      and public.is_provider_member(target_provider_id)
      and coalesce(public.provider_plan_level(target_provider_id), 0) >= 1
    );
$$;

create or replace function public.provider_has_vvip_access(target_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_saino_admin()
    or (
      (select auth.uid()) is not null
      and public.is_provider_member(target_provider_id)
      and coalesce(public.provider_plan_level(target_provider_id), 0) >= 2
    );
$$;

create or replace function public.enforce_provider_service_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  service_limit_value integer;
  existing_services integer;
begin
  if tg_op = 'UPDATE' and old.status = new.status and old.provider_id = new.provider_id then
    return new;
  end if;
  if new.status not in ('pending', 'active') then
    return new;
  end if;

  select pc.service_limit into service_limit_value
  from public.providers p
  join public.provider_plan_catalog pc on pc.plan = p.plan
  where p.id = new.provider_id
  for update of p;

  if service_limit_value is null then
    raise exception 'Provider plan could not be found';
  end if;

  select count(*) into existing_services
  from public.provider_services ps
  where ps.provider_id = new.provider_id
    and ps.status in ('pending', 'active')
    and (tg_op = 'INSERT' or ps.id <> new.id);

  if existing_services >= service_limit_value then
    raise exception 'This plan allows up to % services. Upgrade the provider plan to add more.', service_limit_value;
  end if;
  return new;
end;
$$;

drop trigger if exists provider_services_enforce_plan_limit on public.provider_services;
create trigger provider_services_enforce_plan_limit
before insert or update of status, provider_id on public.provider_services
for each row execute function public.enforce_provider_service_limit();

create or replace function public.sync_provider_marketplace_priority()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.plan is distinct from new.plan then
    if (
      select count(*)
      from public.provider_services ps
      where ps.provider_id = new.id
        and ps.status in ('pending', 'active')
    ) > (
      select pc.service_limit
      from public.provider_plan_catalog pc
      where pc.plan = new.plan
    ) then
      raise exception 'Deactivate services above the selected plan limit before changing this provider plan';
    end if;
  end if;

  select pc.search_priority into new.marketplace_priority
  from public.provider_plan_catalog pc
  where pc.plan = new.plan;
  return new;
end;
$$;

drop trigger if exists providers_sync_marketplace_priority on public.providers;
create trigger providers_sync_marketplace_priority
before insert or update of plan on public.providers
for each row execute function public.sync_provider_marketplace_priority();

update public.providers p
set marketplace_priority = pc.search_priority
from public.provider_plan_catalog pc
where pc.plan = p.plan
  and p.marketplace_priority <> pc.search_priority;

create index if not exists providers_public_listing_priority_idx
  on public.providers (city, provider_type, marketplace_priority desc, created_at desc)
  where status = 'active' and verification_status = 'verified';

drop policy if exists "Provider team reads approved replies" on public.provider_review_responses;
create policy "Provider team reads approved replies"
on public.provider_review_responses for select to authenticated
using (public.provider_has_review_access(provider_id));

drop policy if exists "Provider team reads review reports" on public.provider_review_reports;
create policy "Provider team reads review reports"
on public.provider_review_reports for select to authenticated
using (public.provider_has_review_access(provider_id));

drop policy if exists "Provider team submits review reports" on public.provider_review_reports;
create policy "Provider team submits review reports"
on public.provider_review_reports for insert to authenticated
with check (
  reported_by = (select auth.uid())
  and status = 'pending'
  and public.provider_has_review_access(provider_id)
  and exists (
    select 1 from public.reviews r
    where r.id = review_id
      and r.provider_id = provider_review_reports.provider_id
  )
);

drop policy if exists "Published reviews are public; VIP teams and admins can manage review access" on public.reviews;
create policy "Published reviews are public; VIP teams and admins can manage review access"
on public.reviews for select to anon, authenticated
using (
  public.is_saino_admin()
  or (
    status = 'published'
    and (
      public.provider_has_review_access(provider_id)
      or (
        not public.is_provider_member(provider_id)
        and exists (
          select 1 from public.providers p
          where p.id = provider_id and p.status = 'active' and p.verification_status = 'verified'
        )
      )
    )
  )
);

drop policy if exists "VVIP teams submit pending offers" on public.provider_offers;
create policy "VVIP teams submit pending offers"
on public.provider_offers for insert to authenticated
with check (public.provider_has_vvip_access(provider_id) and status = 'pending');

drop policy if exists "Provider teams edit pending offers; admins moderate" on public.provider_offers;
create policy "Provider teams edit pending offers; admins moderate"
on public.provider_offers for update to authenticated
using ((public.provider_has_vvip_access(provider_id) and status = 'pending') or public.is_saino_admin())
with check ((public.provider_has_vvip_access(provider_id) and status = 'pending') or public.is_saino_admin());

drop policy if exists "Provider teams delete pending offers; admins delete offers" on public.provider_offers;
create policy "Provider teams delete pending offers; admins delete offers"
on public.provider_offers for delete to authenticated
using ((public.provider_has_vvip_access(provider_id) and status = 'pending') or public.is_saino_admin());

drop policy if exists "Provider team reads daily metrics" on public.provider_metrics_daily;
create policy "Provider team reads daily metrics"
on public.provider_metrics_daily for select to authenticated
using (public.provider_has_vvip_access(provider_id));

revoke all on function public.provider_plan_level(uuid) from public;
revoke all on function public.provider_has_review_access(uuid) from public;
revoke all on function public.provider_has_vvip_access(uuid) from public;
revoke all on function public.enforce_provider_service_limit() from public;
revoke all on function public.sync_provider_marketplace_priority() from public;
grant execute on function public.provider_has_review_access(uuid) to anon, authenticated;
grant execute on function public.provider_has_vvip_access(uuid) to anon, authenticated;

commit;
