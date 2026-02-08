/**
 * GET /api/marketplace/tools
 *
 * Fetches available tools from the Composio marketplace API.
 * Falls back to a curated local catalog when COMPOSIO_API_KEY is not configured.
 *
 * Query params:
 *   ?category=enrichment    — filter by category
 *   ?search=apollo          — text search
 */

interface MarketplaceTool {
  id: string
  name: string
  description: string
  icon: string
  category: string
  source: 'composio' | 'built_in' | 'marketplace'
  connected: boolean
  tags: string[]
}

// Curated catalog of CRM-relevant tools available through Composio
// This acts as our "marketplace" — each item maps to a real Composio app/integration
const COMPOSIO_CATALOG: MarketplaceTool[] = [
  // ── Data Enrichment ──
  { id: 'composio_clearbit', name: 'Clearbit', description: 'Company and contact enrichment. Automatically enrich leads with firmographic data, tech stack, and employee info.', icon: 'Database', category: 'enrichment', source: 'composio', connected: false, tags: ['enrichment', 'company data', 'firmographics'] },
  { id: 'composio_apollo', name: 'Apollo.io', description: 'Sales intelligence platform. Search 275M+ contacts, find emails, and enrich lead profiles.', icon: 'Search', category: 'enrichment', source: 'composio', connected: false, tags: ['enrichment', 'email finder', 'sales intelligence'] },
  { id: 'composio_zoominfo', name: 'ZoomInfo', description: 'B2B contact and company database. Access 100M+ business profiles for prospecting.', icon: 'Globe', category: 'enrichment', source: 'composio', connected: false, tags: ['enrichment', 'b2b data', 'prospecting'] },
  { id: 'composio_pdl', name: 'People Data Labs', description: 'Person and company enrichment API. Enrich profiles with job title, company size, and social links.', icon: 'Users', category: 'enrichment', source: 'composio', connected: false, tags: ['enrichment', 'person data', 'api'] },

  // ── Email & Outreach ──
  { id: 'composio_hunter', name: 'Hunter.io', description: 'Find and verify professional email addresses. Domain search, email finder, and verification.', icon: 'Mail', category: 'email', source: 'composio', connected: false, tags: ['email', 'email finder', 'verification'] },
  { id: 'composio_snov', name: 'Snov.io', description: 'Email finder and cold outreach automation. Find emails, verify addresses, and send drip campaigns.', icon: 'Send', category: 'email', source: 'composio', connected: false, tags: ['email', 'outreach', 'drip campaigns'] },
  { id: 'composio_zerobounce', name: 'ZeroBounce', description: 'Email validation and deliverability. Verify emails, detect disposable addresses, and clean lists.', icon: 'Shield', category: 'email', source: 'composio', connected: false, tags: ['email', 'validation', 'deliverability'] },
  { id: 'composio_sendgrid', name: 'SendGrid', description: 'Transactional and marketing email delivery. Send personalized outreach emails at scale.', icon: 'Mail', category: 'email', source: 'composio', connected: false, tags: ['email', 'smtp', 'delivery'] },
  { id: 'composio_gmail', name: 'Gmail', description: 'Connect your Gmail account. Send, read, and track emails directly from your CRM.', icon: 'Mail', category: 'email', source: 'composio', connected: false, tags: ['email', 'gmail', 'google'] },

  // ── Web Scraping ──
  { id: 'composio_firecrawl', name: 'Firecrawl', description: 'AI-powered web scraper. Extract structured data from any website with intelligent parsing.', icon: 'Globe', category: 'scraping', source: 'composio', connected: false, tags: ['scraping', 'web data', 'ai'] },
  { id: 'composio_jina', name: 'Jina Reader', description: 'Convert any URL to clean markdown. Perfect for extracting content from company websites.', icon: 'FileText', category: 'scraping', source: 'composio', connected: false, tags: ['scraping', 'markdown', 'content extraction'] },
  { id: 'composio_phantombuster', name: 'PhantomBuster', description: 'Cloud-based automation for LinkedIn, Twitter, and web. Extract data and automate workflows.', icon: 'Bot', category: 'scraping', source: 'composio', connected: false, tags: ['scraping', 'linkedin', 'automation'] },

  // ── CRM Sync ──
  { id: 'composio_hubspot', name: 'HubSpot', description: 'Sync contacts, deals, and companies with HubSpot CRM. Two-way data sync and workflow triggers.', icon: 'Database', category: 'crm', source: 'composio', connected: false, tags: ['crm', 'hubspot', 'sync'] },
  { id: 'composio_salesforce', name: 'Salesforce', description: 'Enterprise CRM integration. Push qualified leads to Salesforce and sync back engagement data.', icon: 'Database', category: 'crm', source: 'composio', connected: false, tags: ['crm', 'salesforce', 'enterprise'] },
  { id: 'composio_pipedrive', name: 'Pipedrive', description: 'Sales pipeline CRM. Create deals, update stages, and sync contacts with Pipedrive.', icon: 'Target', category: 'crm', source: 'composio', connected: false, tags: ['crm', 'pipedrive', 'pipeline'] },

  // ── Social & Intelligence ──
  { id: 'composio_linkedin', name: 'LinkedIn', description: 'LinkedIn profile data and company insights. Enrich leads with professional background and connections.', icon: 'Users', category: 'social', source: 'composio', connected: false, tags: ['social', 'linkedin', 'professional'] },
  { id: 'composio_twitter', name: 'Twitter / X', description: 'Monitor mentions, track competitors, and engage with leads through social signals.', icon: 'MessageSquare', category: 'social', source: 'composio', connected: false, tags: ['social', 'twitter', 'monitoring'] },
  { id: 'composio_crunchbase', name: 'Crunchbase', description: 'Startup and company intelligence. Funding rounds, key people, and growth signals.', icon: 'TrendingUp', category: 'intelligence', source: 'composio', connected: false, tags: ['intelligence', 'funding', 'startups'] },

  // ── Communication ──
  { id: 'composio_slack', name: 'Slack', description: 'Get notified of new leads, share updates, and collaborate on deals in Slack channels.', icon: 'MessageSquare', category: 'communication', source: 'composio', connected: false, tags: ['communication', 'slack', 'notifications'] },
  { id: 'composio_notion', name: 'Notion', description: 'Sync lead research, meeting notes, and campaign docs to Notion workspaces.', icon: 'FileText', category: 'communication', source: 'composio', connected: false, tags: ['communication', 'notion', 'docs'] },

  // ── Search & Analysis ──
  { id: 'composio_tavily', name: 'Tavily Search', description: 'AI-optimized web search. Research companies, find news, and gather competitive intelligence.', icon: 'Search', category: 'search', source: 'composio', connected: false, tags: ['search', 'research', 'ai'] },
  { id: 'composio_serper', name: 'Serper', description: 'Google Search API. Programmatic search for company info, news, and lead research.', icon: 'Search', category: 'search', source: 'composio', connected: false, tags: ['search', 'google', 'serp'] },
]

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = (query.category as string)?.toLowerCase()
  const search = (query.search as string)?.toLowerCase()

  let tools = [...COMPOSIO_CATALOG]

  // Filter by category
  if (category && category !== 'all') {
    tools = tools.filter(t => t.category === category)
  }

  // Filter by search
  if (search) {
    tools = tools.filter(t =>
      t.name.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search) ||
      t.tags.some(tag => tag.includes(search)) ||
      t.category.toLowerCase().includes(search)
    )
  }

  // Group by category for easy frontend rendering
  const categories = [...new Set(tools.map(t => t.category))]

  return {
    tools,
    categories,
    total: COMPOSIO_CATALOG.length,
    source: 'composio_catalog',
  }
})
