# Ledger CRM — Database Changes Required

This document contains the exact SQL needed to create all Supabase tables, seed data, and RLS policies for the Ledger CRM application. Run these in the Supabase SQL Editor in order.

---

## Overview of Changes

### Tables Already Defined in `database.types.ts` (need creation in Supabase)

| Table | Purpose | Used By |
|-------|---------|---------|
| `activities` | Activity log entries | `useActivities`, `useLeads`, `useDeals` |
| `leads` | Lead records | `useLeads` |
| `contacts` | Contact directory | `useContacts` |
| `deals` | Sales pipeline deals | `useDeals` |
| `agents` | AI agent configs | `useAgents` |
| `skills` | Available agent skills | `useAgents` |
| `tools` | Available agent tools | `useAgents` |
| `agent_skills` | Agent-skill junction | `useAgents` |
| `agent_tools` | Agent-tool junction | `useAgents` |
| `flows` | Automation workflows | `useFlows` |
| `flow_nodes` | Nodes within flows | `useFlows` |
| `flow_connections` | Connections between nodes | `useFlows` |

### New Tables (not in `database.types.ts` yet — need types + creation)

| Table | Purpose | Used By |
|-------|---------|---------|
| `discovery_campaigns` | AI lead discovery campaigns | `useDiscovery` |
| `discovered_leads` | Leads found by AI agents | `useDiscovery` |
| `agent_activities` | Agent action log entries | `useDiscovery` |
| `bug_reports` | User-submitted bug reports | `useBugReports` |
| `documents` | Document library records | `useDocuments` (to be created) |

---

## Part 1: Core CRM Tables

```sql
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
```

## Part 2: Agent & Skills Tables

```sql
-- ============================================
-- 5. AGENTS TABLE
-- ============================================
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'inactive',
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 6. SKILLS TABLE
-- ============================================
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  created_at timestamptz not null default now()
);

-- ============================================
-- 7. TOOLS TABLE
-- ============================================
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  config_schema jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================
-- 8. AGENT_SKILLS JUNCTION TABLE
-- ============================================
create table if not exists public.agent_skills (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (agent_id, skill_id)
);

-- ============================================
-- 9. AGENT_TOOLS JUNCTION TABLE
-- ============================================
create table if not exists public.agent_tools (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (agent_id, tool_id)
);
```

## Part 3: Flow / Automation Tables

```sql
-- ============================================
-- 10. FLOWS TABLE
-- ============================================
create table if not exists public.flows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'draft',
  trigger_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 11. FLOW_NODES TABLE
-- ============================================
create table if not exists public.flow_nodes (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.flows(id) on delete cascade,
  node_type text not null,
  label text not null,
  config jsonb not null default '{}',
  position_x real not null default 0,
  position_y real not null default 0,
  created_at timestamptz not null default now()
);

create index idx_flow_nodes_flow on public.flow_nodes (flow_id);

-- ============================================
-- 12. FLOW_CONNECTIONS TABLE
-- ============================================
create table if not exists public.flow_connections (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.flows(id) on delete cascade,
  from_node_id uuid not null references public.flow_nodes(id) on delete cascade,
  to_node_id uuid not null references public.flow_nodes(id) on delete cascade,
  label text,
  created_at timestamptz not null default now()
);

create index idx_flow_connections_flow on public.flow_connections (flow_id);
```

## Part 4: New Tables (Discovery, Bug Reports, Documents)

These tables are NOT yet in `database.types.ts` — the types file needs to be updated after these are created.

```sql
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
```

## Part 5: Seed Data for Skills & Tools

The agents page expects these records to exist in the `skills` and `tools` tables.

