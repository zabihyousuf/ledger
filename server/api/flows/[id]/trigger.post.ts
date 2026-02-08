import { createServerSupabase } from '../../../utils/supabase'

/**
 * POST /api/flows/:id/trigger
 *
 * Manually triggers a flow execution.
 * Also called internally by event-based triggers (lead_created, contact_added, webhook).
 *
 * Body (optional):
 *   { context?: Record<string, any>, trigger_source?: string }
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Flow ID required' })

  const body = await readBody(event).catch(() => ({})) || {}
  const supabase = createServerSupabase()

  // Load the flow
  const { data: flow, error: flowError } = await supabase
    .from('flows')
    .select('*')
    .eq('id', id)
    .single()

  if (flowError || !flow) {
    throw createError({ statusCode: 404, message: 'Flow not found' })
  }

  if (flow.status !== 'active') {
    throw createError({ statusCode: 400, message: 'Flow is not active. Activate it first.' })
  }

  // Load flow nodes
  const { data: nodes, error: nodesError } = await supabase
    .from('flow_nodes')
    .select('*')
    .eq('flow_id', id)
    .order('created_at')

  if (nodesError) {
    throw createError({ statusCode: 500, message: 'Failed to load flow nodes' })
  }

  if (!nodes || nodes.length === 0) {
    throw createError({ statusCode: 400, message: 'Flow has no nodes. Add nodes before triggering.' })
  }

  // Load flow connections
  const { data: connections } = await supabase
    .from('flow_connections')
    .select('*')
    .eq('flow_id', id)

  // Log the trigger as an activity
  await supabase.from('agent_activities').insert({
    agent_name: 'Flow Engine',
    action: `flow_triggered`,
    detail: `Flow "${flow.name}" triggered via ${body.trigger_source || flow.trigger_type || 'manual'}`,
    status: 'completed',
  })

  // Build execution plan
  const executionPlan = nodes.map((node: any) => ({
    id: node.id,
    type: node.node_type,
    label: node.label,
    config: node.config,
  }))

  return {
    success: true,
    flow: {
      id: flow.id,
      name: flow.name,
      trigger_type: flow.trigger_type,
      status: flow.status,
    },
    execution: {
      triggered_at: new Date().toISOString(),
      trigger_source: body.trigger_source || flow.trigger_type || 'manual',
      context: body.context || {},
      node_count: nodes.length,
      connection_count: connections?.length || 0,
      plan: executionPlan,
    },
  }
})
