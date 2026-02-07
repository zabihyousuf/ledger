import type { Database } from '~/types/database.types'

export type Activity = Database['public']['Tables']['activities']['Row']
export type ActivityInsert = Database['public']['Tables']['activities']['Insert']

export function useActivities() {
  const client = useSupabaseClient<Database>()

  const activities = ref<Activity[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function fetchActivities(limit = 10) {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await client
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError
      activities.value = data || []
    } catch (e) {
      error.value = e as Error
      console.error('Error fetching activities:', e)
    } finally {
      loading.value = false
    }
  }

  async function createActivity(activity: ActivityInsert) {
    loading.value = true
    error.value = null
    try {
      const { data, error: insertError } = await client
        .from('activities')
        .insert(activity)
        .select()
        .single()

      if (insertError) throw insertError
      await fetchActivities()
      return data
    } catch (e) {
      error.value = e as Error
      console.error('Error creating activity:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    activities,
    loading,
    error,
    fetchActivities,
    createActivity,
  }
}
