import { createServerSupabase } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Campaign ID required' })

  const supabase = createServerSupabase()

  // Get latest run for this campaign
  const { data: run } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Get step count
  let stepsCount = 0
  if (run) {
    const { count } = await supabase
      .from('agent_steps')
      .select('*', { count: 'exact', head: true })
      .eq('run_id', run.id)
    stepsCount = count || 0
  }

  return {
    campaignId: id,
    latestRun: run || null,
    totalSteps: stepsCount,
  }
})
