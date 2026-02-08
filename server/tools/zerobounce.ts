const ZB_BASE = 'https://api.zerobounce.net/v2'

function getApiKey(): string {
  const config = useRuntimeConfig()
  return config.zerobounceApiKey || process.env.ZEROBOUNCE_API_KEY || ''
}

export async function verifyEmail(email: string): Promise<{
  status: string
  subStatus: string
  valid: boolean
  error?: string
}> {
  const key = getApiKey()
  if (!key) return { status: 'unknown', subStatus: '', valid: false, error: 'ZeroBounce API key not configured. Set ZEROBOUNCE_API_KEY in environment variables.' }

  try {
    const url = `${ZB_BASE}/validate?api_key=${key}&email=${encodeURIComponent(email)}`

    const res = await fetch(url)
    if (!res.ok) return { status: 'unknown', subStatus: '', valid: false, error: `ZeroBounce error: ${res.status}` }

    const data = await res.json()
    return {
      status: data.status || 'unknown',
      subStatus: data.sub_status || '',
      valid: data.status === 'valid',
    }
  } catch (e: any) {
    return { status: 'unknown', subStatus: '', valid: false, error: `ZeroBounce verify failed: ${e.message}` }
  }
}
