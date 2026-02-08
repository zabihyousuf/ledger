import { generateText, tool } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { searchCompanies, searchPeople } from '../tools/apollo'
import { findEmail } from '../tools/hunter'
import { scrapeUrl } from '../tools/firecrawl'
import { readUrl } from '../tools/jina'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function runDiscoveryAgent(
  campaign: {
    id: string
    target_industry: string
    target_roles: string[]
    target_company_size: string
    target_region: string
    search_criteria: string
    confidence_threshold: number
    max_leads_per_run: number
  },
  supabase: SupabaseClient,
  runId: string,
) {
  const config = useRuntimeConfig()
  let stepCounter = 0

  // Pick model based on available keys
  const hasAnthropic = !!(config.anthropicApiKey || process.env.ANTHROPIC_API_KEY)
  const hasOpenai = !!(config.openaiApiKey || process.env.OPENAI_API_KEY)

  if (!hasAnthropic && !hasOpenai) {
    throw new Error('No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.')
  }

  const model = hasAnthropic
    ? anthropic('claude-sonnet-4-20250514')
    : openai('gpt-4o')

  const discoveredLeadIds: string[] = []

  const result = await generateText({
    model,
    maxSteps: 25,
    system: `You are a B2B lead discovery agent for a CRM platform called Ledger.
Your job is to find REAL people who match the campaign criteria below.

CAMPAIGN CRITERIA:
- Industry: ${campaign.target_industry}
- Target Roles: ${campaign.target_roles.join(', ')}
- Company Size: ${campaign.target_company_size}
- Region: ${campaign.target_region}
- Search Criteria: ${campaign.search_criteria}
- Minimum Confidence: ${campaign.confidence_threshold}%
- Max Leads to Find: ${campaign.max_leads_per_run}

INSTRUCTIONS:
1. Start by searching for companies matching the industry, size, and region.
2. For each promising company, search for people with matching titles/roles.
3. Try to find email addresses for the best matches.
4. Optionally scrape company websites for additional context about the team.
5. Save each qualified lead using the saveLead tool.
6. Include an ai_summary explaining WHY this person is a good lead.
7. Include discovery signals (e.g., "Matches target role", "Company in target industry").

Be thorough but efficient. Focus on quality over quantity.
If a tool returns an error about missing API keys, skip that tool and use alternatives.`,

    tools: {
      searchCompanies: tool({
        description: 'Search for companies matching industry, location, and size criteria. Returns a list of companies with basic info.',
        parameters: z.object({
          query: z.string().describe('Industry or keyword to search for'),
          location: z.string().optional().describe('Geographic location filter'),
          employeeRange: z.string().optional().describe('Employee count range like "11,50" or "51,200"'),
        }),
        execute: async ({ query, location, employeeRange }) => {
          const result = await searchCompanies({ query, location, employeeRange })
          return JSON.stringify(result)
        },
      }),

      searchPeople: tool({
        description: 'Search for people at companies by job title. Returns names, titles, emails, and LinkedIn URLs.',
        parameters: z.object({
          titles: z.array(z.string()).describe('Job titles to search for, e.g. ["CTO", "VP Engineering"]'),
          domain: z.string().optional().describe('Company domain to search within, e.g. "acme.com"'),
        }),
        execute: async ({ titles, domain }) => {
          const result = await searchPeople({ titles, domain })
          return JSON.stringify(result)
        },
      }),

      scrapeWebsite: tool({
        description: 'Scrape a company website to extract team/about page info. Use for companies without good data from search.',
        parameters: z.object({
          url: z.string().url().describe('The URL to scrape (e.g., company about page or team page)'),
        }),
        execute: async ({ url }) => {
          // Try Firecrawl first, fall back to Jina
          const firecrawlResult = await scrapeUrl(url)
          if (firecrawlResult.error && firecrawlResult.error.includes('not configured')) {
            const jinaResult = await readUrl(url)
            return JSON.stringify(jinaResult)
          }
          return JSON.stringify({ content: firecrawlResult.markdown, metadata: firecrawlResult.metadata })
        },
      }),

      findEmail: tool({
        description: 'Find the email address for a specific person at a company domain.',
        parameters: z.object({
          firstName: z.string().describe('First name of the person'),
          lastName: z.string().describe('Last name of the person'),
          domain: z.string().describe('Company domain, e.g. "acme.com"'),
        }),
        execute: async ({ firstName, lastName, domain }) => {
          const result = await findEmail({ firstName, lastName, domain })
          return JSON.stringify(result)
        },
      }),

      saveLead: tool({
        description: 'Save a discovered lead to the database. Call this for each qualified person you find.',
        parameters: z.object({
          name: z.string().describe('Full name of the person'),
          company: z.string().describe('Company name'),
          position: z.string().describe('Job title / position'),
          email: z.string().nullable().optional().describe('Email address if found'),
          linkedin_url: z.string().nullable().optional().describe('LinkedIn profile URL if found'),
          confidence_score: z.number().min(0).max(100).describe('How confident you are this person matches the ICP (0-100)'),
          discovery_source: z.string().describe('How you found this lead, e.g. "Apollo company search", "Website scrape"'),
          ai_summary: z.string().describe('1-2 sentence explanation of why this person is a good lead'),
          signals: z.array(z.string()).describe('Discovery signals, e.g. ["Matches target role", "Company in target industry", "Recently funded"]'),
        }),
        execute: async (lead) => {
          const { data, error } = await supabase
            .from('discovered_leads')
            .insert({
              campaign_id: campaign.id,
              name: lead.name,
              company: lead.company,
              position: lead.position,
              email: lead.email || null,
              linkedin_url: lead.linkedin_url || null,
              confidence_score: lead.confidence_score,
              discovery_source: lead.discovery_source,
              ai_summary: lead.ai_summary,
              signals: lead.signals,
              status: 'pending_review',
            })
            .select('id')
            .single()

          if (error) return `Error saving lead: ${error.message}`

          if (data) discoveredLeadIds.push(data.id)

          // Log activity
          await supabase.from('agent_activities').insert({
            campaign_id: campaign.id,
            agent_name: 'Lead Scout',
            action: 'lead_discovered',
            detail: `Found ${lead.name} (${lead.position}) at ${lead.company} — confidence: ${lead.confidence_score}%`,
            status: 'completed',
          })

          return `Lead saved: ${lead.name} at ${lead.company} (confidence: ${lead.confidence_score}%)`
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
      // Update run progress
      await supabase.from('agent_runs').update({
        steps_completed: stepCounter,
        leads_found: discoveredLeadIds.length,
      }).eq('id', runId)
    },
  })

  // Update campaign leads_found count
  await supabase.from('discovery_campaigns').update({
    leads_found: discoveredLeadIds.length,
  }).eq('id', campaign.id)

  return {
    leadIds: discoveredLeadIds,
    stepsUsed: stepCounter,
    tokensUsed: result.usage?.totalTokens || 0,
  }
}
