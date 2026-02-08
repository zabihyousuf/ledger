export async function readUrl(url: string): Promise<{ content: string; error?: string }> {
  try {
    // Jina Reader converts any URL to clean markdown text
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'text/plain',
      },
    })

    if (!res.ok) return { content: '', error: `Jina Reader error: ${res.status} ${res.statusText}` }

    const text = await res.text()
    // Trim to first 10000 chars to stay within LLM context limits
    return { content: text.slice(0, 10000) }
  } catch (e: any) {
    return { content: '', error: `Jina Reader failed: ${e.message}` }
  }
}
