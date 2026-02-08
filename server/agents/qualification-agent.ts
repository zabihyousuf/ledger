import { generateText, tool } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function runQualificationAgent(
  leadIds: string[],
  campaign: {
    id: string
    target_industry: string
    target_roles: string[]
    target_company_size: string
    target_region: string
    search_criteria: string
    confidence_threshold: number
  },
  supabase: SupabaseClient,
  runId: string,
) {
  if (leadIds.length === 0) return { qualifiedCount: 0, tokensUsed: 0 }

  const config = useRuntimeConfig()
  let stepCounter = 0

  const hasAnthropic = !!(config.anthropicApiKey || process.env.ANTHROPIC_API_KEY)
  const model = hasAnthropic
    ? anthropic('claude-sonnet-4-20250514')
    : openai('gpt-4o')

  // Fetch all leads for this campaign
  const { data: leads } = await supabase
    .from('discovered_leads')
    .select('*')
    .in('id', leadIds)

  if (!leads || leads.length === 0) return { qualifiedCount: 0, tokensUsed: 0 }

  let qualifiedCount = 0

  const result = await generateText({
    model,
    maxSteps: 10,
    system: `You are a lead qualification agent. Analyze each lead below against the Ideal Customer Profile (ICP).

ICP CRITERIA:
- Industry: ${campaign.target_industry}
- Target Roles: ${campaign.target_roles.join(', ')}
- Company Size: ${campaign.target_company_size}
- Region: ${campaign.target_region}
- Additional Criteria: ${campaign.search_criteria}
- Minimum Confidence Threshold: ${campaign.confidence_threshold}%

LEADS TO QUALIFY:
${leads.map((l, i) => `${i + 1}. ID: ${l.id}
   Name: ${l.name}
   Position: ${l.position}
   Company: ${l.company}
   Email: ${l.email || 'unknown'}
   Current Score: ${l.confidence_score}
   Signals: ${(l.signals as string[] || []).join(', ')}
   Current Summary: ${l.ai_summary || 'none'}`).join('\n\n')}

FOR EACH LEAD:
1. Analyze how well they match the ICP
2. Assign a confidence_score (0-100) based on fit
3. Write an ai_summary explaining the score
4. Add relevant signals
5. Call scoreLead for each one`,

    tools: {
      scoreLead: tool({
        description: 'Score and qualify a single lead. Call this for every lead in the list.',
        parameters: z.object({
          leadId: z.string().describe('The lead ID to score'),
          confidence_score: z.number().min(0).max(100).describe('ICP fit score 0-100'),
          ai_summary: z.string().describe('2-3 sentence analysis of why this score was given and how the lead fits the ICP'),
          signals: z.array(z.string()).describe('Qualifying signals, e.g. ["Perfect role match", "Right company size", "Target industry"]'),
        }),
        execute: async ({ leadId, confidence_score, ai_summary, signals }) => {
          const { error } = await supabase
            .from('discovered_leads')
            .update({
              confidence_score,
              ai_summary,
              signals,
            })
            .eq('id', leadId)

          if (error) return `Error scoring lead: ${error.message}`
          qualifiedCount++

          await supabase.from('agent_activities').insert({
            campaign_id: campaign.id,
            agent_name: 'Lead Qualifier',
            action: 'lead_qualified',
            detail: `Scored ${leadId} at ${confidence_score}%`,
            status: 'completed',
          })

          return `Lead ${leadId} scored: ${confidence_score}% — ${ai_summary.slice(0, 100)}...`
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
    qualifiedCount,
    tokensUsed: result.usage?.totalTokens || 0,
  }
}
