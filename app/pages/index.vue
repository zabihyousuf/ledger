<script setup lang="ts">
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  Activity,
  ArrowUpRight,
  Mail,
  UserPlus,
  Radar,
  Bot,
  Loader2,
  Brain,
  Zap,
  Signal,
  Eye,
  Workflow,
  Contact,
  Settings,
  Search,
  BarChart3,
  Globe,
  Sparkles,
  Shield,
  FileText,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { leads, stats, fetchLeads } = useLeads()
const { deals, pipelineStages, fetchDeals } = useDeals()
const { activities, fetchActivities } = useActivities()
const {
  campaigns,
  discoveredLeads,
  fetchCampaigns,
  fetchDiscoveredLeads,
  fetchAgentActivities,
  totalDiscovered,
  totalPending,
  totalApproved,
  activeCampaigns,
  getRunningActivities,
  getRecentActivities,
} = useDiscovery()

onMounted(async () => {
  try {
    await Promise.all([
      fetchLeads(),
      fetchDeals(),
      fetchActivities(10),
      fetchCampaigns(),
      fetchDiscoveredLeads(),
      fetchAgentActivities(),
    ])
  } catch (e) {
    toast.error('Failed to load dashboard data')
  }
})

// --- Greeting ---
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

const todayFormatted = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
})

// --- Stats ---
const statsCards = computed(() => [
  {
    title: 'Total Leads',
    value: stats.value.total,
    change: '+12.5%',
    trend: 'up' as const,
    icon: Users,
    ring: Math.min((stats.value.total / 100) * 100, 100),
    color: 'text-indigo-500',
    ringColor: 'stroke-indigo-500',
    description: 'Total number of leads across all sources and campaigns. Includes leads from AI discovery, manual entry, and imports.',
    breakdown: [
      { label: 'From Discovery', value: totalDiscovered.value },
      { label: 'Manual Entry', value: Math.max(0, stats.value.total - totalDiscovered.value) },
    ],
  },
  {
    title: 'Qualified',
    value: stats.value.qualified,
    change: '+8.2%',
    trend: 'up' as const,
    icon: Target,
    ring: stats.value.total > 0 ? (stats.value.qualified / stats.value.total) * 100 : 0,
    color: 'text-emerald-500',
    ringColor: 'stroke-emerald-500',
    description: 'Leads that have been vetted and meet your ideal customer profile criteria. These are ready for outreach.',
    breakdown: [
      { label: 'Qualification Rate', value: stats.value.total > 0 ? `${Math.round((stats.value.qualified / stats.value.total) * 100)}%` : '0%' },
      { label: 'This Month', value: stats.value.qualified },
    ],
  },
  {
    title: 'In Progress',
    value: stats.value.inProgress,
    change: '-3.1%',
    trend: 'down' as const,
    icon: Activity,
    ring: stats.value.total > 0 ? (stats.value.inProgress / stats.value.total) * 100 : 0,
    color: 'text-amber-500',
    ringColor: 'stroke-amber-500',
    description: 'Leads currently in active engagement stages: contacted, proposal sent, or in negotiation.',
    breakdown: [
      { label: 'Contacted', value: leads.value.filter(l => l.status === 'contacted').length },
      { label: 'Proposal', value: leads.value.filter(l => l.status === 'proposal').length },
      { label: 'Negotiation', value: leads.value.filter(l => l.status === 'negotiation').length },
    ],
  },
  {
    title: 'Converted',
    value: stats.value.converted,
    change: '+24.3%',
    trend: 'up' as const,
    icon: DollarSign,
    ring: stats.value.total > 0 ? (stats.value.converted / stats.value.total) * 100 : 0,
    color: 'text-violet-500',
    ringColor: 'stroke-violet-500',
    description: 'Leads that have been successfully converted into closed-won deals. Your overall conversion funnel output.',
    breakdown: [
      { label: 'Conversion Rate', value: stats.value.total > 0 ? `${Math.round((stats.value.converted / stats.value.total) * 100)}%` : '0%' },
      { label: 'Total Converted', value: stats.value.converted },
    ],
  },
])

// --- Expanded stat card ---
const expandedStatIndex = ref<number | null>(null)

function toggleStatExpand(index: number) {
  if (expandedStatIndex.value === index) {
    expandedStatIndex.value = null
  } else {
    expandedStatIndex.value = index
  }
}

// --- Recent Leads ---
const recentLeads = computed(() =>
  leads.value.slice(0, 5).map((lead) => ({
    name: lead.name,
    company: lead.company || 'N/A',
    status: lead.status || 'new',
    value: lead.value ? `$${lead.value.toLocaleString()}` : '-',
    initials: lead.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  }))
)

