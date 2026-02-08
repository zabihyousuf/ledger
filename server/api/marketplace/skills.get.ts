/**
 * GET /api/marketplace/skills
 *
 * Returns a curated catalog of skills available for AI agents.
 * These represent capabilities that can be attached to agents.
 *
 * Query params:
 *   ?category=discovery    — filter by category
 *   ?search=lead           — text search
 */

interface MarketplaceSkill {
  id: string
  name: string
  description: string
  icon: string
  category: string
  source: 'built_in' | 'marketplace'
  tags: string[]
}

// Curated catalog of skills for AI agents
const SKILL_CATALOG: MarketplaceSkill[] = [
  // ── Discovery ──
  { id: 'skill_lead_discovery', name: 'Lead Discovery', description: 'Search and identify potential leads matching your ideal customer profile from multiple data sources.', icon: 'Radar', category: 'discovery', source: 'built_in', tags: ['discovery', 'leads', 'icp'] },
  { id: 'skill_company_research', name: 'Company Research', description: 'Deep-dive research on target companies including tech stack, funding, and growth signals.', icon: 'Search', category: 'discovery', source: 'built_in', tags: ['research', 'company', 'intelligence'] },
  { id: 'skill_signal_detection', name: 'Signal Detection', description: 'Detect buying signals like funding rounds, new hires, technology changes, and expansion plans.', icon: 'Radio', category: 'discovery', source: 'built_in', tags: ['signals', 'buying intent', 'triggers'] },

  // ── Enrichment ──
  { id: 'skill_data_enrichment', name: 'Data Enrichment', description: 'Augment lead profiles with firmographic data, social links, job history, and company information.', icon: 'Database', category: 'enrichment', source: 'built_in', tags: ['enrichment', 'data', 'profiles'] },
  { id: 'skill_email_finding', name: 'Email Finding', description: 'Find and verify professional email addresses for discovered contacts using multiple providers.', icon: 'Mail', category: 'enrichment', source: 'built_in', tags: ['email', 'contact info', 'verification'] },
  { id: 'skill_web_scraping', name: 'Web Scraping', description: 'Extract structured data from company websites, blogs, and online profiles for lead intelligence.', icon: 'Globe', category: 'enrichment', source: 'built_in', tags: ['scraping', 'web data', 'extraction'] },

  // ── Qualification ──
  { id: 'skill_lead_scoring', name: 'Lead Scoring', description: 'Score and rank leads based on ICP fit, engagement signals, and predictive analytics.', icon: 'Target', category: 'qualification', source: 'built_in', tags: ['scoring', 'qualification', 'ranking'] },
  { id: 'skill_competitor_analysis', name: 'Competitor Analysis', description: 'Analyze competitor positioning, market dynamics, and identify displacement opportunities.', icon: 'TrendingUp', category: 'qualification', source: 'built_in', tags: ['competitor', 'market', 'analysis'] },

  // ── Outreach ──
  { id: 'skill_email_outreach', name: 'Email Outreach', description: 'Craft and send personalized outreach emails with A/B testing and follow-up sequences.', icon: 'Send', category: 'outreach', source: 'built_in', tags: ['email', 'outreach', 'personalization'] },
  { id: 'skill_social_monitoring', name: 'Social Monitoring', description: 'Monitor social media for mentions, buying signals, and engagement opportunities.', icon: 'Eye', category: 'outreach', source: 'built_in', tags: ['social', 'monitoring', 'engagement'] },
  { id: 'skill_meeting_scheduling', name: 'Meeting Scheduling', description: 'Automatically schedule meetings based on lead engagement and availability signals.', icon: 'Calendar', category: 'outreach', source: 'marketplace', tags: ['meetings', 'scheduling', 'calendar'] },

  // ── Operations ──
  { id: 'skill_crm_sync', name: 'CRM Sync', description: 'Sync leads, contacts, and deal data with external CRM systems like Salesforce or HubSpot.', icon: 'Database', category: 'operations', source: 'marketplace', tags: ['crm', 'sync', 'integration'] },
  { id: 'skill_report_generation', name: 'Report Generation', description: 'Generate automated reports on agent performance, lead quality, and campaign metrics.', icon: 'FileText', category: 'operations', source: 'built_in', tags: ['reports', 'analytics', 'metrics'] },
  { id: 'skill_data_cleanup', name: 'Data Cleanup', description: 'Deduplicate, normalize, and clean lead data to maintain database hygiene.', icon: 'Shield', category: 'operations', source: 'marketplace', tags: ['cleanup', 'data quality', 'dedup'] },

  // ── Advanced ──
  { id: 'skill_intent_analysis', name: 'Intent Analysis', description: 'Analyze content and behavior signals to determine purchase intent and timing.', icon: 'Brain', category: 'advanced', source: 'marketplace', tags: ['intent', 'ai', 'behavioral'] },
  { id: 'skill_conversation_intelligence', name: 'Conversation Intelligence', description: 'Analyze call transcripts and email threads for sentiment, objections, and next steps.', icon: 'MessageSquare', category: 'advanced', source: 'marketplace', tags: ['conversation', 'nlp', 'sentiment'] },
  { id: 'skill_predictive_scoring', name: 'Predictive Scoring', description: 'Use ML models to predict lead conversion probability based on historical patterns.', icon: 'TrendingUp', category: 'advanced', source: 'marketplace', tags: ['ml', 'prediction', 'conversion'] },
  { id: 'skill_territory_mapping', name: 'Territory Mapping', description: 'Automatically map and assign leads to sales territories based on geography and account fit.', icon: 'MapPin', category: 'advanced', source: 'marketplace', tags: ['territory', 'assignment', 'geography'] },
]

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = (query.category as string)?.toLowerCase()
  const search = (query.search as string)?.toLowerCase()

  let skills = [...SKILL_CATALOG]

  // Filter by category
  if (category && category !== 'all') {
    skills = skills.filter(s => s.category === category)
  }

  // Filter by search
  if (search) {
    skills = skills.filter(s =>
      s.name.toLowerCase().includes(search) ||
      s.description.toLowerCase().includes(search) ||
      s.tags.some(tag => tag.includes(search)) ||
      s.category.toLowerCase().includes(search)
    )
  }

  // Group by category
  const categories = [...new Set(skills.map(s => s.category))]

  return {
    skills,
    categories,
    total: SKILL_CATALOG.length,
    source: 'skill_catalog',
  }
})
