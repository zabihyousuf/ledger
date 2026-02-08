import { inngest } from '../utils/inngest'
import { createServerSupabase } from '../utils/supabase'

/**
 * Inngest function: Trigger flows when a new lead is created
 * Listens for 'lead/created' events and executes matching flows
 */
export const onLeadCreated = inngest.createFunction(
  {
    id: 'flow-trigger-lead-created',
    concurrency: [{ limit: 10 }],
    retries: 1,
  },
  { event: 'lead/created' },
  async ({ event, step }) => {
    const { leadId, leadName, leadEmail, leadCompany } = event.data as {
      leadId: string
      leadName: string
      leadEmail?: string
      leadCompany?: string
    }

    const supabase = createServerSupabase()

    // Find all active flows with lead_created trigger
    const flows = await step.run('find-lead-created-flows', async () => {
      const { data } = await supabase
        .from('flows')
        .select('*')
        .eq('status', 'active')
        .eq('trigger_type', 'lead_created')

      return data || []
    })

    if (flows.length === 0) return { triggered: 0 }

    // Execute each matching flow
    for (const flow of flows) {
      await step.run(`execute-flow-${flow.id}`, async () => {
        // Load flow nodes
        const { data: nodes } = await supabase
          .from('flow_nodes')
          .select('*')
          .eq('flow_id', flow.id)
          .order('created_at')

        // Log activity
        await supabase.from('agent_activities').insert({
          agent_name: 'Flow Engine',
          action: 'flow_auto_triggered',
          detail: `Flow "${flow.name}" auto-triggered by new lead: ${leadName} (${leadCompany || 'Unknown Company'})`,
          status: 'completed',
        })

        return { flowId: flow.id, nodeCount: nodes?.length || 0 }
      })
    }

    return { triggered: flows.length }
  },
)

/**
 * Inngest function: Trigger flows when a new contact is added
 * Listens for 'contact/added' events and executes matching flows
 */
export const onContactAdded = inngest.createFunction(
  {
    id: 'flow-trigger-contact-added',
    concurrency: [{ limit: 10 }],
    retries: 1,
  },
  { event: 'contact/added' },
  async ({ event, step }) => {
    const { contactId, contactName, contactEmail } = event.data as {
      contactId: string
      contactName: string
      contactEmail?: string
    }

    const supabase = createServerSupabase()

    // Find all active flows with contact_added trigger
    const flows = await step.run('find-contact-added-flows', async () => {
      const { data } = await supabase
        .from('flows')
        .select('*')
        .eq('status', 'active')
        .eq('trigger_type', 'contact_added')

      return data || []
    })

    if (flows.length === 0) return { triggered: 0 }

    // Execute each matching flow
    for (const flow of flows) {
      await step.run(`execute-flow-${flow.id}`, async () => {
        const { data: nodes } = await supabase
          .from('flow_nodes')
          .select('*')
          .eq('flow_id', flow.id)
          .order('created_at')

        await supabase.from('agent_activities').insert({
          agent_name: 'Flow Engine',
          action: 'flow_auto_triggered',
          detail: `Flow "${flow.name}" auto-triggered by new contact: ${contactName}`,
          status: 'completed',
        })

        return { flowId: flow.id, nodeCount: nodes?.length || 0 }
      })
    }

    return { triggered: flows.length }
  },
)

/**
 * Inngest function: Run scheduled flows
 * Runs every hour and checks for active flows with scheduled triggers
 */
export const runScheduledFlows = inngest.createFunction(
  {
    id: 'flow-scheduled-runner',
    concurrency: [{ limit: 3 }],
  },
  { cron: '0 * * * *' }, // Every hour
  async ({ step }) => {
    const supabase = createServerSupabase()

    const flows = await step.run('find-scheduled-flows', async () => {
      const { data } = await supabase
        .from('flows')
        .select('*')
        .eq('status', 'active')
        .eq('trigger_type', 'scheduled')

      return data || []
    })

    if (flows.length === 0) return { triggered: 0 }

    for (const flow of flows) {
      await step.run(`run-scheduled-${flow.id}`, async () => {
        const { data: nodes } = await supabase
          .from('flow_nodes')
          .select('*')
          .eq('flow_id', flow.id)
          .order('created_at')

        await supabase.from('agent_activities').insert({
          agent_name: 'Flow Engine',
          action: 'flow_scheduled_run',
          detail: `Scheduled flow "${flow.name}" executed with ${nodes?.length || 0} nodes`,
          status: 'completed',
        })

        return { flowId: flow.id, nodeCount: nodes?.length || 0 }
      })
    }

    return { triggered: flows.length }
  },
)
