<script setup lang="ts">
import {
  Radar,
  Play,
  Pause,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Target,
  TrendingUp,
  Building2,
  MapPin,
  Users,
  ChevronRight,
  ChevronDown,
  Bot,
  Loader2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Globe,
  Signal,
  Brain,
  Activity,
  Filter,
  BarChart3,
  Layers,
  CircleDot,
  SlidersHorizontal,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { DiscoveryCampaign, DiscoveredLead } from '~/composables/useDiscovery'

const {
  campaigns,
  discoveredLeads,
  agentActivities,
  loading,
  fetchCampaigns,
  createCampaign,
  fetchDiscoveredLeads,
  fetchAgentActivities,
  getCampaignLeads,
  getPendingLeads,
  approveLead,
  rejectLead,
  getRunningActivities,
  getRecentActivities,
  totalDiscovered,
  totalPending,
  totalApproved,
  activeCampaigns,
} = useDiscovery()

onMounted(async () => {
  await fetchCampaigns()
  await Promise.all([fetchDiscoveredLeads(), fetchAgentActivities()])
})

// ── View State ──
type ViewMode = 'overview' | 'campaign' | 'review'
const viewMode = ref<ViewMode>('overview')
const selectedCampaignId = ref<string | null>(null)
const selectedLead = ref<DiscoveredLead | null>(null)
const showCreateDialog = ref(false)
const showLeadDetail = ref(false)
const reviewSearchQuery = ref('')

const selectedCampaign = computed(() =>
  campaigns.value.find(c => c.id === selectedCampaignId.value)
)

const campaignLeads = computed(() =>
  selectedCampaignId.value ? getCampaignLeads(selectedCampaignId.value) : []
)

const pendingLeads = computed(() => getPendingLeads())

const filteredPendingLeads = computed(() => {
  if (!reviewSearchQuery.value) return pendingLeads.value
  const q = reviewSearchQuery.value.toLowerCase()
  return pendingLeads.value.filter(
    l =>
      l.name.toLowerCase().includes(q) ||
      (l.company || '').toLowerCase().includes(q) ||
      (l.position || '').toLowerCase().includes(q)
  )
})

// ── Grouped Agent Activities by Campaign ──
const expandedActivityGroups = ref<Record<string, boolean>>({})

interface CampaignActivityGroup {
  campaignId: string
  campaignName: string
  campaignStatus: string
  activities: typeof agentActivities.value
  hasRunning: boolean
}

const groupedActivities = computed<CampaignActivityGroup[]>(() => {
  const grouped: Record<string, CampaignActivityGroup> = {}
  for (const activity of agentActivities.value) {
    const cId = activity.campaign_id || 'uncategorized'
    if (!grouped[cId]) {
      const campaign = campaigns.value.find(c => c.id === cId)
      grouped[cId] = {
        campaignId: cId,
        campaignName: campaign?.name || 'General Activity',
        campaignStatus: campaign?.status || 'unknown',
        activities: [],
        hasRunning: false,
      }
    }
    grouped[cId].activities.push(activity)
    if (activity.status === 'running') grouped[cId].hasRunning = true
  }

  // Sort activities within each group by timestamp descending
  for (const g of Object.values(grouped)) {
    g.activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  // Sort groups: running campaigns first, then by latest activity
  return Object.values(grouped).sort((a, b) => {
    if (a.hasRunning !== b.hasRunning) return a.hasRunning ? -1 : 1
    const aTime = a.activities[0] ? new Date(a.activities[0].timestamp).getTime() : 0
    const bTime = b.activities[0] ? new Date(b.activities[0].timestamp).getTime() : 0
    return bTime - aTime
  })
})

function getVisibleActivities(group: CampaignActivityGroup) {
  const isExpanded = expandedActivityGroups.value[group.campaignId]
  return isExpanded ? group.activities : group.activities.slice(0, 5)
}

function toggleActivityGroup(campaignId: string) {
  expandedActivityGroups.value[campaignId] = !expandedActivityGroups.value[campaignId]
}

// ── Campaign Detail: Lead Filter ──
const campaignLeadFilter = ref<'all' | 'pending_review' | 'approved' | 'rejected'>('all')
const filteredCampaignLeads = computed(() => {
  if (campaignLeadFilter.value === 'all') return campaignLeads.value
  return campaignLeads.value.filter(l => l.status === campaignLeadFilter.value)
})

// ── Navigation ──
function openCampaign(id: string) {
  selectedCampaignId.value = id
  campaignLeadFilter.value = 'all'
  viewMode.value = 'campaign'
}

function openReview() {
  viewMode.value = 'review'
  reviewSearchQuery.value = ''
}

function backToOverview() {
  viewMode.value = 'overview'
  selectedCampaignId.value = null
}

function openLeadDetail(lead: DiscoveredLead) {
  selectedLead.value = lead
  showLeadDetail.value = true
}

function handleApprove(leadId: string) {
  const lead = discoveredLeads.value.find(l => l.id === leadId)
  approveLead(leadId)
  toast.success('Lead approved', {
    description: lead ? `"${lead.name}" has been approved.` : 'Lead has been approved.',
  })
  if (selectedLead.value?.id === leadId) {
    showLeadDetail.value = false
    selectedLead.value = null
  }
}

function handleReject(leadId: string) {
  const lead = discoveredLeads.value.find(l => l.id === leadId)
  rejectLead(leadId)
  toast.success('Lead rejected', {
    description: lead ? `"${lead.name}" has been rejected.` : 'Lead has been rejected.',
  })
  if (selectedLead.value?.id === leadId) {
    showLeadDetail.value = false
    selectedLead.value = null
  }
}

// ── Create Campaign Form ──
const createForm = ref({
  name: '',
  target_industry: '',
  target_roles: '',
  target_company_size: '50-500',
  target_region: 'North America',
  search_criteria: '',
  confidence_threshold: 70,
})

const creatingCampaign = ref(false)

async function handleCreateCampaign() {
  if (creatingCampaign.value) return
  creatingCampaign.value = true
  try {
    await createCampaign({
      name: createForm.value.name,
      status: 'draft',
      target_industry: createForm.value.target_industry,
      target_roles: createForm.value.target_roles.split(',').map(r => r.trim()),
      target_company_size: createForm.value.target_company_size,
      target_region: createForm.value.target_region,
      search_criteria: createForm.value.search_criteria,
      confidence_threshold: createForm.value.confidence_threshold,
    })
    showCreateDialog.value = false
    toast.success('Campaign created', {
      description: `"${createForm.value.name}" is ready to launch.`,
    })
    createForm.value = {
      name: '',
      target_industry: '',
      target_roles: '',
      target_company_size: '50-500',
      target_region: 'North America',
      search_criteria: '',
      confidence_threshold: 70,
    }
  } catch (error) {
    toast.error('Failed to create campaign')
  } finally {
    creatingCampaign.value = false
  }
}

// ── Helpers ──
function confidenceColor(score: number): string {
  if (score >= 85) return 'text-emerald-600'
  if (score >= 70) return 'text-amber-600'
  return 'text-orange-500'
}

function confidenceRingColor(score: number): string {
  if (score >= 85) return 'border-emerald-400'
  if (score >= 70) return 'border-amber-400'
  return 'border-orange-400'
}

function confidenceGradient(score: number): string {
  if (score >= 85) return 'from-emerald-500/20 to-emerald-500/5'
  if (score >= 70) return 'from-amber-500/20 to-amber-500/5'
  return 'from-orange-500/20 to-orange-500/5'
}

function campaignStatusConfig(status: string) {
  switch (status) {
    case 'running':
      return { variant: 'default' as const, bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/20', dot: 'bg-emerald-500' }
    case 'completed':
      return { variant: 'secondary' as const, bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-500/20', dot: 'bg-blue-500' }
    case 'paused':
      return { variant: 'outline' as const, bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-500/20', dot: 'bg-amber-500' }
    case 'draft':
      return { variant: 'secondary' as const, bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-500/20', dot: 'bg-gray-400' }
    default:
      return { variant: 'secondary' as const, bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-500/20', dot: 'bg-gray-400' }
  }
}

function campaignGradient(index: number): string {
  const gradients = [
    'from-indigo-500/10 via-purple-500/5 to-transparent',
    'from-amber-500/10 via-orange-500/5 to-transparent',
    'from-emerald-500/10 via-teal-500/5 to-transparent',
    'from-rose-500/10 via-pink-500/5 to-transparent',
    'from-sky-500/10 via-cyan-500/5 to-transparent',
    'from-violet-500/10 via-fuchsia-500/5 to-transparent',
  ]
  return gradients[index % gradients.length]
}

function campaignIcon(index: number): string {
  const colors = [
    'from-indigo-600 to-purple-600',
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-rose-500 to-pink-500',
    'from-sky-500 to-cyan-500',
    'from-violet-500 to-fuchsia-500',
  ]
  return colors[index % colors.length]
}

function progressPercent(campaign: DiscoveryCampaign): number {
  if (campaign.leads_found === 0) return 0
  return Math.round(((campaign.leads_approved + campaign.leads_rejected) / campaign.leads_found) * 100)
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const companySizes = ['1-10', '10-50', '50-500', '500-1000', '1000+']
const regions = ['North America', 'Europe', 'Asia Pacific', 'Global', 'United States', 'US & UK', 'LATAM']
</script>

<template>
  <div class="min-h-0">
    <!-- ================================================================== -->
    <!--                         OVERVIEW VIEW                              -->
    <!-- ================================================================== -->
    <template v-if="viewMode === 'overview'">
      <!-- Page Header -->
      <div class="mb-8">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-bold tracking-tight">Discovery</h2>
            <p class="text-sm text-muted-foreground mt-0.5">AI-powered lead discovery and prospecting</p>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" @click="openReview" :disabled="totalPending === 0" class="group">
              <Eye class="size-4 mr-1.5" />
              Review Queue
              <Badge
                v-if="totalPending > 0"
                class="ml-2 text-[10px] px-1.5 py-0 bg-amber-500 text-white border-0 group-hover:bg-amber-600"
              >
                {{ totalPending }}
              </Badge>
            </Button>
            <Button @click="showCreateDialog = true">
              <Plus class="size-4 mr-1.5" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      <!-- Stats Strip -->
      <div class="grid gap-4 md:grid-cols-4 mb-8">
        <!-- Active Campaigns -->
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Campaigns</span>
            <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Radar class="size-4 text-primary" />
            </div>
          </div>
          <p class="text-3xl font-bold tracking-tight">{{ activeCampaigns }}</p>
          <div class="flex items-center gap-1.5 mt-1.5">
            <span class="text-xs text-muted-foreground">of {{ campaigns.length }} total</span>
            <div v-if="activeCampaigns > 0" class="flex items-center gap-1 ml-auto">
              <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span class="text-[10px] text-emerald-600 font-medium">Live</span>
            </div>
          </div>
        </div>

        <!-- Leads Discovered -->
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Discovered</span>
            <div class="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Sparkles class="size-4 text-amber-600" />
            </div>
          </div>
          <p class="text-3xl font-bold tracking-tight">{{ totalDiscovered }}</p>
          <div class="flex items-center gap-1.5 mt-1.5">
            <TrendingUp class="size-3 text-emerald-600" />
            <span class="text-xs text-emerald-600 font-medium">+12 today</span>
          </div>
        </div>

        <!-- Pending Review -->
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer" @click="totalPending > 0 && openReview()">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending Review</span>
            <div class="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock class="size-4 text-amber-600" />
            </div>
          </div>
          <p class="text-3xl font-bold tracking-tight">{{ totalPending }}</p>
          <div class="flex items-center gap-1.5 mt-1.5">
            <span class="text-xs text-muted-foreground">awaiting your decision</span>
          </div>
        </div>

        <!-- Approved -->
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Approved</span>
            <div class="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 class="size-4 text-emerald-600" />
            </div>
          </div>
          <p class="text-3xl font-bold tracking-tight">{{ totalApproved }}</p>
          <div class="flex items-center gap-1.5 mt-1.5">
            <span class="text-xs text-muted-foreground">added to pipeline</span>
          </div>
        </div>
      </div>

      <!-- Main Content: Campaigns Grid + Agent Activity -->
      <div class="grid gap-6 lg:grid-cols-5">
        <!-- Campaigns Grid (3 cols) -->
        <div class="lg:col-span-3 space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Campaigns</h2>
            <span class="text-xs text-muted-foreground">{{ campaigns.length }} total</span>
          </div>

          <!-- Empty State -->
          <div
            v-if="campaigns.length === 0"
            class="rounded-xl border-2 border-dashed border-border p-16 text-center"
          >
            <div class="size-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Radar class="size-8 text-primary/40" />
            </div>
            <h3 class="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p class="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Create your first AI discovery campaign to start finding leads that match your ideal customer profile.
            </p>
            <Button @click="showCreateDialog = true">
              <Plus class="size-4 mr-1.5" /> Create Campaign
            </Button>
          </div>

          <!-- Campaign Cards Grid -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div
              v-for="(campaign, idx) in campaigns"
              :key="campaign.id"
              class="group rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              @click="openCampaign(campaign.id)"
            >
              <!-- Card Content -->
              <div class="p-5">
                <!-- Header Row -->
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Target class="size-5 text-primary" />
                    </div>
                    <div class="min-w-0">
                      <h3 class="font-semibold text-sm leading-tight group-hover:text-primary transition-colors truncate">
                        {{ campaign.name }}
                      </h3>
                      <p class="text-xs text-muted-foreground mt-0.5 truncate">{{ campaign.target_industry }}</p>
                    </div>
                  </div>
                  <div :class="['flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium shrink-0 border', campaignStatusConfig(campaign.status).bg, campaignStatusConfig(campaign.status).text, campaignStatusConfig(campaign.status).border]">
                    <span
                      v-if="campaign.status === 'running'"
                      class="size-1.5 rounded-full bg-emerald-500 animate-pulse"
                    />
                    <Loader2 v-if="campaign.status === 'running'" class="size-3 animate-spin" />
                    <span class="capitalize">{{ campaign.status }}</span>
                  </div>
                </div>

                <!-- Search Criteria -->
                <p class="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                  {{ campaign.search_criteria }}
                </p>

                <!-- Progress Bar -->
                <div class="mb-4">
                  <div class="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                    <span>Review progress</span>
                    <span class="font-medium text-foreground">{{ progressPercent(campaign) }}%</span>
                  </div>
                  <div class="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400 transition-all duration-500"
                      :style="{ width: `${progressPercent(campaign)}%` }"
                    />
                  </div>
                </div>

                <!-- Metrics Row -->
                <div class="grid grid-cols-3 gap-3">
                  <div class="text-center">
                    <p class="text-lg font-bold text-foreground">{{ campaign.leads_found }}</p>
                    <p class="text-[10px] text-muted-foreground">Found</p>
                  </div>
                  <div class="text-center">
                    <p class="text-lg font-bold text-emerald-600">{{ campaign.leads_approved }}</p>
                    <p class="text-[10px] text-muted-foreground">Approved</p>
                  </div>
                  <div class="text-center">
                    <p class="text-lg font-bold text-red-500">{{ campaign.leads_rejected }}</p>
                    <p class="text-[10px] text-muted-foreground">Rejected</p>
                  </div>
                </div>

                <!-- Footer Tags -->
                <div class="flex items-center gap-3 mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground">
                  <span class="flex items-center gap-1">
                    <MapPin class="size-3" />
                    {{ campaign.target_region }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Building2 class="size-3" />
                    {{ campaign.target_company_size }}
                  </span>
                  <ChevronRight class="size-3.5 ml-auto text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Agent Activity Panel (2 cols) - GROUPED BY CAMPAIGN -->
        <div class="lg:col-span-2 space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Agent Activity</h2>
            <div v-if="getRunningActivities().length > 0" class="flex items-center gap-1.5">
              <span class="relative flex size-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span class="relative inline-flex rounded-full size-2 bg-emerald-500" />
              </span>
              <span class="text-xs font-medium text-emerald-600">{{ getRunningActivities().length }} active</span>
            </div>
          </div>

          <!-- Live Agent Banner -->
          <div
            v-if="getRunningActivities().length > 0"
            class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
          >
            <div class="flex items-center gap-2.5 mb-3">
              <div class="relative">
                <div class="size-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <Bot class="size-4 text-emerald-600" />
                </div>
                <span class="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 animate-pulse border border-background" />
              </div>
              <div>
                <p class="text-sm font-semibold text-emerald-700">Agents Working</p>
                <p class="text-[10px] text-emerald-600/70">Processing in real-time</p>
              </div>
            </div>
            <div class="space-y-2">
              <div
                v-for="activity in getRunningActivities()"
                :key="activity.id"
                class="flex items-start gap-2.5 rounded-lg bg-white/50 dark:bg-white/5 p-2.5"
              >
                <Loader2 class="size-3.5 text-emerald-600 animate-spin mt-0.5 shrink-0" />
                <div class="min-w-0">
                  <span class="text-xs font-medium text-foreground">{{ activity.agent_name }}</span>
                  <p class="text-[11px] text-muted-foreground truncate">{{ activity.action }}</p>
                </div>
                <span class="text-[10px] text-muted-foreground whitespace-nowrap ml-auto shrink-0">{{ formatTimeAgo(activity.timestamp) }}</span>
              </div>
            </div>
          </div>

          <!-- Grouped Activity Sections -->
          <div v-if="groupedActivities.length === 0 && getRunningActivities().length === 0" class="rounded-xl border border-border bg-card shadow-sm p-12 text-center">
            <div class="size-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
              <Activity class="size-5 text-muted-foreground/40" />
            </div>
            <p class="text-sm text-muted-foreground">No agent activity yet</p>
            <p class="text-xs text-muted-foreground/70 mt-1">Activity will appear here when agents start working on campaigns</p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="group in groupedActivities"
              :key="group.campaignId"
              class="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
            >
              <!-- Campaign Group Header -->
              <div
                class="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
                @click="$router.push('/activity')"
              >
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <div class="relative">
                    <div class="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target class="size-3.5 text-primary" />
                    </div>
                    <span
                      v-if="group.hasRunning"
                      class="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 animate-pulse"
                    />
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold truncate">{{ group.campaignName }}</p>
                    <p class="text-[10px] text-muted-foreground">{{ group.activities.length }} action{{ group.activities.length > 1 ? 's' : '' }}</p>
                  </div>
                </div>
                <div :class="['px-1.5 py-0.5 rounded text-[9px] font-medium capitalize', campaignStatusConfig(group.campaignStatus).bg, campaignStatusConfig(group.campaignStatus).text]">
                  {{ group.campaignStatus }}
                </div>
              </div>

              <!-- Mini Timeline -->
              <div class="px-4 py-3">
                <div class="relative">
                  <!-- Vertical timeline line -->
                  <div class="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

                  <div class="space-y-0">
                    <div
                      v-for="(activity, aIdx) in getVisibleActivities(group)"
                      :key="activity.id"
                      class="relative flex items-start gap-3 pb-3 last:pb-0"
                    >
                      <!-- Timeline Dot -->
                      <div class="relative z-10 mt-1 shrink-0">
                        <div v-if="activity.status === 'running'" class="relative">
                          <div class="size-[18px] rounded-full bg-emerald-500/15 flex items-center justify-center">
                            <div class="size-2 rounded-full bg-emerald-500 animate-pulse" />
                          </div>
                        </div>
                        <div v-else-if="activity.status === 'completed'" class="size-[18px] rounded-full bg-primary/10 flex items-center justify-center">
                          <CheckCircle2 class="size-2.5 text-primary" />
                        </div>
                        <div v-else class="size-[18px] rounded-full bg-red-500/10 flex items-center justify-center">
                          <XCircle class="size-2.5 text-red-500" />
                        </div>
                      </div>

                      <!-- Activity Content -->
                      <div class="flex-1 min-w-0 pt-0.5">
                        <div class="flex items-start justify-between gap-2">
                          <div class="min-w-0">
                            <p class="text-xs font-medium leading-snug">{{ activity.action }}</p>
                            <p class="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{{ activity.detail }}</p>
                          </div>
                          <span class="text-[9px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">{{ formatTimeAgo(activity.timestamp) }}</span>
                        </div>
                        <div class="flex items-center gap-1.5 mt-1">
                          <Badge variant="secondary" class="text-[9px] px-1.5 py-0 h-4">
                            <Bot class="size-2.5 mr-0.5" />
                            {{ activity.agent_name }}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Show More / Less -->
                <button
                  v-if="group.activities.length > 5"
                  class="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium mt-2 ml-7 transition-colors"
                  @click.stop="toggleActivityGroup(group.campaignId)"
                >
                  <ChevronDown
                    :class="['size-3 transition-transform', expandedActivityGroups[group.campaignId] ? 'rotate-180' : '']"
                  />
                  {{ expandedActivityGroups[group.campaignId] ? 'Show less' : `Show ${group.activities.length - 5} more` }}
                </button>
              </div>
            </div>
          </div>

          <!-- Quick Review CTA -->
          <div
            v-if="totalPending > 0"
            class="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5"
          >
              <div class="flex items-center gap-2.5 mb-2">
                <div class="size-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Brain class="size-4 text-amber-600" />
                </div>
                <div>
                  <p class="text-sm font-semibold">Leads Need Attention</p>
                  <p class="text-[10px] text-muted-foreground">AI has pre-scored them</p>
                </div>
              </div>
              <p class="text-xs text-muted-foreground mb-3 leading-relaxed">
                {{ totalPending }} discovered lead{{ totalPending > 1 ? 's are' : ' is' }} waiting for your review.
              </p>
              <Button size="sm" variant="outline" class="w-full border-amber-500/30 hover:bg-amber-500/10" @click="openReview">
                Review Now
                <ArrowRight class="size-3 ml-1.5" />
              </Button>
          </div>
        </div>
      </div>
    </template>

    <!-- ================================================================== -->
    <!--                       CAMPAIGN DETAIL VIEW                         -->
    <!-- ================================================================== -->
    <template v-if="viewMode === 'campaign' && selectedCampaign">
      <!-- Back Navigation -->
      <button
        class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors group"
        @click="backToOverview"
      >
        <ArrowLeft class="size-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Discovery
      </button>

      <!-- Campaign Header -->
      <div class="rounded-xl border border-border bg-card p-6 mb-6 shadow-sm">
        <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-4">
              <div class="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target class="size-6 text-primary" />
              </div>
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <h1 class="text-2xl font-bold tracking-tight">{{ selectedCampaign.name }}</h1>
                  <div :class="['flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', campaignStatusConfig(selectedCampaign.status).bg, campaignStatusConfig(selectedCampaign.status).text, campaignStatusConfig(selectedCampaign.status).border]">
                    <span
                      v-if="selectedCampaign.status === 'running'"
                      class="size-1.5 rounded-full bg-emerald-500 animate-pulse"
                    />
                    <span class="capitalize">{{ selectedCampaign.status }}</span>
                  </div>
                </div>
                <p class="text-sm text-muted-foreground max-w-xl">{{ selectedCampaign.search_criteria }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <Button
                v-if="selectedCampaign.status === 'running'"
                variant="outline"
                size="sm"
                @click="updateCampaign(selectedCampaign.id, { status: 'paused' })"
              >
                <Pause class="size-4 mr-1.5" /> Pause
              </Button>
              <Button
                v-else
                size="sm"
                @click="updateCampaign(selectedCampaign.id, { status: 'running' })"
              >
                <Play class="size-4 mr-1.5" /> Start
              </Button>
            </div>
          </div>

          <!-- Date info -->
          <div class="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Created {{ formatDate(selectedCampaign.created_at) }}</span>
            <span>Updated {{ formatTimeAgo(selectedCampaign.updated_at) }}</span>
          </div>
      </div>

      <!-- Targeting Criteria Cards -->
      <div class="grid gap-3 md:grid-cols-5 mb-6">
        <div class="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
          <div class="flex items-center gap-2 mb-2">
            <Layers class="size-3.5 text-primary" />
            <p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Industry</p>
          </div>
          <p class="text-sm font-semibold">{{ selectedCampaign.target_industry }}</p>
        </div>
        <div class="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
          <div class="flex items-center gap-2 mb-2">
            <Users class="size-3.5 text-primary" />
            <p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Roles</p>
          </div>
          <div class="flex flex-wrap gap-1">
            <Badge v-for="role in selectedCampaign.target_roles" :key="role" variant="secondary" class="text-[10px]">
              {{ role }}
            </Badge>
          </div>
        </div>
        <div class="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
          <div class="flex items-center gap-2 mb-2">
            <Building2 class="size-3.5 text-primary" />
            <p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Company Size</p>
          </div>
          <p class="text-sm font-semibold">{{ selectedCampaign.target_company_size }} employees</p>
        </div>
        <div class="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
          <div class="flex items-center gap-2 mb-2">
            <MapPin class="size-3.5 text-primary" />
            <p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Region</p>
          </div>
          <p class="text-sm font-semibold">{{ selectedCampaign.target_region }}</p>
        </div>
        <div class="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
          <div class="flex items-center gap-2 mb-2">
            <SlidersHorizontal class="size-3.5 text-primary" />
            <p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Min Confidence</p>
          </div>
          <p class="text-sm font-semibold">{{ selectedCampaign.confidence_threshold }}%</p>
        </div>
      </div>

      <!-- Campaign Metrics Bar -->
      <div class="flex items-center gap-6 rounded-xl border border-border bg-card px-6 py-4 mb-6 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Search class="size-5 text-primary" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ selectedCampaign.leads_found }}</p>
            <p class="text-[10px] text-muted-foreground uppercase tracking-wider">Found</p>
          </div>
        </div>
        <div class="h-8 w-px bg-border" />
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 class="size-5 text-emerald-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-emerald-600">{{ selectedCampaign.leads_approved }}</p>
            <p class="text-[10px] text-muted-foreground uppercase tracking-wider">Approved</p>
          </div>
        </div>
        <div class="h-8 w-px bg-border" />
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <XCircle class="size-5 text-red-500" />
          </div>
          <div>
            <p class="text-2xl font-bold text-red-500">{{ selectedCampaign.leads_rejected }}</p>
            <p class="text-[10px] text-muted-foreground uppercase tracking-wider">Rejected</p>
          </div>
        </div>
        <div class="h-8 w-px bg-border" />
        <div class="flex-1">
          <div class="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Review Progress</span>
            <span class="font-medium text-foreground">{{ progressPercent(selectedCampaign) }}%</span>
          </div>
          <div class="h-2 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400 transition-all duration-500"
              :style="{ width: `${progressPercent(selectedCampaign)}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Leads Section -->
      <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <!-- Leads Header with Filter -->
        <div class="flex items-center justify-between p-5 pb-0">
          <h2 class="text-lg font-semibold">Discovered Leads</h2>
          <div class="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              v-for="f in [
                { key: 'all', label: 'All', count: campaignLeads.length },
                { key: 'pending_review', label: 'Pending', count: campaignLeads.filter(l => l.status === 'pending_review').length },
                { key: 'approved', label: 'Approved', count: campaignLeads.filter(l => l.status === 'approved').length },
                { key: 'rejected', label: 'Rejected', count: campaignLeads.filter(l => l.status === 'rejected').length },
              ] as { key: 'all' | 'pending_review' | 'approved' | 'rejected'; label: string; count: number }[]"
              :key="f.key"
              :class="[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                campaignLeadFilter === f.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              ]"
              @click="campaignLeadFilter = f.key"
            >
              {{ f.label }}
              <span class="ml-1 text-[10px] text-muted-foreground">({{ f.count }})</span>
            </button>
          </div>
        </div>

        <!-- Leads Empty State -->
        <div v-if="filteredCampaignLeads.length === 0" class="p-12 text-center">
          <Search class="size-8 text-muted-foreground/30 mx-auto mb-3" />
          <p class="text-sm text-muted-foreground">No leads match this filter.</p>
        </div>

        <!-- Leads List -->
        <div class="divide-y divide-border mt-4">
          <div
            v-for="lead in filteredCampaignLeads"
            :key="lead.id"
            class="p-5 hover:bg-muted/20 transition-colors cursor-pointer"
            @click="openLeadDetail(lead)"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-4 min-w-0">
                <!-- Confidence Ring -->
                <div :class="['relative flex items-center justify-center size-14 rounded-full border-[3px] shrink-0 bg-gradient-to-br', confidenceRingColor(lead.confidence_score), confidenceGradient(lead.confidence_score)]">
                  <span :class="['text-base font-bold', confidenceColor(lead.confidence_score)]">{{ lead.confidence_score }}</span>
                </div>

                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-semibold">{{ lead.name }}</h3>
                    <Badge
                      v-if="lead.status === 'approved'"
                      class="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                    >
                      <CheckCircle2 class="size-3 mr-0.5" /> Approved
                    </Badge>
                    <Badge
                      v-else-if="lead.status === 'rejected'"
                      variant="destructive"
                      class="text-[10px]"
                    >
                      <XCircle class="size-3 mr-0.5" /> Rejected
                    </Badge>
                    <Badge
                      v-else
                      variant="outline"
                      class="text-[10px] border-amber-500/30 text-amber-700 bg-amber-500/5"
                    >
                      <Clock class="size-3 mr-0.5" /> Pending
                    </Badge>
                  </div>
                  <p class="text-sm text-muted-foreground">{{ lead.position }} at <strong class="text-foreground">{{ lead.company }}</strong></p>
                  <p class="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{{ lead.ai_summary }}</p>

                  <!-- Signals -->
                  <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                    <Badge v-for="signal in lead.signals.slice(0, 3)" :key="signal" variant="secondary" class="text-[10px]">
                      <Signal class="size-2.5 mr-0.5" /> {{ signal }}
                    </Badge>
                    <span v-if="lead.signals.length > 3" class="text-[10px] text-muted-foreground">+{{ lead.signals.length - 3 }} more</span>
                  </div>
                </div>
              </div>

              <!-- Quick Actions -->
              <div v-if="lead.status === 'pending_review'" class="flex items-center gap-1.5 shrink-0" @click.stop>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-9 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 rounded-lg"
                  @click="handleApprove(lead.id)"
                >
                  <ThumbsUp class="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-9 text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-lg"
                  @click="handleReject(lead.id)"
                >
                  <ThumbsDown class="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ================================================================== -->
    <!--                        REVIEW QUEUE VIEW                           -->
    <!-- ================================================================== -->
    <template v-if="viewMode === 'review'">
      <!-- Back Navigation -->
      <button
        class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors group"
        @click="backToOverview"
      >
        <ArrowLeft class="size-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Discovery
      </button>

      <!-- Review Header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Review Queue</h2>
          <p class="text-sm text-muted-foreground mt-0.5">{{ pendingLeads.length }} lead{{ pendingLeads.length !== 1 ? 's' : '' }} awaiting your review</p>
        </div>
        <div class="relative">
          <Search class="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="reviewSearchQuery"
            placeholder="Search leads..."
            class="pl-9 w-64"
          />
        </div>
      </div>

      <!-- All Caught Up State -->
      <div v-if="pendingLeads.length === 0" class="rounded-xl border-2 border-dashed border-border p-16 text-center">
        <div class="size-16 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 class="size-8 text-emerald-600/50" />
        </div>
        <h3 class="text-lg font-semibold mb-2">All Caught Up</h3>
        <p class="text-sm text-muted-foreground max-w-xs mx-auto">
          No leads waiting for review. Check back later or create a new campaign.
        </p>
      </div>

      <!-- No Search Results -->
      <div v-else-if="filteredPendingLeads.length === 0" class="rounded-xl border-2 border-dashed border-border p-12 text-center">
        <Search class="size-8 text-muted-foreground/30 mx-auto mb-3" />
        <p class="text-sm text-muted-foreground">No leads match your search.</p>
      </div>

      <!-- Review Cards -->
      <div v-else class="space-y-4">
        <div
          v-for="(lead, idx) in filteredPendingLeads"
          :key="lead.id"
          class="group rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
        >

          <div class="p-6">
            <div class="flex items-start gap-5">
              <!-- Confidence Ring (Large) -->
              <div class="shrink-0">
                <div :class="['relative flex items-center justify-center size-16 rounded-full border-[3px] bg-gradient-to-br', confidenceRingColor(lead.confidence_score), confidenceGradient(lead.confidence_score)]">
                  <span :class="['text-xl font-bold', confidenceColor(lead.confidence_score)]">{{ lead.confidence_score }}</span>
                </div>
                <p class="text-[9px] text-muted-foreground text-center mt-1.5">Score</p>
              </div>

              <!-- Lead Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-lg font-semibold">{{ lead.name }}</h3>
                  <span class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">via {{ lead.discovery_source }}</span>
                </div>
                <p class="text-sm text-muted-foreground">
                  {{ lead.position }} at <strong class="text-foreground">{{ lead.company }}</strong>
                </p>

                <!-- AI Analysis Box -->
                <div class="mt-4 rounded-xl bg-primary/5 border border-primary/10 p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="size-5 rounded-md bg-primary/10 flex items-center justify-center">
                      <Brain class="size-3 text-primary" />
                    </div>
                    <span class="text-xs font-semibold text-primary">AI Analysis</span>
                  </div>
                  <p class="text-sm text-muted-foreground leading-relaxed">{{ lead.ai_summary }}</p>
                </div>

                <!-- Signals -->
                <div class="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge
                    v-for="signal in lead.signals"
                    :key="signal"
                    variant="secondary"
                    class="text-xs"
                  >
                    <Zap class="size-3 mr-1 text-amber-500" /> {{ signal }}
                  </Badge>
                </div>

                <!-- Contact Info Row -->
                <div class="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  <span v-if="lead.email" class="flex items-center gap-1">
                    {{ lead.email }}
                  </span>
                  <a
                    v-if="lead.linkedin_url"
                    :href="lead.linkedin_url"
                    target="_blank"
                    class="flex items-center gap-1 text-primary hover:underline"
                    @click.stop
                  >
                    <Globe class="size-3" /> LinkedIn
                    <ExternalLink class="size-2.5" />
                  </a>
                  <span class="flex items-center gap-1">
                    <Clock class="size-3" />
                    {{ formatTimeAgo(lead.discovered_at) }}
                  </span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  class="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
                  @click="handleApprove(lead.id)"
                >
                  <ThumbsUp class="size-4 mr-1.5" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-500/30 dark:hover:bg-red-500/10"
                  @click="handleReject(lead.id)"
                >
                  <ThumbsDown class="size-4 mr-1.5" />
                  Reject
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-muted-foreground"
                  @click="openLeadDetail(lead)"
                >
                  <Eye class="size-4 mr-1.5" />
                  Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ================================================================== -->
    <!--                      LEAD DETAIL DIALOG                            -->
    <!-- ================================================================== -->
    <Dialog :open="showLeadDetail" @update:open="showLeadDetail = $event">
      <DialogContent class="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{{ selectedLead?.name }}</DialogTitle>
          <DialogDescription v-if="selectedLead">
            {{ selectedLead.position }} at {{ selectedLead.company }} · Confidence: {{ selectedLead.confidence_score }}%
          </DialogDescription>
          <DialogDescription class="sr-only">
            Lead detail and analysis
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedLead" class="space-y-4 py-2">
          <!-- AI Summary -->
          <div class="rounded-xl bg-primary/5 border border-primary/10 p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="size-5 rounded-md bg-primary/10 flex items-center justify-center">
                <Brain class="size-3 text-primary" />
              </div>
              <span class="text-xs font-semibold text-primary">AI Analysis</span>
            </div>
            <p class="text-sm leading-relaxed">{{ selectedLead.ai_summary }}</p>
          </div>

          <!-- Signals -->
          <div>
            <h3 class="text-sm font-semibold mb-2">Discovery Signals</h3>
            <div class="flex flex-wrap gap-1.5">
              <Badge v-for="signal in selectedLead.signals" :key="signal" variant="secondary" class="text-xs">
                <Zap class="size-3 mr-1 text-amber-500" /> {{ signal }}
              </Badge>
            </div>
          </div>

          <!-- Contact Details Grid -->
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl border border-border p-3 bg-muted/20">
              <p class="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Email</p>
              <p class="text-sm font-medium">{{ selectedLead.email || 'Not available' }}</p>
            </div>
            <div class="rounded-xl border border-border p-3 bg-muted/20">
              <p class="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Source</p>
              <p class="text-sm font-medium">{{ selectedLead.discovery_source }}</p>
            </div>
            <div class="rounded-xl border border-border p-3 bg-muted/20">
              <p class="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Discovered</p>
              <p class="text-sm font-medium">{{ formatTimeAgo(selectedLead.discovered_at) }}</p>
            </div>
            <div class="rounded-xl border border-border p-3 bg-muted/20">
              <p class="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Campaign</p>
              <p class="text-sm font-medium">{{ campaigns.find(c => c.id === selectedLead!.campaign_id)?.name || 'Unknown' }}</p>
            </div>
          </div>

          <!-- LinkedIn Link -->
          <div v-if="selectedLead.linkedin_url">
            <a
              :href="selectedLead.linkedin_url"
              target="_blank"
              class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Globe class="size-3.5" /> View LinkedIn Profile
              <ExternalLink class="size-3" />
            </a>
          </div>
        </div>

        <DialogFooter v-if="selectedLead && selectedLead.status === 'pending_review'" class="gap-2">
          <Button variant="outline" @click="showLeadDetail = false">Close</Button>
          <Button
            variant="outline"
            class="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
            @click="handleReject(selectedLead.id)"
          >
            <ThumbsDown class="size-4 mr-1.5" /> Reject
          </Button>
          <Button
            class="bg-emerald-600 hover:bg-emerald-700 text-white"
            @click="handleApprove(selectedLead.id)"
          >
            <ThumbsUp class="size-4 mr-1.5" /> Approve & Import
          </Button>
        </DialogFooter>
        <DialogFooter v-else>
          <Button variant="outline" @click="showLeadDetail = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- ================================================================== -->
    <!--                    CREATE CAMPAIGN DIALOG                          -->
    <!-- ================================================================== -->
    <Dialog :open="showCreateDialog" @update:open="showCreateDialog = $event">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Discovery Campaign</DialogTitle>
          <DialogDescription>
            Define your ICP and let AI agents find matching leads.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-5 py-4">
          <!-- Campaign Name -->
          <div>
            <label class="text-sm font-medium mb-1.5 block">Campaign Name <span class="text-red-500">*</span></label>
            <Input v-model="createForm.name" placeholder="e.g., SaaS Decision Makers - Q1" />
          </div>

          <!-- Industry & Roles -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium mb-1.5 block">Target Industry <span class="text-red-500">*</span></label>
              <Input v-model="createForm.target_industry" placeholder="e.g., SaaS / Software" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1.5 block">Target Roles <span class="text-red-500">*</span></label>
              <Input v-model="createForm.target_roles" placeholder="CTO, VP Engineering" />
              <p class="text-[10px] text-muted-foreground mt-1">Comma separated</p>
            </div>
          </div>

          <!-- Size & Region -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium mb-1.5 block">Company Size</label>
              <Select v-model="createForm.target_company_size">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="size in companySizes" :key="size" :value="size">{{ size }} employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label class="text-sm font-medium mb-1.5 block">Region</label>
              <Select v-model="createForm.target_region">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="region in regions" :key="region" :value="region">{{ region }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Search Criteria -->
          <div>
            <label class="text-sm font-medium mb-1.5 block">Search Criteria <span class="text-red-500">*</span></label>
            <Textarea
              v-model="createForm.search_criteria"
              placeholder="Describe what makes someone a good lead... e.g., Recently funded startups looking to scale their engineering team"
              rows="3"
            />
          </div>

          <!-- Confidence Threshold -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium">Minimum Confidence</label>
              <span class="text-sm font-bold text-primary">{{ createForm.confidence_threshold }}%</span>
            </div>
            <input
              v-model.number="createForm.confidence_threshold"
              type="range"
              min="30"
              max="95"
              step="5"
              class="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div class="flex justify-between text-[10px] text-muted-foreground mt-1.5">
              <span>More leads, lower quality</span>
              <span>Fewer leads, higher quality</span>
            </div>
          </div>
        </div>
        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showCreateDialog = false" :disabled="creatingCampaign">Cancel</Button>
          <Button
            :disabled="!createForm.name || !createForm.target_industry || !createForm.target_roles || !createForm.search_criteria || creatingCampaign"
            @click="handleCreateCampaign"
          >
            <Loader2 v-if="creatingCampaign" class="size-4 mr-1.5 animate-spin" />
            <Radar v-else class="size-4 mr-1.5" />
            {{ creatingCampaign ? 'Creating...' : 'Create Campaign' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
