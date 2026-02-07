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
  Phone,
  Calendar,
  FileText,
  UserPlus,
  Radar,
  Bot,
  Sparkles,
  CheckCircle2,
  Clock,
  Loader2,
  Brain,
  Zap,
  Signal,
  Globe,
  ArrowRight,
} from 'lucide-vue-next'

const { leads, stats, fetchLeads } = useLeads()
const { deals, pipelineStages, fetchDeals } = useDeals()
const { activities, fetchActivities } = useActivities()
const {
  campaigns,
  discoveredLeads,
  fetchCampaigns,
  totalDiscovered,
  totalPending,
  totalApproved,
  activeCampaigns,
  getRunningActivities,
  getRecentActivities,
} = useDiscovery()

onMounted(async () => {
  await Promise.all([
    fetchLeads(),
    fetchDeals(),
    fetchActivities(10),
    fetchCampaigns(),
  ])
})

const statsCards = computed(() => [
  { title: 'Total Leads', value: stats.value.total.toString(), change: '+12.5%', trend: 'up', icon: Users },
  { title: 'Qualified', value: stats.value.qualified.toString(), change: '+8.2%', trend: 'up', icon: Target },
  { title: 'In Progress', value: stats.value.inProgress.toString(), change: '-3.1%', trend: 'down', icon: Activity },
  { title: 'Converted', value: stats.value.converted.toString(), change: '+24.3%', trend: 'up', icon: DollarSign },
])

const recentLeads = computed(() => leads.value.slice(0, 5).map(lead => ({
  name: lead.name,
  company: lead.company || 'N/A',
  status: lead.status || 'new',
  value: lead.value ? `$${lead.value.toLocaleString()}` : '-'
})))

const activityIcons: Record<string, any> = {
  lead_created: UserPlus,
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: FileText,
  task: FileText,
  deal_created: DollarSign,
  status_changed: Activity,
}

const recentActivity = computed(() => activities.value.map(activity => ({
  action: activity.title,
  detail: activity.description || '',
  time: formatTimeAgo(activity.created_at),
  icon: activityIcons[activity.type] || Activity,
})))

