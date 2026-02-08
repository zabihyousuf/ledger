-- ============================================
-- PART 2: AGENT & SKILLS TABLES
-- ============================================
-- Creates: agents, skills, tools, agent_skills, agent_tools

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
