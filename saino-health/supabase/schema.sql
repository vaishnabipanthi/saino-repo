create extension if not exists pgcrypto;
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

create or replace function public.is_saino_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin', false);
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

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 2 and 180),
  provider_type text not null check (provider_type in ('hospital', 'clinic', 'diagnostic_centre', 'other')),
  plan text not null default 'saino_listed' check (plan in ('saino_listed', 'saino_pro', 'saino_prime')),
  about text,
  address text,
  city text not null,
  phone text,
  logo_path text,
  cover_path text,
  opening_hours jsonb not null default '{}'::jsonb check (jsonb_typeof(opening_hours) = 'object'),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  social_links jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links) = 'object'),
  emergency_available boolean not null default false,
  telemedicine_enabled boolean not null default false,
  profile_views bigint not null default 0 check (profile_views >= 0),
  next_queue_token integer not null default 1 check (next_queue_token > 0),
  marketplace_priority smallint not null default 0 check (marketplace_priority >= 0),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'rejected')),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null))
);
alter table public.providers
  add column if not exists marketplace_priority smallint not null default 0
    check (marketplace_priority >= 0);
create table if not exists public.provider_members (
  provider_id uuid not null references public.providers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null default 'editor' check (member_role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  primary key (provider_id, user_id)
);

create or replace function public.is_provider_member(target_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.provider_members pm
    where pm.provider_id = target_provider_id
      and pm.user_id = (select auth.uid())
  );
$$;

create or replace function public.add_provider_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is not null then
    insert into public.provider_members (provider_id, user_id, member_role)
    values (new.id, new.owner_id, 'owner')
    on conflict (provider_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists providers_add_owner_membership on public.providers;
create trigger providers_add_owner_membership
after insert on public.providers
for each row execute function public.add_provider_owner_membership();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists providers_set_updated_at on public.providers;
create trigger providers_set_updated_at
before update on public.providers
for each row execute function public.set_updated_at();

create table if not exists public.provider_change_requests (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  submitted_by uuid not null default auth.uid() references auth.users(id),
  profile jsonb not null check (jsonb_typeof(profile) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  reviewed_by uuid references auth.users(id),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 180),
  specialty text not null,
  about text,
  photo_path text,
  qualification text,
  consultation_fee numeric(12, 2) check (consultation_fee is null or consultation_fee >= 0),
  currency text not null default 'NPR' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists doctors_id_provider_unique
  on public.doctors (id, provider_id);

drop trigger if exists doctors_set_updated_at on public.doctors;
create trigger doctors_set_updated_at
before update on public.doctors
for each row execute function public.set_updated_at();

create table if not exists public.provider_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 180),
  description text,
  price numeric(12, 2) check (price is null or price >= 0),
  currency text not null default 'NPR' check (currency ~ '^[A-Z]{3}$'),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 5 and 1440),
  telemedicine_enabled boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists provider_services_id_provider_unique
  on public.provider_services (id, provider_id);

drop trigger if exists provider_services_set_updated_at on public.provider_services;
create trigger provider_services_set_updated_at
before update on public.provider_services
for each row execute function public.set_updated_at();

create table if not exists public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  doctor_id uuid,
  service_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null default 1 check (capacity between 1 and 500),
  booked_count integer not null default 0 check (booked_count between 0 and capacity),
  status text not null default 'pending' check (status in ('pending', 'active', 'cancelled')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (doctor_id, provider_id) references public.doctors(id, provider_id),
  foreign key (service_id, provider_id) references public.provider_services(id, provider_id)
);

create table if not exists public.provider_gallery (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  storage_path text not null unique,
  caption text,
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id),
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 1 and 3000),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'hidden')),
  created_at timestamptz not null default now(),
  moderated_by uuid references auth.users(id),
  moderated_at timestamptz
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.appointment_slots(id),
  patient_id uuid not null default auth.uid() references auth.users(id),
  patient_name text,
  patient_phone text,
  status text not null default 'booked' check (status in ('booked', 'confirmed', 'cancelled', 'completed', 'no_show')),
  patient_note text check (char_length(patient_note) <= 2000),
  telemedicine boolean not null default false,
  telemedicine_url text,
  created_at timestamptz not null default now(),
  unique (slot_id, patient_id)
);

create table if not exists public.provider_queue_visits (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  patient_name text not null check (char_length(patient_name) between 1 and 180),
  token_number integer not null check (token_number > 0),
  status text not null default 'waiting' check (status in ('waiting', 'serving', 'completed', 'cancelled')),
  joined_at timestamptz not null default now(),
  called_at timestamptz,
  completed_at timestamptz,
  unique (provider_id, token_number)
);

create unique index if not exists provider_queue_one_serving_idx
  on public.provider_queue_visits (provider_id)
  where status = 'serving';

