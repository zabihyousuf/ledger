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
} from 'lucide-vue-next'

const stats = [
  { title: 'Total Leads', value: '2,847', change: '+12.5%', trend: 'up', icon: Users },
  { title: 'Qualified', value: '1,423', change: '+8.2%', trend: 'up', icon: Target },
  { title: 'In Progress', value: '892', change: '-3.1%', trend: 'down', icon: Activity },
  { title: 'Converted', value: '532', change: '+24.3%', trend: 'up', icon: DollarSign },
]

const recentLeads = [
  { name: 'Sarah Chen', company: 'TechFlow Inc.', status: 'New', value: '$12,500' },
  { name: 'Marcus Rivera', company: 'DataPrime', status: 'Contacted', value: '$8,200' },
  { name: 'Emily Watson', company: 'CloudNest', status: 'Qualified', value: '$24,000' },
  { name: 'James Park', company: 'ScaleUp AI', status: 'Proposal', value: '$45,000' },
  { name: 'Ava Thompson', company: 'BrightEdge', status: 'New', value: '$6,800' },
]

const pipelineStages = [
  { name: 'New', count: 45, value: '$125K', color: 'bg-blue-500' },
  { name: 'Contacted', count: 32, value: '$89K', color: 'bg-yellow-500' },
  { name: 'Qualified', count: 28, value: '$210K', color: 'bg-purple-500' },
  { name: 'Proposal', count: 15, value: '$340K', color: 'bg-orange-500' },
  { name: 'Negotiation', count: 8, value: '$180K', color: 'bg-pink-500' },
  { name: 'Closed Won', count: 12, value: '$520K', color: 'bg-green-500' },
]

const recentActivity = [
  { action: 'New lead created', detail: 'Sarah Chen from TechFlow Inc.', time: '2 min ago', icon: UserPlus },
  { action: 'Email sent', detail: 'Follow-up to Marcus Rivera', time: '15 min ago', icon: Mail },
  { action: 'Meeting scheduled', detail: 'Demo with CloudNest team', time: '1 hour ago', icon: Calendar },
  { action: 'Deal updated', detail: 'ScaleUp AI moved to Proposal', time: '2 hours ago', icon: FileText },
  { action: 'Call completed', detail: '12 min call with BrightEdge', time: '3 hours ago', icon: Phone },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold tracking-tight">Dashboard</h2>
      <p class="text-muted-foreground">
        Overview of your lead generation pipeline.
      </p>
    </div>

    <!-- Stat Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="stat in stats"
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

    <!-- Pipeline + Activity -->
    <div class="grid gap-4 lg:grid-cols-3">
      <!-- Pipeline Overview -->
      <div class="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
        <h3 class="text-lg font-semibold mb-4">Pipeline Overview</h3>
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
                :style="{ width: `${(stage.count / 45) * 100}%` }"
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
        </div>
      </div>
    </div>

    <!-- Recent Leads Table -->
    <div class="rounded-xl border border-border bg-card shadow-sm">
      <div class="flex items-center justify-between p-6 pb-4">
        <h3 class="text-lg font-semibold">Recent Leads</h3>
        <Button variant="outline" size="sm">
          View All
          <ArrowUpRight class="ml-1 size-3" />
        </Button>
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
                <Badge variant="secondary">{{ lead.status }}</Badge>
              </td>
              <td class="px-6 py-3 text-sm text-right font-medium">{{ lead.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
      <div class="flex flex-wrap gap-3">
        <Button variant="outline">
          <UserPlus class="size-4" />
          Add Lead
        </Button>
        <Button variant="outline">
          <Mail class="size-4" />
          Send Email
        </Button>
        <Button variant="outline">
          <Calendar class="size-4" />
          Schedule Meeting
        </Button>
        <Button variant="outline">
          <FileText class="size-4" />
          Create Document
        </Button>
        <Button variant="outline">
          <Phone class="size-4" />
          Log Call
        </Button>
      </div>
    </div>
  </div>
</template>
