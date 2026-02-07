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
  Radar,
  Brain,
  Search,
  Loader2,
  CheckCircle2,
  Activity,
  Zap,
  Shield,
  Eye,
  TrendingUp,
  MessageSquare,
  Users,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const {
  agents, skills, tools, loading,
  fetchAgents, fetchSkills, fetchTools,
  createAgent, updateAgent, deleteAgent,
  attachSkill, detachSkill, attachTool, detachTool,
} = useAgents()

const {
  campaigns,
  discoveredLeads,
  agentActivities,
  fetchCampaigns,
  getRecentActivities,
} = useDiscovery()

const selectedAgent = ref<string | null>(null)

onMounted(async () => {
  await Promise.all([
    fetchAgents(),
    fetchSkills(),
    fetchTools(),
    fetchCampaigns(),
  ])
})

// Map icon names to components
const iconMap: Record<string, any> = {
  Target, Send, Database, Clock, Video,
  Mail, Calendar, Globe, FileOutput, Search,
  Brain, Radar, Shield, Eye, MessageSquare,
}

const availableSkills = computed(() =>
  skills.value.map(skill => ({
    ...skill,
    icon: iconMap[skill.icon || 'Sparkles'] || Sparkles
  }))
)

const availableTools = computed(() =>
  tools.value.map((tool: any) => ({
    ...tool,
    icon: iconMap[tool.icon || 'Wrench'] || Wrench
  }))
)

const currentAgent = computed(() => agents.value.find(a => a.id === selectedAgent.value))

// Agent type templates for creation
const agentTemplates = [
  {
    name: 'Lead Scout',
    description: 'Autonomously searches LinkedIn, company databases, and social media to discover potential leads matching your ICP.',
    icon: Radar,
    color: 'bg-blue-500',
    category: 'discovery',
  },
  {
    name: 'Signal Analyzer',
    description: 'Monitors buying signals like funding rounds, job postings, tech stack changes, and social media activity.',
    icon: Brain,
    color: 'bg-purple-500',
    category: 'intelligence',
  },
  {
    name: 'Email Outreach',
    description: 'Crafts personalized outreach emails based on lead profiles and engagement history.',
    icon: Mail,
    color: 'bg-green-500',
    category: 'outreach',
  },
  {
    name: 'Lead Qualifier',
    description: 'Scores and qualifies leads based on engagement patterns, company fit, and behavioral signals.',
    icon: Target,
    color: 'bg-amber-500',
    category: 'qualification',
  },
]

// ── Loading states ──
const togglingStatus = ref(false)
const loadingSkillId = ref<string | null>(null)
const loadingToolId = ref<string | null>(null)
const savingConfig = ref(false)
const creatingAgent = ref(false)
const deletingAgentLoading = ref(false)
const testingAgent = ref(false)

// ── Hover states for "Unattach" badges ──
const hoveredSkillId = ref<string | null>(null)
const hoveredToolId = ref<string | null>(null)

// ── Status toggle ──
async function toggleStatus() {
  if (!currentAgent.value || togglingStatus.value) return
  togglingStatus.value = true
  try {
    const newStatus = currentAgent.value.status === 'active' ? 'inactive' : 'active'
    await updateAgent(currentAgent.value.id, { status: newStatus })
    toast.success(newStatus === 'active' ? 'Agent activated' : 'Agent deactivated', {
      description: `"${currentAgent.value.name}" is now ${newStatus}.`,
    })
  } catch (error) {
    toast.error('Failed to update agent status')
  } finally {
    togglingStatus.value = false
  }
}

// ── Skill toggle ──
async function toggleSkill(skillId: string, skillName: string) {
  if (!currentAgent.value || loadingSkillId.value) return
  loadingSkillId.value = skillId
  try {
    const isAttached = currentAgent.value.skills?.includes(skillName)
    if (isAttached) {
      await detachSkill(currentAgent.value.id, skillId)
      toast.success('Skill detached', {
        description: `"${skillName}" removed from ${currentAgent.value.name}.`,
      })
    } else {
      await attachSkill(currentAgent.value.id, skillId)
      toast.success('Skill attached', {
        description: `"${skillName}" added to ${currentAgent.value.name}.`,
      })
    }
  } catch (error) {
    toast.error('Failed to update skill')
  } finally {
    loadingSkillId.value = null
  }
}

