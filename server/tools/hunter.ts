const HUNTER_BASE = 'https://api.hunter.io/v2'

function getApiKey(): string {
  const config = useRuntimeConfig()
  return config.hunterApiKey || process.env.HUNTER_API_KEY || ''
}

export async function findEmail(params: {
  firstName: string
  lastName: string
  domain: string
}): Promise<{ email: string | null; confidence: number; error?: string }> {
  const key = getApiKey()
  if (!key) return { email: null, confidence: 0, error: 'Hunter.io API key not configured. Set HUNTER_API_KEY in environment variables.' }

  try {
    const url = `${HUNTER_BASE}/email-finder?domain=${encodeURIComponent(params.domain)}&first_name=${encodeURIComponent(params.firstName)}&last_name=${encodeURIComponent(params.lastName)}&api_key=${key}`

    const res = await fetch(url)
    if (!res.ok) return { email: null, confidence: 0, error: `Hunter API error: ${res.status}` }

    const data = await res.json()
    return {
      email: data.data?.email || null,
      confidence: data.data?.confidence || 0,
    }
  } catch (e: any) {
    return { email: null, confidence: 0, error: `Hunter email find failed: ${e.message}` }
  }
}

export async function verifyEmail(email: string): Promise<{ status: string; score: number; error?: string }> {
  const key = getApiKey()
  if (!key) return { status: 'unknown', score: 0, error: 'Hunter.io API key not configured.' }

  try {
    const url = `${HUNTER_BASE}/email-verifier?email=${encodeURIComponent(email)}&api_key=${key}`

    const res = await fetch(url)
    if (!res.ok) return { status: 'unknown', score: 0, error: `Hunter verify error: ${res.status}` }

    const data = await res.json()
    return {
      status: data.data?.status || 'unknown',
      score: data.data?.score || 0,
    }
  } catch (e: any) {
    return { status: 'unknown', score: 0, error: `Hunter verify failed: ${e.message}` }
  }
}

export async function domainSearch(domain: string): Promise<{ emails: any[]; error?: string }> {
  const key = getApiKey()
  if (!key) return { emails: [], error: 'Hunter.io API key not configured.' }

  try {
    const url = `${HUNTER_BASE}/domain-search?domain=${encodeURIComponent(domain)}&api_key=${key}`

    const res = await fetch(url)
    if (!res.ok) return { emails: [], error: `Hunter domain search error: ${res.status}` }

    const data = await res.json()
    const emails = (data.data?.emails || []).map((e: any) => ({
      email: e.value,
      firstName: e.first_name,
      lastName: e.last_name,
      position: e.position,
      confidence: e.confidence,
    }))

    return { emails }
  } catch (e: any) {
    return { emails: [], error: `Hunter domain search failed: ${e.message}` }
  }
}