// --- Status color map ---
const statusColorMap: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  contacted: 'bg-amber-100 text-amber-700 border-amber-200',
  qualified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  proposal: 'bg-violet-100 text-violet-700 border-violet-200',
  negotiation: 'bg-orange-100 text-orange-700 border-orange-200',
  closed_won: 'bg-green-100 text-green-700 border-green-200',
  closed_lost: 'bg-red-100 text-red-700 border-red-200',
}

function formatTimeAgo(date: string) {
  const now = new Date()
  const past = new Date(date)
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000 / 60)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

// --- SVG progress ring helpers ---
function ringDasharray(percent: number, radius = 36) {
  const circumference = 2 * Math.PI * radius
  const filled = (percent / 100) * circumference
  return `${filled} ${circumference - filled}`
}

function campaignProgress(c: { leads_found: number; leads_approved: number }) {
  if (c.leads_found === 0) return 0
  return Math.round((c.leads_approved / c.leads_found) * 100)
}

// --- Stacked card groups ---
const hoveredStack = ref<string | null>(null)

const cardStacks = [
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    color: 'from-indigo-500 to-violet-600',
    bgAccent: 'bg-indigo-500/10',
    textAccent: 'text-indigo-600',
    items: [
      { label: 'Launch Discovery', description: 'Find new leads with AI', icon: Radar, to: '/discovery' },
      { label: 'Add Lead', description: 'Manual lead entry', icon: UserPlus, to: '/leads' },
      { label: 'Browse Contacts', description: 'Your network', icon: Contact, to: '/contacts' },
      { label: 'Build a Flow', description: 'Automate outreach', icon: Workflow, to: '/flows' },
      { label: 'Configure Agents', description: 'AI workers', icon: Bot, to: '/agents' },
    ],
  },
  {
    id: 'intelligence',
    title: 'Intelligence',
    color: 'from-emerald-500 to-teal-600',
    bgAccent: 'bg-emerald-500/10',
    textAccent: 'text-emerald-600',
    items: [
      { label: 'Discovery Campaigns', description: 'AI-powered prospecting', icon: Radar, to: '/discovery' },
      { label: 'Agent Activity', description: 'Monitor AI tasks', icon: Activity, to: '/activity' },
      { label: 'Lead Scoring', description: 'Qualification pipeline', icon: Target, to: '/leads' },
    ],
  },
  {
    id: 'outreach',
    title: 'Outreach',
    color: 'from-amber-500 to-orange-600',
    bgAccent: 'bg-amber-500/10',
    textAccent: 'text-amber-600',
    items: [
      { label: 'Email Sequences', description: 'Automated outreach', icon: Mail, to: '/flows' },
      { label: 'Flow Builder', description: 'Visual automation', icon: Zap, to: '/flows' },
      { label: 'Templates', description: 'Reusable workflows', icon: FileText, to: '/flows' },
    ],
  },
  {
    id: 'workspace',
    title: 'Workspace',
    color: 'from-violet-500 to-purple-600',
    bgAccent: 'bg-violet-500/10',
    textAccent: 'text-violet-600',
    items: [
      { label: 'All Leads', description: 'Browse pipeline', icon: Users, to: '/leads' },
      { label: 'Settings', description: 'Preferences', icon: Settings, to: '/settings' },
    ],
  },
]
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- ============================================ -->
    <!-- GREETING + DATE                              -->
    <!-- ============================================ -->
    <div class="rounded-xl border border-border bg-card px-8 py-7 shadow-sm">
      <p class="text-sm font-medium text-muted-foreground tracking-wide uppercase">{{ todayFormatted }}</p>
      <h2 class="text-2xl font-bold tracking-tight mt-1">{{ greeting }},</h2>
      <p class="text-muted-foreground mt-1 text-sm">Welcome to your lead generation command center.</p>
    </div>

    <!-- ============================================ -->
    <!-- COMMAND CENTER — HORIZONTAL STACKED CARDS    -->
    <!-- ============================================ -->
    <section>
      <h2 class="text-lg font-semibold mb-1">Command Center</h2>
      <p class="text-sm text-muted-foreground mb-5">Hover a stack to reveal actions.</p>

      <!-- Horizontal row of all stacks -->
      <div class="relative" style="min-height: 120px;">
        <!-- Collapsed state: all stacks side by side -->
        <div
          :class="[
            'flex gap-4 transition-all duration-300 ease-in-out',
            hoveredStack ? 'opacity-0 scale-[0.98] pointer-events-none' : 'opacity-100 scale-100',
          ]"
        >
          <div
            v-for="stack in cardStacks"
            :key="stack.id"
            class="flex-1 min-w-0 cursor-pointer"
            @mouseenter="hoveredStack = stack.id"
          >
            <!-- Stack label -->
            <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{{ stack.title }}</p>

            <!-- Stacked deck -->
            <div class="relative" style="height: 80px;">
              <!-- Decorative back cards -->
              <div
                v-if="stack.items.length > 2"
                class="absolute inset-x-0 top-0 h-[72px] rounded-xl border border-border bg-card/30"
                style="z-index: 0; transform: translate(6px, 6px);"
              />
              <div
                v-if="stack.items.length > 1"
                class="absolute inset-x-0 top-0 h-[72px] rounded-xl border border-border bg-card/50"
                style="z-index: 1; transform: translate(3px, 3px);"
              />
              <!-- Top card -->
              <div
                class="absolute inset-x-0 top-0 rounded-xl border border-border bg-card p-4 shadow-sm"
                style="z-index: 2;"
              >
                <div class="flex items-center gap-3">
                  <div :class="['size-9 rounded-lg flex items-center justify-center bg-gradient-to-br text-white shrink-0', stack.color]">
                    <component :is="stack.items[0].icon" class="size-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold leading-tight truncate">{{ stack.items[0].label }}</p>
                    <p class="text-[11px] text-muted-foreground leading-snug">
                      {{ stack.items.length }} action{{ stack.items.length !== 1 ? 's' : '' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Expanded state: hovered stack takes over full width -->
        <div
          v-for="stack in cardStacks"
          :key="'expanded-' + stack.id"
          :class="[
            'absolute inset-0 transition-all duration-300 ease-in-out',
            hoveredStack === stack.id ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98] pointer-events-none',
          ]"
          @mouseleave="hoveredStack = null"
        >
          <!-- Stack label -->
          <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{{ stack.title }}</p>

          <!-- Expanded cards spread full width -->
          <div class="flex gap-3">
            <NuxtLink
              v-for="(item, i) in stack.items"
              :key="item.label"
              :to="item.to"
              class="flex-1 min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group/card"
              :style="{
                transitionDelay: hoveredStack === stack.id ? `${i * 40}ms` : '0ms',
                transform: hoveredStack === stack.id ? 'translateY(0)' : 'translateY(8px)',
                opacity: hoveredStack === stack.id ? '1' : '0',
                transition: `all 250ms ease-out ${hoveredStack === stack.id ? i * 40 : 0}ms`,
              }"
            >
              <div class="flex items-center gap-3">
                <div :class="['size-9 rounded-lg flex items-center justify-center shrink-0', stack.bgAccent]">
                  <component :is="item.icon" :class="['size-4', stack.textAccent]" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold leading-tight group-hover/card:text-primary transition-colors truncate">{{ item.label }}</p>
                  <p class="text-[11px] text-muted-foreground leading-snug truncate">{{ item.description }}</p>
                </div>
                <ArrowUpRight class="size-3.5 text-muted-foreground/0 group-hover/card:text-muted-foreground/60 transition-colors shrink-0" />
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- AI DISCOVERY COMMAND BANNER                  -->
    <!-- ============================================ -->
    <section v-if="activeCampaigns > 0 || totalPending > 0" class="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <!-- Left: Agent status -->
        <div class="flex items-start gap-4">
          <div class="relative">
            <div class="size-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain class="size-7 text-primary" />
            </div>
            <span class="absolute -top-1 -right-1 flex size-4">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span class="relative inline-flex rounded-full size-4 bg-green-500 items-center justify-center">
                <span class="size-1.5 rounded-full bg-white" />
              </span>
            </span>
          </div>
          <div>
            <h3 class="text-lg font-semibold flex items-center gap-2">
              AI Discovery Active
              <span v-for="agent in getRunningActivities()" :key="agent.id" class="inline-flex items-center gap-1 text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                <Loader2 class="size-3 animate-spin" />
                {{ agent.agent_name }}
              </span>
            </h3>
            <p class="text-sm text-muted-foreground mt-0.5">
              {{ activeCampaigns }} campaign{{ activeCampaigns !== 1 ? 's' : '' }} actively scanning
            </p>
            <div v-if="getRunningActivities().length > 0" class="flex flex-wrap gap-2 mt-2">
              <div
                v-for="ra in getRunningActivities()"
                :key="ra.id"
                class="flex items-center gap-1.5 text-xs bg-card/60 backdrop-blur border border-primary/10 rounded-lg px-2.5 py-1"
              >
                <Signal class="size-3 text-green-500 animate-pulse" />
                <span class="text-muted-foreground truncate max-w-[200px]">{{ ra.action }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Discovery counters + CTA -->
        <div class="flex items-center gap-4 md:gap-5">
          <div class="text-center">
            <div class="relative inline-flex items-center justify-center">
              <svg class="size-16 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" class="text-border" stroke-width="3" />
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" class="text-primary" stroke-width="3" stroke-linecap="round" :stroke-dasharray="ringDasharray(totalDiscovered > 0 ? Math.min((totalDiscovered / 50) * 100, 100) : 0)" />
              </svg>
              <span class="absolute text-lg font-bold">{{ totalDiscovered }}</span>
            </div>
            <p class="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Discovered</p>
          </div>

          <div class="text-center">
            <div class="relative inline-flex items-center justify-center">
              <svg class="size-16 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" class="text-border" stroke-width="3" />
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" class="text-amber-500" stroke-width="3" stroke-linecap="round" :stroke-dasharray="ringDasharray(totalDiscovered > 0 ? (totalPending / totalDiscovered) * 100 : 0)" />
              </svg>
              <span class="absolute text-lg font-bold text-amber-600">{{ totalPending }}</span>
            </div>
            <p class="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Pending</p>
          </div>

          <div class="text-center">
            <div class="relative inline-flex items-center justify-center">
              <svg class="size-16 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" class="text-border" stroke-width="3" />
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" class="text-emerald-500" stroke-width="3" stroke-linecap="round" :stroke-dasharray="ringDasharray(totalDiscovered > 0 ? (totalApproved / totalDiscovered) * 100 : 0)" />
              </svg>
              <span class="absolute text-lg font-bold text-emerald-600">{{ totalApproved }}</span>
            </div>
            <p class="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Approved</p>
          </div>

          <NuxtLink to="/discovery">
            <Button size="sm" class="gap-1.5">
              <Eye class="size-4" />
              Review Leads
            </Button>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- PERFORMANCE STATS - EXPANDABLE CARDS         -->
    <!-- ============================================ -->
    <section>
      <h2 class="text-lg font-semibold mb-4">Performance</h2>
      <p class="text-sm text-muted-foreground -mt-3 mb-4">Click a card to see more detail.</p>
      <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div
          v-for="(stat, index) in statsCards"
          :key="stat.title"
          class="rounded-xl border border-border bg-card p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          :class="{ 'ring-1 ring-primary/30': expandedStatIndex === index }"
          @click="toggleStatExpand(index)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">{{ stat.title }}</p>
              <p class="text-3xl font-bold mt-1.5 tabular-nums">{{ stat.value }}</p>
              <div class="flex items-center gap-1 mt-2">
                <TrendingUp v-if="stat.trend === 'up'" class="size-3 text-emerald-500" />
                <TrendingDown v-else class="size-3 text-red-500" />
                <span :class="stat.trend === 'up' ? 'text-emerald-600' : 'text-red-500'" class="text-xs font-medium">
                  {{ stat.change }}
                </span>
                <span class="text-[10px] text-muted-foreground">vs last month</span>
              </div>
            </div>

            <!-- Progress ring -->
            <div class="relative flex items-center justify-center shrink-0">
              <svg class="size-14 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" class="text-muted/50" stroke-width="4" />
                <circle
                  cx="40" cy="40" r="36" fill="none"
                  :class="stat.ringColor"
                  stroke-width="4" stroke-linecap="round"
                  :stroke-dasharray="ringDasharray(stat.ring)"
                  class="transition-all duration-1000 ease-out"
                />
              </svg>
              <component :is="stat.icon" :class="['size-5 absolute', stat.color]" />
            </div>
          </div>

          <!-- Expanded detail -->
          <div
            v-if="expandedStatIndex === index"
            class="mt-4 pt-4 border-t border-border"
          >
            <p class="text-xs text-muted-foreground leading-relaxed mb-3">{{ stat.description }}</p>
            <div class="space-y-2">
              <div
                v-for="item in stat.breakdown"
                :key="item.label"
                class="flex items-center justify-between"
              >
                <span class="text-xs text-muted-foreground">{{ item.label }}</span>
                <span class="text-sm font-semibold tabular-nums">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- RECENT LEADS + CAMPAIGNS / AGENT STATUS      -->
    <!-- ============================================ -->
    <div class="grid gap-6 lg:grid-cols-5">
      <!-- Recent Leads (3 cols) -->
      <div class="lg:col-span-3">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Recent Leads</h2>
          <NuxtLink to="/leads">
            <Button variant="outline" size="sm" class="gap-1 text-xs">
              View All <ArrowUpRight class="size-3" />
            </Button>
          </NuxtLink>
        </div>

        <div class="space-y-2.5">
          <NuxtLink
            v-for="lead in recentLeads"
            :key="lead.name"
            to="/leads"
            class="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <!-- Avatar with initials -->
            <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span class="text-xs font-bold text-primary">{{ lead.initials }}</span>
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold truncate">{{ lead.name }}</p>
              <p class="text-xs text-muted-foreground truncate">{{ lead.company }}</p>
            </div>

            <span :class="['text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize', statusColorMap[lead.status] || 'bg-muted text-muted-foreground']">
              {{ lead.status.replace('_', ' ') }}
            </span>

            <span class="text-sm font-semibold tabular-nums min-w-[60px] text-right">{{ lead.value }}</span>

            <ArrowUpRight class="size-4 text-muted-foreground/30 group-hover:text-foreground transition-colors shrink-0" />
          </NuxtLink>

          <div v-if="recentLeads.length === 0" class="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <Users class="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p class="text-sm text-muted-foreground">No leads yet. Launch a discovery campaign to get started.</p>
          </div>
        </div>
      </div>

      <!-- Right sidebar: Agent Status + Campaigns (2 cols) -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Agent Status -->
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold">Agent Status</h3>
            <NuxtLink to="/agents">
              <Button variant="ghost" size="sm" class="text-xs h-7 gap-1">
                Manage <ArrowUpRight class="size-3" />
              </Button>
            </NuxtLink>
          </div>

          <div v-if="getRunningActivities().length > 0" class="space-y-2.5">
            <div
              v-for="activity in getRunningActivities()"
              :key="activity.id"
              class="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/10 p-3"
            >
              <div class="relative shrink-0">
                <div class="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot class="size-4 text-primary" />
                </div>
                <span class="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-green-500 animate-pulse ring-2 ring-card" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold">{{ activity.agent_name }}</p>
                <p class="text-[10px] text-muted-foreground truncate">{{ activity.action }}</p>
              </div>
              <Loader2 class="size-3.5 text-primary animate-spin shrink-0" />
            </div>
          </div>
          <div v-else class="flex flex-col items-center py-5 text-center">
            <div class="size-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <Bot class="size-5 text-muted-foreground/40" />
            </div>
            <p class="text-xs text-muted-foreground">No agents currently active</p>
          </div>
        </div>

        <!-- Campaigns -->
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold">Campaigns</h3>
            <NuxtLink to="/discovery">
              <Button variant="ghost" size="sm" class="text-xs h-7 gap-1">
                View All <ArrowUpRight class="size-3" />
              </Button>
            </NuxtLink>
          </div>


          <div v-if="campaigns.length === 0" class="flex flex-col items-center py-5 text-center">
            <div class="size-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <Radar class="size-5 text-muted-foreground/40" />
            </div>
            <p class="text-xs text-muted-foreground">No campaigns yet</p>
          </div>
          <div v-else class="space-y-3">
            <NuxtLink
              v-for="campaign in campaigns.slice(0, 4)"
              :key="campaign.id"
              to="/discovery"
              class="group flex items-center gap-3 rounded-lg border border-border p-3 hover:shadow-md transition-shadow"
            >
              <!-- Mini progress ring -->
              <div class="relative flex items-center justify-center shrink-0">
                <svg class="size-10 -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" class="text-muted/50" stroke-width="2.5" />
                  <circle
                    cx="20" cy="20" r="17" fill="none"
                    :class="campaign.status === 'running' ? 'stroke-emerald-500' : campaign.status === 'paused' ? 'stroke-amber-500' : 'stroke-muted-foreground'"
                    stroke-width="2.5" stroke-linecap="round"
                    :stroke-dasharray="ringDasharray(campaignProgress(campaign), 17)"
                  />
                </svg>
                <span class="absolute text-[8px] font-bold">{{ campaignProgress(campaign) }}%</span>
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold truncate">{{ campaign.name }}</p>
                <p class="text-[10px] text-muted-foreground">
                  {{ campaign.leads_approved }}/{{ campaign.leads_found }} approved
                </p>
              </div>

              <div class="shrink-0">
                <span
                  :class="[
                    'text-[9px] font-medium px-1.5 py-0.5 rounded-full',
                    campaign.status === 'running' ? 'bg-emerald-100 text-emerald-700' :
                    campaign.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                    campaign.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                    'bg-blue-100 text-blue-700'
                  ]"
                >
                  {{ campaign.status }}
                </span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
