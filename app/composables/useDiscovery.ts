import type { Database } from '~/types/database.types'

export type DiscoveryCampaign = Database['public']['Tables']['discovery_campaigns']['Row']
export type DiscoveryCampaignInsert = Database['public']['Tables']['discovery_campaigns']['Insert']
export type DiscoveredLead = Database['public']['Tables']['discovered_leads']['Row']
export type AgentActivity = Database['public']['Tables']['agent_activities']['Row']

export function useDiscovery() {
  const client = useSupabaseClient<Database>()

  const campaigns = ref<DiscoveryCampaign[]>([])
  const discoveredLeads = ref<DiscoveredLead[]>([])
  const agentActivities = ref<AgentActivity[]>([])
  const loading = ref(false)

  async function fetchCampaigns() {
    loading.value = true
    try {
      const { data, error } = await client
        .from('discovery_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      campaigns.value = data || []
    } catch (e) {
      console.error('Error fetching campaigns:', e)
    } finally {
      loading.value = false
    }
  }

  async function createCampaign(campaign: DiscoveryCampaignInsert) {
    try {
      const { data, error } = await client
        .from('discovery_campaigns')
        .insert(campaign)
        .select()
        .single()

      if (error) throw error
      await fetchCampaigns()
      return data
    } catch (e) {
      console.error('Error creating campaign:', e)
      throw e
    }
  }

  async function updateCampaign(id: string, updates: Partial<DiscoveryCampaign>) {
    try {
      const { error } = await client
        .from('discovery_campaigns')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await fetchCampaigns()
    } catch (e) {
      console.error('Error updating campaign:', e)
      throw e
    }
  }

  async function fetchDiscoveredLeads() {
    try {
      const { data, error } = await client
        .from('discovered_leads')
        .select('*')
        .order('discovered_at', { ascending: false })

      if (error) throw error
      discoveredLeads.value = data || []
    } catch (e) {
      console.error('Error fetching discovered leads:', e)
    }
  }

  function getCampaignLeads(campaignId: string) {
    return discoveredLeads.value.filter(l => l.campaign_id === campaignId)
  }

  function getPendingLeads() {
    return discoveredLeads.value.filter(l => l.status === 'pending_review')
  }

  async function approveLead(leadId: string) {
    try {
      const lead = discoveredLeads.value.find(l => l.id === leadId)
      const { error } = await client
        .from('discovered_leads')
        .update({ status: 'approved' })
        .eq('id', leadId)

      if (error) throw error

      if (lead) {
        lead.status = 'approved'
        // Increment campaign approved count
        await client
          .from('discovery_campaigns')
          .update({ leads_approved: (campaigns.value.find(c => c.id === lead.campaign_id)?.leads_approved || 0) + 1 })
          .eq('id', lead.campaign_id)
        await fetchCampaigns()
      }
    } catch (e) {
      console.error('Error approving lead:', e)
      throw e
    }
  }

  async function rejectLead(leadId: string) {
    try {
      const lead = discoveredLeads.value.find(l => l.id === leadId)
      const { error } = await client
        .from('discovered_leads')
        .update({ status: 'rejected' })
        .eq('id', leadId)

      if (error) throw error

      if (lead) {
        lead.status = 'rejected'
        await client
          .from('discovery_campaigns')
          .update({ leads_rejected: (campaigns.value.find(c => c.id === lead.campaign_id)?.leads_rejected || 0) + 1 })
          .eq('id', lead.campaign_id)
        await fetchCampaigns()
      }
    } catch (e) {
      console.error('Error rejecting lead:', e)
      throw e
    }
  }

  async function fetchAgentActivities() {
    try {
      const { data, error } = await client
        .from('agent_activities')
        .select('*')
        .order('timestamp', { ascending: false })

      if (error) throw error
      agentActivities.value = data || []
    } catch (e) {
      console.error('Error fetching agent activities:', e)
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
    createCampaign,
    updateCampaign,
    fetchDiscoveredLeads,
    getCampaignLeads,
    getPendingLeads,
    approveLead,
    rejectLead,
    fetchAgentActivities,
    getRunningActivities,
    getRecentActivities,
    totalDiscovered,
    totalPending,
    totalApproved,
    activeCampaigns,
  }
}