```sql
-- ============================================
-- SEED: SKILLS
-- ============================================
insert into public.skills (name, description, icon) values
  ('Web Scraping', 'Extract data from websites and web applications', 'Globe'),
  ('LinkedIn Search', 'Search and analyze LinkedIn profiles and companies', 'Linkedin'),
  ('Email Enrichment', 'Find and verify email addresses for leads', 'Mail'),
  ('Company Research', 'Deep research on company financials, news, and signals', 'Building2'),
  ('Signal Detection', 'Detect buying signals from social media and news', 'Radio'),
  ('Lead Scoring', 'Score leads based on ICP fit and engagement signals', 'Target'),
  ('Data Validation', 'Validate and clean lead data quality', 'ShieldCheck'),
  ('Content Analysis', 'Analyze blog posts, press releases, and social content', 'FileText')
on conflict do nothing;

-- ============================================
-- SEED: TOOLS
-- ============================================
insert into public.tools (name, description, icon, config_schema) values
  ('LinkedIn API', 'Access LinkedIn data for prospecting and enrichment', 'Linkedin', '{"api_key": "", "rate_limit": 100}'),
  ('Hunter.io', 'Email finding and verification service', 'Search', '{"api_key": "", "credits_per_month": 500}'),
  ('Clearbit', 'Company and contact data enrichment', 'Database', '{"api_key": ""}'),
  ('Google Search', 'Search the web for company and contact information', 'Globe', '{"api_key": "", "cx": ""}'),
  ('Crunchbase', 'Startup and company funding data', 'TrendingUp', '{"api_key": ""}'),
  ('Twitter API', 'Monitor tweets and social signals', 'Twitter', '{"bearer_token": ""}'),
  ('Slack Webhook', 'Send notifications to Slack channels', 'MessageSquare', '{"webhook_url": ""}'),
  ('SendGrid', 'Send outreach emails at scale', 'Send', '{"api_key": "", "from_email": ""}')
on conflict do nothing;
```

## Part 6: Updated `database.types.ts`

After running the SQL above, update `app/types/database.types.ts` to include the 5 new tables. The new type definitions to add:

```
discovery_campaigns — matches DiscoveryCampaign interface in useDiscovery.ts
discovered_leads — matches DiscoveredLead interface in useDiscovery.ts
agent_activities — matches AgentActivity interface in useDiscovery.ts
bug_reports — matches BugReport interface in useBugReports.ts
documents — new table for document management
```

---

## Part 7: `updated_at` Auto-Update Trigger

Tables with `updated_at` columns should auto-update on row modification:

```sql
-- Create the trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
create trigger set_updated_at before update on public.leads
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.contacts
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.deals
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.agents
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.flows
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.discovery_campaigns
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.documents
  for each row execute function public.handle_updated_at();
```

---

## Part 8: RLS Policies (Permissive — No Auth)

Since the app currently has no authentication, enable RLS with permissive policies. This allows all operations but ensures RLS is in place for when auth is added later.

```sql
-- Enable RLS on all tables
alter table public.activities enable row level security;
alter table public.leads enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.agents enable row level security;
alter table public.skills enable row level security;
alter table public.tools enable row level security;
alter table public.agent_skills enable row level security;
alter table public.agent_tools enable row level security;
alter table public.flows enable row level security;
alter table public.flow_nodes enable row level security;
alter table public.flow_connections enable row level security;
alter table public.discovery_campaigns enable row level security;
alter table public.discovered_leads enable row level security;
alter table public.agent_activities enable row level security;
alter table public.bug_reports enable row level security;
alter table public.documents enable row level security;

-- Permissive policies for anon access (no auth required)
-- Replace these with proper user-based policies when auth is added

create policy "Allow all access" on public.activities for all using (true) with check (true);
create policy "Allow all access" on public.leads for all using (true) with check (true);
create policy "Allow all access" on public.contacts for all using (true) with check (true);
create policy "Allow all access" on public.deals for all using (true) with check (true);
create policy "Allow all access" on public.agents for all using (true) with check (true);
create policy "Allow all access" on public.skills for all using (true) with check (true);
create policy "Allow all access" on public.tools for all using (true) with check (true);
create policy "Allow all access" on public.agent_skills for all using (true) with check (true);
create policy "Allow all access" on public.agent_tools for all using (true) with check (true);
create policy "Allow all access" on public.flows for all using (true) with check (true);
create policy "Allow all access" on public.flow_nodes for all using (true) with check (true);
create policy "Allow all access" on public.flow_connections for all using (true) with check (true);
create policy "Allow all access" on public.discovery_campaigns for all using (true) with check (true);
create policy "Allow all access" on public.discovered_leads for all using (true) with check (true);
create policy "Allow all access" on public.agent_activities for all using (true) with check (true);
create policy "Allow all access" on public.bug_reports for all using (true) with check (true);
create policy "Allow all access" on public.documents for all using (true) with check (true);
```

