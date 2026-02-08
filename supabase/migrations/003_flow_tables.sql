-- ============================================
-- PART 3: FLOW / AUTOMATION TABLES
-- ============================================
-- Creates: flows, flow_nodes, flow_connections

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
