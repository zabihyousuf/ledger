import { serve } from 'inngest/nuxt'
import { inngest } from '../utils/inngest'
import { runCampaign } from '../inngest/campaign-runner'
import { onLeadCreated, onContactAdded, runScheduledFlows } from '../inngest/flow-triggers'

const handler = serve({
  client: inngest,
  functions: [
    runCampaign,
    onLeadCreated,
    onContactAdded,
    runScheduledFlows,
  ],
})

// Wrap with eventHandler to avoid H3 implicit handler conversion deprecation warning
export default eventHandler(async (event) => {
  const res = await handler(event)
  return res
})
