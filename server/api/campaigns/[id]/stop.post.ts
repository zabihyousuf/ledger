import { createServerSupabase } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Campaign ID required' })

  const supabase = createServerSupabase()

  // Update campaign status to paused
  await supabase
    .from('discovery_campaigns')
    .update({ status: 'paused' })
    .eq('id', id)

  // Cancel any running agent runs
  await supabase
    .from('agent_runs')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    })
    .eq('campaign_id', id)
    .eq('status', 'running')

  // Log activity
  await supabase.from('agent_activities').insert({
    campaign_id: id,
    agent_name: 'Campaign Runner',
    action: 'campaign_stopped',
    detail: 'Campaign stopped by user',
    status: 'completed',
  })

  return { success: true }
})
