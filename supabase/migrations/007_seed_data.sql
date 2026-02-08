-- ============================================
-- PART 7: SEED DATA
-- ============================================
-- Seeds: skills, tools, pre-configured agents, marketplace items

-- ============================================
-- DELETE OLD SEED DATA (IF ANY)
-- ============================================
DELETE FROM agent_skills;
DELETE FROM agent_tools;
DELETE FROM skills;
DELETE FROM tools;

-- ============================================
-- SEED: SKILLS (BUILT-IN)
-- ============================================
INSERT INTO skills (name, description, icon, category, source) VALUES
  ('Company Search', 'Search for companies by industry, size, and location', 'Search', 'data_collection', 'built_in'),
  ('Contact Finding', 'Find people at specific companies by role/title', 'Users', 'data_collection', 'built_in'),
  ('Email Discovery', 'Find and verify email addresses for contacts', 'Mail', 'enrichment', 'built_in'),
  ('Website Intelligence', 'Extract structured data from company websites', 'Globe', 'data_collection', 'built_in'),
  ('Lead Scoring', 'AI-powered ICP fit analysis and scoring', 'Target', 'analysis', 'built_in'),
  ('Data Enrichment', 'Augment lead records with additional firmographic data', 'Database', 'enrichment', 'built_in'),
  ('Email Verification', 'Validate email deliverability before outreach', 'Shield', 'enrichment', 'built_in')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: TOOLS (BUILT-IN)
-- ============================================
INSERT INTO tools (name, description, icon, config_schema, category, source) VALUES
  ('Apollo.io', 'B2B company and contact search API with 200M+ contacts', 'Search', '{"api_key": "string"}', 'search', 'built_in'),
  ('Hunter.io', 'Email finding and verification service', 'Mail', '{"api_key": "string"}', 'email', 'built_in'),
  ('People Data Labs', 'Person and company enrichment API with 3B+ records', 'Database', '{"api_key": "string"}', 'enrichment', 'built_in'),
  ('Firecrawl', 'AI-powered web scraping and content extraction', 'Globe', '{"api_key": "string"}', 'scraping', 'built_in'),
  ('Jina Reader', 'URL to clean markdown text conversion', 'FileOutput', '{"api_key": "string"}', 'scraping', 'built_in'),
  ('ZeroBounce', 'Email validation and deliverability verification', 'Shield', '{"api_key": "string"}', 'email', 'built_in')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: MARKETPLACE SKILLS
-- ============================================
INSERT INTO skills (name, description, icon, category, source) VALUES
  ('Social Monitoring', 'Track social media mentions and engagement signals', 'Radio', 'intelligence', 'marketplace'),
  ('CRM Sync', 'Sync discovered leads to your CRM automatically', 'Database', 'integration', 'marketplace'),
  ('Competitive Intel', 'Monitor competitor activities and positioning', 'Eye', 'intelligence', 'marketplace'),
  ('Intent Detection', 'Detect purchase intent from web activity', 'Target', 'analysis', 'marketplace')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: MARKETPLACE TOOLS
-- ============================================
INSERT INTO tools (name, description, icon, config_schema, category, source) VALUES
  ('Clearbit', 'Company and contact enrichment API', 'Database', '{"api_key": "string"}', 'enrichment', 'marketplace'),
  ('Crunchbase', 'Startup funding and company intelligence', 'TrendingUp', '{"api_key": "string"}', 'intelligence', 'marketplace'),
  ('PhantomBuster', 'Cloud-based scraping and automation', 'Globe', '{"api_key": "string"}', 'scraping', 'marketplace'),
  ('Snov.io', 'Email finder and outreach platform', 'Mail', '{"api_key": "string"}', 'email', 'marketplace')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: PRE-CONFIGURED AGENTS
-- ============================================
INSERT INTO agents (name, description, status, config) VALUES
  ('Lead Scout', 'Searches company databases and websites to discover potential leads matching your ICP criteria.', 'active', '{"type": "discovery", "maxSteps": 25}'),
  ('Lead Enricher', 'Enriches discovered leads with detailed contact info, company data, and verified emails.', 'active', '{"type": "enrichment", "maxSteps": 15}'),
  ('Lead Qualifier', 'Analyzes and scores leads against your ICP using AI to determine fit and priority.', 'active', '{"type": "qualification", "maxSteps": 10}')
ON CONFLICT DO NOTHING;
