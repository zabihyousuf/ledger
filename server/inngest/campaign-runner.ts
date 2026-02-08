import { inngest } from '../utils/inngest'
import { createServerSupabase } from '../utils/supabase'
import { runDiscoveryAgent } from '../agents/discovery-agent'
import { runEnrichmentAgent } from '../agents/enrichment-agent'
import { runQualificationAgent } from '../agents/qualification-agent'

export const runCampaign = inngest.createFunction(
  {
    id: 'run-campaign',
    concurrency: [{ limit: 5 }],
    retries: 2,
  },
  { event: 'campaign/started' },
  async ({ event, step }) => {
    const { campaignId, runId } = event.data as { campaignId: string; runId: string }
    const supabase = createServerSupabase()

    // Step 1: Load campaign and mark as running
    const campaign = await step.run('load-campaign', async () => {
      const { data, error } = await supabase
        .from('discovery_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (error || !data) throw new Error(`Campaign not found: ${campaignId}`)

      // Mark campaign as running
      await supabase
        .from('discovery_campaigns')
        .update({ status: 'running' })
        .eq('id', campaignId)

      // Mark run as running
      await supabase
        .from('agent_runs')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
          steps_total: 3, // discovery, enrichment, qualification
        })
        .eq('id', runId)

      // Log activity
      await supabase.from('agent_activities').insert({
        campaign_id: campaignId,
        agent_name: 'Campaign Runner',
        action: 'campaign_started',
        detail: `Started campaign "${data.name}"`,
        status: 'completed',
      })

      return data
    })

    // Step 2: Run discovery agent
    const discoveryResult = await step.run('run-discovery', async () => {
      await supabase.from('agent_activities').insert({
        campaign_id: campaignId,
        agent_name: 'Lead Scout',
        action: 'discovery_started',
        detail: `Searching for ${campaign.target_roles.join(', ')} in ${campaign.target_industry}`,
        status: 'running',
      })

      try {
        const result = await runDiscoveryAgent(
          {
            id: campaign.id,
            target_industry: campaign.target_industry,
            target_roles: campaign.target_roles,
            target_company_size: campaign.target_company_size,
            target_region: campaign.target_region,
            search_criteria: campaign.search_criteria,
            confidence_threshold: campaign.confidence_threshold,
            max_leads_per_run: campaign.max_leads_per_run || 50,
          },
          supabase,
          runId,
        )

        await supabase.from('agent_activities').insert({
          campaign_id: campaignId,
          agent_name: 'Lead Scout',
          action: 'discovery_completed',
          detail: `Discovered ${result.leadIds.length} leads in ${result.stepsUsed} steps`,
          status: 'completed',
        })

        return result
      } catch (err: any) {
        await supabase.from('agent_activities').insert({
          campaign_id: campaignId,
          agent_name: 'Lead Scout',
          action: 'discovery_error',
          detail: err.message,
          status: 'error',
        })
        throw err
      }
    })

    // Step 3: Run enrichment agent
    const enrichmentResult = await step.run('run-enrichment', async () => {
      if (discoveryResult.leadIds.length === 0) {
        return { enrichedCount: 0, tokensUsed: 0 }
      }

      await supabase.from('agent_activities').insert({
        campaign_id: campaignId,
        agent_name: 'Lead Enricher',
        action: 'enrichment_started',
        detail: `Enriching ${discoveryResult.leadIds.length} discovered leads`,
        status: 'running',
      })

      try {
        const result = await runEnrichmentAgent(
          discoveryResult.leadIds,
          { id: campaign.id },
          supabase,
          runId,
        )

        await supabase.from('agent_activities').insert({
          campaign_id: campaignId,
          agent_name: 'Lead Enricher',
          action: 'enrichment_completed',
          detail: `Enriched ${result.enrichedCount} leads`,
          status: 'completed',
        })

        return result
      } catch (err: any) {
        await supabase.from('agent_activities').insert({
          campaign_id: campaignId,
          agent_name: 'Lead Enricher',
          action: 'enrichment_error',
          detail: err.message,
          status: 'error',
        })
        // Don't fail the whole campaign if enrichment fails
        return { enrichedCount: 0, tokensUsed: 0 }
      }
    })

    // Step 4: Run qualification agent
    const qualificationResult = await step.run('run-qualification', async () => {
      if (discoveryResult.leadIds.length === 0) {
        return { qualifiedCount: 0, tokensUsed: 0 }
      }

      await supabase.from('agent_activities').insert({
        campaign_id: campaignId,
        agent_name: 'Lead Qualifier',
        action: 'qualification_started',
        detail: `Qualifying ${discoveryResult.leadIds.length} leads against ICP`,
        status: 'running',
      })

      try {
        const result = await runQualificationAgent(
          discoveryResult.leadIds,
          {
            id: campaign.id,
            target_industry: campaign.target_industry,
            target_roles: campaign.target_roles,
            target_company_size: campaign.target_company_size,
            target_region: campaign.target_region,
            search_criteria: campaign.search_criteria,
            confidence_threshold: campaign.confidence_threshold,
          },
          supabase,
          runId,
        )

        await supabase.from('agent_activities').insert({
          campaign_id: campaignId,
          agent_name: 'Lead Qualifier',
          action: 'qualification_completed',
          detail: `Qualified ${result.qualifiedCount} leads`,
          status: 'completed',
        })

        return result
      } catch (err: any) {
        await supabase.from('agent_activities').insert({
          campaign_id: campaignId,
          agent_name: 'Lead Qualifier',
          action: 'qualification_error',
          detail: err.message,
          status: 'error',
        })
        return { qualifiedCount: 0, tokensUsed: 0 }
      }
    })

    // Step 5: Finalize
    await step.run('finalize', async () => {
      const totalTokens = (discoveryResult.tokensUsed || 0)
        + (enrichmentResult.tokensUsed || 0)
        + (qualificationResult.tokensUsed || 0)

      // Update agent run as completed
      await supabase.from('agent_runs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        leads_found: discoveryResult.leadIds.length,
        llm_tokens_used: totalTokens,
      }).eq('id', runId)

      // Update campaign status
      await supabase.from('discovery_campaigns').update({
        status: 'completed',
        leads_found: discoveryResult.leadIds.length,
        total_runs: (campaign.total_runs || 0) + 1,
        last_run_at: new Date().toISOString(),
      }).eq('id', campaignId)

      // Log metrics
      await supabase.from('campaign_metrics').upsert({
        campaign_id: campaignId,
        date: new Date().toISOString().split('T')[0],
        leads_discovered: discoveryResult.leadIds.length,
        leads_enriched: enrichmentResult.enrichedCount,
        leads_qualified: qualificationResult.qualifiedCount,
        llm_tokens: totalTokens,
      }, { onConflict: 'campaign_id,date' })

      await supabase.from('agent_activities').insert({
        campaign_id: campaignId,
        agent_name: 'Campaign Runner',
        action: 'campaign_completed',
        detail: `Campaign complete: ${discoveryResult.leadIds.length} leads found, ${enrichmentResult.enrichedCount} enriched, ${qualificationResult.qualifiedCount} qualified`,
        status: 'completed',
      })
    })

    return {
      success: true,
      leadsFound: discoveryResult.leadIds.length,
      leadsEnriched: enrichmentResult.enrichedCount,
      leadsQualified: qualificationResult.qualifiedCount,
    }
  },
)
