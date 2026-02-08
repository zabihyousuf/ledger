const APOLLO_BASE = 'https://api.apollo.io/v1'

function getApiKey(): string {
  const config = useRuntimeConfig()
  return config.apolloApiKey || process.env.APOLLO_API_KEY || ''
}

export async function searchCompanies(params: {
  query: string
  industry?: string
  location?: string
  employeeRange?: string
  perPage?: number
}): Promise<{ companies: any[]; error?: string }> {
  const key = getApiKey()
  if (!key) return { companies: [], error: 'Apollo API key not configured. Set APOLLO_API_KEY in environment variables.' }

  try {
    const body: Record<string, any> = {
      per_page: params.perPage || 10,
    }
    if (params.query) body.q_organization_keyword_tags = [params.query]
    if (params.location) body.organization_locations = [params.location]
    if (params.employeeRange) body.organization_num_employees_ranges = [params.employeeRange]

    const res = await fetch(`${APOLLO_BASE}/mixed_companies/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': key },
      body: JSON.stringify(body),
    })

    if (!res.ok) return { companies: [], error: `Apollo API error: ${res.status} ${res.statusText}` }

    const data = await res.json()
    const companies = (data.organizations || []).map((org: any) => ({
      id: org.id,
      name: org.name,
      website: org.website_url,
      industry: org.industry,
      employees: org.estimated_num_employees,
      city: org.city,
      state: org.state,
      country: org.country,
      description: org.short_description,
      linkedin_url: org.linkedin_url,
      founded_year: org.founded_year,
    }))

    return { companies }
  } catch (e: any) {
    return { companies: [], error: `Apollo search failed: ${e.message}` }
  }
}

export async function searchPeople(params: {
  titles?: string[]
  domain?: string
  organizationId?: string
  perPage?: number
}): Promise<{ people: any[]; error?: string }> {
  const key = getApiKey()
  if (!key) return { people: [], error: 'Apollo API key not configured.' }

  try {
    const body: Record<string, any> = {
      per_page: params.perPage || 10,
    }
    if (params.titles) body.person_titles = params.titles
    if (params.domain) body.q_organization_domains = params.domain
    if (params.organizationId) body.organization_ids = [params.organizationId]

    const res = await fetch(`${APOLLO_BASE}/mixed_people/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': key },
      body: JSON.stringify(body),
    })

    if (!res.ok) return { people: [], error: `Apollo API error: ${res.status}` }

    const data = await res.json()
    const people = (data.people || []).map((p: any) => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      name: p.name,
      title: p.title,
      email: p.email,
      linkedin_url: p.linkedin_url,
      company: p.organization?.name,
      companyDomain: p.organization?.primary_domain,
      city: p.city,
      state: p.state,
      country: p.country,
    }))

    return { people }
  } catch (e: any) {
    return { people: [], error: `Apollo people search failed: ${e.message}` }
  }
}

export async function enrichPerson(params: {
  email?: string
  firstName?: string
  lastName?: string
  domain?: string
}): Promise<{ person: any | null; error?: string }> {
  const key = getApiKey()
  if (!key) return { person: null, error: 'Apollo API key not configured.' }

  try {
    const res = await fetch(`${APOLLO_BASE}/people/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': key },
      body: JSON.stringify({
        email: params.email,
        first_name: params.firstName,
        last_name: params.lastName,
        organization_domain: params.domain,
      }),
    })

    if (!res.ok) return { person: null, error: `Apollo enrich error: ${res.status}` }

    const data = await res.json()
    return { person: data.person || null }
  } catch (e: any) {
    return { person: null, error: `Apollo enrich failed: ${e.message}` }
  }
}
