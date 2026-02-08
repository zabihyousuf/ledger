const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v1'

function getApiKey(): string {
  const config = useRuntimeConfig()
  return config.firecrawlApiKey || process.env.FIRECRAWL_API_KEY || ''
}

export async function scrapeUrl(url: string): Promise<{ markdown: string; metadata: any; error?: string }> {
  const key = getApiKey()
  if (!key) return { markdown: '', metadata: null, error: 'Firecrawl API key not configured. Set FIRECRAWL_API_KEY in environment variables.' }

  try {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
      }),
    })

    if (!res.ok) return { markdown: '', metadata: null, error: `Firecrawl error: ${res.status} ${res.statusText}` }

    const data = await res.json()
    return {
      markdown: data.data?.markdown || '',
      metadata: data.data?.metadata || null,
    }
  } catch (e: any) {
    return { markdown: '', metadata: null, error: `Firecrawl scrape failed: ${e.message}` }
  }
}