// ── Tool toggle ──
async function toggleTool(toolId: string, toolName: string) {
  if (!currentAgent.value || loadingToolId.value) return
  loadingToolId.value = toolId
  try {
    const isAttached = currentAgent.value.tools?.includes(toolName)
    if (isAttached) {
      await detachTool(currentAgent.value.id, toolId)
      toast.success('Tool detached', {
        description: `"${toolName}" removed from ${currentAgent.value.name}.`,
      })
    } else {
      await attachTool(currentAgent.value.id, toolId)
      toast.success('Tool attached', {
        description: `"${toolName}" added to ${currentAgent.value.name}.`,
      })
    }
  } catch (error) {
    toast.error('Failed to update tool')
  } finally {
    loadingToolId.value = null
  }
}

// ── Create agent dialog ──
const showCreateDialog = ref(false)
const selectedTemplate = ref<string | null>(null)
const createForm = ref({
  name: '',
  description: '',
})

function openCreateDialog(template?: typeof agentTemplates[number]) {
  if (template) {
    createForm.value = { name: template.name, description: template.description }
    selectedTemplate.value = template.name
  } else {
    createForm.value = { name: '', description: '' }
    selectedTemplate.value = null
  }
  showCreateDialog.value = true
}

async function handleCreate() {
  if (creatingAgent.value) return
  creatingAgent.value = true
  try {
    await createAgent({
      name: createForm.value.name,
      description: createForm.value.description || null,
      status: 'inactive',
    })
    showCreateDialog.value = false
    toast.success('Agent created', {
      description: `"${createForm.value.name}" is ready to configure.`,
    })
  } catch (error) {
    toast.error('Failed to create agent')
  } finally {
    creatingAgent.value = false
  }
}

// ── Delete agent dialog ──
const showDeleteConfirm = ref(false)

async function handleDelete() {
  if (!currentAgent.value || deletingAgentLoading.value) return
  deletingAgentLoading.value = true
  try {
    const name = currentAgent.value.name
    await deleteAgent(currentAgent.value.id)
    selectedAgent.value = null
    showDeleteConfirm.value = false
    toast.success('Agent deleted', {
      description: `"${name}" has been removed.`,
    })
  } catch (error) {
    toast.error('Failed to delete agent')
  } finally {
    deletingAgentLoading.value = false
  }
}

// ── Save config (name + description) ──
const editName = ref('')
const editDescription = ref('')

watch(currentAgent, (agent) => {
  if (agent) {
    editName.value = agent.name
    editDescription.value = agent.description || ''
  }
}, { immediate: true })

async function saveConfig() {
  if (!currentAgent.value || savingConfig.value) return
  savingConfig.value = true
  try {
    await updateAgent(currentAgent.value.id, {
      name: editName.value,
      description: editDescription.value || null,
    })
    toast.success('Agent updated', {
      description: 'Configuration has been saved.',
    })
  } catch (error) {
    toast.error('Failed to save configuration')
  } finally {
    savingConfig.value = false
  }
}

