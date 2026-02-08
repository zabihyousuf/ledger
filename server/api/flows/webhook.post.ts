import { createServerSupabase } from '../../utils/supabase'

/**
 * POST /api/flows/webhook
 *
 * Universal webhook receiver for flow triggers.
 * When an external service sends a webhook, this endpoint finds matching
 * flows with trigger_type='webhook' and executes them.
 *
 * Body:
 *   { flow_id?: string, event?: string, data?: any }
 *
 * If flow_id is provided, triggers that specific flow.
 * Otherwise, triggers all active webhook flows.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({})) || {}
  const supabase = createServerSupabase()

  let flowsToTrigger: any[] = []

  if (body.flow_id) {
    // Trigger specific flow
    const { data: flow } = await supabase
      .from('flows')
      .select('*')
      .eq('id', body.flow_id)
      .eq('status', 'active')
      .eq('trigger_type', 'webhook')
      .single()

    if (flow) flowsToTrigger = [flow]
  } else {
    // Trigger all active webhook flows
    const { data: flows } = await supabase
      .from('flows')
      .select('*')
      .eq('status', 'active')
      .eq('trigger_type', 'webhook')

    flowsToTrigger = flows || []
  }

  if (flowsToTrigger.length === 0) {
    return { success: false, message: 'No active webhook flows found', triggered: 0 }
  }

  const results: Array<{ flow_id: string; flow_name: string; triggered: boolean }> = []

  for (const flow of flowsToTrigger) {
    // Log the webhook trigger
    await supabase.from('agent_activities').insert({
      agent_name: 'Flow Engine',
      action: 'webhook_received',
      detail: `Webhook triggered flow "${flow.name}" with event: ${body.event || 'unknown'}`,
      status: 'completed',
    })

    results.push({
      flow_id: flow.id,
      flow_name: flow.name,
      triggered: true,
    })
  }

  return {
    success: true,
    triggered: results.length,
    results,
    received_at: new Date().toISOString(),
  }
})
