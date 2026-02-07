<script setup lang="ts">
import {
  Users,
  DollarSign,
  TrendingUp,
  Radar,
  RefreshCw,
  Loader2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

// ── Composables ──
const { leads, stats, fetchLeads } = useLeads()
const { deals, pipelineStages, fetchDeals } = useDeals()
const { activities, fetchActivities } = useActivities()
const {
  campaigns,
  discoveredLeads,
  fetchCampaigns,
  fetchDiscoveredLeads,
  totalDiscovered,
  totalPending,
  totalApproved,
  activeCampaigns,
} = useDiscovery()

const loading = ref(true)

onMounted(async () => {
  try {
    await Promise.all([
      fetchLeads(),
      fetchDeals(),
      fetchActivities(10),
      fetchCampaigns(),
      fetchDiscoveredLeads(),
    ])
  } catch {
    toast.error('Failed to load analytics data.')
  } finally {
    loading.value = false
  }
})

// ── Time period (cosmetic) ──
const timePeriod = ref('all')
const timePeriodOptions = [
  { value: 'all', label: 'All Time' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '7d', label: 'Last 7 Days' },
]

// ── Refresh handler ──
const refreshing = ref(false)
async function refreshData() {
  refreshing.value = true
  try {
    await Promise.all([
      fetchLeads(),
      fetchDeals(),
      fetchActivities(10),
      fetchCampaigns(),
      fetchDiscoveredLeads(),
    ])
    toast.success('Analytics data refreshed.')
  } catch {
    toast.error('Failed to refresh data.')
  } finally {
    refreshing.value = false
  }
}

// ── Overview stat cards ──
const totalPipelineValue = computed(() =>
  deals.value.reduce((sum, d) => sum + Number(d.value || 0), 0)
)

const conversionRate = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.converted / stats.value.total) * 100)
})

const overviewCards = computed(() => [
  {
    label: 'Total Leads',
    value: stats.value.total,
    formatted: stats.value.total.toLocaleString(),
    icon: Users,
  },
  {
    label: 'Pipeline Value',
    value: totalPipelineValue.value,
    formatted: formatCurrency(totalPipelineValue.value),
    icon: DollarSign,
  },
  {
    label: 'Conversion Rate',
    value: conversionRate.value,
    formatted: `${conversionRate.value}%`,
    icon: TrendingUp,
  },
  {
    label: 'Active Campaigns',
    value: activeCampaigns.value,
    formatted: activeCampaigns.value.toLocaleString(),
    icon: Radar,
  },
])

// ── Pipeline breakdown (raw values) ──
const pipelineRawValues = computed(() => {
  const stages = [
    { key: 'prospecting', name: 'Prospecting' },
    { key: 'qualification', name: 'Qualification' },
    { key: 'proposal', name: 'Proposal' },
    { key: 'negotiation', name: 'Negotiation' },
    { key: 'closed_won', name: 'Closed Won' },
    { key: 'closed_lost', name: 'Closed Lost' },
  ]
  return stages.map(stage => {
    const stageDeals = deals.value.filter(d => d.stage === stage.key)
    return {
      name: stage.name,
      key: stage.key,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0),
    }
  })
})

const maxPipelineRawCount = computed(() =>
  Math.max(...pipelineRawValues.value.map(s => s.count), 1)
)

// ── Lead sources breakdown ──
const sourceLabels: Record<string, string> = {
  website: 'Website',
  referral: 'Referral',
  linkedin: 'LinkedIn',
  cold_call: 'Cold Call',
  email: 'Email',
  event: 'Event',
  other: 'Other',
}

const leadsBySource = computed(() => {
  const groups: Record<string, number> = {}
  for (const lead of leads.value) {
    const src = lead.source || 'other'
    groups[src] = (groups[src] || 0) + 1
  }
  return Object.entries(groups)
    .map(([source, count]) => ({
      source,
      label: sourceLabels[source] || source,
      count,
    }))
    .sort((a, b) => b.count - a.count)
})

const maxSourceCount = computed(() =>
  Math.max(...leadsBySource.value.map(s => s.count), 1)
)