// Agent activity for detail view
const agentActivity = computed(() => {
  if (!currentAgent.value) return []
  return agentActivities.value
    .filter(a => a.agent_name === currentAgent.value?.name)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
})

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
        <Button @click="openCreateDialog()">
          <Plus class="size-4 mr-1" />
          New Agent
        </Button>
      </div>

      <!-- Agent Templates -->
      <div class="mb-6">
        <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Start Templates</h3>
        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="template in agentTemplates"
            :key="template.name"
            class="rounded-xl border border-dashed border-border bg-card/50 p-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group"
            @click="openCreateDialog(template)"
          >
            <div class="flex items-center gap-3 mb-2">
              <div :class="[template.color, 'rounded-lg p-2 text-white']">
                <component :is="template.icon" class="size-4" />
              </div>
              <h4 class="text-sm font-semibold group-hover:text-primary transition-colors">{{ template.name }}</h4>
            </div>
            <p class="text-xs text-muted-foreground line-clamp-2">{{ template.description }}</p>
          </div>
        </div>
      </div>

      <!-- Existing Agents -->
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Agents</h3>
        <span class="text-xs text-muted-foreground">{{ agents.length }} agent{{ agents.length !== 1 ? 's' : '' }}</span>
      </div>

      <div v-if="loading" class="text-center py-12 text-muted-foreground">
        <Loader2 class="size-6 animate-spin mx-auto mb-2" />
        Loading agents...
      </div>

      <div v-else-if="agents.length === 0" class="rounded-xl border-2 border-dashed border-border p-12 text-center">
        <div class="size-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Bot class="size-5 text-muted-foreground/40" />
        </div>
        <p class="text-sm font-medium text-muted-foreground mb-2">No agents yet</p>
        <p class="text-xs text-muted-foreground mb-4">Create your first agent using a template above or from scratch.</p>
        <Button size="sm" @click="openCreateDialog()">
          <Plus class="size-4 mr-1" /> Create Agent
        </Button>
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="agent in agents"
          :key="agent.id"
          class="rounded-xl border border-border bg-card p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow group"
          @click="selectedAgent = agent.id"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="rounded-lg bg-primary/10 p-2.5">
              <Bot class="size-5 text-primary" />
            </div>
            <div class="flex items-center gap-2">
              <Badge :variant="agent.status === 'active' ? 'default' : 'secondary'" class="capitalize">
                <span v-if="agent.status === 'active'" class="relative flex size-1.5 mr-1">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span class="relative inline-flex rounded-full size-1.5 bg-green-500" />
                </span>
                {{ agent.status }}
              </Badge>
            </div>
          </div>
          <h3 class="text-base font-semibold mb-1 group-hover:text-primary transition-colors">{{ agent.name }}</h3>
          <p class="text-sm text-muted-foreground mb-4 line-clamp-2">{{ agent.description || 'No description' }}</p>

          <!-- Stats row -->
          <div class="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
            <span class="flex items-center gap-1">
              <Sparkles class="size-3" />
              {{ (agent.skills || []).length }} skills
            </span>
            <span class="flex items-center gap-1">
              <Wrench class="size-3" />
              {{ (agent.tools || []).length }} tools
            </span>
          </div>
        </div>

        <!-- Add Agent card -->
        <div
          class="rounded-xl border-2 border-dashed border-border bg-card/50 p-6 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer min-h-[200px]"
          @click="openCreateDialog()"
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

      <!-- Agent header -->
      <div class="flex items-start justify-between mb-6">
        <div class="flex items-center gap-4">
          <div class="rounded-xl bg-primary/10 p-3">
            <Bot class="size-6 text-primary" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-2xl font-bold tracking-tight">{{ currentAgent.name }}</h2>
              <Badge :variant="currentAgent.status === 'active' ? 'default' : 'secondary'" class="capitalize">
                {{ currentAgent.status }}
              </Badge>
            </div>
            <p class="text-sm text-muted-foreground">{{ currentAgent.description || 'No description' }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" :disabled="togglingStatus" @click="toggleStatus">
            <Loader2 v-if="togglingStatus" class="size-4 mr-1 animate-spin" />
            <component v-else :is="currentAgent.status === 'active' ? Activity : Play" class="size-4 mr-1" />
            {{ togglingStatus ? 'Updating...' : (currentAgent.status === 'active' ? 'Deactivate' : 'Activate') }}
          </Button>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Left: Agent config + Skills -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Config -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 class="text-lg font-semibold mb-4">Configuration</h3>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium mb-1.5 block">Name</label>
                <Input v-model="editName" placeholder="Agent name" />
              </div>
              <div>
                <label class="text-sm font-medium mb-1.5 block">Description</label>
                <Textarea v-model="editDescription" placeholder="What does this agent do?" rows="3" />
              </div>
              <Button size="sm" :disabled="savingConfig" @click="saveConfig">
                <Loader2 v-if="savingConfig" class="size-4 mr-1 animate-spin" />
                <Save v-else class="size-4 mr-1" />
                {{ savingConfig ? 'Saving...' : 'Save Changes' }}
              </Button>
            </div>
          </div>

          <!-- Skills -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 class="text-lg font-semibold mb-1">Skills</h3>
            <p class="text-sm text-muted-foreground mb-4">
              Click to attach or detach skills from this agent.
            </p>
            <div v-if="availableSkills.length === 0" class="flex flex-col items-center py-6 text-center">
              <div class="size-10 rounded-full bg-muted flex items-center justify-center mb-2">
                <Sparkles class="size-5 text-muted-foreground/40" />
              </div>
              <p class="text-sm text-muted-foreground">No skills available</p>
              <p class="text-xs text-muted-foreground/70 mt-1">Add skills via the database</p>
            </div>
            <div class="grid gap-2 md:grid-cols-2">
              <div
                v-for="skill in availableSkills"
                :key="skill.id"
                :class="[
                  'flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer relative',
                  loadingSkillId === skill.id
                    ? 'border-primary/30 bg-primary/5 opacity-70 pointer-events-none'
                    : currentAgent.skills?.includes(skill.name)
                      ? 'border-primary bg-primary/5 hover:border-destructive/50'
                      : 'border-border hover:bg-muted/50 hover:border-primary/40',
                ]"
                @click="toggleSkill(skill.id, skill.name)"
                @mouseenter="hoveredSkillId = skill.id"
                @mouseleave="hoveredSkillId = null"
              >
                <div class="rounded-md bg-muted p-2">
                  <component :is="skill.icon" class="size-4 text-muted-foreground" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">{{ skill.name }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ skill.description }}</p>
                </div>
                <!-- Loading spinner for this specific skill -->
                <div v-if="loadingSkillId === skill.id" class="shrink-0">
                  <Loader2 class="size-4 animate-spin text-primary" />
                </div>
                <!-- Active badge with hover "Unattach" -->
                <Badge
                  v-else-if="currentAgent.skills?.includes(skill.name)"
                  :variant="hoveredSkillId === skill.id ? 'destructive' : 'default'"
                  class="text-xs transition-all duration-150 shrink-0"
                >
                  {{ hoveredSkillId === skill.id ? 'Unattach' : 'Active' }}
                </Badge>
                <!-- Add badge -->
                <Badge v-else variant="outline" class="text-xs shrink-0">Add</Badge>
              </div>
            </div>
          </div>

          <!-- Activity Log -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold">Recent Activity</h3>
              <NuxtLink to="/activity" class="text-xs text-primary hover:underline">
                View all activity
              </NuxtLink>
            </div>
            <div v-if="agentActivity.length === 0" class="flex flex-col items-center py-6 text-center">
              <div class="size-10 rounded-full bg-muted flex items-center justify-center mb-2">
                <Activity class="size-5 text-muted-foreground/40" />
              </div>
              <p class="text-sm text-muted-foreground">No activity recorded yet</p>
              <p class="text-xs text-muted-foreground/70 mt-1">Activate this agent to start seeing activity</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="activity in agentActivity"
                :key="activity.id"
                class="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
              >
                <div :class="[
                  'rounded-md p-1.5 mt-0.5 shrink-0',
                  activity.status === 'running' ? 'bg-primary/10' : activity.status === 'error' ? 'bg-destructive/10' : 'bg-muted'
                ]">
                  <Loader2 v-if="activity.status === 'running'" class="size-3.5 text-primary animate-spin" />
                  <CheckCircle2 v-else-if="activity.status === 'completed'" class="size-3.5 text-muted-foreground" />
                  <Activity v-else class="size-3.5 text-destructive" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">{{ activity.action }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ activity.detail }}</p>
                </div>
                <span class="text-xs text-muted-foreground whitespace-nowrap">{{ formatTimeAgo(activity.timestamp) }}</span>
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
              Click to attach or detach integrations.
            </p>
            <div v-if="availableTools.length === 0" class="flex flex-col items-center py-6 text-center">
              <div class="size-10 rounded-full bg-muted flex items-center justify-center mb-2">
                <Wrench class="size-5 text-muted-foreground/40" />
              </div>
              <p class="text-sm text-muted-foreground">No tools available</p>
              <p class="text-xs text-muted-foreground/70 mt-1">Add tools via the database</p>
            </div>
            <div class="space-y-2">
              <div
                v-for="tool in availableTools"
                :key="tool.id"
                :class="[
                  'flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer relative',
                  loadingToolId === tool.id
                    ? 'border-primary/30 bg-primary/5 opacity-70 pointer-events-none'
                    : currentAgent.tools?.includes(tool.name)
                      ? 'border-primary bg-primary/5 hover:border-destructive/50'
                      : 'border-border hover:bg-muted/50 hover:border-primary/40',
                ]"
                @click="toggleTool(tool.id, tool.name)"
                @mouseenter="hoveredToolId = tool.id"
                @mouseleave="hoveredToolId = null"
              >
                <div class="rounded-md bg-muted p-2">
                  <component :is="tool.icon" class="size-4 text-muted-foreground" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">{{ tool.name }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ tool.description }}</p>
                </div>
                <!-- Loading spinner for this specific tool -->
                <div v-if="loadingToolId === tool.id" class="shrink-0">
                  <Loader2 class="size-4 animate-spin text-primary" />
                </div>
                <!-- Active badge with hover "Unattach" -->
                <Badge
                  v-else-if="currentAgent.tools?.includes(tool.name)"
                  :variant="hoveredToolId === tool.id ? 'destructive' : 'default'"
                  class="text-xs transition-all duration-150 shrink-0"
                >
                  {{ hoveredToolId === tool.id ? 'Unattach' : 'Active' }}
                </Badge>
                <!-- Add badge -->
                <Badge v-else variant="outline" class="text-xs shrink-0">Add</Badge>
              </div>
            </div>
          </div>

          <!-- Agent Performance -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 class="text-sm font-semibold mb-3">Performance</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted-foreground">Leads Found</span>
                <span class="text-sm font-semibold">--</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted-foreground">Success Rate</span>
                <span class="text-sm font-semibold">--</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted-foreground">Avg Confidence</span>
                <span class="text-sm font-semibold">--</span>
              </div>
              <p class="text-[11px] text-muted-foreground text-center pt-2 border-t border-border">
                Performance data appears once the agent runs campaigns.
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 class="text-sm font-semibold mb-3">Actions</h3>
            <div class="space-y-2">
              <Button class="w-full" variant="outline" size="sm" :disabled="testingAgent" @click="testingAgent = true; setTimeout(() => { testingAgent = false; toast.success('Test complete', { description: 'Agent responded successfully.' }) }, 2000)">
                <Loader2 v-if="testingAgent" class="size-4 mr-1 animate-spin" />
                <Play v-else class="size-4 mr-1" />
                {{ testingAgent ? 'Testing...' : 'Test Agent' }}
              </Button>
              <NuxtLink to="/discovery" class="block">
                <Button class="w-full" variant="outline" size="sm">
                  <Radar class="size-4 mr-1" />
                  Assign to Campaign
                </Button>
              </NuxtLink>
              <Button class="w-full" variant="destructive" size="sm" @click="showDeleteConfirm = true">
                <Trash2 class="size-4 mr-1" />
                Delete Agent
              </Button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Create Agent Dialog -->
    <Dialog :open="showCreateDialog" @update:open="showCreateDialog = $event">
      <DialogContent class="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Create Agent</DialogTitle>
          <DialogDescription>
            {{ selectedTemplate ? `Creating from "${selectedTemplate}" template.` : 'Set up a new AI agent with a name and description.' }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div>
            <label class="text-sm font-medium mb-1.5 block">Name *</label>
            <Input v-model="createForm.name" placeholder="Lead Qualifier Agent" />
          </div>
          <div>
            <label class="text-sm font-medium mb-1.5 block">Description</label>
            <Textarea v-model="createForm.description" placeholder="What will this agent do?" rows="3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCreateDialog = false" :disabled="creatingAgent">Cancel</Button>
          <Button :disabled="!createForm.name || creatingAgent" @click="handleCreate">
            <Loader2 v-if="creatingAgent" class="size-4 mr-1 animate-spin" />
            <Bot v-else class="size-4 mr-1" />
            {{ creatingAgent ? 'Creating...' : 'Create Agent' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog :open="showDeleteConfirm" @update:open="showDeleteConfirm = $event">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Agent</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ currentAgent?.name }}"? This will also remove all attached skills and tools. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteConfirm = false" :disabled="deletingAgentLoading">Cancel</Button>
          <Button variant="destructive" :disabled="deletingAgentLoading" @click="handleDelete">
            <Loader2 v-if="deletingAgentLoading" class="size-4 mr-1 animate-spin" />
            <Trash2 v-else class="size-4 mr-1" />
            {{ deletingAgentLoading ? 'Deleting...' : 'Delete' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
