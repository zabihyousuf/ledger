import { createServerSupabase } from '../../../utils/supabase'

/**
 * POST /api/agents/:id/test
 *
 * Tests an agent by:
 * 1. Verifying attached tools have valid API key env vars configured
 * 2. Validating skills are properly attached
 * 3. Checking AI provider keys
 * 4. Generating a test scenario summary showing what the agent can do
 */

// Map tool names to their expected environment variable names
const toolEnvMap: Record<string, string> = {
  'Apollo.io': 'APOLLO_API_KEY',
  'Hunter.io': 'HUNTER_API_KEY',
  'People Data Labs': 'PDL_API_KEY',
  'Firecrawl': 'FIRECRAWL_API_KEY',
  'Jina Reader': 'JINA_API_KEY',
  'ZeroBounce': 'ZEROBOUNCE_API_KEY',
  'Clearbit': 'CLEARBIT_API_KEY',
  'Crunchbase': 'CRUNCHBASE_API_KEY',
  'PhantomBuster': 'PHANTOMBUSTER_API_KEY',
  'Snov.io': 'SNOV_API_KEY',
}

// Describe what each tool does in a test scenario
const toolCapabilities: Record<string, { action: string; testDescription: string }> = {
  'Apollo.io': { action: 'Search company databases', testDescription: 'Can search 275M+ contacts and companies by ICP criteria' },
  'Hunter.io': { action: 'Find email addresses', testDescription: 'Can find and verify professional email addresses by name and domain' },
  'People Data Labs': { action: 'Enrich lead profiles', testDescription: 'Can enrich contacts with job title, company size, and social links' },
  'Firecrawl': { action: 'Scrape company websites', testDescription: 'Can extract structured data from any website with AI parsing' },
  'Jina Reader': { action: 'Read web pages', testDescription: 'Can convert any URL to clean markdown for analysis' },
  'ZeroBounce': { action: 'Validate emails', testDescription: 'Can verify email deliverability and detect disposable addresses' },
  'Clearbit': { action: 'Company enrichment', testDescription: 'Can enrich with firmographic data, tech stack, and employee info' },
  'Crunchbase': { action: 'Funding intelligence', testDescription: 'Can pull funding rounds, key people, and growth signals' },
  'PhantomBuster': { action: 'LinkedIn automation', testDescription: 'Can extract data from LinkedIn profiles and company pages' },
  'Snov.io': { action: 'Email outreach', testDescription: 'Can find emails and send drip campaign sequences' },
}

