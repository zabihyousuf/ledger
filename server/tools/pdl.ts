const PDL_BASE = 'https://api.peopledatalabs.com/v5'

function getApiKey(): string {
  const config = useRuntimeConfig()
  return config.pdlApiKey || process.env.PDL_API_KEY || ''
}

export async function enrichPerson(params: {
  email?: string
  firstName?: string
  lastName?: string
  company?: string
  linkedinUrl?: string
}): Promise<{ person: any | null; error?: string }> {
  const key = getApiKey()
  if (!key) return { person: null, error: 'People Data Labs API key not configured. Set PDL_API_KEY in environment variables.' }

  try {
    const queryParams = new URLSearchParams()
    if (params.email) queryParams.set('email', params.email)
    if (params.firstName) queryParams.set('first_name', params.firstName)
    if (params.lastName) queryParams.set('last_name', params.lastName)
    if (params.company) queryParams.set('company', params.company)
    if (params.linkedinUrl) queryParams.set('profile', params.linkedinUrl)

    const res = await fetch(`${PDL_BASE}/person/enrich?${queryParams.toString()}`, {
      headers: { 'X-Api-Key': key },
    })

    if (!res.ok) {
      if (res.status === 404) return { person: null, error: 'Person not found in PDL database.' }
      return { person: null, error: `PDL error: ${res.status}` }
    }

    const data = await res.json()
    return {
      person: {
        fullName: data.full_name,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.work_email || data.personal_emails?.[0],
        phone: data.mobile_phone || data.phone_numbers?.[0],
        title: data.job_title,
        company: data.job_company_name,
        companySize: data.job_company_size,
        companyIndustry: data.job_company_industry,
        companyWebsite: data.job_company_website,
        linkedin: data.linkedin_url,
        location: data.location_name,
        skills: data.skills || [],
        experience: data.experience || [],
      },
    }
  } catch (e: any) {
    return { person: null, error: `PDL enrich failed: ${e.message}` }
  }
}

export async function searchPeople(params: {
  query: string
  size?: number
}): Promise<{ people: any[]; error?: string }> {
  const key = getApiKey()
  if (!key) return { people: [], error: 'People Data Labs API key not configured.' }

  try {
    const res = await fetch(`${PDL_BASE}/person/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': key,
      },
      body: JSON.stringify({
        sql: params.query,
        size: params.size || 10,
      }),
    })

    if (!res.ok) return { people: [], error: `PDL search error: ${res.status}` }

    const data = await res.json()
    const people = (data.data || []).map((p: any) => ({
      fullName: p.full_name,
      title: p.job_title,
      company: p.job_company_name,
      email: p.work_email,
      linkedin: p.linkedin_url,
      location: p.location_name,
    }))

    return { people }
  } catch (e: any) {
    return { people: [], error: `PDL search failed: ${e.message}` }
  }
}
