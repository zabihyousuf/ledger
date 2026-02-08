import { searchCompanies } from '../../../tools/apollo'
import { findEmail } from '../../../tools/hunter'
import { scrapeUrl } from '../../../tools/firecrawl'
import { readUrl } from '../../../tools/jina'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Campaign ID required' })

  // Run quick tests on each configured tool
  const results: Record<string, { ok: boolean; message: string }> = {}

  // Test Apollo
  const apolloResult = await searchCompanies({ query: 'test', perPage: 1 })
  results.apollo = apolloResult.error
    ? { ok: false, message: apolloResult.error }
    : { ok: true, message: `Found ${apolloResult.companies.length} companies` }

  // Test Hunter
  const hunterResult = await findEmail({ firstName: 'John', lastName: 'Doe', domain: 'example.com' })
  results.hunter = hunterResult.error
    ? { ok: false, message: hunterResult.error }
    : { ok: true, message: `Email: ${hunterResult.email || 'none'}, confidence: ${hunterResult.confidence}` }

  // Test Firecrawl
  const firecrawlResult = await scrapeUrl('https://example.com')
  results.firecrawl = firecrawlResult.error
    ? { ok: false, message: firecrawlResult.error }
    : { ok: true, message: `Scraped ${firecrawlResult.markdown.length} chars` }

  // Test Jina
  const jinaResult = await readUrl('https://example.com')
  results.jina = jinaResult.error
    ? { ok: false, message: jinaResult.error }
    : { ok: true, message: `Read ${jinaResult.content.length} chars` }

  // Check AI keys
  const config = useRuntimeConfig()
  results.anthropic = {
    ok: !!(config.anthropicApiKey || process.env.ANTHROPIC_API_KEY),
    message: (config.anthropicApiKey || process.env.ANTHROPIC_API_KEY) ? 'Key configured' : 'Key not configured',
  }
  results.openai = {
    ok: !!(config.openaiApiKey || process.env.OPENAI_API_KEY),
    message: (config.openaiApiKey || process.env.OPENAI_API_KEY) ? 'Key configured' : 'Key not configured',
  }

  const allOk = Object.values(results).some(r => r.ok) // At least some tools work
  return { success: allOk, results }
})