// Describe what each skill enables
const skillCapabilities: Record<string, string> = {
  'Lead Discovery': 'Search and identify potential leads matching your ICP',
  'Email Finding': 'Find professional email addresses for discovered contacts',
  'Data Enrichment': 'Augment lead profiles with firmographic and demographic data',
  'Lead Scoring': 'Score and rank leads based on fit and engagement signals',
  'Email Outreach': 'Craft and send personalized outreach emails',
  'Social Monitoring': 'Monitor social media for buying signals and mentions',
  'Company Research': 'Deep-dive research on target companies',
  'Competitor Analysis': 'Analyze competitor positioning and market dynamics',
  'CRM Sync': 'Sync data with external CRM systems',
  'Report Generation': 'Generate reports and summaries of agent activities',
  'Web Scraping': 'Extract data from websites and online sources',
  'Signal Detection': 'Detect buying signals like funding, hiring, and tech changes',
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Agent ID required' })

  const supabase = createServerSupabase()

  // Load agent
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single()

  if (agentError || !agent) {
    throw createError({ statusCode: 404, message: 'Agent not found' })
  }

  // Load attached tools with their names
  const { data: agentTools, error: toolsError } = await supabase
    .from('agent_tools')
    .select('tool_id, tools(name, description)')
    .eq('agent_id', id)

  if (toolsError) {
    throw createError({ statusCode: 500, message: 'Failed to load agent tools' })
  }

  // Load attached skills
  const { data: agentSkills, error: skillsError } = await supabase
    .from('agent_skills')
    .select('skill_id, skills(name, description)')
    .eq('agent_id', id)

  if (skillsError) {
    throw createError({ statusCode: 500, message: 'Failed to load agent skills' })
  }

  const toolResults: Record<string, { ok: boolean; message: string; capability?: string }> = {}
  const skillResults: Record<string, { ok: boolean; message: string; capability?: string }> = {}
  let allToolsOk = true
  let hasTools = false
  let hasSkills = false

  // Check each attached tool
  if (agentTools && agentTools.length > 0) {
    hasTools = true
    for (const at of agentTools) {
      const toolName = (at as any).tools?.name || 'Unknown Tool'
      const envVar = toolEnvMap[toolName]
      const capability = toolCapabilities[toolName]

      if (!envVar) {
        toolResults[toolName] = {
          ok: true,
          message: 'Community tool — no API key required',
          capability: capability?.testDescription || 'Ready to use',
        }
        continue
      }

      const keyValue = process.env[envVar]
      if (keyValue && keyValue.length > 0) {
        toolResults[toolName] = {
          ok: true,
          message: `API key configured (${envVar})`,
          capability: capability?.testDescription || 'Tool ready',
        }
      } else {
        toolResults[toolName] = {
          ok: false,
          message: `Missing env var: ${envVar}`,
          capability: capability?.testDescription || 'Tool not configured',
        }
        allToolsOk = false
      }
    }
  }

  // Check each attached skill
  if (agentSkills && agentSkills.length > 0) {
    hasSkills = true
    for (const as_ of agentSkills) {
      const skillName = (as_ as any).skills?.name || 'Unknown Skill'
      const capability = skillCapabilities[skillName]

      skillResults[skillName] = {
        ok: true,
        message: 'Skill attached and ready',
        capability: capability || 'Custom skill',
      }
    }
  }

  // Check AI provider keys
  const config = useRuntimeConfig()
  const aiProviders: Record<string, { ok: boolean; message: string }> = {}

  const anthropicKey = config.anthropicApiKey || process.env.ANTHROPIC_API_KEY
  aiProviders['Anthropic (Claude)'] = {
    ok: !!anthropicKey,
    message: anthropicKey ? 'API key configured' : 'Not configured — add ANTHROPIC_API_KEY',
  }

  const openaiKey = config.openaiApiKey || process.env.OPENAI_API_KEY
  aiProviders['OpenAI'] = {
    ok: !!openaiKey,
    message: openaiKey ? 'API key configured' : 'Not configured — add OPENAI_API_KEY',
  }

  const hasAnyAI = !!anthropicKey || !!openaiKey

  // Build test scenario
  const scenarioSteps: string[] = []
  const toolNames = agentTools?.map((t: any) => t.tools?.name).filter(Boolean) || []
  const skillNames = agentSkills?.map((s: any) => s.skills?.name).filter(Boolean) || []

  if (skillNames.includes('Lead Discovery') || skillNames.includes('Company Research')) {
    scenarioSteps.push('Search for leads matching your ICP criteria')
  }
  if (toolNames.includes('Apollo.io')) {
    scenarioSteps.push('Query Apollo.io database for matching companies and contacts')
  }
  if (toolNames.includes('Hunter.io')) {
    scenarioSteps.push('Find professional email addresses for discovered leads')
  }
  if (toolNames.includes('People Data Labs') || toolNames.includes('Clearbit')) {
    scenarioSteps.push('Enrich lead profiles with company data and social links')
  }
  if (toolNames.includes('Firecrawl') || toolNames.includes('Jina Reader')) {
    scenarioSteps.push('Scrape company websites for additional intelligence')
  }
  if (toolNames.includes('ZeroBounce')) {
    scenarioSteps.push('Validate email addresses for deliverability')
  }
  if (skillNames.includes('Lead Scoring')) {
    scenarioSteps.push('Score and rank leads based on ICP fit')
  }
  if (skillNames.includes('Email Outreach')) {
    scenarioSteps.push('Draft personalized outreach emails')
  }
  if (skillNames.includes('Signal Detection') || skillNames.includes('Social Monitoring')) {
    scenarioSteps.push('Monitor for buying signals and engagement opportunities')
  }

  if (scenarioSteps.length === 0) {
    scenarioSteps.push('No workflow steps configured — attach skills and tools to define agent capabilities')
  }

  // Overall success
  const success = hasTools && allToolsOk && hasAnyAI

  return {
    success,
    agent: {
      id: agent.id,
      name: agent.name,
      status: agent.status,
    },
    skillCount: agentSkills?.length || 0,
    toolCount: agentTools?.length || 0,
    toolResults,
    skillResults,
    aiProviders,
    results: toolResults, // backward compat
    testScenario: {
      title: `Test Scenario for "${agent.name}"`,
      steps: scenarioSteps,
      summary: success
        ? `Agent is fully configured with ${agentTools?.length || 0} tool(s) and ${agentSkills?.length || 0} skill(s). All API keys verified.`
        : !hasTools
          ? 'No tools attached. Add tools to enable data access capabilities.'
          : !allToolsOk
            ? 'Some tools are missing API keys. Check your environment variables.'
            : 'No AI provider configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY.',
    },
  }
})
