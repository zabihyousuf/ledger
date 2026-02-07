import type { Database } from '~/types/database.types'

// Discovery campaign types (these will map to a future Supabase table)
export interface DiscoveryCampaign {
  id: string
  name: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  target_industry: string
  target_roles: string[]
  target_company_size: string
  target_region: string
  search_criteria: string
  agent_id: string | null
  leads_found: number
  leads_approved: number
  leads_rejected: number
  confidence_threshold: number
  created_at: string
  updated_at: string
}

export interface DiscoveredLead {
  id: string
  campaign_id: string
  name: string
  email: string | null
  company: string | null
  position: string | null
  linkedin_url: string | null
  confidence_score: number
  discovery_source: string
  status: 'pending_review' | 'approved' | 'rejected' | 'imported'
  ai_summary: string
  signals: string[]
  discovered_at: string
}

export interface AgentActivity {
  id: string
  agent_id: string
  agent_name: string
  campaign_id: string | null
  action: string
  detail: string
  status: 'running' | 'completed' | 'error'
  timestamp: string
}

export function useDiscovery() {
  const campaigns = ref<DiscoveryCampaign[]>([])
  const discoveredLeads = ref<DiscoveredLead[]>([])
  const agentActivities = ref<AgentActivity[]>([])
  const loading = ref(false)

  // Mock data for UI development - will be replaced with Supabase calls
  function seedMockData() {
    campaigns.value = [
      {
        id: '1',
        name: 'SaaS Decision Makers - Q1',
        status: 'running',
        target_industry: 'SaaS / Software',
        target_roles: ['CTO', 'VP Engineering', 'Head of Product'],
        target_company_size: '50-500',
        target_region: 'North America',
        search_criteria: 'Series A-C SaaS companies looking to scale engineering teams',
        agent_id: null,
        leads_found: 47,
        leads_approved: 31,
        leads_rejected: 8,
        confidence_threshold: 70,
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 300000).toISOString(),
      },
      {
        id: '2',
        name: 'E-commerce Founders',
        status: 'running',
        target_industry: 'E-commerce / Retail',
        target_roles: ['Founder', 'CEO', 'Head of Growth'],
        target_company_size: '10-100',
        target_region: 'Global',
        search_criteria: 'DTC brands with $1M-$50M revenue seeking growth tools',
        agent_id: null,
        leads_found: 23,
        leads_approved: 15,
        leads_rejected: 3,
        confidence_threshold: 65,
        created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 600000).toISOString(),
      },
      {
        id: '3',
        name: 'Fintech Partnership Leads',
        status: 'paused',
        target_industry: 'Financial Technology',
        target_roles: ['Head of Partnerships', 'BD Director', 'VP Strategy'],
        target_company_size: '100-1000',
        target_region: 'US & UK',
        search_criteria: 'Fintech companies with open API platforms seeking integration partners',
        agent_id: null,
        leads_found: 12,
        leads_approved: 9,
        leads_rejected: 1,
        confidence_threshold: 75,
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: '4',
        name: 'Healthcare AI Buyers',
        status: 'draft',
        target_industry: 'Healthcare / Health Tech',
        target_roles: ['CIO', 'Chief Digital Officer', 'VP Innovation'],
        target_company_size: '500+',
        target_region: 'United States',
        search_criteria: 'Healthcare orgs evaluating AI/ML solutions for operational efficiency',
        agent_id: null,
        leads_found: 0,
        leads_approved: 0,
        leads_rejected: 0,
        confidence_threshold: 80,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]

    discoveredLeads.value = [
      {
        id: 'dl-1',
        campaign_id: '1',
        name: 'Sarah Chen',
        email: 's.chen@scalemtx.io',
        company: 'ScaleMatrix',
        position: 'CTO',
        linkedin_url: 'https://linkedin.com/in/sarachen',
        confidence_score: 94,
        discovery_source: 'LinkedIn + Company Blog',
        status: 'pending_review',
        ai_summary: 'Recently posted about scaling infrastructure challenges. Company raised Series B ($18M) last quarter. Actively hiring backend engineers — strong indicator of growth phase.',
        signals: ['Recent funding', 'Hiring surge', 'Tech blog active', 'Conference speaker'],
        discovered_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'dl-2',
        campaign_id: '1',
        name: 'Marcus Williams',
        email: 'marcus@datavine.com',
        company: 'DataVine Analytics',
        position: 'VP Engineering',
        linkedin_url: 'https://linkedin.com/in/marcuswilliams',
        confidence_score: 87,
        discovery_source: 'LinkedIn + Crunchbase',
        status: 'pending_review',
        ai_summary: 'Engineering leader at fast-growing data analytics platform. Mentioned evaluating new tools in a recent podcast interview. Company size aligns with target profile.',
        signals: ['Podcast mention', 'Company growth 40% YoY', 'Tool evaluator'],
        discovered_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'dl-3',
        campaign_id: '1',
        name: 'Priya Sharma',
        email: 'priya@cloudnest.dev',
        company: 'CloudNest',
        position: 'Head of Product',
        linkedin_url: 'https://linkedin.com/in/priyasharma',
        confidence_score: 82,
        discovery_source: 'LinkedIn + Job Posts',
        status: 'approved',
        ai_summary: 'Product leader at DevOps platform startup. Company is expanding into enterprise market. Recent job posts suggest building out sales tooling.',
        signals: ['Enterprise expansion', 'New job listings', 'Product Hunt launch'],
        discovered_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'dl-4',
        campaign_id: '2',
        name: 'Jake Morrison',
        email: 'jake@peakstyle.co',
        company: 'PeakStyle',
        position: 'Founder & CEO',
        linkedin_url: 'https://linkedin.com/in/jakemorrison',
        confidence_score: 91,
        discovery_source: 'Twitter + Shopify App Store',
        status: 'pending_review',
        ai_summary: 'DTC outdoor apparel brand doing $8M ARR. Active on Twitter discussing growth challenges. Uses Shopify Plus — strong CRM integration potential.',
        signals: ['Revenue match', 'Growth challenges', 'Shopify Plus', 'Active social'],
        discovered_at: new Date(Date.now() - 900000).toISOString(),
      },
      {
        id: 'dl-5',
        campaign_id: '1',
        name: 'Elena Rodriguez',
        email: 'elena.r@synthwave.ai',
        company: 'SynthWave AI',
        position: 'CTO',
        linkedin_url: 'https://linkedin.com/in/elenarodriguez',
        confidence_score: 76,
        discovery_source: 'GitHub + LinkedIn',
        status: 'pending_review',
        ai_summary: 'Technical co-founder at AI startup. Active open source contributor. Company is pre-Series A but growing rapidly. May be slightly early but shows strong buying signals.',
        signals: ['Open source active', 'Fast growth', 'AI company', 'Technical buyer'],
        discovered_at: new Date(Date.now() - 5400000).toISOString(),
      },
      {
        id: 'dl-6',
        campaign_id: '2',
        name: 'Amara Okafor',
        email: 'amara@glowbox.com',
        company: 'GlowBox Beauty',
        position: 'Head of Growth',
        linkedin_url: 'https://linkedin.com/in/amaraokafor',
        confidence_score: 88,
        discovery_source: 'Instagram + LinkedIn',
        status: 'approved',
        ai_summary: 'Growth leader at fast-scaling beauty subscription box. Company recently expanded to 3 new markets. Running aggressive paid acquisition — likely needs better lead management.',
        signals: ['Market expansion', 'Paid acquisition', 'Subscription model', '$12M ARR'],
        discovered_at: new Date(Date.now() - 10800000).toISOString(),
      },
      {
        id: 'dl-7',
        campaign_id: '1',
        name: 'David Park',
        email: null,
        company: 'NexGen Payments',
        position: 'VP Engineering',
        linkedin_url: 'https://linkedin.com/in/davidpark',
        confidence_score: 63,
        discovery_source: 'LinkedIn',
        status: 'rejected',
        ai_summary: 'Engineering VP at payments company. Limited public signals about tool evaluation. Company may be too large for target profile.',
        signals: ['Senior role', 'Payments industry'],
        discovered_at: new Date(Date.now() - 14400000).toISOString(),
      },
    ]

    agentActivities.value = [
      {
        id: 'aa-1',
        agent_id: 'a1',
        agent_name: 'Lead Scout',
        campaign_id: '1',
        action: 'Scanning LinkedIn profiles',
        detail: 'Analyzing CTO profiles in SaaS companies with 50-500 employees in North America',
        status: 'running',
        timestamp: new Date(Date.now() - 30000).toISOString(),
      },
      {
        id: 'aa-2',
        agent_id: 'a1',
        agent_name: 'Lead Scout',
        campaign_id: '1',
        action: 'Found potential lead: Sarah Chen',
        detail: 'High confidence match — CTO at ScaleMatrix, recently funded, active tech blog',
        status: 'completed',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'aa-3',
        agent_id: 'a2',
        agent_name: 'Signal Analyzer',
        campaign_id: '1',
        action: 'Enriching lead data',
        detail: 'Cross-referencing Sarah Chen with Crunchbase, company blog, and GitHub activity',
        status: 'completed',
        timestamp: new Date(Date.now() - 1700000).toISOString(),
      },
      {
        id: 'aa-4',
        agent_id: 'a1',
        agent_name: 'Lead Scout',
        campaign_id: '2',
        action: 'Monitoring Twitter for buying signals',
        detail: 'Tracking DTC brand founders discussing growth challenges and tool evaluations',
        status: 'running',
        timestamp: new Date(Date.now() - 60000).toISOString(),
      },
      {
        id: 'aa-5',
        agent_id: 'a2',
        agent_name: 'Signal Analyzer',
        campaign_id: '2',
        action: 'Scored lead: Jake Morrison',
        detail: 'Confidence 91% — Revenue match, growth signals, active social presence',
        status: 'completed',
        timestamp: new Date(Date.now() - 900000).toISOString(),
      },
      {
        id: 'aa-6',
        agent_id: 'a1',
        agent_name: 'Lead Scout',
        campaign_id: '1',
        action: 'Found potential lead: Elena Rodriguez',
        detail: 'CTO at SynthWave AI — active on GitHub, company growing rapidly',
        status: 'completed',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
      },
    ]
  }

  async function fetchCampaigns() {
    loading.value = true
    // TODO: Replace with Supabase calls when tables exist
    if (campaigns.value.length === 0) seedMockData()
    loading.value = false
  }

  function getCampaignLeads(campaignId: string) {
    return discoveredLeads.value.filter(l => l.campaign_id === campaignId)
  }

  function getPendingLeads() {
    return discoveredLeads.value.filter(l => l.status === 'pending_review')
  }

  function approveLead(leadId: string) {
    const lead = discoveredLeads.value.find(l => l.id === leadId)
    if (lead) {
      lead.status = 'approved'
      const campaign = campaigns.value.find(c => c.id === lead.campaign_id)
      if (campaign) campaign.leads_approved++
    }
  }

  function rejectLead(leadId: string) {
    const lead = discoveredLeads.value.find(l => l.id === leadId)
    if (lead) {
      lead.status = 'rejected'
      const campaign = campaigns.value.find(c => c.id === lead.campaign_id)
      if (campaign) campaign.leads_rejected++
    }
  }

  function getRunningActivities() {
    return agentActivities.value.filter(a => a.status === 'running')
  }

  function getRecentActivities(limit = 10) {
    return [...agentActivities.value]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  const totalDiscovered = computed(() => discoveredLeads.value.length)
  const totalPending = computed(() => discoveredLeads.value.filter(l => l.status === 'pending_review').length)
  const totalApproved = computed(() => discoveredLeads.value.filter(l => l.status === 'approved').length)
  const activeCampaigns = computed(() => campaigns.value.filter(c => c.status === 'running').length)

  return {
    campaigns,
    discoveredLeads,
    agentActivities,
    loading,
    fetchCampaigns,
    getCampaignLeads,
    getPendingLeads,
    approveLead,
    rejectLead,
    getRunningActivities,
    getRecentActivities,
    totalDiscovered,
    totalPending,
    totalApproved,
    activeCampaigns,
  }
}
