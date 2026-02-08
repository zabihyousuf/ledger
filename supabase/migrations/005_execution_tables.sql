-- ============================================
-- PART 5: AI AGENT EXECUTION TABLES
-- ============================================
-- Creates: agent_runs, agent_steps, campaign_metrics, api_usage
-- Adds columns to discovery_campaigns for agent config

-- ============================================
-- AGENT_RUNS TABLE
-- ============================================
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

-- ============================================
-- AGENT_STEPS TABLE
-- ============================================
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

-- ============================================
-- CAMPAIGN_METRICS TABLE
-- ============================================
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

-- ============================================
-- API_USAGE TABLE
-- ============================================
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

-- ============================================
-- ADD COLUMNS TO DISCOVERY_CAMPAIGNS
-- ============================================
ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS agent_config JSONB DEFAULT '{}';
ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS schedule_cron TEXT;
ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS max_leads_per_run INTEGER DEFAULT 50;
ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS total_runs INTEGER DEFAULT 0;
ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_agent_runs_campaign ON agent_runs(campaign_id);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_steps_run ON agent_steps(run_id);
CREATE INDEX idx_agent_steps_campaign ON agent_steps(campaign_id);
CREATE INDEX idx_campaign_metrics_campaign ON campaign_metrics(campaign_id);
CREATE INDEX idx_api_usage_provider ON api_usage(provider);
CREATE INDEX idx_api_usage_campaign ON api_usage(campaign_id);
