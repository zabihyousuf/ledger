<script setup lang="ts">
import {
  Bot,
  Plus,
  Sparkles,
  Mail,
  Database,
  Globe,
  FileOutput,
  Calendar,
  Target,
  Send,
  Clock,
  Video,
  ChevronLeft,
  Wrench,
  Save,
  Play,
  Trash2,
} from 'lucide-vue-next'

const selectedAgent = ref<number | null>(null)

const agents = ref([
  {
    id: 1,
    name: 'Lead Qualifier',
    description: 'Automatically scores and qualifies incoming leads based on company data and engagement signals.',
    status: 'active' as const,
    skills: ['Lead Qualification', 'Data Enrichment'],
    tools: ['CRM Database', 'Web Search'],
  },
  {
    id: 2,
    name: 'Email Outreach Bot',
    description: 'Crafts and sends personalized outreach emails to prospects based on their profile and interests.',
    status: 'active' as const,
    skills: ['Email Outreach', 'Follow-up Scheduler'],
    tools: ['Email', 'CRM Database'],
  },
  {
    id: 3,
    name: 'Meeting Scheduler',
    description: 'Coordinates meeting times between sales reps and prospects, handles timezone conversions.',
    status: 'inactive' as const,
    skills: ['Meeting Booking', 'Follow-up Scheduler'],
    tools: ['Calendar', 'Email'],
  },
  {
    id: 4,
    name: 'Data Enrichment Agent',
    description: 'Enriches contact records with company info, social profiles, and technology stack data.',
    status: 'active' as const,
    skills: ['Data Enrichment', 'Lead Qualification'],
    tools: ['Web Search', 'CRM Database', 'Document Generator'],
  },
])

const availableSkills = [
  { name: 'Lead Qualification', icon: Target, description: 'Score and qualify leads automatically' },
  { name: 'Email Outreach', icon: Send, description: 'Generate personalized email campaigns' },
  { name: 'Data Enrichment', icon: Database, description: 'Enrich records with external data' },
  { name: 'Follow-up Scheduler', icon: Clock, description: 'Schedule timely follow-up sequences' },
  { name: 'Meeting Booking', icon: Video, description: 'Coordinate and book meetings' },
]

const availableTools = [
  { name: 'Email', icon: Mail, description: 'Send and receive emails' },
  { name: 'Calendar', icon: Calendar, description: 'Access calendar events' },
  { name: 'CRM Database', icon: Database, description: 'Read/write CRM records' },
  { name: 'Web Search', icon: Globe, description: 'Search the internet' },
  { name: 'Document Generator', icon: FileOutput, description: 'Create documents and PDFs' },
]

const currentAgent = computed(() => agents.value.find(a => a.id === selectedAgent.value))
</script>

<template>
  <div>
    <!-- Grid View -->
    <template v-if="!selectedAgent">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">AI Agents</h2>
          <p class="text-muted-foreground">
            Create and manage your AI-powered automation agents.
          </p>
        </div>
        <Button>
          <Plus class="size-4" />
          New Agent
        </Button>
      </div>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="agent in agents"
          :key="agent.id"
          class="rounded-xl border border-border bg-card p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          @click="selectedAgent = agent.id"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="rounded-lg bg-muted p-2">
              <Bot class="size-5 text-muted-foreground" />
            </div>
            <Badge :variant="agent.status === 'active' ? 'default' : 'secondary'">
              {{ agent.status }}
            </Badge>
          </div>
          <h3 class="text-base font-semibold mb-1">{{ agent.name }}</h3>
          <p class="text-sm text-muted-foreground mb-4 line-clamp-2">{{ agent.description }}</p>
          <div class="flex items-center gap-4 text-xs text-muted-foreground">
            <span class="flex items-center gap-1">
              <Sparkles class="size-3" />
              {{ agent.skills.length }} skills
            </span>
            <span class="flex items-center gap-1">
              <Wrench class="size-3" />
              {{ agent.tools.length }} tools
            </span>
          </div>
        </div>

        <!-- Add Agent card -->
        <div
          class="rounded-xl border-2 border-dashed border-border bg-card/50 p-6 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer min-h-[200px]"
        >
          <div class="rounded-full bg-muted p-3 mb-3">
            <Plus class="size-5" />
          </div>
          <p class="text-sm font-medium">Create New Agent</p>
        </div>
      </div>
    </template>

    <!-- Detail View -->
    <template v-else-if="currentAgent">
      <button
        class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        @click="selectedAgent = null"
      >
        <ChevronLeft class="size-4" />
        Back to Agents
      </button>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Left: Agent config + Skills -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Config -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 class="text-lg font-semibold mb-4">Agent Configuration</h3>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium mb-1.5 block">Name</label>
                <Input :model-value="currentAgent.name" placeholder="Agent name" />
              </div>
              <div>
                <label class="text-sm font-medium mb-1.5 block">Description</label>
                <Input :model-value="currentAgent.description" placeholder="What does this agent do?" />
              </div>
              <div class="flex items-center justify-between pt-2">
                <div>
                  <p class="text-sm font-medium">Status</p>
                  <p class="text-xs text-muted-foreground">Enable or disable this agent</p>
                </div>
                <Badge
                  :variant="currentAgent.status === 'active' ? 'default' : 'secondary'"
                  class="cursor-pointer"
                >
                  {{ currentAgent.status === 'active' ? 'Active' : 'Inactive' }}
                </Badge>
              </div>
            </div>
          </div>

          <!-- Skills -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 class="text-lg font-semibold mb-1">Skills</h3>
            <p class="text-sm text-muted-foreground mb-4">
              Capabilities this agent can use to complete tasks.
            </p>
            <div class="space-y-2">
              <div
                v-for="skill in availableSkills"
                :key="skill.name"
                :class="[
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer',
                  currentAgent.skills.includes(skill.name)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50',
                ]"
              >
                <div class="rounded-md bg-muted p-2">
                  <component :is="skill.icon" class="size-4 text-muted-foreground" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">{{ skill.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ skill.description }}</p>
                </div>
                <Badge
                  v-if="currentAgent.skills.includes(skill.name)"
                  variant="default"
                >
                  Attached
                </Badge>
                <Badge v-else variant="outline">Add</Badge>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Tools + Actions -->
        <div class="space-y-6">
          <!-- Tools -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 class="text-lg font-semibold mb-1">Tools</h3>
            <p class="text-sm text-muted-foreground mb-4">
              External integrations available to this agent.
            </p>
            <div class="space-y-2">
              <div
                v-for="tool in availableTools"
                :key="tool.name"
                :class="[
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer',
                  currentAgent.tools.includes(tool.name)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50',
                ]"
              >
                <div class="rounded-md bg-muted p-2">
                  <component :is="tool.icon" class="size-4 text-muted-foreground" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">{{ tool.name }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ tool.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 class="text-sm font-semibold mb-3">Actions</h3>
            <div class="space-y-2">
              <Button class="w-full" size="sm">
                <Save class="size-4" />
                Save Changes
              </Button>
              <Button class="w-full" variant="outline" size="sm">
                <Play class="size-4" />
                Test Agent
              </Button>
              <Button class="w-full" variant="destructive" size="sm">
                <Trash2 class="size-4" />
                Delete Agent
              </Button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
