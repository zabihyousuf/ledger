export interface BugReport {
  id: string
  title: string
  description: string
  page_url: string
  screenshot_data: string | null
  browser_info: string
  viewport: string
  console_errors: string[]
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
}

export function useBugReports() {
  const client = useSupabaseClient()
  const reports = ref<BugReport[]>([])
  const loading = ref(false)
  const submitting = ref(false)

  async function fetchReports() {
    loading.value = true
    try {
      // Try Supabase first
      const { data, error } = await client.from('bug_reports').select('*').order('created_at', { ascending: false })
      if (!error && data) {
        reports.value = data as unknown as BugReport[]
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('ledger_bug_reports')
        reports.value = stored ? JSON.parse(stored) : []
      }
    } catch {
      const stored = localStorage.getItem('ledger_bug_reports')
      reports.value = stored ? JSON.parse(stored) : []
    }
    loading.value = false
  }

  async function captureScreenshot(): Promise<string | null> {
    try {
      // Use html2canvas-style approach via canvas API on the document body
      // For now, we capture the page metadata instead since true screenshots
      // require html2canvas library. We'll capture DOM state info.
      const docEl = document.documentElement
      const bodyInfo = {
        scrollTop: docEl.scrollTop,
        scrollLeft: docEl.scrollLeft,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        pageTitle: document.title,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }
      return JSON.stringify(bodyInfo)
    } catch {
      return null
    }
  }

  function getConsoleErrors(): string[] {
    // Return any errors we can capture
    return []
  }

  function getBrowserInfo(): string {
    return navigator.userAgent
  }

  function getViewport(): string {
    return `${window.innerWidth}x${window.innerHeight}`
  }

  async function submitReport(title: string, description: string): Promise<BugReport | null> {
    submitting.value = true

    const screenshotData = await captureScreenshot()

    const report: BugReport = {
      id: `bug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      description,
      page_url: window.location.href,
      screenshot_data: screenshotData,
      browser_info: getBrowserInfo(),
      viewport: getViewport(),
      console_errors: getConsoleErrors(),
      status: 'open',
      created_at: new Date().toISOString(),
    }

    try {
      // Try Supabase first
      const { data, error } = await client
        .from('bug_reports')
        .insert({
          title: report.title,
          description: report.description,
          page_url: report.page_url,
          screenshot_data: report.screenshot_data,
          browser_info: report.browser_info,
          viewport: report.viewport,
          console_errors: report.console_errors,
          status: report.status,
        } as any)
        .select()
        .single()

      if (!error && data) {
        reports.value.unshift(data as unknown as BugReport)
      } else {
        // Fallback to localStorage
        reports.value.unshift(report)
        localStorage.setItem('ledger_bug_reports', JSON.stringify(reports.value))
      }
    } catch {
      reports.value.unshift(report)
      localStorage.setItem('ledger_bug_reports', JSON.stringify(reports.value))
    }

    submitting.value = false
    return report
  }

  async function updateReportStatus(id: string, status: BugReport['status']) {
    const idx = reports.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      reports.value[idx] = { ...reports.value[idx]!, status }
    }

    try {
      await client.from('bug_reports').update({ status } as any).eq('id', id)
    } catch {
      localStorage.setItem('ledger_bug_reports', JSON.stringify(reports.value))
    }
  }

  return {
    reports,
    loading,
    submitting,
    fetchReports,
    submitReport,
    updateReportStatus,
  }
}