// ── Lead status distribution ──
const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-amber-500',
  qualified: 'bg-emerald-500',
  proposal: 'bg-purple-500',
  negotiation: 'bg-orange-500',
  closed_won: 'bg-green-500',
  closed_lost: 'bg-red-500',
}

const leadsByStatus = computed(() => {
  const groups: Record<string, number> = {}
  for (const lead of leads.value) {
    const status = lead.status || 'new'
    groups[status] = (groups[status] || 0) + 1
  }
  return Object.entries(groups)
    .map(([status, count]) => ({
      status,
      label: statusLabels[status] || status,
      count,
      color: statusColors[status] || 'bg-gray-500',
      percent: leads.value.length > 0 ? Math.round((count / leads.value.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
})

// ── Discovery performance ──
const campaignPerformance = computed(() =>
  campaigns.value.map(c => {
    const total = c.leads_found
    const approvedRate = total > 0 ? Math.round((c.leads_approved / total) * 100) : 0
    const rejectedRate = total > 0 ? Math.round((c.leads_rejected / total) * 100) : 0
    const pendingCount = total - c.leads_approved - c.leads_rejected
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      leadsFound: total,
      approved: c.leads_approved,
      rejected: c.leads_rejected,
      pending: pendingCount,
      approvedRate,
      rejectedRate,
    }
  })
)

// ── Recent activities ──
const recentActivities = computed(() => activities.value.slice(0, 10))

// ── Helpers ──
function formatCurrency(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`
  return `$${val.toLocaleString()}`
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

function stageBarColor(key: string): string {
  const colors: Record<string, string> = {
    prospecting: 'bg-blue-500',
    qualification: 'bg-yellow-500',
    proposal: 'bg-purple-500',
    negotiation: 'bg-orange-500',
    closed_won: 'bg-green-500',
    closed_lost: 'bg-red-500',
  }
  return colors[key] || 'bg-gray-500'
}

function sourceBarColor(index: number): string {
  const colors = [
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-blue-500',
    'bg-violet-500',
    'bg-teal-500',
  ]
  return colors[index % colors.length]
}

function activityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    lead_created: 'Lead Created',
    deal_created: 'Deal Created',
    status_changed: 'Status Changed',
    email: 'Email',
    call: 'Call',
    meeting: 'Meeting',
    note: 'Note',
    task: 'Task',
  }
  return labels[type] || type
}

function activityBadgeVariant(type: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (type) {
    case 'lead_created':
    case 'deal_created':
      return 'default'
    case 'status_changed':
      return 'secondary'
    default:
      return 'outline'
  }
}

function campaignStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'running': return 'default'
    case 'completed': return 'secondary'
    case 'paused': return 'outline'
    case 'draft': return 'secondary'
    default: return 'outline'
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Analytics</h2>
        <p class="text-sm text-muted-foreground">Track performance metrics and pipeline insights.</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Time Period Selector -->
        <Select v-model="timePeriod">
          <SelectTrigger class="w-[160px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in timePeriodOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <!-- Refresh -->
        <Button variant="outline" size="icon" :disabled="refreshing" @click="refreshData">
          <Loader2 v-if="refreshing" class="size-4 animate-spin" />
          <RefreshCw v-else class="size-4" />
        </Button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <Loader2 class="size-8 animate-spin text-muted-foreground" />
    </div>

    <template v-else>
      <!-- ════════════════════════════════════════════ -->
      <!-- OVERVIEW STATS ROW                          -->
      <!-- ════════════════════════════════════════════ -->
      <div class="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        <div
          v-for="card in overviewCards"
          :key="card.label"
          class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-medium text-muted-foreground">{{ card.label }}</p>
            <div class="size-9 rounded-lg bg-muted flex items-center justify-center">
              <component :is="card.icon" class="size-4 text-muted-foreground" />
            </div>
          </div>
          <p class="text-3xl font-bold tracking-tight">{{ card.formatted }}</p>
        </div>
      </div>

      <!-- ════════════════════════════════════════════ -->
      <!-- PIPELINE BREAKDOWN                          -->
      <!-- ════════════════════════════════════════════ -->
      <div class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow mb-8">
        <div class="mb-5">
          <h2 class="text-lg font-semibold">Pipeline Breakdown</h2>
          <p class="text-sm text-muted-foreground mt-0.5">Deals by stage with total value.</p>
        </div>

        <div v-if="deals.length === 0" class="py-8 text-center text-sm text-muted-foreground">
          No deals in the pipeline yet.
        </div>

        <div v-else class="space-y-4">
          <div v-for="stage in pipelineRawValues" :key="stage.key">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-sm font-medium">{{ stage.name }}</span>
              <div class="flex items-center gap-3">
                <span class="text-xs text-muted-foreground">{{ stage.count }} deal{{ stage.count !== 1 ? 's' : '' }}</span>
                <span class="text-xs font-semibold min-w-[60px] text-right">{{ formatCurrency(stage.value) }}</span>
              </div>
            </div>
            <div class="h-3 bg-muted rounded-full overflow-hidden">
              <div
                :class="[stageBarColor(stage.key), 'h-full rounded-full transition-all duration-700 ease-out']"
                :style="{ width: `${stage.count > 0 ? Math.max(4, (stage.count / maxPipelineRawCount) * 100) : 0}%` }"
              />
            </div>
          </div>
        </div>

        <div v-if="deals.length > 0" class="mt-5 pt-4 border-t border-border flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Total pipeline value</span>
          <span class="text-base font-bold">{{ formatCurrency(totalPipelineValue) }}</span>
        </div>
      </div>

      <!-- ════════════════════════════════════════════ -->
      <!-- LEAD SOURCES + STATUS DISTRIBUTION          -->
      <!-- ════════════════════════════════════════════ -->
      <div class="grid gap-6 lg:grid-cols-2 mb-8">
        <!-- Lead Sources Breakdown -->
        <div class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div class="mb-5">
            <h2 class="text-lg font-semibold">Lead Sources</h2>
            <p class="text-sm text-muted-foreground mt-0.5">Leads grouped by acquisition source.</p>
          </div>

          <div v-if="leadsBySource.length === 0" class="py-8 text-center text-sm text-muted-foreground">
            No lead data available.
          </div>

          <div v-else class="space-y-3">
            <div v-for="(src, idx) in leadsBySource" :key="src.source">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium capitalize">{{ src.label }}</span>
                <span class="text-xs text-muted-foreground">{{ src.count }} lead{{ src.count !== 1 ? 's' : '' }}</span>
              </div>
              <div class="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  :class="[sourceBarColor(idx), 'h-full rounded-full transition-all duration-700 ease-out']"
                  :style="{ width: `${(src.count / maxSourceCount) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Lead Status Distribution -->
        <div class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div class="mb-5">
            <h2 class="text-lg font-semibold">Lead Status Distribution</h2>
            <p class="text-sm text-muted-foreground mt-0.5">Current breakdown by lead status.</p>
          </div>

          <div v-if="leadsByStatus.length === 0" class="py-8 text-center text-sm text-muted-foreground">
            No lead data available.
          </div>

          <div v-else class="space-y-3">
            <div v-for="item in leadsByStatus" :key="item.status">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <div :class="[item.color, 'size-2.5 rounded-full']" />
                  <span class="text-sm font-medium">{{ item.label }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground">{{ item.count }}</span>
                  <span class="text-xs font-semibold min-w-[36px] text-right">{{ item.percent }}%</span>
                </div>
              </div>
              <div class="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  :class="[item.color, 'h-full rounded-full transition-all duration-700 ease-out']"
                  :style="{ width: `${item.percent}%` }"
                />
              </div>
            </div>

            <!-- Total -->
            <div class="pt-3 border-t border-border flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Total leads</span>
              <span class="text-sm font-bold">{{ leads.length }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════ -->
      <!-- DISCOVERY PERFORMANCE                       -->
      <!-- ════════════════════════════════════════════ -->
      <div class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow mb-8">
        <div class="mb-5">
          <h2 class="text-lg font-semibold">Discovery Performance</h2>
          <p class="text-sm text-muted-foreground mt-0.5">Campaign lead discovery and approval rates.</p>
        </div>

        <div v-if="campaignPerformance.length === 0" class="py-8 text-center text-sm text-muted-foreground">
          No discovery campaigns yet.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border text-left text-xs text-muted-foreground">
                <th class="px-4 py-3 font-medium">Campaign</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium text-center">Found</th>
                <th class="px-4 py-3 font-medium text-center">Approved</th>
                <th class="px-4 py-3 font-medium text-center">Rejected</th>
                <th class="px-4 py-3 font-medium text-center">Pending</th>
                <th class="px-4 py-3 font-medium min-w-[180px]">Approval Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="c in campaignPerformance"
                :key="c.id"
                class="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td class="px-4 py-3 text-sm font-medium">{{ c.name }}</td>
                <td class="px-4 py-3">
                  <Badge :variant="campaignStatusVariant(c.status)" class="capitalize text-xs">
                    {{ c.status }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-sm text-center tabular-nums">{{ c.leadsFound }}</td>
                <td class="px-4 py-3 text-sm text-center tabular-nums text-emerald-600 font-medium">{{ c.approved }}</td>
                <td class="px-4 py-3 text-sm text-center tabular-nums text-red-500 font-medium">{{ c.rejected }}</td>
                <td class="px-4 py-3 text-sm text-center tabular-nums text-amber-600 font-medium">{{ c.pending }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-2 bg-muted rounded-full overflow-hidden flex">
                      <div
                        class="h-full bg-emerald-500 transition-all duration-500"
                        :style="{ width: `${c.approvedRate}%` }"
                      />
                      <div
                        class="h-full bg-red-400 transition-all duration-500"
                        :style="{ width: `${c.rejectedRate}%` }"
                      />
                    </div>
                    <span class="text-xs font-semibold min-w-[36px] text-right">{{ c.approvedRate }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Discovery totals -->
        <div v-if="campaignPerformance.length > 0" class="mt-5 pt-4 border-t border-border flex items-center gap-6 text-sm">
          <div class="flex items-center gap-1.5">
            <span class="text-muted-foreground">Total discovered:</span>
            <span class="font-semibold">{{ totalDiscovered }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-muted-foreground">Approved:</span>
            <span class="font-semibold text-emerald-600">{{ totalApproved }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-muted-foreground">Pending:</span>
            <span class="font-semibold text-amber-600">{{ totalPending }}</span>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════ -->
      <!-- RECENT ACTIVITY                             -->
      <!-- ════════════════════════════════════════════ -->
      <div class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
        <div class="mb-5">
          <h2 class="text-lg font-semibold">Recent Activity</h2>
          <p class="text-sm text-muted-foreground mt-0.5">Last 10 logged activities across the CRM.</p>
        </div>

        <div v-if="recentActivities.length === 0" class="py-8 text-center text-sm text-muted-foreground">
          No recent activity recorded.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border text-left text-xs text-muted-foreground">
                <th class="px-4 py-3 font-medium">Type</th>
                <th class="px-4 py-3 font-medium">Title</th>
                <th class="px-4 py-3 font-medium">Description</th>
                <th class="px-4 py-3 font-medium">Related To</th>
                <th class="px-4 py-3 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="activity in recentActivities"
                :key="activity.id"
                class="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td class="px-4 py-3">
                  <Badge :variant="activityBadgeVariant(activity.type)" class="text-xs capitalize whitespace-nowrap">
                    {{ activityTypeLabel(activity.type) }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-sm font-medium">{{ activity.title }}</td>
                <td class="px-4 py-3 text-sm text-muted-foreground max-w-[260px] truncate">
                  {{ activity.description || '-' }}
                </td>
                <td class="px-4 py-3 text-sm text-muted-foreground capitalize">
                  {{ activity.related_to_type || '-' }}
                </td>
                <td class="px-4 py-3 text-sm text-muted-foreground text-right whitespace-nowrap">
                  {{ formatTimeAgo(activity.created_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
