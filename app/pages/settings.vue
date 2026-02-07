<script setup lang="ts">
import {
  Building2,
  Globe,
  Calendar,
  DollarSign,
  Bell,
  BellRing,
  Mail,
  Gauge,
  Zap,
  Layers,
  Minimize2,
  Sparkles,
  MessageSquare,
  Smile,
  FileSignature,
  RotateCcw,
  Key,
  Bot,
  Eye,
  EyeOff,
  Brain,
  CheckCircle2,
  AlertCircle,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { settings, updateSetting, resetSettings } = useSettings()

function handleUpdate<K extends keyof typeof settings.value>(key: K, value: (typeof settings.value)[K]) {
  updateSetting(key, value)
  toast.success('Settings saved')
}

function handleReset() {
  resetSettings()
  toast.success('Settings reset to defaults')
}

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const dateFormats = [
  { value: 'MMM D, YYYY', label: 'MMM D, YYYY (Jan 5, 2025)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (05/01/2025)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (01/05/2025)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-01-05)' },
]

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'BRL', label: 'BRL (R$)' },
]

const pageSizes = [10, 25, 50, 100]

// ── API Key visibility toggles ──
const showOpenAIKey = ref(false)
const showAnthropicKey = ref(false)

function maskKey(key: string): string {
  if (!key || key.length < 8) return key
  return key.slice(0, 4) + '•'.repeat(key.length - 8) + key.slice(-4)
}

function isKeyConfigured(key: string): boolean {
  return key.length > 0
}

const openaiModels = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'o1', label: 'o1' },
  { value: 'o1-mini', label: 'o1 Mini' },
]