---

## Execution Order

Run the SQL in this order:

1. **Part 1**: Core CRM tables (activities, leads, contacts, deals)
2. **Part 2**: Agent & skills tables (agents, skills, tools, agent_skills, agent_tools)
3. **Part 3**: Flow tables (flows, flow_nodes, flow_connections)
4. **Part 4**: New tables (discovery_campaigns, discovered_leads, agent_activities, bug_reports, documents)
5. **Part 5**: Seed data (skills, tools)
6. **Part 7**: Updated_at triggers
7. **Part 8**: RLS policies
8. **Part 9**: AI Agent Execution tables (agent_runs, agent_steps, campaign_metrics, api_usage)
9. **Part 10**: Updated seed data (replaces Part 5 seeds with real tool implementations)
10. **Part 11**: Marketplace columns, categories, and marketplace seed data
11. **Part 12**: Multi-agent campaign support (agent_ids array, flow webhook columns)

After running the SQL, update `database.types.ts` with the 5 new table types (Part 6).

---

## Code Changes Required After DB Setup

---

## Part 9: AI Agent Execution Tables (NEW)

These tables support the AI agent execution engine (Inngest + Vercel AI SDK).

```sql
-- ============================================
-- PART 9: AI Agent Execution Tables
-- ============================================

-- agent_runs: track each campaign execution
CREATE TABLE agent_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES discovery_campaigns(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL DEFAULT 'full_pipeline',
  status TEXT DEFAULT 'pending',
  inngest_run_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  steps_completed INTEGER DEFAULT 0,
  steps_total INTEGER,
  leads_found INTEGER DEFAULT 0,
  error_message TEXT,
  llm_tokens_used INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- agent_steps: each tool call made by an agent during a run
CREATE TABLE agent_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES discovery_campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  tool_name TEXT NOT NULL,
  tool_input JSONB,
  tool_output JSONB,
  status TEXT DEFAULT 'running',
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- campaign_metrics: daily aggregated stats per campaign
CREATE TABLE campaign_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES discovery_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  leads_discovered INTEGER DEFAULT 0,
  leads_enriched INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  leads_approved INTEGER DEFAULT 0,
  leads_rejected INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  llm_tokens INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, date)
);

-- api_usage: per-call API usage tracking
CREATE TABLE api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  campaign_id UUID REFERENCES discovery_campaigns(id),
  run_id UUID REFERENCES agent_runs(id),
  credits_used INTEGER DEFAULT 1,
  response_status INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to discovery_campaigns for agent config
ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS agent_config JSONB DEFAULT '{}';
ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS schedule_cron TEXT;
ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS max_leads_per_run INTEGER DEFAULT 50;
ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS total_runs INTEGER DEFAULT 0;
ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;

-- Indexes for performance
CREATE INDEX idx_agent_runs_campaign ON agent_runs(campaign_id);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_steps_run ON agent_steps(run_id);
CREATE INDEX idx_agent_steps_campaign ON agent_steps(campaign_id);
CREATE INDEX idx_campaign_metrics_campaign ON campaign_metrics(campaign_id);
CREATE INDEX idx_api_usage_provider ON api_usage(provider);
CREATE INDEX idx_api_usage_campaign ON api_usage(campaign_id);

-- RLS (permissive — no auth)
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on agent_runs" ON agent_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on agent_steps" ON agent_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on campaign_metrics" ON campaign_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on api_usage" ON api_usage FOR ALL USING (true) WITH CHECK (true);

-- updated_at trigger for agent_runs
CREATE TRIGGER agent_runs_updated_at BEFORE UPDATE ON agent_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Part 10: Updated Seed Data for Skills & Tools

Replace the seed data from Part 5 with these updated entries that match the real tool implementations:

```sql
-- ============================================
-- PART 10: Updated Seed Data
-- ============================================

