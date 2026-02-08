import { generateText, tool } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { enrichPerson as pdlEnrich } from '../tools/pdl'
import { verifyEmail as zbVerify } from '../tools/zerobounce'
import { readUrl } from '../tools/jina'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function runEnrichmentAgent(
  leadIds: string[],
  campaign: { id: string },
  supabase: SupabaseClient,
  runId: string,
) {
  if (leadIds.length === 0) return { enrichedCount: 0, tokensUsed: 0 }

  const config = useRuntimeConfig()
  let stepCounter = 0

  const hasAnthropic = !!(config.anthropicApiKey || process.env.ANTHROPIC_API_KEY)
  const model = hasAnthropic
    ? anthropic('claude-sonnet-4-20250514')
    : openai('gpt-4o')

  // Fetch the leads to enrich
  const { data: leads } = await supabase
    .from('discovered_leads')
    .select('*')
    .in('id', leadIds)

  if (!leads || leads.length === 0) return { enrichedCount: 0, tokensUsed: 0 }

  let enrichedCount = 0

  const result = await generateText({
    model,
    maxSteps: 15,
    system: `You are a lead enrichment agent. You have a list of recently discovered leads.
For each lead, use the available tools to:
1. Enrich their profile with additional data (company info, social profiles, skills)
2. Verify their email address if one exists
3. Optionally read their company website for additional context

After enriching, update each lead with the new information.

LEADS TO ENRICH:
${leads.map((l, i) => `${i + 1}. ${l.name} — ${l.position} at ${l.company} (email: ${l.email || 'unknown'})`).join('\n')}

Be efficient — if enrichment tools are not configured, note that and move on.`,

    tools: {
      enrichPerson: tool({
        description: 'Enrich a person profile with additional data from People Data Labs.',
        parameters: z.object({
          email: z.string().optional().describe('Email to look up'),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          company: z.string().optional(),
        }),
        execute: async (params) => {
          const result = await pdlEnrich(params)
          return JSON.stringify(result)
        },
      }),

      verifyEmail: tool({
        description: 'Verify if an email address is valid and deliverable.',
        parameters: z.object({
          email: z.string().email().describe('Email to verify'),
        }),
        execute: async ({ email }) => {
          const result = await zbVerify(email)
          return JSON.stringify(result)
        },
      }),

      readCompanyWebsite: tool({
        description: 'Read a company website page for additional context.',
        parameters: z.object({
          url: z.string().url().describe('Company URL to read'),
        }),
        execute: async ({ url }) => {
          const result = await readUrl(url)
          return JSON.stringify(result)
        },
      }),

      updateLead: tool({
        description: 'Update a lead record with enriched information.',
        parameters: z.object({
          leadId: z.string().describe('The lead ID to update'),
          email: z.string().nullable().optional().describe('Updated/verified email'),
          linkedin_url: z.string().nullable().optional().describe('LinkedIn URL if found'),
          signals: z.array(z.string()).optional().describe('Additional signals from enrichment'),
          ai_summary: z.string().optional().describe('Updated AI summary with enrichment data'),
        }),
        execute: async ({ leadId, email, linkedin_url, signals, ai_summary }) => {
          const updates: Record<string, unknown> = {}
          if (email !== undefined) updates.email = email
          if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url
          if (ai_summary) updates.ai_summary = ai_summary
          if (signals) {
            // Merge with existing signals
            const { data: existing } = await supabase
              .from('discovered_leads')
              .select('signals')
              .eq('id', leadId)
              .single()
            const existingSignals = (existing?.signals as string[]) || []
            updates.signals = [...new Set([...existingSignals, ...signals])]
          }

          const { error } = await supabase
            .from('discovered_leads')
            .update(updates)
            .eq('id', leadId)

          if (error) return `Error updating lead: ${error.message}`
          enrichedCount++

          await supabase.from('agent_activities').insert({
            campaign_id: campaign.id,
            agent_name: 'Lead Enricher',
            action: 'lead_enriched',
            detail: `Enriched lead ${leadId} with new data`,
            status: 'completed',
          })

          return `Lead ${leadId} updated successfully`
        },
      }),
    },

    onStepFinish: async ({ toolCalls }) => {
      stepCounter++
      if (toolCalls) {
        for (const call of toolCalls) {
          await supabase.from('agent_steps').insert({
            run_id: runId,
            campaign_id: campaign.id,
            step_number: stepCounter,
            tool_name: call.toolName,
            tool_input: call.args as Record<string, unknown>,
            status: 'completed',
          })
        }
      }
      await supabase.from('agent_runs').update({
        steps_completed: stepCounter,
      }).eq('id', runId)
    },
  })

  return {
    enrichedCount,
    tokensUsed: result.usage?.totalTokens || 0,
  }
}
