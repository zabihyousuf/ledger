import { createServerSupabase } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Campaign ID required' })

  const supabase = createServerSupabase()

  const { data: runs, error } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { runs: runs || [] }
})