function formatTimeAgo(date: string) {
  const now = new Date()
  const past = new Date(date)
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000 / 60)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p class="text-muted-foreground">
          Your lead generation command center.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink to="/discovery">
          <Button variant="outline" size="sm">
            <Radar class="size-4 mr-1" />
            Discovery
          </Button>
        </NuxtLink>
        <NuxtLink to="/leads">
          <Button size="sm">
            <UserPlus class="size-4 mr-1" />
            Add Lead
          </Button>
        </NuxtLink>
      </div>
    </div>

    <!-- AI Discovery Banner -->
    <div v-if="activeCampaigns > 0 || totalPending > 0" class="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/10 p-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="rounded-xl bg-primary/10 p-3">
            <Brain class="size-6 text-primary" />
          </div>
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <h3 class="font-semibold">AI Discovery Active</h3>
              <span class="relative flex size-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span class="relative inline-flex rounded-full size-2 bg-green-500" />
              </span>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ activeCampaigns }} campaign{{ activeCampaigns !== 1 ? 's' : '' }} running
              <span v-if="totalPending > 0">
                &middot; <strong class="text-foreground">{{ totalPending }} leads</strong> awaiting review
              </span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right hidden md:block">
            <p class="text-2xl font-bold">{{ totalDiscovered }}</p>
            <p class="text-xs text-muted-foreground">discovered</p>
          </div>
          <div class="w-px h-8 bg-border hidden md:block" />
          <div class="text-right hidden md:block">
            <p class="text-2xl font-bold text-green-600">{{ totalApproved }}</p>
            <p class="text-xs text-muted-foreground">approved</p>
          </div>
          <NuxtLink to="/discovery">
            <Button variant="outline" size="sm">
              Review
              <ArrowRight class="size-3 ml-1" />
            </Button>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="stat in statsCards"
        :key="stat.title"
        class="rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-muted-foreground">{{ stat.title }}</h3>
          <div class="rounded-md bg-muted p-2">
            <component :is="stat.icon" class="size-4 text-muted-foreground" />
          </div>
        </div>
        <p class="mt-2 text-3xl font-bold">{{ stat.value }}</p>
        <div class="mt-1 flex items-center gap-1 text-xs">
          <TrendingUp v-if="stat.trend === 'up'" class="size-3 text-green-600" />
          <TrendingDown v-else class="size-3 text-red-600" />
          <span :class="stat.trend === 'up' ? 'text-green-600' : 'text-red-600'">
            {{ stat.change }}
          </span>
          <span class="text-muted-foreground">from last month</span>
        </div>
      </div>
    </div>

    <!-- Pipeline + Activity + Agent Status -->
    <div class="grid gap-4 lg:grid-cols-3">
      <!-- Pipeline Overview -->
      <div class="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Pipeline Overview</h3>
          <NuxtLink to="/deals">
            <Button variant="ghost" size="sm" class="text-xs">
              View Deals <ArrowUpRight class="size-3 ml-1" />
            </Button>
          </NuxtLink>
        </div>
        <div class="space-y-3">
          <div
            v-for="stage in pipelineStages"
            :key="stage.name"
            class="flex items-center gap-3"
          >
            <span class="w-24 text-sm text-muted-foreground shrink-0">{{ stage.name }}</span>
            <div class="flex-1 h-8 bg-muted rounded-md overflow-hidden">
              <div
                :class="[stage.color, 'h-full rounded-md flex items-center px-2 text-xs font-medium text-white transition-all']"
                :style="{ width: `${stage.count > 0 ? Math.max(8, (stage.count / Math.max(...pipelineStages.map(s => s.count), 1)) * 100) : 0}%` }"
              >
                {{ stage.count }}
              </div>
            </div>
            <span class="w-16 text-right text-sm font-medium shrink-0">{{ stage.value }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Recent Activity</h3>
        <div class="space-y-4">
          <div
            v-for="item in recentActivity"
            :key="item.detail"
            class="flex items-start gap-3"
          >
            <div class="rounded-md bg-muted p-1.5 mt-0.5">
              <component :is="item.icon" class="size-3.5 text-muted-foreground" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium">{{ item.action }}</p>
              <p class="text-xs text-muted-foreground truncate">{{ item.detail }}</p>
            </div>
            <span class="text-xs text-muted-foreground whitespace-nowrap">{{ item.time }}</span>
          </div>
          <div v-if="recentActivity.length === 0" class="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Leads + Discovery Intel -->
    <div class="grid gap-4 lg:grid-cols-3">
      <!-- Recent Leads Table -->
      <div class="rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
        <div class="flex items-center justify-between p-6 pb-4">
          <h3 class="text-lg font-semibold">Recent Leads</h3>
          <NuxtLink to="/leads">
            <Button variant="outline" size="sm">
              View All
              <ArrowUpRight class="ml-1 size-3" />
            </Button>
          </NuxtLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-t border-border text-left text-xs text-muted-foreground">
                <th class="px-6 py-3 font-medium">Name</th>
                <th class="px-6 py-3 font-medium">Company</th>
                <th class="px-6 py-3 font-medium">Status</th>
                <th class="px-6 py-3 font-medium text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="lead in recentLeads"
                :key="lead.name"
                class="border-t border-border"
              >
                <td class="px-6 py-3 text-sm font-medium">{{ lead.name }}</td>
                <td class="px-6 py-3 text-sm text-muted-foreground">{{ lead.company }}</td>
                <td class="px-6 py-3">
                  <Badge variant="secondary" class="capitalize">{{ lead.status }}</Badge>
                </td>
                <td class="px-6 py-3 text-sm text-right font-medium">{{ lead.value }}</td>
              </tr>
              <tr v-if="recentLeads.length === 0">
                <td colspan="4" class="px-6 py-8 text-center text-sm text-muted-foreground">No leads yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Discovery Intelligence Card -->
      <div class="space-y-4">
        <!-- Active Agents -->
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold">Agent Status</h3>
            <NuxtLink to="/agents">
              <Button variant="ghost" size="sm" class="text-xs h-7">
                Manage <ArrowUpRight class="size-3 ml-1" />
              </Button>
            </NuxtLink>
          </div>
          <div v-if="getRunningActivities().length > 0" class="space-y-2.5">
            <div
              v-for="activity in getRunningActivities()"
              :key="activity.id"
              class="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/10 p-2.5"
            >
              <div class="relative shrink-0">
                <Bot class="size-4 text-primary" />
                <span class="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium">{{ activity.agent_name }}</p>
                <p class="text-[10px] text-muted-foreground truncate">{{ activity.action }}</p>
              </div>
              <Loader2 class="size-3 text-primary animate-spin shrink-0" />
            </div>
          </div>
          <div v-else class="text-sm text-muted-foreground text-center py-4">
            No agents currently active
          </div>
        </div>

        <!-- Discovery campaigns summary -->
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold">Campaigns</h3>
            <NuxtLink to="/discovery">
              <Button variant="ghost" size="sm" class="text-xs h-7">
                View All <ArrowUpRight class="size-3 ml-1" />
              </Button>
            </NuxtLink>
          </div>
          <div class="space-y-2">
            <NuxtLink
              v-for="campaign in campaigns.slice(0, 3)"
              :key="campaign.id"
              to="/discovery"
              class="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:bg-muted/30 transition-colors"
            >
              <Target class="size-4 text-muted-foreground shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium truncate">{{ campaign.name }}</p>
                <p class="text-[10px] text-muted-foreground">{{ campaign.leads_found }} leads found</p>
              </div>
              <Badge
                :variant="campaign.status === 'running' ? 'default' : 'secondary'"
                class="text-[9px] px-1.5 py-0"
              >
                {{ campaign.status }}
              </Badge>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
      <div class="flex flex-wrap gap-3">
        <NuxtLink to="/discovery">
          <Button variant="outline">
            <Radar class="size-4" />
            Launch Discovery
          </Button>
        </NuxtLink>
        <NuxtLink to="/leads">
          <Button variant="outline">
            <UserPlus class="size-4" />
            Add Lead
          </Button>
        </NuxtLink>
        <NuxtLink to="/contacts">
          <Button variant="outline">
            <Mail class="size-4" />
            Contacts
          </Button>
        </NuxtLink>
        <NuxtLink to="/deals">
          <Button variant="outline">
            <DollarSign class="size-4" />
            Deals
          </Button>
        </NuxtLink>
        <NuxtLink to="/flows">
          <Button variant="outline">
            <Zap class="size-4" />
            Flows
          </Button>
        </NuxtLink>
        <NuxtLink to="/agents">
          <Button variant="outline">
            <Bot class="size-4" />
            Agents
          </Button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
