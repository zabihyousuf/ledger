import type { Database } from '~/types/database.types'

export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadInsert = Database['public']['Tables']['leads']['Insert']
export type LeadUpdate = Database['public']['Tables']['leads']['Update']

export function useLeads() {
  const client = useSupabaseClient<Database>()

  const leads = ref<Lead[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function fetchLeads() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await client
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      leads.value = data || []
    } catch (e) {
      error.value = e as Error
      console.error('Error fetching leads:', e)
    } finally {
      loading.value = false
    }
  }

  async function createLead(lead: LeadInsert) {
    loading.value = true
    error.value = null
    try {
      const { data, error: insertError } = await client
        .from('leads')
        .insert(lead)
        .select()
        .single()

      if (insertError) throw insertError
      
      // Add activity
      if (data) {
        await client.from('activities').insert({
          type: 'lead_created',
          title: 'New lead created',
          description: `${data.name} from ${data.company || 'Unknown company'}`,
          related_to_type: 'lead',
          related_to_id: data.id,
        })
      }

      await fetchLeads()
      return data
    } catch (e) {
      error.value = e as Error
      console.error('Error creating lead:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateLead(id: string, updates: LeadUpdate) {
    loading.value = true
    error.value = null
    try {
      const { data, error: updateError } = await client
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Add activity if status changed
      if (updates.status && data) {
        await client.from('activities').insert({
          type: 'status_changed',
          title: 'Lead status updated',
          description: `Status changed to ${updates.status}`,
          related_to_type: 'lead',
          related_to_id: data.id,
        })
      }

      await fetchLeads()
      return data
    } catch (e) {
      error.value = e as Error
      console.error('Error updating lead:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteLead(id: string) {
    loading.value = true
    error.value = null
    try {
      const { error: deleteError } = await client
        .from('leads')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchLeads()
    } catch (e) {
      error.value = e as Error
      console.error('Error deleting lead:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // Computed stats
  const stats = computed(() => {
    const total = leads.value.length
    const qualified = leads.value.filter(l => l.status === 'qualified').length
    const inProgress = leads.value.filter(l => ['contacted', 'proposal', 'negotiation'].includes(l.status || '')).length
    const converted = leads.value.filter(l => l.status === 'closed_won').length

    return {
      total,
      qualified,
      inProgress,
      converted,
    }
  })

  return {
    leads,
    loading,
    error,
    stats,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
  }
}
