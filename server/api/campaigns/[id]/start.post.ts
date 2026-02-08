import { createServerSupabase } from '../../../utils/supabase'
import { inngest } from '../../../utils/inngest'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Campaign ID required' })

  const supabase = createServerSupabase()

  // Check campaign exists
  const { data: campaign, error } = await supabase
    .from('discovery_campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !campaign) {
    throw createError({ statusCode: 404, message: 'Campaign not found' })
  }

  if (campaign.status === 'running') {
    throw createError({ statusCode: 400, message: 'Campaign is already running' })
  }

  // Create agent run record
  const { data: run, error: runError } = await supabase
    .from('agent_runs')
    .insert({
      campaign_id: id,
      agent_type: 'full_pipeline',
      status: 'pending',
    })
    .select()
    .single()

  if (runError || !run) {
    throw createError({ statusCode: 500, message: 'Failed to create agent run' })
  }

  // Resolve agent IDs — prefer agent_ids array, fall back to single agent_id
  const agentIds: string[] = (campaign as any).agent_ids?.length
    ? (campaign as any).agent_ids
    : campaign.agent_id
      ? [campaign.agent_id]
      : []

  // Send event to Inngest
  await inngest.send({
    name: 'campaign/started',
    data: {
      campaignId: id,
      runId: run.id,
      agentIds,
    },
  })

  return { success: true, runId: run.id }
})