-- Delete old seed data and re-insert
DELETE FROM agent_skills;
DELETE FROM agent_tools;
DELETE FROM skills;
DELETE FROM tools;

-- Skills (match agent capabilities)
INSERT INTO skills (name, description, icon) VALUES
  ('Company Search', 'Search for companies by industry, size, and location', 'Search'),
  ('Contact Finding', 'Find people at specific companies by role/title', 'Users'),
  ('Email Discovery', 'Find and verify email addresses for contacts', 'Mail'),
  ('Website Intelligence', 'Extract structured data from company websites', 'Globe'),
  ('Lead Scoring', 'AI-powered ICP fit analysis and scoring', 'Target'),
  ('Data Enrichment', 'Augment lead records with additional firmographic data', 'Database'),
  ('Email Verification', 'Validate email deliverability before outreach', 'Shield');

-- Tools (match server/tools/ implementations)
INSERT INTO tools (name, description, icon, config_schema) VALUES
  ('Apollo.io', 'B2B company and contact search API with 200M+ contacts', 'Search', '{"api_key": "string"}'),
  ('Hunter.io', 'Email finding and verification service', 'Mail', '{"api_key": "string"}'),
  ('People Data Labs', 'Person and company enrichment API with 3B+ records', 'Database', '{"api_key": "string"}'),
  ('Firecrawl', 'AI-powered web scraping and content extraction', 'Globe', '{"api_key": "string"}'),
  ('Jina Reader', 'URL to clean markdown text conversion', 'FileOutput', '{"api_key": "string"}'),
  ('ZeroBounce', 'Email validation and deliverability verification', 'Shield', '{"api_key": "string"}');

-- Pre-configured agents
INSERT INTO agents (name, description, status, config) VALUES
  ('Lead Scout', 'Searches company databases and websites to discover potential leads matching your ICP criteria.', 'active', '{"type": "discovery", "maxSteps": 25}'),
  ('Lead Enricher', 'Enriches discovered leads with detailed contact info, company data, and verified emails.', 'active', '{"type": "enrichment", "maxSteps": 15}'),
  ('Lead Qualifier', 'Analyzes and scores leads against your ICP using AI to determine fit and priority.', 'active', '{"type": "qualification", "maxSteps": 10}');
```

---

After the database is set up, the following code changes are needed:

1. **Update `database.types.ts`** — Add type definitions for `discovery_campaigns`, `discovered_leads`, `agent_activities`, `bug_reports`, `documents`

2. **Rewrite `useDiscovery.ts`** — Replace mock data with real Supabase CRUD operations

3. **Create `useDocuments.ts`** — New composable for document CRUD operations

4. **Update `documents.vue`** — Replace hardcoded mock data with `useDocuments` composable

5. **Update `activity.vue`** — Switch from `useDiscovery.agentActivities` to reading from `agent_activities` table

6. **Update `analytics.vue`** — Replace mock campaign data with real `discovery_campaigns` queries

7. **Update `dashboard (index.vue)`** — Connect discovery stats to real data

---

## Part 11: Marketplace Columns & Agent-Campaign Wiring

These changes add marketplace support to skills/tools and enable the agent-campaign connection.

### 11A. Add marketplace columns to skills & tools

```sql
-- Add marketplace columns to skills
ALTER TABLE skills ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'built_in';

-- Add marketplace columns to tools
ALTER TABLE tools ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'built_in';

-- Index for marketplace browsing
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_source ON skills(source);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_source ON tools(source);
```

### 11B. Update existing seed data with categories

```sql
-- Categorize existing skills
UPDATE skills SET category = 'data_collection' WHERE name IN ('Company Search', 'Contact Finding', 'Website Intelligence');
UPDATE skills SET category = 'enrichment' WHERE name IN ('Email Discovery', 'Data Enrichment', 'Email Verification');
UPDATE skills SET category = 'analysis' WHERE name IN ('Lead Scoring');

