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
  ExternalLink,
  Sparkles,
  Target,
  TrendingUp,
  Building2,
  MapPin,
  Users,
  ChevronRight,
  Bot,
  Loader2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Import,
  Zap,
  Globe,
  Signal,
  Brain,
} from 'lucide-vue-next'
import type { DiscoveryCampaign, DiscoveredLead } from '~/composables/useDiscovery'

const {
  campaigns,
  discoveredLeads,
  agentActivities,
  loading,
  fetchCampaigns,
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

onMounted(() => {
  fetchCampaigns()
})

// ── Views ──
type ViewMode = 'overview' | 'campaign' | 'review'
const viewMode = ref<ViewMode>('overview')
const selectedCampaignId = ref<string | null>(null)
const selectedLead = ref<DiscoveredLead | null>(null)
const showCreateDialog = ref(false)
const showLeadDetail = ref(false)

const selectedCampaign = computed(() =>
  campaigns.value.find(c => c.id === selectedCampaignId.value)
)

const campaignLeads = computed(() =>
  selectedCampaignId.value ? getCampaignLeads(selectedCampaignId.value) : []
)

const pendingLeads = computed(() => getPendingLeads())

function openCampaign(id: string) {
  selectedCampaignId.value = id
  viewMode.value = 'campaign'
}

function openReview() {
  viewMode.value = 'review'
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
  approveLead(leadId)
  if (selectedLead.value?.id === leadId) {
    showLeadDetail.value = false
    selectedLead.value = null
  }
}

function handleReject(leadId: string) {
  rejectLead(leadId)
  if (selectedLead.value?.id === leadId) {
    showLeadDetail.value = false
    selectedLead.value = null
  }
}

// ── Create campaign form ──
const createForm = ref({
  name: '',
  target_industry: '',
  target_roles: '',
  target_company_size: '50-500',
  target_region: 'North America',
  search_criteria: '',
  confidence_threshold: 70,
})

function handleCreateCampaign() {
  const newCampaign: DiscoveryCampaign = {
    id: `c-${Date.now()}`,
    name: createForm.value.name,
    status: 'draft',
    target_industry: createForm.value.target_industry,
    target_roles: createForm.value.target_roles.split(',').map(r => r.trim()),
    target_company_size: createForm.value.target_company_size,
    target_region: createForm.value.target_region,
    search_criteria: createForm.value.search_criteria,
    agent_id: null,
    leads_found: 0,
    leads_approved: 0,
    leads_rejected: 0,
    confidence_threshold: createForm.value.confidence_threshold,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  campaigns.value.push(newCampaign)
  showCreateDialog.value = false
  createForm.value = {
    name: '',
    target_industry: '',
    target_roles: '',
    target_company_size: '50-500',
    target_region: 'North America',
    search_criteria: '',
    confidence_threshold: 70,
  }
}

function confidenceColor(score: number): string {
  if (score >= 85) return 'text-green-600'
  if (score >= 70) return 'text-amber-600'
  return 'text-orange-500'
}

function confidenceBg(score: number): string {
  if (score >= 85) return 'bg-green-500/10 border-green-500/20'
  if (score >= 70) return 'bg-amber-500/10 border-amber-500/20'
  return 'bg-orange-500/10 border-orange-500/20'
}

function campaignStatusColor(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'running': return 'default'
    case 'completed': return 'secondary'
    case 'paused': return 'outline'
    case 'draft': return 'secondary'
    default: return 'secondary'
  }
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

const companySizes = ['1-10', '10-50', '50-500', '500-1000', '1000+']
const regions = ['North America', 'Europe', 'Asia Pacific', 'Global', 'United States', 'US & UK', 'LATAM']
</script>

<template>
  <div>
    <!-- ═══════════════════════════════ OVERVIEW ═══════════════════════════════ -->
    <template v-if="viewMode === 'overview'">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Discovery</h2>
          <p class="text-muted-foreground">AI-powered lead discovery and prospecting.</p>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" @click="openReview" :disabled="totalPending === 0">
            <Eye class="size-4 mr-1" />
            Review Leads
            <Badge v-if="totalPending > 0" variant="default" class="ml-2 text-[10px] px-1.5 py-0">
              {{ totalPending }}
            </Badge>
          </Button>
          <Button @click="showCreateDialog = true">
            <Plus class="size-4 mr-1" />
            New Campaign
          </Button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid gap-4 md:grid-cols-4 mb-6">
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-muted-foreground">Active Campaigns</span>
            <div class="rounded-lg bg-primary/10 p-2">
              <Radar class="size-4 text-primary" />
            </div>
          </div>
          <p class="text-3xl font-bold">{{ activeCampaigns }}</p>
          <p class="text-xs text-muted-foreground mt-1">of {{ campaigns.length }} total</p>
        </div>

        <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-muted-foreground">Leads Discovered</span>
            <div class="rounded-lg bg-accent/20 p-2">
              <Sparkles class="size-4 text-accent-foreground" />
            </div>
          </div>
          <p class="text-3xl font-bold">{{ totalDiscovered }}</p>
          <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp class="size-3" /> +12 today
          </p>
        </div>

        <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-muted-foreground">Pending Review</span>
            <div class="rounded-lg bg-amber-500/10 p-2">
              <Clock class="size-4 text-amber-600" />
            </div>
          </div>
          <p class="text-3xl font-bold">{{ totalPending }}</p>
          <p class="text-xs text-muted-foreground mt-1">awaiting your decision</p>
        </div>

        <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-muted-foreground">Approved & Imported</span>
            <div class="rounded-lg bg-green-500/10 p-2">
              <CheckCircle2 class="size-4 text-green-600" />
            </div>
          </div>
          <p class="text-3xl font-bold">{{ totalApproved }}</p>
          <p class="text-xs text-muted-foreground mt-1">added to pipeline</p>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Campaigns List (left 2 cols) -->
        <div class="lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Campaigns</h3>
          </div>

          <div v-if="campaigns.length === 0" class="rounded-xl border-2 border-dashed border-border p-12 text-center">
            <Radar class="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p class="text-sm font-medium text-muted-foreground mb-2">No campaigns yet</p>
            <p class="text-xs text-muted-foreground mb-4">Create your first discovery campaign to start finding leads.</p>
            <Button size="sm" @click="showCreateDialog = true">
              <Plus class="size-4 mr-1" /> Create Campaign
            </Button>
          </div>

          <div
            v-for="campaign in campaigns"
            :key="campaign.id"
            class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            @click="openCampaign(campaign.id)"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-primary/10 p-2.5">
                  <Target class="size-5 text-primary" />
                </div>
                <div>
                  <h4 class="font-semibold group-hover:text-primary transition-colors">{{ campaign.name }}</h4>
                  <p class="text-sm text-muted-foreground">{{ campaign.target_industry }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Badge :variant="campaignStatusColor(campaign.status)" class="capitalize">
                  <Loader2 v-if="campaign.status === 'running'" class="size-3 mr-1 animate-spin" />
                  {{ campaign.status }}
                </Badge>
                <ChevronRight class="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <p class="text-sm text-muted-foreground mb-4 line-clamp-1">{{ campaign.search_criteria }}</p>

            <div class="flex items-center gap-6 text-xs text-muted-foreground">
              <span class="flex items-center gap-1.5">
                <Users class="size-3" />
                <strong class="text-foreground">{{ campaign.leads_found }}</strong> found
              </span>
              <span class="flex items-center gap-1.5">
                <CheckCircle2 class="size-3 text-green-600" />
                <strong class="text-foreground">{{ campaign.leads_approved }}</strong> approved
              </span>
              <span class="flex items-center gap-1.5">
                <MapPin class="size-3" />
                {{ campaign.target_region }}
              </span>
              <span class="flex items-center gap-1.5">
                <Building2 class="size-3" />
                {{ campaign.target_company_size }} employees
              </span>
            </div>
          </div>
        </div>

        <!-- Agent Activity Feed (right col) -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Agent Activity</h3>

          <!-- Running agents pulse -->
          <div v-if="getRunningActivities().length > 0" class="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div class="flex items-center gap-2 mb-3">
              <div class="relative">
                <Bot class="size-4 text-primary" />
                <span class="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <span class="text-sm font-medium text-primary">{{ getRunningActivities().length }} agent{{ getRunningActivities().length > 1 ? 's' : '' }} active</span>
            </div>
            <div class="space-y-2">
              <div
                v-for="activity in getRunningActivities()"
                :key="activity.id"
                class="flex items-start gap-2 text-xs"
              >
                <Loader2 class="size-3 text-primary animate-spin mt-0.5 shrink-0" />
                <div>
                  <span class="font-medium">{{ activity.agent_name }}:</span>
                  <span class="text-muted-foreground"> {{ activity.action }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Activity timeline -->
          <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div class="space-y-3">
              <div
                v-for="activity in getRecentActivities(8)"
                :key="activity.id"
                class="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
              >
                <div :class="[
                  'rounded-md p-1.5 mt-0.5 shrink-0',
                  activity.status === 'running' ? 'bg-primary/10' : activity.status === 'error' ? 'bg-destructive/10' : 'bg-muted'
                ]">
                  <Bot v-if="activity.status === 'running'" class="size-3 text-primary" />
                  <CheckCircle2 v-else-if="activity.status === 'completed'" class="size-3 text-muted-foreground" />
                  <XCircle v-else class="size-3 text-destructive" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium leading-tight">{{ activity.action }}</p>
                  <p class="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{{ activity.detail }}</p>
                </div>
                <span class="text-[10px] text-muted-foreground whitespace-nowrap">{{ formatTimeAgo(activity.timestamp) }}</span>
              </div>
            </div>
          </div>

          <!-- Quick review prompt -->
          <div v-if="totalPending > 0" class="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div class="flex items-center gap-2 mb-2">
              <Brain class="size-4 text-amber-600" />
              <span class="text-sm font-medium">Leads need your attention</span>
            </div>
            <p class="text-xs text-muted-foreground mb-3">
              {{ totalPending }} discovered leads are waiting for your review. AI has pre-scored them based on your criteria.
            </p>
            <Button size="sm" variant="outline" class="w-full" @click="openReview">
              Review Now
              <ArrowRight class="size-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══════════════════════════════ CAMPAIGN DETAIL ═══════════════════════════════ -->
    <template v-if="viewMode === 'campaign' && selectedCampaign">
      <button
        class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        @click="backToOverview"
      >
        <ChevronRight class="size-4 rotate-180" />
        Back to Discovery
      </button>

      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h2 class="text-2xl font-bold tracking-tight">{{ selectedCampaign.name }}</h2>
            <Badge :variant="campaignStatusColor(selectedCampaign.status)" class="capitalize">
              <Loader2 v-if="selectedCampaign.status === 'running'" class="size-3 mr-1 animate-spin" />
              {{ selectedCampaign.status }}
            </Badge>
          </div>
          <p class="text-muted-foreground">{{ selectedCampaign.search_criteria }}</p>
        </div>
        <div class="flex items-center gap-2">
          <Button
            v-if="selectedCampaign.status === 'running'"
            variant="outline"
            size="sm"
            @click="selectedCampaign.status = 'paused'"
          >
            <Pause class="size-4 mr-1" /> Pause
          </Button>
          <Button
            v-else
            size="sm"
            @click="selectedCampaign.status = 'running'"
          >
            <Play class="size-4 mr-1" /> Start
          </Button>
        </div>
      </div>

      <!-- Campaign Stats -->
      <div class="grid gap-4 md:grid-cols-5 mb-6">
        <div class="rounded-lg border border-border bg-card p-4">
          <p class="text-xs text-muted-foreground mb-1">Target Industry</p>
          <p class="text-sm font-medium">{{ selectedCampaign.target_industry }}</p>
        </div>
        <div class="rounded-lg border border-border bg-card p-4">
          <p class="text-xs text-muted-foreground mb-1">Target Roles</p>
          <div class="flex flex-wrap gap-1 mt-1">
            <Badge v-for="role in selectedCampaign.target_roles" :key="role" variant="secondary" class="text-[10px]">
              {{ role }}
            </Badge>
          </div>
        </div>
        <div class="rounded-lg border border-border bg-card p-4">
          <p class="text-xs text-muted-foreground mb-1">Company Size</p>
          <p class="text-sm font-medium">{{ selectedCampaign.target_company_size }}</p>
        </div>
        <div class="rounded-lg border border-border bg-card p-4">
          <p class="text-xs text-muted-foreground mb-1">Region</p>
          <p class="text-sm font-medium">{{ selectedCampaign.target_region }}</p>
        </div>
        <div class="rounded-lg border border-border bg-card p-4">
          <p class="text-xs text-muted-foreground mb-1">Min. Confidence</p>
          <p class="text-sm font-medium">{{ selectedCampaign.confidence_threshold }}%</p>
        </div>
      </div>

      <!-- Campaign Leads -->
      <div class="rounded-xl border border-border bg-card shadow-sm">
        <div class="flex items-center justify-between p-5 pb-3">
          <h3 class="text-lg font-semibold">Discovered Leads ({{ campaignLeads.length }})</h3>
        </div>

        <div class="divide-y divide-border">
          <div
            v-for="lead in campaignLeads"
            :key="lead.id"
            class="p-5 hover:bg-muted/30 transition-colors cursor-pointer"
            @click="openLeadDetail(lead)"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-4">
                <!-- Confidence circle -->
                <div :class="['flex items-center justify-center size-12 rounded-full border-2 shrink-0', confidenceBg(lead.confidence_score)]">
                  <span :class="['text-sm font-bold', confidenceColor(lead.confidence_score)]">{{ lead.confidence_score }}</span>
                </div>

                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-semibold">{{ lead.name }}</h4>
                    <Badge
                      v-if="lead.status === 'approved'"
                      variant="default"
                      class="text-[10px]"
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
                      class="text-[10px]"
                    >
                      <Clock class="size-3 mr-0.5" /> Pending
                    </Badge>
                  </div>
                  <p class="text-sm text-muted-foreground">{{ lead.position }} at {{ lead.company }}</p>
                  <p class="text-xs text-muted-foreground mt-1 line-clamp-2">{{ lead.ai_summary }}</p>
                  <div class="flex items-center gap-2 mt-2">
                    <Badge v-for="signal in lead.signals.slice(0, 3)" :key="signal" variant="secondary" class="text-[10px]">
                      <Signal class="size-2.5 mr-0.5" /> {{ signal }}
                    </Badge>
                    <span v-if="lead.signals.length > 3" class="text-[10px] text-muted-foreground">+{{ lead.signals.length - 3 }} more</span>
                  </div>
                </div>
              </div>

              <div v-if="lead.status === 'pending_review'" class="flex items-center gap-1.5 shrink-0" @click.stop>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 text-green-600 hover:bg-green-500/10 hover:text-green-700"
                  @click="handleApprove(lead.id)"
                >
                  <ThumbsUp class="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 text-red-500 hover:bg-red-500/10 hover:text-red-600"
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

    <!-- ═══════════════════════════════ REVIEW QUEUE ═══════════════════════════════ -->
    <template v-if="viewMode === 'review'">
      <button
        class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        @click="backToOverview"
      >
        <ChevronRight class="size-4 rotate-180" />
        Back to Discovery
      </button>

      <div class="mb-6">
        <h2 class="text-2xl font-bold tracking-tight">Review Queue</h2>
        <p class="text-muted-foreground">{{ pendingLeads.length }} leads awaiting your review.</p>
      </div>

      <div v-if="pendingLeads.length === 0" class="rounded-xl border-2 border-dashed border-border p-12 text-center">
        <CheckCircle2 class="size-10 text-green-600/40 mx-auto mb-3" />
        <p class="text-sm font-medium text-muted-foreground">All caught up</p>
        <p class="text-xs text-muted-foreground mt-1">No leads waiting for review. Check back later.</p>
      </div>

      <div class="space-y-3">
        <div
          v-for="lead in pendingLeads"
          :key="lead.id"
          class="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <div class="flex items-start gap-4">
            <!-- Confidence circle -->
            <div :class="['flex items-center justify-center size-14 rounded-full border-2 shrink-0', confidenceBg(lead.confidence_score)]">
              <span :class="['text-lg font-bold', confidenceColor(lead.confidence_score)]">{{ lead.confidence_score }}</span>
            </div>

            <!-- Lead info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="text-base font-semibold">{{ lead.name }}</h4>
                <span class="text-xs text-muted-foreground">via {{ lead.discovery_source }}</span>
              </div>
              <p class="text-sm text-muted-foreground">{{ lead.position }} at <strong class="text-foreground">{{ lead.company }}</strong></p>

              <!-- AI Summary -->
              <div class="mt-3 rounded-lg bg-muted/50 border border-border p-3">
                <div class="flex items-center gap-1.5 mb-1.5">
                  <Brain class="size-3 text-primary" />
                  <span class="text-[11px] font-medium text-primary">AI Analysis</span>
                </div>
                <p class="text-sm text-muted-foreground leading-relaxed">{{ lead.ai_summary }}</p>
              </div>

              <!-- Signals -->
              <div class="flex items-center gap-2 mt-3 flex-wrap">
                <Badge v-for="signal in lead.signals" :key="signal" variant="secondary" class="text-xs">
                  <Signal class="size-3 mr-1" /> {{ signal }}
                </Badge>
              </div>

              <!-- Contact info -->
              <div class="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span v-if="lead.email">{{ lead.email }}</span>
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
                <span>Discovered {{ formatTimeAgo(lead.discovered_at) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                class="bg-green-600 hover:bg-green-700 text-white"
                @click="handleApprove(lead.id)"
              >
                <ThumbsUp class="size-4 mr-1" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                @click="handleReject(lead.id)"
              >
                <ThumbsDown class="size-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══════════════════════════════ LEAD DETAIL DIALOG ═══════════════════════════════ -->
    <Dialog :open="showLeadDetail" @update:open="showLeadDetail = $event">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-3">
            <div :class="['flex items-center justify-center size-10 rounded-full border-2 shrink-0', selectedLead ? confidenceBg(selectedLead.confidence_score) : '']">
              <span v-if="selectedLead" :class="['text-sm font-bold', confidenceColor(selectedLead.confidence_score)]">{{ selectedLead.confidence_score }}</span>
            </div>
            {{ selectedLead?.name }}
          </DialogTitle>
          <DialogDescription v-if="selectedLead">
            {{ selectedLead.position }} at {{ selectedLead.company }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedLead" class="space-y-4 py-2">
          <!-- AI Summary -->
          <div class="rounded-lg bg-muted/50 border border-border p-4">
            <div class="flex items-center gap-1.5 mb-2">
              <Brain class="size-3.5 text-primary" />
              <span class="text-xs font-medium text-primary">AI Analysis</span>
            </div>
            <p class="text-sm leading-relaxed">{{ selectedLead.ai_summary }}</p>
          </div>

          <!-- Signals -->
          <div>
            <h4 class="text-sm font-medium mb-2">Discovery Signals</h4>
            <div class="flex flex-wrap gap-1.5">
              <Badge v-for="signal in selectedLead.signals" :key="signal" variant="secondary">
                <Signal class="size-3 mr-1" /> {{ signal }}
              </Badge>
            </div>
          </div>

          <!-- Contact details -->
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg border border-border p-3">
              <p class="text-[11px] text-muted-foreground mb-1">Email</p>
              <p class="text-sm font-medium">{{ selectedLead.email || 'Not available' }}</p>
            </div>
            <div class="rounded-lg border border-border p-3">
              <p class="text-[11px] text-muted-foreground mb-1">Source</p>
              <p class="text-sm font-medium">{{ selectedLead.discovery_source }}</p>
            </div>
          </div>

          <div v-if="selectedLead.linkedin_url" class="flex items-center gap-2">
            <a
              :href="selectedLead.linkedin_url"
              target="_blank"
              class="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Globe class="size-3.5" /> View LinkedIn Profile
              <ExternalLink class="size-3" />
            </a>
          </div>
        </div>

        <DialogFooter v-if="selectedLead && selectedLead.status === 'pending_review'">
          <Button variant="outline" @click="showLeadDetail = false">Close</Button>
          <Button
            variant="outline"
            class="text-red-500 border-red-200 hover:bg-red-50"
            @click="handleReject(selectedLead.id)"
          >
            <ThumbsDown class="size-4 mr-1" /> Reject
          </Button>
          <Button
            class="bg-green-600 hover:bg-green-700 text-white"
            @click="handleApprove(selectedLead.id)"
          >
            <ThumbsUp class="size-4 mr-1" /> Approve & Import
          </Button>
        </DialogFooter>
        <DialogFooter v-else>
          <Button variant="outline" @click="showLeadDetail = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- ═══════════════════════════════ CREATE CAMPAIGN DIALOG ═══════════════════════════════ -->
    <Dialog :open="showCreateDialog" @update:open="showCreateDialog = $event">
      <DialogContent class="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>New Discovery Campaign</DialogTitle>
          <DialogDescription>
            Define your ideal customer profile and let AI agents find matching leads.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div>
            <label class="text-sm font-medium mb-1.5 block">Campaign Name *</label>
            <Input v-model="createForm.name" placeholder="e.g., SaaS Decision Makers - Q1" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium mb-1.5 block">Target Industry *</label>
              <Input v-model="createForm.target_industry" placeholder="e.g., SaaS / Software" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1.5 block">Target Roles *</label>
              <Input v-model="createForm.target_roles" placeholder="CTO, VP Engineering" />
              <p class="text-[10px] text-muted-foreground mt-1">Comma separated</p>
            </div>
          </div>
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
          <div>
            <label class="text-sm font-medium mb-1.5 block">Search Criteria *</label>
            <Textarea
              v-model="createForm.search_criteria"
              placeholder="Describe what makes someone a good lead... e.g., Recently funded startups looking to scale their engineering team"
              rows="3"
            />
          </div>
          <div>
            <label class="text-sm font-medium mb-1.5 block">Minimum Confidence Score: {{ createForm.confidence_threshold }}%</label>
            <input
              v-model.number="createForm.confidence_threshold"
              type="range"
              min="30"
              max="95"
              step="5"
              class="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div class="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>More leads, lower quality</span>
              <span>Fewer leads, higher quality</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCreateDialog = false">Cancel</Button>
          <Button
            :disabled="!createForm.name || !createForm.target_industry || !createForm.target_roles || !createForm.search_criteria"
            @click="handleCreateCampaign"
          >
            <Radar class="size-4 mr-1" />
            Create Campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
