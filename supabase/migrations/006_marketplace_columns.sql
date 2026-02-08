-- ============================================
-- PART 6: MARKETPLACE COLUMNS & MULTI-AGENT CAMPAIGNS
-- ============================================
-- Adds: marketplace columns to skills/tools, agent_ids array, flow webhook columns

-- ============================================
-- ADD MARKETPLACE COLUMNS TO SKILLS
-- ============================================
ALTER TABLE skills ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'built_in';

-- ============================================
-- ADD MARKETPLACE COLUMNS TO TOOLS
-- ============================================
ALTER TABLE tools ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'built_in';

-- ============================================
-- INDEXES FOR MARKETPLACE BROWSING
-- ============================================
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_source ON skills(source);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_source ON tools(source);

-- ============================================
-- CATEGORIZE EXISTING SKILLS
-- ============================================
UPDATE skills SET category = 'data_collection' WHERE name IN ('Company Search', 'Contact Finding', 'Website Intelligence');
UPDATE skills SET category = 'enrichment' WHERE name IN ('Email Discovery', 'Data Enrichment', 'Email Verification');
UPDATE skills SET category = 'analysis' WHERE name IN ('Lead Scoring');

-- ============================================
-- CATEGORIZE EXISTING TOOLS
-- ============================================
UPDATE tools SET category = 'search' WHERE name IN ('Apollo.io');
UPDATE tools SET category = 'email' WHERE name IN ('Hunter.io', 'ZeroBounce');
UPDATE tools SET category = 'enrichment' WHERE name IN ('People Data Labs');
UPDATE tools SET category = 'scraping' WHERE name IN ('Firecrawl', 'Jina Reader');

-- ============================================
-- MULTI-AGENT CAMPAIGN SUPPORT
-- ============================================
ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS agent_ids UUID[] DEFAULT '{}';

-- Index for querying campaigns by agent
CREATE INDEX IF NOT EXISTS idx_discovery_campaigns_agent_ids ON discovery_campaigns USING GIN (agent_ids);

-- Backfill agent_ids from legacy agent_id column
UPDATE discovery_campaigns
SET agent_ids = ARRAY[agent_id]
WHERE agent_id IS NOT NULL
  AND (agent_ids IS NULL OR agent_ids = '{}');

-- ============================================
-- FLOW WEBHOOK COLUMNS
-- ============================================
ALTER TABLE flows ADD COLUMN IF NOT EXISTS webhook_secret TEXT;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMPTZ;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS trigger_count INTEGER DEFAULT 0;