-- Categorize existing tools
UPDATE tools SET category = 'search' WHERE name IN ('Apollo.io');
UPDATE tools SET category = 'email' WHERE name IN ('Hunter.io', 'ZeroBounce');
UPDATE tools SET category = 'enrichment' WHERE name IN ('People Data Labs');
UPDATE tools SET category = 'scraping' WHERE name IN ('Firecrawl', 'Jina Reader');
```

### 11C. Add marketplace skills & tools

```sql
-- Marketplace skills (community/external)
INSERT INTO skills (name, description, icon, category, source) VALUES
  ('Social Monitoring', 'Track social media mentions and engagement signals', 'Radio', 'intelligence', 'marketplace'),
  ('CRM Sync', 'Sync discovered leads to your CRM automatically', 'Database', 'integration', 'marketplace'),
  ('Competitive Intel', 'Monitor competitor activities and positioning', 'Eye', 'intelligence', 'marketplace'),
  ('Intent Detection', 'Detect purchase intent from web activity', 'Target', 'analysis', 'marketplace')
ON CONFLICT DO NOTHING;

-- Marketplace tools (community/external)
INSERT INTO tools (name, description, icon, config_schema, category, source) VALUES
  ('Clearbit', 'Company and contact enrichment API', 'Database', '{"api_key": "string"}', 'enrichment', 'marketplace'),
  ('Crunchbase', 'Startup funding and company intelligence', 'TrendingUp', '{"api_key": "string"}', 'intelligence', 'marketplace'),
  ('PhantomBuster', 'Cloud-based scraping and automation', 'Globe', '{"api_key": "string"}', 'scraping', 'marketplace'),
  ('Snov.io', 'Email finder and outreach platform', 'Mail', '{"api_key": "string"}', 'email', 'marketplace')
ON CONFLICT DO NOTHING;
```

### 11D. Agent-Campaign connection

The `discovery_campaigns.agent_id` column already exists (see Part 4, line `agent_id uuid references public.agents(id) on delete set null`). The frontend now uses this column when creating campaigns — users select an agent in the campaign creation dialog, and the `agent_id` is stored on the campaign record.

No additional SQL is needed for this — the column and FK constraint are already in place.

---

## Part 12: Multi-Agent Campaign Support

Campaigns now support multiple assigned agents. Each agent has different capabilities (discovery, enrichment, qualification), so users can combine agents for broader coverage. The `agent_ids` column stores an array of agent UUIDs alongside the legacy `agent_id` column for backward compatibility.

### 12A. Add `agent_ids` array column to `discovery_campaigns`

```sql
-- Add multi-agent support to discovery_campaigns
ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS agent_ids UUID[] DEFAULT '{}';

-- Index for querying campaigns by agent
CREATE INDEX IF NOT EXISTS idx_discovery_campaigns_agent_ids ON discovery_campaigns USING GIN (agent_ids);
```

### 12B. Migrate existing single-agent campaigns

If you have existing campaigns with `agent_id` set, run this to populate `agent_ids`:

```sql
-- Backfill agent_ids from legacy agent_id column
UPDATE discovery_campaigns
SET agent_ids = ARRAY[agent_id]
WHERE agent_id IS NOT NULL
  AND (agent_ids IS NULL OR agent_ids = '{}');
```

### 12C. Flow trigger webhook_secret column (for webhook flows)

```sql
-- Add webhook secret for secure webhook trigger validation
ALTER TABLE flows ADD COLUMN IF NOT EXISTS webhook_secret TEXT;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMPTZ;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS trigger_count INTEGER DEFAULT 0;
```

### 12D. Notes

- The frontend now requires at least one agent when creating a campaign (no longer optional)
- The `agent_id` column is kept for backward compatibility — it stores the first agent from `agent_ids`
- The campaign start API resolves `agent_ids` first, falling back to `agent_id` for older campaigns
- `database.types.ts` already has `agent_ids: string[]` on the `discovery_campaigns` type