const anthropicModels = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
]
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold tracking-tight">Settings</h2>
      <p class="text-sm text-muted-foreground">Configure your CRM preferences and integrations.</p>
    </div>

    <!-- Tabs -->
    <Tabs default-value="general">
      <TabsList class="mb-6">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="ai">AI & Discovery</TabsTrigger>
        <TabsTrigger value="display">Display</TabsTrigger>
        <TabsTrigger value="outreach">Outreach</TabsTrigger>
      </TabsList>

      <!-- ================================================================== -->
      <!--                          GENERAL TAB                                -->
      <!-- ================================================================== -->
      <TabsContent value="general">
        <div class="space-y-6">
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 class="text-lg font-semibold mb-1">Organization</h3>
            <p class="text-sm text-muted-foreground mb-6">Basic information about your company.</p>

            <div class="space-y-6">
              <!-- Company Name -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Company Name</label>
                    <p class="text-xs text-muted-foreground mt-0.5">The name displayed across your CRM.</p>
                  </div>
                </div>
                <Input
                  :model-value="settings.companyName"
                  class="w-64"
                  placeholder="Your company name"
                  @change="handleUpdate('companyName', ($event.target as HTMLInputElement).value)"
                />
              </div>

              <div class="border-t border-border" />

              <!-- Timezone -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Timezone</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Used for scheduling and activity timestamps.</p>
                  </div>
                </div>
                <Select
                  :model-value="settings.timezone"
                  @update:model-value="(val: string) => handleUpdate('timezone', val)"
                >
                  <SelectTrigger class="w-64">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="tz in timezones" :key="tz" :value="tz">
                      {{ tz }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="border-t border-border" />

              <!-- Date Format -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Date Format</label>
                    <p class="text-xs text-muted-foreground mt-0.5">How dates are displayed throughout the app.</p>
                  </div>
                </div>
                <Select
                  :model-value="settings.dateFormat"
                  @update:model-value="(val: string) => handleUpdate('dateFormat', val)"
                >
                  <SelectTrigger class="w-64">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="df in dateFormats" :key="df.value" :value="df.value">
                      {{ df.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="border-t border-border" />

              <!-- Currency -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <DollarSign class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Currency</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Default currency for deals and revenue.</p>
                  </div>
                </div>
                <Select
                  :model-value="settings.currency"
                  @update:model-value="(val: string) => handleUpdate('currency', val)"
                >
                  <SelectTrigger class="w-64">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="c in currencies" :key="c.value" :value="c.value">
                      {{ c.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- ================================================================== -->
      <!--                       INTEGRATIONS TAB                              -->
      <!-- ================================================================== -->
      <TabsContent value="integrations">
        <div class="space-y-6">
          <!-- AI Provider Selection -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 class="text-lg font-semibold mb-1">AI Provider</h3>
            <p class="text-sm text-muted-foreground mb-6">Select which AI provider your agents use for campaigns, lead scoring, and message generation.</p>

            <div class="flex items-center justify-between gap-8">
              <div class="flex items-start gap-3 min-w-0">
                <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Brain class="size-4 text-primary" />
                </div>
                <div>
                  <label class="text-sm font-medium">Active Provider</label>
                  <p class="text-xs text-muted-foreground mt-0.5">The AI backend used across all agent operations.</p>
                </div>
              </div>
              <Select
                :model-value="settings.aiProvider"
                @update:model-value="(val: string) => handleUpdate('aiProvider', val as 'openai' | 'anthropic')"
              >
                <SelectTrigger class="w-64">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- OpenAI Configuration -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-1">
              <h3 class="text-lg font-semibold">OpenAI</h3>
              <div class="flex items-center gap-2">
                <div v-if="isKeyConfigured(settings.openaiApiKey)" class="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 class="size-3.5" />
                  Configured
                </div>
                <div v-else class="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle class="size-3.5" />
                  Not configured
                </div>
                <Badge v-if="settings.aiProvider === 'openai'" variant="default" class="text-xs">Active</Badge>
              </div>
            </div>
            <p class="text-sm text-muted-foreground mb-6">Connect your OpenAI account for GPT-powered agents.</p>

            <div class="space-y-6">
              <!-- API Key -->
              <div class="flex items-start justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Key class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">API Key</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Your OpenAI API key. Stored locally in your browser.</p>
                  </div>
                </div>
                <div class="w-80 shrink-0">
                  <div class="relative">
                    <Input
                      :type="showOpenAIKey ? 'text' : 'password'"
                      :model-value="settings.openaiApiKey"
                      placeholder="sk-..."
                      class="pr-10 font-mono text-sm"
                      @change="handleUpdate('openaiApiKey', ($event.target as HTMLInputElement).value)"
                    />
                    <button
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      @click="showOpenAIKey = !showOpenAIKey"
                    >
                      <EyeOff v-if="showOpenAIKey" class="size-4" />
                      <Eye v-else class="size-4" />
                    </button>
                  </div>
                  <p class="text-[10px] text-muted-foreground mt-1.5">Find your key at platform.openai.com/api-keys</p>
                </div>
              </div>

              <div class="border-t border-border" />

              <!-- Model -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Model</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Which GPT model to use for AI agent operations.</p>
                  </div>
                </div>
                <Select
                  :model-value="settings.openaiModel"
                  @update:model-value="(val: string) => handleUpdate('openaiModel', val)"
                >
                  <SelectTrigger class="w-64">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="m in openaiModels" :key="m.value" :value="m.value">
                      {{ m.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <!-- Anthropic Configuration -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-1">
              <h3 class="text-lg font-semibold">Anthropic</h3>
              <div class="flex items-center gap-2">
                <div v-if="isKeyConfigured(settings.anthropicApiKey)" class="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 class="size-3.5" />
                  Configured
                </div>
                <div v-else class="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle class="size-3.5" />
                  Not configured
                </div>
                <Badge v-if="settings.aiProvider === 'anthropic'" variant="default" class="text-xs">Active</Badge>
              </div>
            </div>
            <p class="text-sm text-muted-foreground mb-6">Connect your Anthropic account for Claude-powered agents.</p>

            <div class="space-y-6">
              <!-- API Key -->
              <div class="flex items-start justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Key class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">API Key</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Your Anthropic API key. Stored locally in your browser.</p>
                  </div>
                </div>
                <div class="w-80 shrink-0">
                  <div class="relative">
                    <Input
                      :type="showAnthropicKey ? 'text' : 'password'"
                      :model-value="settings.anthropicApiKey"
                      placeholder="sk-ant-..."
                      class="pr-10 font-mono text-sm"
                      @change="handleUpdate('anthropicApiKey', ($event.target as HTMLInputElement).value)"
                    />
                    <button
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      @click="showAnthropicKey = !showAnthropicKey"
                    >
                      <EyeOff v-if="showAnthropicKey" class="size-4" />
                      <Eye v-else class="size-4" />
                    </button>
                  </div>
                  <p class="text-[10px] text-muted-foreground mt-1.5">Find your key at console.anthropic.com/settings/keys</p>
                </div>
              </div>

              <div class="border-t border-border" />

              <!-- Model -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Model</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Which Claude model to use for AI agent operations.</p>
                  </div>
                </div>
                <Select
                  :model-value="settings.anthropicModel"
                  @update:model-value="(val: string) => handleUpdate('anthropicModel', val)"
                >
                  <SelectTrigger class="w-64">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="m in anthropicModels" :key="m.value" :value="m.value">
                      {{ m.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <!-- Security Notice -->
          <div class="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div class="flex items-start gap-3">
              <AlertCircle class="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-amber-700">API keys are stored locally</p>
                <p class="text-xs text-muted-foreground mt-0.5">Your API keys are saved in your browser's local storage and never sent to our servers. They are only used client-side to make requests to the respective AI providers. Clear your browser data to remove them.</p>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- ================================================================== -->
      <!--                       NOTIFICATIONS TAB                             -->
      <!-- ================================================================== -->
      <TabsContent value="notifications">
        <div class="space-y-6">
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 class="text-lg font-semibold mb-1">Notification Preferences</h3>
            <p class="text-sm text-muted-foreground mb-6">Control how and when you receive notifications.</p>

            <div class="space-y-6">
              <!-- Email Notifications -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Email Notifications</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Receive updates and alerts via email.</p>
                  </div>
                </div>
                <Switch
                  :checked="settings.emailNotifications"
                  @update:checked="(val: boolean) => handleUpdate('emailNotifications', val)"
                />
              </div>

              <div class="border-t border-border" />

              <!-- Desktop Notifications -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <BellRing class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Desktop Notifications</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Show browser push notifications for real-time alerts.</p>
                  </div>
                </div>
                <Switch
                  :checked="settings.desktopNotifications"
                  @update:checked="(val: boolean) => handleUpdate('desktopNotifications', val)"
                />
              </div>

              <div class="border-t border-border" />

              <!-- Activity Digest -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Activity Digest</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Summary of CRM activity delivered to your inbox.</p>
                  </div>
                </div>
                <Select
                  :model-value="settings.activityDigest"
                  @update:model-value="(val: string) => handleUpdate('activityDigest', val as 'off' | 'daily' | 'weekly')"
                >
                  <SelectTrigger class="w-40">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- ================================================================== -->
      <!--                      AI & DISCOVERY TAB                             -->
      <!-- ================================================================== -->
      <TabsContent value="ai">
        <div class="space-y-6">
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 class="text-lg font-semibold mb-1">AI Configuration</h3>
            <p class="text-sm text-muted-foreground mb-6">Fine-tune how AI-powered discovery and scoring works.</p>

            <div class="space-y-6">
              <!-- Confidence Threshold -->
              <div class="flex items-start justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Gauge class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Default Confidence Threshold</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Minimum AI confidence score for discovered leads.</p>
                  </div>
                </div>
                <div class="w-64 shrink-0">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs text-muted-foreground">Low</span>
                    <span class="text-sm font-bold text-primary">{{ settings.defaultConfidenceThreshold }}%</span>
                    <span class="text-xs text-muted-foreground">High</span>
                  </div>
                  <input
                    type="range"
                    :value="settings.defaultConfidenceThreshold"
                    min="10"
                    max="100"
                    step="5"
                    class="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    @input="handleUpdate('defaultConfidenceThreshold', Number(($event.target as HTMLInputElement).value))"
                  />
                </div>
              </div>

              <div class="border-t border-border" />

              <!-- Auto-approve High Confidence -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Auto-Approve High Confidence</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Automatically approve leads that exceed the confidence threshold.</p>
                  </div>
                </div>
                <Switch
                  :checked="settings.autoApproveHighConfidence"
                  @update:checked="(val: boolean) => handleUpdate('autoApproveHighConfidence', val)"
                />
              </div>

              <div class="border-t border-border" />

              <!-- Max Concurrent Campaigns -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Max Concurrent Campaigns</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Limit how many discovery campaigns run simultaneously.</p>
                  </div>
                </div>
                <Select
                  :model-value="String(settings.maxConcurrentCampaigns)"
                  @update:model-value="(val: string) => handleUpdate('maxConcurrentCampaigns', Number(val))"
                >
                  <SelectTrigger class="w-40">
                    <SelectValue placeholder="Select limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="n in [1, 2, 3, 5, 10]" :key="n" :value="String(n)">
                      {{ n }} campaign{{ n > 1 ? 's' : '' }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- ================================================================== -->
      <!--                         DISPLAY TAB                                 -->
      <!-- ================================================================== -->
      <TabsContent value="display">
        <div class="space-y-6">
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 class="text-lg font-semibold mb-1">Appearance</h3>
            <p class="text-sm text-muted-foreground mb-6">Customize how the interface looks and feels.</p>

            <div class="space-y-6">
              <!-- Default Page Size -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Default Page Size</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Number of items shown per page in lists and tables.</p>
                  </div>
                </div>
                <Select
                  :model-value="String(settings.defaultPageSize)"
                  @update:model-value="(val: string) => handleUpdate('defaultPageSize', Number(val))"
                >
                  <SelectTrigger class="w-40">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="size in pageSizes" :key="size" :value="String(size)">
                      {{ size }} items
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="border-t border-border" />

              <!-- Compact Mode -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Minimize2 class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Compact Mode</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Reduce spacing and padding for a denser layout.</p>
                  </div>
                </div>
                <Switch
                  :checked="settings.compactMode"
                  @update:checked="(val: boolean) => handleUpdate('compactMode', val)"
                />
              </div>

              <div class="border-t border-border" />

              <!-- Show Animations -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Show Animations</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Enable transitions and motion effects throughout the UI.</p>
                  </div>
                </div>
                <Switch
                  :checked="settings.showAnimations"
                  @update:checked="(val: boolean) => handleUpdate('showAnimations', val)"
                />
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- ================================================================== -->
      <!--                        OUTREACH TAB                                 -->
      <!-- ================================================================== -->
      <TabsContent value="outreach">
        <div class="space-y-6">
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 class="text-lg font-semibold mb-1">Messaging Defaults</h3>
            <p class="text-sm text-muted-foreground mb-6">Configure how outgoing messages are composed.</p>

            <div class="space-y-6">
              <!-- Default Message Tone -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Default Message Tone</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Sets the tone for AI-generated outreach messages.</p>
                  </div>
                </div>
                <Select
                  :model-value="settings.defaultMessageTone"
                  @update:model-value="(val: string) => handleUpdate('defaultMessageTone', val as 'professional' | 'casual' | 'friendly')"
                >
                  <SelectTrigger class="w-48">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="border-t border-border" />

              <!-- Include Signature -->
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FileSignature class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Include Signature</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Automatically append your signature to outgoing messages.</p>
                  </div>
                </div>
                <Switch
                  :checked="settings.includeSignature"
                  @update:checked="(val: boolean) => handleUpdate('includeSignature', val)"
                />
              </div>

              <div class="border-t border-border" />

              <!-- Signature Text -->
              <div class="flex items-start justify-between gap-8">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Smile class="size-4 text-primary" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Signature Text</label>
                    <p class="text-xs text-muted-foreground mt-0.5">Your email signature appended to outbound messages.</p>
                  </div>
                </div>
                <Textarea
                  :model-value="settings.signatureText"
                  class="w-64"
                  rows="3"
                  placeholder="Best regards,&#10;Your Name"
                  @change="handleUpdate('signatureText', ($event.target as HTMLTextAreaElement).value)"
                />
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>

    <!-- Reset to Defaults -->
    <div class="mt-8 flex justify-end">
      <Button variant="outline" class="text-muted-foreground" @click="handleReset">
        <RotateCcw class="size-4 mr-2" />
        Reset to Defaults
      </Button>
    </div>
  </div>
</template>
