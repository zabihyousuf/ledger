import type { Database } from '~/types/database.types'

export type Deal = Database['public']['Tables']['deals']['Row']
export type DealInsert = Database['public']['Tables']['deals']['Insert']
export type DealUpdate = Database['public']['Tables']['deals']['Update']

export function useDeals() {
  const client = useSupabaseClient<Database>()

  const deals = ref<Deal[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function fetchDeals() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await client
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      deals.value = data || []
    } catch (e) {
      error.value = e as Error
      console.error('Error fetching deals:', e)
    } finally {
      loading.value = false
    }
  }

  async function createDeal(deal: DealInsert) {
    loading.value = true
    error.value = null
    try {
      const { data, error: insertError } = await client
        .from('deals')
        .insert(deal)
        .select()
        .single()

      if (insertError) throw insertError

      // Add activity
      if (data) {
        await client.from('activities').insert({
          type: 'deal_created',
          title: 'New deal created',
          description: `${data.title} - $${data.value}`,
          related_to_type: 'deal',
          related_to_id: data.id,
        })
      }

      await fetchDeals()
      return data
    } catch (e) {
      error.value = e as Error
      console.error('Error creating deal:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateDeal(id: string, updates: DealUpdate) {
    loading.value = true
    error.value = null
    try {
      const { data, error: updateError } = await client
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Add activity if stage changed
      if (updates.stage && data) {
        await client.from('activities').insert({
          type: 'status_changed',
          title: 'Deal stage updated',
          description: `Stage changed to ${updates.stage}`,
          related_to_type: 'deal',
          related_to_id: data.id,
        })
      }

      await fetchDeals()
      return data
    } catch (e) {
      error.value = e as Error
      console.error('Error updating deal:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteDeal(id: string) {
    loading.value = true
    error.value = null
    try {
      const { error: deleteError } = await client
        .from('deals')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      await fetchDeals()
    } catch (e) {
      error.value = e as Error
      console.error('Error deleting deal:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // Pipeline stats
  const pipelineStages = computed(() => {
    const stages = [
      { name: 'Prospecting', key: 'prospecting', color: 'bg-blue-500' },
      { name: 'Qualification', key: 'qualification', color: 'bg-yellow-500' },
      { name: 'Proposal', key: 'proposal', color: 'bg-purple-500' },
      { name: 'Negotiation', key: 'negotiation', color: 'bg-orange-500' },
      { name: 'Closed Won', key: 'closed_won', color: 'bg-green-500' },
      { name: 'Closed Lost', key: 'closed_lost', color: 'bg-red-500' },
    ]

    return stages.map(stage => {
      const stageDeals = deals.value.filter(d => d.stage === stage.key)
      const count = stageDeals.length
      const value = stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0)

      return {
        ...stage,
        count,
        value: `$${(value / 1000).toFixed(0)}K`,
      }
    })
  })

  return {
    deals,
    loading,
    error,
    pipelineStages,
    fetchDeals,
    createDeal,
    updateDeal,
    deleteDeal,
  }
}
