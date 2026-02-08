import type { Database } from '~/types/database.types'

type AgentStep = Database['public']['Tables']['agent_steps']['Row']
type DiscoveredLead = Database['public']['Tables']['discovered_leads']['Row']
type AgentRun = Database['public']['Tables']['agent_runs']['Row']

export function useCampaignLive(campaignId: Ref<string | null>) {
  const client = useSupabaseClient<Database>()

  const liveSteps = ref<AgentStep[]>([])
  const liveLeads = ref<DiscoveredLead[]>([])
  const runStatus = ref<string>('idle')
  const latestRun = ref<AgentRun | null>(null)

  let stepsChannel: ReturnType<typeof client.channel> | null = null
  let leadsChannel: ReturnType<typeof client.channel> | null = null
  let runChannel: ReturnType<typeof client.channel> | null = null

  function subscribe(id: string) {
    cleanup()

    // Listen for new agent steps
    stepsChannel = client
      .channel(`steps-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_steps',
          filter: `campaign_id=eq.${id}`,
        },
        (payload) => {
          liveSteps.value.unshift(payload.new as AgentStep)
        },
      )
      .subscribe()

    // Listen for new discovered leads
    leadsChannel = client
      .channel(`leads-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discovered_leads',
          filter: `campaign_id=eq.${id}`,
        },
        (payload) => {
          liveLeads.value.unshift(payload.new as DiscoveredLead)
        },
      )
      .subscribe()

    // Listen for run status changes
    runChannel = client
      .channel(`runs-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_runs',
          filter: `campaign_id=eq.${id}`,
        },
        (payload) => {
          const run = payload.new as AgentRun
          latestRun.value = run
          runStatus.value = run.status
        },
      )
      .subscribe()
  }

  function cleanup() {
    if (stepsChannel) { client.removeChannel(stepsChannel); stepsChannel = null }
    if (leadsChannel) { client.removeChannel(leadsChannel); leadsChannel = null }
    if (runChannel) { client.removeChannel(runChannel); runChannel = null }
    liveSteps.value = []
    liveLeads.value = []
    runStatus.value = 'idle'
    latestRun.value = null
  }

  // Watch for campaign ID changes
  watch(campaignId, (newId) => {
    if (newId) {
      subscribe(newId)
    } else {
      cleanup()
    }
  }, { immediate: true })

  onUnmounted(() => {
    cleanup()
  })

  return {
    liveSteps: readonly(liveSteps),
    liveLeads: readonly(liveLeads),
    runStatus: readonly(runStatus),
    latestRun: readonly(latestRun),
    cleanup,
  }
}
