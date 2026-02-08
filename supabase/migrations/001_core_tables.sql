-- ============================================
-- PART 1: CORE CRM TABLES
-- ============================================
-- Creates: activities, leads, contacts, deals

-- ============================================
-- 1. ACTIVITIES TABLE
-- ============================================
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  description text,
  related_to_type text,
  related_to_id text,
  user_id text,
  created_at timestamptz not null default now()
);

create index idx_activities_created_at on public.activities (created_at desc);
create index idx_activities_related on public.activities (related_to_type, related_to_id);

-- ============================================
-- 2. LEADS TABLE
-- ============================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  company text,
  position text,
  status text not null default 'new',
  source text not null default 'manual',
  score integer,
  value numeric,
  notes text,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_leads_status on public.leads (status);
create index idx_leads_source on public.leads (source);
create index idx_leads_created_at on public.leads (created_at desc);

-- ============================================
-- 3. CONTACTS TABLE
-- ============================================
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  company text,
  position text,
  linkedin_url text,
  twitter_url text,
  tags text[],
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contacts_email on public.contacts (email);
create index idx_contacts_company on public.contacts (company);

-- ============================================
-- 4. DEALS TABLE
-- ============================================
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  value numeric not null default 0,
  stage text not null default 'prospecting',
  probability integer,
  expected_close_date date,
  actual_close_date date,
  assigned_to text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_deals_stage on public.deals (stage);
create index idx_deals_contact on public.deals (contact_id);
create index idx_deals_lead on public.deals (lead_id);
