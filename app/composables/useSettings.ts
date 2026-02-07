export interface AppSettings {
  // General
  companyName: string
  timezone: string
  dateFormat: string
  currency: string

  // Notifications
  emailNotifications: boolean
  desktopNotifications: boolean
  activityDigest: 'off' | 'daily' | 'weekly'

  // AI & Discovery
  defaultConfidenceThreshold: number
  autoApproveHighConfidence: boolean
  maxConcurrentCampaigns: number
  aiProvider: 'openai' | 'anthropic'
  openaiApiKey: string
  openaiModel: string
  anthropicApiKey: string
  anthropicModel: string

  // Display
  defaultPageSize: number
  compactMode: boolean
  showAnimations: boolean

  // Outreach
  defaultMessageTone: 'professional' | 'casual' | 'friendly'
  includeSignature: boolean
  signatureText: string
}

const STORAGE_KEY = 'ledger-crm-settings'

const defaultSettings: AppSettings = {
  companyName: 'My Company',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MMM D, YYYY',
  currency: 'USD',

  emailNotifications: true,
  desktopNotifications: false,
  activityDigest: 'daily',

  defaultConfidenceThreshold: 70,
  autoApproveHighConfidence: false,
  maxConcurrentCampaigns: 3,
  aiProvider: 'openai',
  openaiApiKey: '',
  openaiModel: 'gpt-4o',
  anthropicApiKey: '',
  anthropicModel: 'claude-sonnet-4-20250514',

  defaultPageSize: 25,
  compactMode: false,
  showAnimations: true,

  defaultMessageTone: 'professional',
  includeSignature: true,
  signatureText: '',
}

const settings = ref<AppSettings>({ ...defaultSettings })

function loadSettings() {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      settings.value = { ...defaultSettings, ...parsed }
    }
  } catch {
    // ignore parse errors
  }
}

function saveSettings() {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
}

function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
  settings.value[key] = value
  saveSettings()
}

function resetSettings() {
  settings.value = { ...defaultSettings }
  saveSettings()
}

// Load on first use
if (typeof window !== 'undefined') {
  loadSettings()
}

export function useSettings() {
  return {
    settings: readonly(settings),
    updateSetting,
    saveSettings,
    resetSettings,
    loadSettings,
  }
}
