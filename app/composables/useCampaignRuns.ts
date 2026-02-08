export function useCampaignRuns() {
  const starting = ref(false)
  const stopping = ref(false)
  const testing = ref(false)

  async function startCampaign(campaignId: string) {
    starting.value = true
    try {
      const data = await $fetch(`/api/campaigns/${campaignId}/start`, { method: 'POST' })
      return data
    } finally {
      starting.value = false
    }
  }

  async function stopCampaign(campaignId: string) {
    stopping.value = true
    try {
      const data = await $fetch(`/api/campaigns/${campaignId}/stop`, { method: 'POST' })
      return data
    } finally {
      stopping.value = false
    }
  }

  async function testCampaign(campaignId: string) {
    testing.value = true
    try {
      const data = await $fetch(`/api/campaigns/${campaignId}/test`, { method: 'POST' })
      return data
    } finally {
      testing.value = false
    }
  }

  async function fetchRunStatus(campaignId: string) {
    return await $fetch(`/api/campaigns/${campaignId}/status`)
  }

  async function fetchRuns(campaignId: string) {
    const data = await $fetch(`/api/campaigns/${campaignId}/runs`)
    return (data as any).runs || []
  }

  return {
    starting,
    stopping,
    testing,
    startCampaign,
    stopCampaign,
    testCampaign,
    fetchRunStatus,
    fetchRuns,
  }
}