create table if not exists public.provider_offers (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  campaign_type text not null default 'offer' check (campaign_type in ('offer', 'search_campaign')),
  title text not null check (char_length(title) between 2 and 180),
  description text,
  discount_percent numeric(5, 2) check (discount_percent between 0 and 100),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected', 'expired')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
alter table public.provider_offers
  add column if not exists campaign_type text not null default 'offer'
    check (campaign_type in ('offer', 'search_campaign'));

create table if not exists public.provider_metrics_daily (
  provider_id uuid not null references public.providers(id) on delete cascade,
  metric_date date not null,
  profile_views integer not null default 0 check (profile_views >= 0),
  searches integer not null default 0 check (searches >= 0),
  bookings integer not null default 0 check (bookings >= 0),
  service_views integer not null default 0 check (service_views >= 0),
  primary key (provider_id, metric_date)
);

create table if not exists public.provider_notifications (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  body text not null,
  notification_type text not null check (notification_type in ('appointment', 'approval', 'review', 'campaign', 'system')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.provider_review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id),
  response text not null check (char_length(response) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.provider_review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  reported_by uuid not null default auth.uid() references auth.users(id),
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.provider_plan_catalog (
  plan text primary key check (plan in ('saino_listed', 'saino_pro', 'saino_prime')),
  display_name text not null,
  description text not null,
  service_limit integer not null check (service_limit > 0),
  trust_badge text,
  search_priority smallint not null default 0 check (search_priority >= 0),
  monthly_price numeric(12, 2) check (monthly_price is null or monthly_price >= 0),
  currency text not null default 'NPR' check (currency ~ '^[A-Z]{3}$'),
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),
  active boolean not null default true
);
alter table public.provider_plan_catalog
  add column if not exists service_limit integer not null default 2 check (service_limit > 0),
  add column if not exists trust_badge text,
  add column if not exists search_priority smallint not null default 0 check (search_priority >= 0);

create table if not exists public.provider_subscriptions (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  plan text not null references public.provider_plan_catalog(plan),
  status text not null default 'pending' check (status in ('pending', 'active', 'past_due', 'cancelled')),
  starts_at timestamptz,
  renews_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.provider_applications (
  id uuid primary key default gen_random_uuid(),
  upload_token uuid not null default gen_random_uuid(),
  provider_name text not null check (char_length(provider_name) between 2 and 180),
  provider_type text not null check (provider_type in ('hospital', 'clinic', 'diagnostic_centre', 'other')),
  registration_number text not null check (char_length(registration_number) between 1 and 120),
  vat_pan text not null check (char_length(vat_pan) between 1 and 80),
  address text not null check (char_length(address) between 3 and 300),
  city text not null check (char_length(city) between 2 and 100),
  contact_name text not null check (char_length(contact_name) between 2 and 160),
  contact_email text not null check (char_length(contact_email) between 3 and 254),
  contact_phone text not null check (char_length(contact_phone) between 5 and 32),
  plan text not null references public.provider_plan_catalog(plan),
  payment_method text check (payment_method in ('bank_transfer', 'esewa', 'khalti', 'fonepay', 'qr')),
  payment_reference text check (payment_reference is null or char_length(payment_reference) between 3 and 120),
  payment_status text not null check (payment_status in ('not_required', 'awaiting_verification', 'confirmed', 'rejected')),
  document_names text[] not null default '{}',
  document_paths text[] not null default '{}',
  legal_agreements_accepted boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  provider_id uuid unique references public.providers(id) on delete set null,
  review_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  payment_confirmed_by uuid references auth.users(id),
  payment_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (plan = 'saino_listed' and payment_status = 'not_required')
    or (plan <> 'saino_listed' and payment_status in ('awaiting_verification', 'confirmed', 'rejected'))
  ),
  check ((payment_status = 'not_required' and payment_method is null and payment_reference is null)
    or (payment_status <> 'not_required' and payment_method is not null and payment_reference is not null))
);

create index if not exists provider_applications_queue_idx
  on public.provider_applications (status, payment_status, created_at desc);
create index if not exists provider_applications_email_idx
  on public.provider_applications (lower(contact_email), status, created_at desc);

create table if not exists public.provider_preferences (
  provider_id uuid primary key references public.providers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_preferences jsonb not null default '{"appointments":true,"reviews":true,"campaigns":true,"system":true}'::jsonb
    check (jsonb_typeof(notification_preferences) = 'object'),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_media (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id),
  storage_path text not null unique,
  purpose text not null check (purpose in ('logo', 'cover', 'gallery')),
  created_at timestamptz not null default now()
);

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

create or replace function public.submit_provider_application(
  application_payload jsonb,
  submitted_document_names text[],
  honeypot text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  application_id uuid;
  upload_token uuid;
  normalized_email text;
  normalized_plan text;
  normalized_method text;
  normalized_reference text;
  normalized_type text;
begin
  if coalesce(honeypot, '') <> '' then
    raise exception 'Application could not be accepted';
  end if;
  if jsonb_typeof(application_payload) <> 'object'
    or coalesce((application_payload ->> 'legal_agreements_accepted')::boolean, false) is not true then
    raise exception 'Accept the required agreements before submitting';
  end if;

  normalized_plan := application_payload ->> 'plan';
  if normalized_plan not in ('saino_listed', 'saino_pro', 'saino_prime') then
    raise exception 'Select a valid provider plan';
  end if;
  normalized_type := application_payload ->> 'provider_type';
  if normalized_type not in ('hospital', 'clinic', 'diagnostic_centre', 'other') then
    raise exception 'Select a valid provider type';
  end if;

  normalized_email := lower(trim(application_payload ->> 'contact_email'));
  normalized_method := nullif(trim(application_payload ->> 'payment_method'), '');
  normalized_reference := nullif(trim(application_payload ->> 'payment_reference'), '');

  if length(trim(coalesce(application_payload ->> 'provider_name', ''))) not between 2 and 180
    or length(trim(coalesce(application_payload ->> 'registration_number', ''))) not between 1 and 120
    or length(trim(coalesce(application_payload ->> 'vat_pan', ''))) not between 1 and 80
    or length(trim(coalesce(application_payload ->> 'address', ''))) not between 3 and 300
    or length(trim(coalesce(application_payload ->> 'city', ''))) not between 2 and 100
    or length(trim(coalesce(application_payload ->> 'contact_name', ''))) not between 2 and 160
    or length(normalized_email) not between 3 and 254
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or length(trim(coalesce(application_payload ->> 'contact_phone', ''))) not between 5 and 32 then
    raise exception 'Complete all required provider and contact details';
  end if;
  if coalesce(array_length(submitted_document_names, 1), 0) > 10
    or exists (
      select 1 from unnest(coalesce(submitted_document_names, '{}'::text[])) document_name
      where length(document_name) > 255
    ) then
    raise exception 'Too many or invalid provider documents';
  end if;

  if normalized_plan = 'saino_listed' then
    normalized_method := null;
    normalized_reference := null;
  elsif normalized_method not in ('bank_transfer', 'esewa', 'khalti', 'fonepay', 'qr')
    or length(coalesce(normalized_reference, '')) not between 3 and 120 then
    raise exception 'Enter a valid manual payment method and transaction reference';
  end if;

  if exists (
    select 1 from public.provider_applications pa
    where lower(pa.contact_email) = normalized_email
      and pa.status = 'pending'
  ) then
    raise exception 'A provider application for this email is already awaiting review';
  end if;

  insert into public.provider_applications (
    provider_name, provider_type, registration_number, vat_pan, address, city,
    contact_name, contact_email, contact_phone, plan, payment_method,
    payment_reference, payment_status, document_names, legal_agreements_accepted
  ) values (
    trim(application_payload ->> 'provider_name'),
    normalized_type,
    trim(application_payload ->> 'registration_number'),
    trim(application_payload ->> 'vat_pan'),
    trim(application_payload ->> 'address'),
    trim(application_payload ->> 'city'),
    trim(application_payload ->> 'contact_name'),
    normalized_email,
    trim(application_payload ->> 'contact_phone'),
    normalized_plan,
    normalized_method,
    normalized_reference,
    case when normalized_plan = 'saino_listed' then 'not_required' else 'awaiting_verification' end,
    coalesce(submitted_document_names, '{}'::text[]),
    true
  )
  returning id, provider_applications.upload_token into application_id, upload_token;

  return jsonb_build_object('application_id', application_id, 'upload_token', upload_token);
end;
$$;

create or replace function public.provider_application_upload_allowed(
  target_application_id uuid,
  target_upload_token uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.provider_applications pa
    where pa.id = target_application_id
      and pa.upload_token = target_upload_token
      and pa.status = 'pending'
  );
$$;

create or replace function public.attach_provider_application_documents(
  target_application_id uuid,
  target_upload_token uuid,
  uploaded_paths text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.provider_application_upload_allowed(target_application_id, target_upload_token) then
    raise exception 'Application upload session is invalid or closed';
  end if;
  if coalesce(array_length(uploaded_paths, 1), 0) > 10
    or exists (
      select 1
      from unnest(coalesce(uploaded_paths, '{}'::text[])) uploaded_path
      where uploaded_path !~ (
        '^' || target_application_id::text || '/' || target_upload_token::text || '/[A-Za-z0-9._-]{1,180}$'
      )
    ) then
    raise exception 'Application document paths are invalid';
  end if;

  update public.provider_applications
  set document_paths = uploaded_paths
  where id = target_application_id
    and upload_token = target_upload_token
    and status = 'pending';
  if not found then
    raise exception 'Pending provider application not found';
  end if;
end;
$$;

create or replace function public.review_provider_application(
  target_application_id uuid,
  decision text,
  decision_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  application_record public.provider_applications%rowtype;
  created_provider_id uuid;
begin
  if not public.is_saino_admin() then
    raise exception 'Only a SAINO super admin can review provider applications';
  end if;

  select * into application_record
  from public.provider_applications
  where id = target_application_id
  for update;
  if not found or application_record.status <> 'pending' then
    raise exception 'Pending provider application not found';
  end if;

  if decision = 'payment_confirmed' then
    if application_record.payment_status <> 'awaiting_verification' then
      raise exception 'This application is not awaiting payment verification';
    end if;
    update public.provider_applications
    set payment_status = 'confirmed',
        payment_confirmed_by = auth.uid(),
        payment_confirmed_at = now(),
        review_note = nullif(trim(coalesce(decision_note, '')), '')
    where id = target_application_id;
    return null;
  elsif decision = 'rejected' then
    update public.provider_applications
    set status = 'rejected',
        payment_status = case when payment_status = 'awaiting_verification' then 'rejected' else payment_status end,
        review_note = nullif(trim(coalesce(decision_note, '')), ''),
        reviewed_by = auth.uid(),
        reviewed_at = now()
    where id = target_application_id;
    return null;
  elsif decision <> 'approved' then
    raise exception 'Decision must be approved, rejected, or payment_confirmed';
  end if;

  if application_record.payment_status not in ('not_required', 'confirmed') then
    raise exception 'Confirm payment before creating the provider listing';
  end if;

  insert into public.providers (
    name, provider_type, plan, address, city, phone, status, verification_status
  ) values (
    application_record.provider_name,
    application_record.provider_type,
    application_record.plan,
    application_record.address,
    application_record.city,
    application_record.contact_phone,
    'pending',
    'pending'
  )
  returning id into created_provider_id;

  update public.provider_applications
  set status = 'approved',
      provider_id = created_provider_id,
      review_note = nullif(trim(coalesce(decision_note, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = target_application_id;

  return created_provider_id;
end;
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

create or replace function public.create_provider_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_provider_id uuid;
  notification_title text;
  notification_body text;
  notification_kind text;
begin
  if tg_table_name = 'appointments' then
    select s.provider_id into target_provider_id
    from public.appointment_slots s
    where s.id = new.slot_id;
    notification_title := case when tg_op = 'INSERT' then 'New appointment request' else 'Appointment updated' end;
    notification_body := 'A patient booking is ' || coalesce(new.status, 'updated') || '.';
    notification_kind := 'appointment';
  elsif tg_table_name = 'reviews' then
    target_provider_id := new.provider_id;
    notification_title := 'New patient review';
    notification_body := 'A patient submitted feedback for moderation.';
    notification_kind := 'review';
  elsif tg_table_name = 'provider_change_requests' then
    target_provider_id := new.provider_id;
    notification_title := case when new.status = 'approved' then 'Provider update approved' else 'Provider update needs attention' end;
    notification_body := coalesce(new.review_note, 'Your provider profile change request was ' || new.status || '.');
    notification_kind := 'approval';
  elsif tg_table_name = 'provider_offers' then
    target_provider_id := new.provider_id;
    notification_title := case when new.status = 'active' then 'Offer approved' else 'Offer update' end;
    notification_body := 'Your marketplace offer "' || new.title || '" is ' || new.status || '.';
    notification_kind := 'campaign';
  else
    return new;
  end if;

  if tg_table_name = 'appointments' and tg_op = 'UPDATE' and old.status = new.status then
    return new;
  end if;
  if tg_table_name = 'provider_change_requests' and tg_op = 'UPDATE' and old.status = new.status then
    return new;
  end if;
  if tg_table_name = 'provider_offers' and tg_op = 'UPDATE' and old.status = new.status then
    return new;
  end if;
  if target_provider_id is not null then
    insert into public.provider_notifications (provider_id, title, body, notification_type)
    values (target_provider_id, notification_title, notification_body, notification_kind);
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_notify_provider on public.appointments;
create trigger appointments_notify_provider
after insert or update of status on public.appointments
for each row execute function public.create_provider_notification();
drop trigger if exists reviews_notify_provider on public.reviews;
create trigger reviews_notify_provider
after insert on public.reviews
for each row execute function public.create_provider_notification();
drop trigger if exists provider_changes_notify_provider on public.provider_change_requests;
create trigger provider_changes_notify_provider
after update of status on public.provider_change_requests
for each row execute function public.create_provider_notification();
drop trigger if exists provider_offers_notify_provider on public.provider_offers;
create trigger provider_offers_notify_provider
after update of status on public.provider_offers
for each row execute function public.create_provider_notification();

create index if not exists providers_public_listing_idx
  on public.providers (city, provider_type, marketplace_priority desc, created_at desc)
  where status = 'active' and verification_status = 'verified';
create index if not exists providers_owner_idx on public.providers (owner_id, created_at desc);
create index if not exists providers_status_idx on public.providers (status, created_at desc);
create index if not exists providers_name_trgm_idx on public.providers using gin (name extensions.gin_trgm_ops);
create index if not exists providers_city_trgm_idx on public.providers using gin (city extensions.gin_trgm_ops);
create index if not exists provider_members_user_idx on public.provider_members (user_id, provider_id);
create index if not exists provider_change_requests_queue_idx
  on public.provider_change_requests (status, submitted_at desc);
create index if not exists provider_change_requests_provider_idx
  on public.provider_change_requests (provider_id, submitted_at desc);
create index if not exists doctors_provider_status_idx on public.doctors (provider_id, status);
create index if not exists provider_services_provider_status_idx on public.provider_services (provider_id, status);
create index if not exists appointment_slots_provider_time_idx
  on public.appointment_slots (provider_id, starts_at)
  where status = 'active';
create index if not exists appointment_slots_doctor_time_idx
  on public.appointment_slots (doctor_id, starts_at)
  where status = 'active';
create index if not exists gallery_provider_status_idx on public.provider_gallery (provider_id, status);
create index if not exists reviews_provider_queue_idx on public.reviews (provider_id, status, created_at desc);
create index if not exists appointments_patient_idx on public.appointments (patient_id, created_at desc);
create index if not exists appointments_slot_idx on public.appointments (slot_id, status);

alter table public.providers enable row level security;
alter table public.provider_members enable row level security;
alter table public.provider_change_requests enable row level security;
alter table public.doctors enable row level security;
alter table public.provider_services enable row level security;
alter table public.appointment_slots enable row level security;
alter table public.provider_gallery enable row level security;
alter table public.reviews enable row level security;
alter table public.appointments enable row level security;

revoke all on public.providers, public.provider_members, public.provider_change_requests,
  public.doctors, public.provider_services, public.appointment_slots, public.provider_gallery, public.reviews,
  public.appointments from anon, authenticated;

grant select (id, name, provider_type, plan, about, address, city, phone, logo_path, cover_path, opening_hours,
  latitude, longitude, social_links, emergency_available, telemedicine_enabled, profile_views, marketplace_priority,
  status, verification_status, created_at, updated_at)
on public.providers to anon, authenticated;
grant insert (owner_id, name, provider_type, plan, about, address, city, phone, opening_hours,
  latitude, longitude, status, verification_status, logo_path, cover_path, social_links,
  emergency_available, telemedicine_enabled)
on public.providers to authenticated;
grant update (owner_id, name, provider_type, plan, about, address, city, phone, opening_hours,
  latitude, longitude, status, verification_status, logo_path, cover_path, social_links,
  emergency_available, telemedicine_enabled, profile_views)
on public.providers to authenticated;
grant delete on public.providers to authenticated;

grant select, insert, update, delete on public.provider_members to authenticated;
grant select, insert on public.provider_change_requests to authenticated;
grant select on public.doctors, public.provider_services, public.appointment_slots, public.provider_gallery, public.reviews to anon;
grant select on public.provider_offers to anon;
grant select, insert, update, delete on public.doctors, public.provider_services, public.appointment_slots,
  public.provider_gallery, public.reviews to authenticated;
grant select, insert on public.appointments to authenticated;
grant update (status) on public.appointments to authenticated;
grant select on public.provider_queue_visits to authenticated;
grant select, insert, update, delete on public.provider_offers to authenticated;
grant select on public.provider_metrics_daily, public.provider_plan_catalog, public.provider_subscriptions to authenticated;
grant select, update on public.provider_notifications to authenticated;
grant select, insert, update on public.provider_review_responses, public.provider_review_reports to authenticated;
grant select on public.provider_review_responses to anon;
grant select, insert, update on public.provider_preferences to authenticated;
grant select, insert, delete on public.provider_media to authenticated;

grant select, insert on public.appointments to authenticated;

alter table public.provider_queue_visits enable row level security;
alter table public.provider_offers enable row level security;
alter table public.provider_metrics_daily enable row level security;
alter table public.provider_notifications enable row level security;
alter table public.provider_review_responses enable row level security;
alter table public.provider_review_reports enable row level security;
alter table public.provider_plan_catalog enable row level security;
alter table public.provider_subscriptions enable row level security;
alter table public.provider_applications enable row level security;
alter table public.provider_preferences enable row level security;

revoke all on public.provider_queue_visits, public.provider_offers, public.provider_metrics_daily,
  public.provider_notifications, public.provider_review_responses, public.provider_review_reports,
  public.provider_plan_catalog, public.provider_subscriptions, public.provider_applications, public.provider_preferences
from anon, authenticated;

grant select on public.provider_queue_visits to authenticated;
grant select, insert, update, delete on public.provider_offers to authenticated;
grant select on public.provider_offers to anon;
grant select on public.provider_metrics_daily, public.provider_plan_catalog, public.provider_subscriptions to authenticated;
grant select on public.provider_applications to authenticated;
grant select, update (read_at) on public.provider_notifications to authenticated;
grant select, insert, update on public.provider_review_responses, public.provider_review_reports to authenticated;
grant select on public.provider_review_responses to anon;
grant select, insert, update (notification_preferences) on public.provider_preferences to authenticated;

create index if not exists provider_queue_status_idx
  on public.provider_queue_visits (provider_id, status, token_number);
create index if not exists provider_offers_provider_status_idx
  on public.provider_offers (provider_id, status, ends_at desc);
create index if not exists provider_notifications_inbox_idx
  on public.provider_notifications (provider_id, created_at desc)
  where read_at is null;
create index if not exists provider_subscriptions_provider_idx
  on public.provider_subscriptions (provider_id, created_at desc);
create index if not exists review_responses_provider_idx
  on public.provider_review_responses (provider_id, status, created_at desc);
create index if not exists review_reports_provider_idx
  on public.provider_review_reports (provider_id, created_at desc);

alter table public.provider_media enable row level security;
revoke all on public.provider_media from anon, authenticated;
grant select, insert, delete on public.provider_media to authenticated;
create index if not exists provider_media_provider_idx on public.provider_media (provider_id, purpose, created_at desc);

create policy "Providers are visible when published or to their team"
on public.providers for select to anon, authenticated
using (
  (status = 'active' and verification_status = 'verified')
  or public.is_saino_admin()
  or public.is_provider_member(id)
);
create policy "Provider teams can create pending listings"
on public.providers for insert to authenticated
with check (
  status = 'pending'
  and verification_status = 'pending'
  and (owner_id = (select auth.uid()) or public.is_saino_admin())
);
create policy "Admins manage provider listings"
on public.providers for update to authenticated
using (public.is_saino_admin())
with check (public.is_saino_admin());
create policy "Admins delete provider listings"
on public.providers for delete to authenticated
using (public.is_saino_admin());

create or replace function public.set_provider_member(target_provider_id uuid, target_user_id uuid, role_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_saino_admin() then
    raise exception 'Only a SAINO super admin can manage provider access';
  end if;
  if role_name not in ('owner', 'editor') then
    raise exception 'Role must be owner or editor';
  end if;

  insert into public.provider_members (provider_id, user_id, member_role)
  values (target_provider_id, target_user_id, role_name)
  on conflict (provider_id, user_id)
  do update set member_role = excluded.member_role;
end;
$$;

create or replace function public.set_provider_member_by_email(target_provider_id uuid, target_email text, role_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
begin
  if not public.is_saino_admin() then
    raise exception 'Only a SAINO super admin can manage provider access';
  end if;
  select u.id into target_user_id
  from auth.users u
  where lower(u.email) = lower(trim(target_email))
  limit 1;
  if target_user_id is null then
    raise exception 'No Supabase Auth account exists for this email';
  end if;
  perform public.set_provider_member(target_provider_id, target_user_id, role_name);
end;
$$;

create or replace function public.add_provider_queue_visit(target_provider_id uuid, target_patient_name text)
returns public.provider_queue_visits
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_token integer;
  new_visit public.provider_queue_visits%rowtype;
begin
  if not public.is_provider_member(target_provider_id) then
    raise exception 'Provider team membership is required';
  end if;
  if char_length(trim(target_patient_name)) not between 1 and 180 then
    raise exception 'Patient name must be between 1 and 180 characters';
  end if;

  update public.providers
  set next_queue_token = next_queue_token + 1
  where id = target_provider_id
  returning next_queue_token - 1 into next_token;

  insert into public.provider_queue_visits (provider_id, patient_name, token_number)
  values (target_provider_id, trim(target_patient_name), next_token)
  returning * into new_visit;

  return new_visit;
end;
$$;

create or replace function public.advance_provider_queue(target_visit_id uuid, next_status text)
returns public.provider_queue_visits
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_visit public.provider_queue_visits%rowtype;
begin
  if next_status not in ('serving', 'completed', 'cancelled') then
    raise exception 'Invalid queue transition';
  end if;

  select * into target_visit
  from public.provider_queue_visits
  where id = target_visit_id
  for update;

  if not found or not public.is_provider_member(target_visit.provider_id) then
    raise exception 'Provider queue entry not found or access denied';
  end if;
  if target_visit.status not in ('waiting', 'serving') then
    raise exception 'Queue entry is already closed';
  end if;

  if next_status = 'serving' then
    update public.provider_queue_visits
    set status = 'waiting', called_at = null
    where provider_id = target_visit.provider_id and status = 'serving';
  end if;

  update public.provider_queue_visits
  set status = next_status,
      called_at = case when next_status = 'serving' then now() else called_at end,
      completed_at = case when next_status in ('completed', 'cancelled') then now() else completed_at end
  where id = target_visit_id
  returning * into target_visit;

  return target_visit;
end;
$$;

create policy "Members and admins can read provider memberships"
on public.provider_members for select to authenticated
using (user_id = (select auth.uid()) or public.is_saino_admin());
create policy "Admins manage provider memberships"
on public.provider_members for all to authenticated
using (public.is_saino_admin())
with check (public.is_saino_admin());

create policy "Teams and admins can read provider change requests"
on public.provider_change_requests for select to authenticated
using (public.is_saino_admin() or public.is_provider_member(provider_id));
create policy "Provider teams can submit changes"
on public.provider_change_requests for insert to authenticated
with check (
  submitted_by = (select auth.uid())
  and status = 'pending'
  and public.is_provider_member(provider_id)
);
create policy "Admins review provider changes"
on public.provider_change_requests for update to authenticated
using (public.is_saino_admin())
with check (public.is_saino_admin());

create policy "Provider teams read and create private media"
on public.provider_media for select to authenticated
using (public.is_provider_member(provider_id) or public.is_saino_admin());
create policy "Provider teams upload own media metadata"
on public.provider_media for insert to authenticated
with check (
  user_id = (select auth.uid())
  and public.is_provider_member(provider_id)
  and storage_path like provider_id::text || '/%'
);
create policy "Provider teams delete own media metadata"
on public.provider_media for delete to authenticated
using (
  user_id = (select auth.uid())
  and public.is_provider_member(provider_id)
  and not exists (
    select 1 from public.providers p
    where p.id = provider_media.provider_id
      and provider_media.storage_path in (p.logo_path, p.cover_path)
  )
  and not exists (
    select 1 from public.provider_gallery g
    where g.storage_path = provider_media.storage_path and g.status = 'active'
  )
  and not exists (
    select 1 from public.doctors d
    where d.photo_path = provider_media.storage_path and d.status = 'active'
  )
);

create policy "Provider teams manage queue"
on public.provider_queue_visits for select to authenticated
using (public.is_provider_member(provider_id) or public.is_saino_admin());
create policy "Provider teams insert queue"
on public.provider_queue_visits for insert to authenticated
with check (public.is_provider_member(provider_id) and status = 'waiting');
create policy "Provider teams update queue"
on public.provider_queue_visits for update to authenticated
using (public.is_provider_member(provider_id) or public.is_saino_admin())
with check (public.is_provider_member(provider_id) or public.is_saino_admin());

create policy "Offers are visible to provider team"
on public.provider_offers for select to authenticated
using (public.is_provider_member(provider_id) or public.is_saino_admin());
create policy "VVIP teams submit pending offers"
on public.provider_offers for insert to authenticated
with check (public.provider_has_vvip_access(provider_id) and status = 'pending');
create policy "Provider teams edit pending offers; admins moderate"
on public.provider_offers for update to authenticated
using ((public.provider_has_vvip_access(provider_id) and status = 'pending') or public.is_saino_admin())
with check ((public.provider_has_vvip_access(provider_id) and status = 'pending') or public.is_saino_admin());
create policy "Provider teams delete pending offers; admins delete offers"
on public.provider_offers for delete to authenticated
using ((public.provider_has_vvip_access(provider_id) and status = 'pending') or public.is_saino_admin());
create policy "Approved offers are public"
on public.provider_offers for select to anon
using (
  status = 'active'
  and starts_at <= now()
  and ends_at > now()
  and exists (
    select 1 from public.providers p
    where p.id = provider_offers.provider_id
      and p.status = 'active' and p.verification_status = 'verified'
  )
);

create policy "Provider team reads daily metrics"
on public.provider_metrics_daily for select to authenticated
using (public.provider_has_vvip_access(provider_id));

create policy "Provider team reads notifications"
on public.provider_notifications for select to authenticated
using (public.is_provider_member(provider_id) or public.is_saino_admin());
create policy "Provider team marks notifications read"
on public.provider_notifications for update to authenticated
using (public.is_provider_member(provider_id) or public.is_saino_admin())
with check (public.is_provider_member(provider_id) or public.is_saino_admin());

create policy "Provider team reads approved replies"
on public.provider_review_responses for select to authenticated
using (public.provider_has_review_access(provider_id));
create policy "Published provider replies are public"
on public.provider_review_responses for select to anon
using (
  status = 'published'
  and exists (
    select 1 from public.providers p
    where p.id = provider_review_responses.provider_id
      and p.status = 'active' and p.verification_status = 'verified'
  )
);
create policy "Provider team submits pending review replies"
on public.provider_review_responses for insert to authenticated
with check (
  author_id = (select auth.uid())
  and status = 'pending'
  and public.provider_has_review_access(provider_id)
  and exists (
    select 1 from public.reviews r
    where r.id = review_id
      and r.provider_id = provider_review_responses.provider_id
      and r.status = 'published'
  )
);
create policy "Admins moderate provider review replies"
on public.provider_review_responses for update to authenticated
using (public.is_saino_admin())
with check (public.is_saino_admin());

create policy "Provider team reads review reports"
on public.provider_review_reports for select to authenticated
using (public.provider_has_review_access(provider_id));
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
create policy "Admins manage review reports"
on public.provider_review_reports for update to authenticated
using (public.is_saino_admin())
with check (public.is_saino_admin());

create policy "Active plan catalogue visible to signed-in providers"
on public.provider_plan_catalog for select to authenticated
using (active or public.is_saino_admin());
drop policy if exists "Super admins read provider applications" on public.provider_applications;
create policy "Super admins read provider applications"
on public.provider_applications for select to authenticated
using (public.is_saino_admin());
create policy "Provider team reads its subscriptions"
on public.provider_subscriptions for select to authenticated
using (public.is_provider_member(provider_id) or public.is_saino_admin());

create policy "Provider user reads and saves preferences"
on public.provider_preferences for select to authenticated
using (user_id = (select auth.uid()) and public.is_provider_member(provider_id));
create policy "Provider user creates preferences"
on public.provider_preferences for insert to authenticated
with check (user_id = (select auth.uid()) and public.is_provider_member(provider_id));
create policy "Provider user updates notification preferences"
on public.provider_preferences for update to authenticated
using (user_id = (select auth.uid()) and public.is_provider_member(provider_id))
with check (user_id = (select auth.uid()) and public.is_provider_member(provider_id));

create policy "Approved doctors are public; teams and admins see all"
on public.doctors for select to anon, authenticated
using (
  (status = 'active' and exists (
    select 1 from public.providers p
    where p.id = provider_id and p.status = 'active' and p.verification_status = 'verified'
  ))
  or public.is_saino_admin()
  or public.is_provider_member(provider_id)
);
create policy "Provider teams create draft doctors"
on public.doctors for insert to authenticated
with check (status = 'pending' and public.is_provider_member(provider_id));
create policy "Provider teams edit draft doctors; admins edit all"
on public.doctors for update to authenticated
using (status = 'pending' and public.is_provider_member(provider_id) or public.is_saino_admin())
with check ((status = 'pending' and public.is_provider_member(provider_id)) or public.is_saino_admin());
create policy "Provider teams delete drafts; admins delete doctors"
on public.doctors for delete to authenticated
using ((status = 'pending' and public.is_provider_member(provider_id)) or public.is_saino_admin());

create policy "Approved services are public; teams and admins see all"
on public.provider_services for select to anon, authenticated
using (
  (status = 'active' and exists (
    select 1 from public.providers p
    where p.id = provider_services.provider_id
      and p.status = 'active' and p.verification_status = 'verified'
  ))
  or public.is_saino_admin()
  or public.is_provider_member(provider_id)
);
create policy "Provider teams create draft services"
on public.provider_services for insert to authenticated
with check (status = 'pending' and public.is_provider_member(provider_id));
create policy "Provider teams edit draft services; admins edit all"
on public.provider_services for update to authenticated
using ((status = 'pending' and public.is_provider_member(provider_id)) or public.is_saino_admin())
with check ((status = 'pending' and public.is_provider_member(provider_id)) or public.is_saino_admin());
create policy "Provider teams delete drafts; admins delete services"
on public.provider_services for delete to authenticated
using ((status = 'pending' and public.is_provider_member(provider_id)) or public.is_saino_admin());

create policy "Available slots are public; teams and admins see all"
on public.appointment_slots for select to anon, authenticated
using (
  (status = 'active' and exists (
    select 1 from public.providers p
    where p.id = provider_id and p.status = 'active' and p.verification_status = 'verified'
  ))
  or public.is_saino_admin()
  or public.is_provider_member(provider_id)
);
create policy "Provider teams create draft slots"
on public.appointment_slots for insert to authenticated
with check (status = 'pending' and booked_count = 0 and public.is_provider_member(provider_id));
create policy "Provider teams edit draft slots; admins edit all"
on public.appointment_slots for update to authenticated
using (status = 'pending' and public.is_provider_member(provider_id) or public.is_saino_admin())
with check ((status = 'pending' and booked_count = 0 and public.is_provider_member(provider_id)) or public.is_saino_admin());
create policy "Provider teams delete draft slots; admins delete slots"
on public.appointment_slots for delete to authenticated
using ((status = 'pending' and public.is_provider_member(provider_id)) or public.is_saino_admin());

create policy "Approved gallery is public; teams and admins see all"
on public.provider_gallery for select to anon, authenticated
using (
  (status = 'active' and exists (
    select 1 from public.providers p
    where p.id = provider_id and p.status = 'active' and p.verification_status = 'verified'
  ))
  or public.is_saino_admin()
  or public.is_provider_member(provider_id)
);
create policy "Provider teams add pending gallery items"
on public.provider_gallery for insert to authenticated
with check (status = 'pending' and public.is_provider_member(provider_id));
create policy "Admins moderate gallery"
on public.provider_gallery for update to authenticated
using (public.is_saino_admin())
with check (public.is_saino_admin());
create policy "Admins delete gallery items"
on public.provider_gallery for delete to authenticated
using ((status = 'pending' and public.is_provider_member(provider_id)) or public.is_saino_admin());

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
create policy "Signed-in patients submit pending reviews"
on public.reviews for insert to authenticated
with check (author_id = (select auth.uid()) and status = 'pending');
create policy "Admins moderate reviews"
on public.reviews for update to authenticated
using (public.is_saino_admin())
with check (public.is_saino_admin());
create policy "Admins delete reviews"
on public.reviews for delete to authenticated
using (public.is_saino_admin());

create policy "Patients and provider teams read appointments"
on public.appointments for select to authenticated
using (
  patient_id = (select auth.uid())
  or public.is_saino_admin()
  or exists (
    select 1 from public.appointment_slots s
    where s.id = slot_id and public.is_provider_member(s.provider_id)
  )
);
create policy "Patients book published slots"
on public.appointments for insert to authenticated
with check (
  patient_id = (select auth.uid())
  and status = 'booked'
  and exists (
    select 1 from public.appointment_slots s
    join public.providers p on p.id = s.provider_id
    where s.id = slot_id and s.status = 'active'
      and s.starts_at > now()
      and s.booked_count < s.capacity
      and p.status = 'active' and p.verification_status = 'verified'
  )
);
create policy "Patients cancel own bookings; admins manage bookings"
on public.appointments for update to authenticated
using (patient_id = (select auth.uid()) or public.is_saino_admin())
with check (
  public.is_saino_admin()
  or (patient_id = (select auth.uid()) and status = 'cancelled')
);
create policy "Provider teams update appointment status"
on public.appointments for update to authenticated
using (
  public.is_saino_admin()
  or exists (
    select 1 from public.appointment_slots s
    where s.id = appointments.slot_id and public.is_provider_member(s.provider_id)
  )
)
with check (
  public.is_saino_admin()
  or exists (
    select 1 from public.appointment_slots s
    where s.id = appointments.slot_id and public.is_provider_member(s.provider_id)
  )
);

create or replace function public.sync_appointment_slot_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  slot_to_change uuid;
  capacity_delta integer;
begin
  if tg_op = 'INSERT' then
    slot_to_change := new.slot_id;
    capacity_delta := 1;
  elsif tg_op = 'UPDATE' then
    if old.status in ('booked', 'confirmed') and new.status not in ('booked', 'confirmed') then
      slot_to_change := old.slot_id;
      capacity_delta := -1;
    elsif old.status not in ('booked', 'confirmed') and new.status in ('booked', 'confirmed') then
      slot_to_change := new.slot_id;
      capacity_delta := 1;
    else
      return new;
    end if;
  else
    return old;
  end if;

  if capacity_delta = 1 then
    update public.appointment_slots
    set booked_count = booked_count + 1
    where id = slot_to_change and status = 'active' and booked_count < capacity;
    if not found then
      raise exception 'Appointment slot is no longer available';
    end if;
  else
    update public.appointment_slots
    set booked_count = greatest(0, booked_count - 1)
    where id = slot_to_change;
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_sync_slot_capacity on public.appointments;
create trigger appointments_sync_slot_capacity
after insert or update of status on public.appointments
for each row execute function public.sync_appointment_slot_capacity();

create or replace function public.review_provider_change_request(
  target_request_id uuid,
  decision text,
  decision_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  change_request public.provider_change_requests%rowtype;
  submitted_profile jsonb;
  submitted_content jsonb;
  content_id uuid;
begin
  if not public.is_saino_admin() then
    raise exception 'Only a SAINO super admin can review provider changes';
  end if;
  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;

  select * into change_request
  from public.provider_change_requests
  where id = target_request_id
  for update;

  if not found or change_request.status <> 'pending' then
    raise exception 'Pending provider change request not found';
  end if;
  submitted_profile := change_request.profile;

  if decision = 'approved' then
    if submitted_profile ? 'content' then
      submitted_content := submitted_profile -> 'content';
      if jsonb_typeof(submitted_content) <> 'object'
        or jsonb_typeof(submitted_content -> 'data') <> 'object' then
        raise exception 'Submitted content change is malformed';
      end if;
      content_id := (submitted_content ->> 'id')::uuid;

      if submitted_content ->> 'entity' = 'doctor' then
        update public.doctors
        set name = coalesce(submitted_content -> 'data' ->> 'name', name),
            specialty = coalesce(submitted_content -> 'data' ->> 'specialty', specialty),
            qualification = case when submitted_content -> 'data' ? 'qualification' then submitted_content -> 'data' ->> 'qualification' else qualification end,
            consultation_fee = case when submitted_content -> 'data' ? 'consultation_fee' then (submitted_content -> 'data' ->> 'consultation_fee')::numeric else consultation_fee end,
            about = case when submitted_content -> 'data' ? 'about' then submitted_content -> 'data' ->> 'about' else about end,
            photo_path = case when submitted_content -> 'data' ? 'photo_path' then submitted_content -> 'data' ->> 'photo_path' else photo_path end
        where id = content_id and provider_id = change_request.provider_id;
      elsif submitted_content ->> 'entity' = 'service' then
        update public.provider_services
        set name = coalesce(submitted_content -> 'data' ->> 'name', name),
            description = case when submitted_content -> 'data' ? 'description' then submitted_content -> 'data' ->> 'description' else description end,
            price = case when submitted_content -> 'data' ? 'price' then (submitted_content -> 'data' ->> 'price')::numeric else price end,
            duration_minutes = case when submitted_content -> 'data' ? 'duration_minutes' then (submitted_content -> 'data' ->> 'duration_minutes')::integer else duration_minutes end,
            telemedicine_enabled = coalesce((submitted_content -> 'data' ->> 'telemedicine_enabled')::boolean, telemedicine_enabled)
        where id = content_id and provider_id = change_request.provider_id;
      else
        raise exception 'Unsupported provider content change';
      end if;
      if not found then
        raise exception 'The provider content item was not found';
      end if;
    end if;

    if submitted_profile ? 'provider_type'
      and submitted_profile ->> 'provider_type' not in ('hospital', 'clinic', 'diagnostic_centre', 'other') then
      raise exception 'Invalid provider_type in submitted profile';
    end if;
    if submitted_profile ? 'plan'
      and submitted_profile ->> 'plan' not in ('saino_listed', 'saino_pro', 'saino_prime') then
      raise exception 'Invalid plan in submitted profile';
    end if;
    if submitted_profile ? 'opening_hours'
      and jsonb_typeof(submitted_profile -> 'opening_hours') <> 'object' then
      raise exception 'opening_hours must be a JSON object';
    end if;

    if submitted_profile ? 'social_links'
      and jsonb_typeof(submitted_profile -> 'social_links') <> 'object' then
      raise exception 'social_links must be a JSON object';
    end if;
    if submitted_profile ? 'emergency_available'
      and jsonb_typeof(submitted_profile -> 'emergency_available') <> 'boolean' then
      raise exception 'emergency_available must be a boolean';
    end if;
    if submitted_profile ? 'telemedicine_enabled'
      and jsonb_typeof(submitted_profile -> 'telemedicine_enabled') <> 'boolean' then
      raise exception 'telemedicine_enabled must be a boolean';
    end if;

    update public.providers
    set name = coalesce(submitted_profile ->> 'name', name),
        provider_type = coalesce(submitted_profile ->> 'provider_type', provider_type),
        plan = coalesce(submitted_profile ->> 'plan', plan),
        about = case when submitted_profile ? 'about' then submitted_profile ->> 'about' else about end,
        address = case when submitted_profile ? 'address' then submitted_profile ->> 'address' else address end,
        city = coalesce(submitted_profile ->> 'city', city),
        phone = case when submitted_profile ? 'phone' then submitted_profile ->> 'phone' else phone end,
        opening_hours = coalesce(submitted_profile -> 'opening_hours', opening_hours),
        logo_path = case when submitted_profile ? 'logo_path' then submitted_profile ->> 'logo_path' else logo_path end,
        cover_path = case when submitted_profile ? 'cover_path' then submitted_profile ->> 'cover_path' else cover_path end,
        social_links = coalesce(submitted_profile -> 'social_links', social_links),
        emergency_available = coalesce((submitted_profile ->> 'emergency_available')::boolean, emergency_available),
        telemedicine_enabled = coalesce((submitted_profile ->> 'telemedicine_enabled')::boolean, telemedicine_enabled),
        latitude = case when submitted_profile ? 'latitude' then (submitted_profile ->> 'latitude')::double precision else latitude end,
        longitude = case when submitted_profile ? 'longitude' then (submitted_profile ->> 'longitude')::double precision else longitude end,
        updated_at = now()
    where id = change_request.provider_id;
  end if;

  update public.provider_change_requests
  set status = decision,
      review_note = decision_note,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = change_request.id;
end;
$$;

create or replace function public.moderate_provider_submission(
  resource_type text,
  resource_id uuid,
  decision text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_status text;
begin
  if not public.is_saino_admin() then
    raise exception 'Only a SAINO super admin can moderate provider submissions';
  end if;
  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;
  next_status := case when decision = 'approved' then 'active' else 'rejected' end;

  if resource_type = 'doctor' then
    update public.doctors set status = next_status
    where id = resource_id and status = 'pending';
  elsif resource_type = 'service' then
    update public.provider_services set status = next_status
    where id = resource_id and status = 'pending';
  elsif resource_type = 'slot' then
    if decision = 'approved' and exists (
      select 1
      from public.appointment_slots s
      join public.provider_services ps on ps.id = s.service_id
      where s.id = resource_id and ps.status <> 'active'
    ) then
      raise exception 'Approve the linked service before publishing this appointment slot';
    end if;
    update public.appointment_slots set status = next_status
    where id = resource_id and status = 'pending';
  elsif resource_type = 'gallery' then
    update public.provider_gallery set status = next_status
    where id = resource_id and status = 'pending';
  elsif resource_type = 'offer' then
    update public.provider_offers set status = next_status
    where id = resource_id and status = 'pending';
  else
    raise exception 'Unsupported provider submission type';
  end if;

  if not found then
    raise exception 'Pending provider submission not found';
  end if;
end;
$$;

revoke all on function public.set_provider_member(uuid, uuid, text) from public;
revoke all on function public.set_provider_member_by_email(uuid, text, text) from public;
revoke all on function public.add_provider_queue_visit(uuid, text) from public;
revoke all on function public.advance_provider_queue(uuid, text) from public;
revoke all on function public.review_provider_change_request(uuid, text, text) from public;
revoke all on function public.moderate_provider_submission(text, uuid, text) from public;
revoke all on function public.create_provider_notification() from public;
revoke all on function public.provider_plan_level(uuid) from public;
revoke all on function public.provider_has_review_access(uuid) from public;
revoke all on function public.provider_has_vvip_access(uuid) from public;
revoke all on function public.enforce_provider_service_limit() from public;
revoke all on function public.sync_provider_marketplace_priority() from public;
revoke all on function public.submit_provider_application(jsonb, text[], text) from public;
revoke all on function public.provider_application_upload_allowed(uuid, uuid) from public;
revoke all on function public.attach_provider_application_documents(uuid, uuid, text[]) from public;
revoke all on function public.review_provider_application(uuid, text, text) from public;
grant execute on function public.set_provider_member(uuid, uuid, text) to authenticated;
grant execute on function public.set_provider_member_by_email(uuid, text, text) to authenticated;
grant execute on function public.add_provider_queue_visit(uuid, text) to authenticated;
grant execute on function public.advance_provider_queue(uuid, text) to authenticated;
grant execute on function public.review_provider_change_request(uuid, text, text) to authenticated;
grant execute on function public.moderate_provider_submission(text, uuid, text) to authenticated;
grant execute on function public.is_provider_member(uuid) to anon, authenticated;
grant execute on function public.provider_has_review_access(uuid) to anon, authenticated;
grant execute on function public.provider_has_vvip_access(uuid) to anon, authenticated;
grant execute on function public.submit_provider_application(jsonb, text[], text) to anon, authenticated;
grant execute on function public.provider_application_upload_allowed(uuid, uuid) to anon, authenticated;
grant execute on function public.attach_provider_application_documents(uuid, uuid, text[]) to anon, authenticated;
grant execute on function public.review_provider_application(uuid, text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('provider-gallery', 'provider-gallery', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('provider-application-documents', 'provider-application-documents', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "Applicants upload documents with their private token" on storage.objects;
create policy "Applicants upload documents with their private token"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'provider-application-documents'
  and public.provider_application_upload_allowed(
    ((storage.foldername(name))[1])::uuid,
    ((storage.foldername(name))[2])::uuid
  )
);
drop policy if exists "Super admins read submitted provider documents" on storage.objects;
create policy "Super admins read submitted provider documents"
on storage.objects for select to authenticated
using (bucket_id = 'provider-application-documents' and public.is_saino_admin());

create policy "Provider teams upload images to their own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'provider-gallery'
  and (storage.foldername(name))[1] in (
    select pm.provider_id::text
    from public.provider_members pm
    where pm.user_id = (select auth.uid())
  )
);
create policy "Provider teams delete images from their own folder"
on storage.objects for delete to authenticated
using (
  bucket_id = 'provider-gallery'
  and (storage.foldername(name))[1] in (
    select pm.provider_id::text
    from public.provider_members pm
    where pm.user_id = (select auth.uid()    )
    and not exists (
      select 1 from public.providers p
      where storage.objects.name in (p.logo_path, p.cover_path)
    )
    and not exists (
      select 1 from public.provider_gallery g
      where g.storage_path = storage.objects.name and g.status = 'active'
    )
    and not exists (
      select 1 from public.doctors d
      where d.photo_path = storage.objects.name and d.status = 'active'
    )
  );
);
create policy "Provider teams read and admins manage gallery files"
on storage.objects for select to authenticated
using (
  bucket_id = 'provider-gallery'
  and (
    public.is_saino_admin()
    or (storage.foldername(name))[1] in (
      select pm.provider_id::text
      from public.provider_members pm
      where pm.user_id = (select auth.uid())
    )
  )
);
create policy "Admins delete gallery files"
on storage.objects for delete to authenticated
using (bucket_id = 'provider-gallery' and public.is_saino_admin());
