<script setup lang="ts">
import {
  Bot,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Filter,
  Zap,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
  CircleDot,
  AlertTriangle,
  Orbit,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { AgentActivity, DiscoveryCampaign } from '~/composables/useDiscovery'

const router = useRouter()

const {
  campaigns,
  agentActivities,
  fetchCampaigns,
  fetchAgentActivities,
} = useDiscovery()

onMounted(async () => {
  await fetchCampaigns()
  await fetchAgentActivities()
})

// ── Filters ──
const searchQuery = ref('')
const filterStatus = ref<'all' | 'running' | 'completed' | 'error'>('all')
const filterCampaignId = ref<string>('all')
const collapsedCampaigns = ref<Set<string>>(new Set())

// ── Computed data ──
const filteredActivities = computed(() => {
  let result = [...agentActivities.value]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(a =>
      a.agent_name.toLowerCase().includes(q) ||
      a.action.toLowerCase().includes(q) ||
      a.detail.toLowerCase().includes(q)
    )
  }

  if (filterStatus.value !== 'all') {
    result = result.filter(a => a.status === filterStatus.value)
  }

  if (filterCampaignId.value !== 'all') {
    result = result.filter(a => a.campaign_id === filterCampaignId.value)
  }

  return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

// Group filtered activities by campaign
const activitiesByCampaign = computed(() => {
  const groups: Record<string, { campaign: DiscoveryCampaign | null; activities: AgentActivity[] }> = {}

  for (const activity of filteredActivities.value) {
    const key = activity.campaign_id || '_uncategorized'
    if (!groups[key]) {
      const campaign = campaigns.value.find(c => c.id === activity.campaign_id) || null
      groups[key] = { campaign, activities: [] }
    }
    groups[key].activities.push(activity)
  }

  return Object.entries(groups).sort(([, a], [, b]) => {
    const aRunning = a.campaign?.status === 'running' ? 0 : 1
    const bRunning = b.campaign?.status === 'running' ? 0 : 1
    if (aRunning !== bRunning) return aRunning - bRunning
    const aTime = new Date(a.activities[0]?.timestamp || 0).getTime()
    const bTime = new Date(b.activities[0]?.timestamp || 0).getTime()
    return bTime - aTime
  })
})

// ── Stats ──
const totalActions = computed(() => agentActivities.value.length)

const activeAgentCount = computed(() => {
  const running = agentActivities.value.filter(a => a.status === 'running')
  return new Set(running.map(a => a.agent_id)).size
})

const successRate = computed(() => {
  const nonRunning = agentActivities.value.filter(a => a.status !== 'running')
  if (nonRunning.length === 0) return 0
  const completed = nonRunning.filter(a => a.status === 'completed').length
  return Math.round((completed / nonRunning.length) * 100)
})

const runningCount = computed(() => agentActivities.value.filter(a => a.status === 'running').length)

// ── Time formatting ──
function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const past = new Date(dateStr).getTime()
  const diffMs = now - past
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 30) return 'Just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// ── Campaign toggle ──
function toggleCampaignCollapse(campaignId: string) {
  const newSet = new Set(collapsedCampaigns.value)
  if (newSet.has(campaignId)) {
    newSet.delete(campaignId)
  } else {
    newSet.add(campaignId)
  }
  collapsedCampaigns.value = newSet
}

// ── Navigate to campaign ──
function navigateToCampaign(campaignId: string | null, event: MouseEvent) {
  event.stopPropagation()
  if (!campaignId) return
  router.push({ path: '/discovery', query: { campaign: campaignId } })
}

// ── Status helpers ──
function statusDotColor(status: AgentActivity['status']): string {
  switch (status) {
    case 'running': return 'bg-blue-500'
    case 'completed': return 'bg-emerald-500'
    case 'error': return 'bg-red-500'
  }
}

// ── Detail dialog ──
const selectedActivity = ref<AgentActivity | null>(null)
const showDetailDialog = ref(false)

function openActivityDetail(activity: AgentActivity) {
  selectedActivity.value = activity
  showDetailDialog.value = true
}

function getCampaignName(campaignId: string | null): string {
  if (!campaignId) return 'Uncategorized'
  return campaigns.value.find(c => c.id === campaignId)?.name || 'Unknown Campaign'
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold tracking-tight">Agent Activity</h2>
      <p class="text-sm text-muted-foreground">Real-time insights into what your AI agents are doing across campaigns.</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-4 mb-8">
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-muted-foreground">Total Actions</span>
          <div class="rounded-lg bg-primary/10 p-2">
            <Zap class="size-4 text-primary" />
          </div>
        </div>
        <p class="text-3xl font-bold tracking-tight">{{ totalActions }}</p>
        <p class="text-xs text-muted-foreground mt-1">across all campaigns</p>
      </div>

      <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-muted-foreground">Active Agents</span>
          <div class="rounded-lg bg-blue-500/10 p-2">
            <Bot class="size-4 text-blue-600" />
          </div>
        </div>
        <p class="text-3xl font-bold tracking-tight">{{ activeAgentCount }}</p>
        <div class="flex items-center gap-1.5 mt-1">
          <span v-if="runningCount > 0" class="flex items-center gap-1 text-xs text-blue-600 font-medium">
            <Loader2 class="size-3 animate-spin" /> {{ runningCount }} task{{ runningCount > 1 ? 's' : '' }} running
          </span>
          <span v-else class="text-xs text-muted-foreground">all idle</span>
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-muted-foreground">Success Rate</span>
          <div class="rounded-lg bg-emerald-500/10 p-2">
            <TrendingUp class="size-4 text-emerald-600" />
          </div>
        </div>
        <div class="flex items-baseline gap-1">
          <p class="text-3xl font-bold tracking-tight">{{ successRate }}</p>
          <span class="text-lg font-semibold text-muted-foreground">%</span>
        </div>
        <div class="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            class="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-out"
            :style="{ width: `${successRate}%` }"
          />
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-muted-foreground">Campaigns</span>
          <div class="rounded-lg bg-amber-500/10 p-2">
            <Orbit class="size-4 text-amber-600" />
          </div>
        </div>
        <p class="text-3xl font-bold tracking-tight">{{ campaigns.filter(c => c.status === 'running').length }}</p>
        <p class="text-xs text-muted-foreground mt-1">of {{ campaigns.length }} active</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div class="flex items-center gap-3 flex-1">
        <div class="relative flex-1 max-w-sm">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            v-model="searchQuery"
            placeholder="Search agents, actions..."
            class="pl-9 h-9"
          />
        </div>

        <Select v-model="filterStatus">
          <SelectTrigger class="w-[140px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="filterCampaignId">
          <SelectTrigger class="w-[200px] h-9">
            <SelectValue placeholder="Campaign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            <SelectItem v-for="c in campaigns" :key="c.id" :value="c.id">{{ c.name }}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <Filter class="size-3.5" />
        <span>{{ filteredActivities.length }} of {{ totalActions }} activities</span>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="filteredActivities.length === 0"
      class="rounded-xl border-2 border-dashed border-border p-16 text-center"
    >
      <div class="mx-auto mb-4 size-12 rounded-xl bg-muted flex items-center justify-center">
        <Clock class="size-6 text-muted-foreground" />
      </div>
      <h3 class="text-lg font-semibold text-muted-foreground mb-2">No activity found</h3>
      <p v-if="searchQuery || filterStatus !== 'all' || filterCampaignId !== 'all'" class="text-sm text-muted-foreground max-w-md mx-auto">
        No activities match your current filters. Try adjusting your search or filter criteria.
      </p>
      <p v-else class="text-sm text-muted-foreground max-w-md mx-auto">
        Your AI agents haven't performed any actions yet. Start a discovery campaign to see agent activity here.
      </p>
      <Button
        v-if="searchQuery || filterStatus !== 'all' || filterCampaignId !== 'all'"
        variant="outline"
        size="sm"
        class="mt-4"
        @click="searchQuery = ''; filterStatus = 'all'; filterCampaignId = 'all'"
      >
        Clear Filters
      </Button>
    </div>

    <!-- Campaign Groups -->
    <div v-else class="space-y-4">
      <div
        v-for="[groupKey, group] in activitiesByCampaign"
        :key="groupKey"
        class="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
      >
        <!-- Campaign Group Header -->
        <div class="flex items-center gap-3 p-4 border-b border-border">
          <button
            class="shrink-0 rounded p-0.5 hover:bg-muted transition-colors"
            @click="toggleCampaignCollapse(groupKey)"
          >
            <ChevronRight
              :class="[
                'size-4 text-muted-foreground transition-transform duration-200',
                !collapsedCampaigns.has(groupKey) && 'rotate-90'
              ]"
            />
          </button>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <button
                class="text-left hover:underline decoration-muted-foreground/40 underline-offset-2"
                @click="navigateToCampaign(group.campaign?.id || null, $event)"
              >
                <h2 class="text-lg font-semibold truncate">
                  {{ group.campaign?.name || 'Uncategorized Activity' }}
                </h2>
              </button>
              <Badge
                v-if="group.campaign"
                :variant="group.campaign.status === 'running' ? 'default' : 'secondary'"
                class="capitalize text-[10px] shrink-0"
              >
                <Loader2 v-if="group.campaign.status === 'running'" class="size-2.5 mr-0.5 animate-spin" />
                {{ group.campaign.status }}
              </Badge>
            </div>
            <div class="flex items-center gap-4 mt-0.5 text-xs text-muted-foreground">
              <span class="flex items-center gap-1">
                <CircleDot class="size-3" />
                {{ group.activities.length }} action{{ group.activities.length !== 1 ? 's' : '' }}
              </span>
              <span class="flex items-center gap-1">
                <Users class="size-3" />
                {{ new Set(group.activities.map(a => a.agent_name)).size }} agent{{ new Set(group.activities.map(a => a.agent_name)).size !== 1 ? 's' : '' }}
              </span>
              <span v-if="group.campaign?.target_industry">
                {{ group.campaign.target_industry }}
              </span>
            </div>
          </div>

          <div v-if="group.activities.some(a => a.status === 'running')" class="shrink-0 flex items-center gap-1.5">
            <span class="relative flex size-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-50" />
              <span class="relative inline-flex rounded-full size-2 bg-blue-500" />
            </span>
            <span class="text-xs font-medium text-blue-600">Live</span>
          </div>
        </div>

        <!-- Activity List (collapsible) -->
        <div v-show="!collapsedCampaigns.has(groupKey)">
          <div class="divide-y divide-border">
            <div
              v-for="activity in group.activities"
              :key="activity.id"
              class="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
              @click="openActivityDetail(activity)"
            >
              <!-- Status dot -->
              <div class="mt-1.5 shrink-0">
                <div :class="[
                  'size-2 rounded-full',
                  statusDotColor(activity.status),
                  activity.status === 'running' && 'animate-pulse',
                ]" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-xs font-medium text-muted-foreground">{{ activity.agent_name }}</span>
                  <Badge
                    v-if="activity.status === 'running'"
                    variant="outline"
                    class="text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-600"
                  >
                    <Loader2 class="size-2.5 mr-0.5 animate-spin" />
                    Running
                  </Badge>
                  <Badge
                    v-else-if="activity.status === 'error'"
                    variant="outline"
                    class="text-[10px] px-1.5 py-0 border-red-500/30 text-red-500"
                  >
                    <AlertTriangle class="size-2.5 mr-0.5" />
                    Error
                  </Badge>
                </div>
                <p class="text-sm font-medium leading-snug">{{ activity.action }}</p>
                <p class="text-xs text-muted-foreground mt-0.5 line-clamp-1">{{ activity.detail }}</p>
              </div>

              <!-- Timestamp -->
              <div class="text-right shrink-0 pt-0.5">
                <p class="text-xs text-muted-foreground">{{ formatTimeAgo(activity.timestamp) }}</p>
                <p class="text-[10px] text-muted-foreground/60">{{ formatTimestamp(activity.timestamp) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Detail Dialog -->
    <Dialog :open="showDetailDialog" @update:open="showDetailDialog = $event">
      <DialogContent class="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Activity Detail</DialogTitle>
          <DialogDescription v-if="selectedActivity">
            {{ selectedActivity.agent_name }} -- {{ formatTimeAgo(selectedActivity.timestamp) }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedActivity" class="space-y-4 py-2">
          <!-- Status -->
          <div class="flex items-center gap-2.5">
            <Loader2 v-if="selectedActivity.status === 'running'" class="size-4 text-blue-600 animate-spin" />
            <CheckCircle2 v-else-if="selectedActivity.status === 'completed'" class="size-4 text-emerald-600" />
            <XCircle v-else class="size-4 text-red-500" />
            <span :class="[
              'text-sm font-semibold capitalize',
              selectedActivity.status === 'running'
                ? 'text-blue-700'
                : selectedActivity.status === 'error'
                  ? 'text-red-600'
                  : 'text-emerald-700',
            ]">
              {{ selectedActivity.status }}
            </span>
          </div>

          <!-- Action -->
          <div>
            <p class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Action</p>
            <p class="text-sm font-medium">{{ selectedActivity.action }}</p>
          </div>

          <!-- Detail -->
          <div class="rounded-lg bg-muted/50 border border-border p-4">
            <p class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Detail</p>
            <p class="text-sm leading-relaxed">{{ selectedActivity.detail }}</p>
          </div>

          <!-- Meta grid -->
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg border border-border p-3">
              <p class="text-[11px] text-muted-foreground mb-1">Agent</p>
              <p class="text-sm font-medium">{{ selectedActivity.agent_name }}</p>
            </div>
            <div class="rounded-lg border border-border p-3">
              <p class="text-[11px] text-muted-foreground mb-1">Campaign</p>
              <p class="text-sm font-medium">{{ getCampaignName(selectedActivity.campaign_id) }}</p>
            </div>
            <div class="rounded-lg border border-border p-3">
              <p class="text-[11px] text-muted-foreground mb-1">Time</p>
              <p class="text-sm font-medium">{{ formatTimeAgo(selectedActivity.timestamp) }}</p>
            </div>
            <div class="rounded-lg border border-border p-3">
              <p class="text-[11px] text-muted-foreground mb-1">Timestamp</p>
              <p class="text-sm font-medium">{{ new Date(selectedActivity.timestamp).toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showDetailDialog = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
