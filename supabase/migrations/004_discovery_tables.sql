-- ============================================
-- PART 4: DISCOVERY & NEW FEATURE TABLES
-- ============================================
-- Creates: discovery_campaigns, discovered_leads, agent_activities, bug_reports, documents

-- ============================================
-- 13. DISCOVERY_CAMPAIGNS TABLE
-- ============================================
create table if not exists public.discovery_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft',
  target_industry text not null,
  target_roles text[] not null default '{}',
  target_company_size text not null,
  target_region text not null,
  search_criteria text not null,
  agent_id uuid references public.agents(id) on delete set null,
  leads_found integer not null default 0,
  leads_approved integer not null default 0,
  leads_rejected integer not null default 0,
  confidence_threshold integer not null default 70,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_discovery_campaigns_status on public.discovery_campaigns (status);

-- ============================================
-- 14. DISCOVERED_LEADS TABLE
-- ============================================
create table if not exists public.discovered_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.discovery_campaigns(id) on delete cascade,
  name text not null,
  email text,
  company text,
  position text,
  linkedin_url text,
  confidence_score integer not null default 0,
  discovery_source text not null,
  status text not null default 'pending_review',
  ai_summary text not null,
  signals text[] not null default '{}',
  discovered_at timestamptz not null default now()
);

create index idx_discovered_leads_campaign on public.discovered_leads (campaign_id);
create index idx_discovered_leads_status on public.discovered_leads (status);

-- ============================================
-- 15. AGENT_ACTIVITIES TABLE
-- ============================================
create table if not exists public.agent_activities (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  agent_name text not null,
  campaign_id uuid references public.discovery_campaigns(id) on delete set null,
  action text not null,
  detail text not null,
  status text not null default 'running',
  timestamp timestamptz not null default now()
);

create index idx_agent_activities_agent on public.agent_activities (agent_id);
create index idx_agent_activities_campaign on public.agent_activities (campaign_id);
create index idx_agent_activities_timestamp on public.agent_activities (timestamp desc);

-- ============================================
-- 16. BUG_REPORTS TABLE
-- ============================================
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  page_url text not null,
  screenshot_data text,
  browser_info text not null,
  viewport text not null,
  console_errors text[] not null default '{}',
  status text not null default 'open',
  created_at timestamptz not null default now()
);

-- ============================================
-- 17. DOCUMENTS TABLE
-- ============================================
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'report',
  status text not null default 'draft',
  size integer not null default 0,
  deal_id uuid references public.deals(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  file_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_documents_type on public.documents (type);
create index idx_documents_status on public.documents (status);
create index idx_documents_deal on public.documents (deal_id);
