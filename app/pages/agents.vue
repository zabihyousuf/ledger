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
  Pencil,
  Store,
  Package,
  Link2,
  Check,
  Radio,
  MapPin,
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
  updateCampaign,
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
  Radio, TrendingUp, Package, Bot, Users,
  FileText: FileOutput, MapPin,
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

// ── Inline edit state ──
const editingName = ref(false)
const editingDescription = ref(false)
const nameInputRef = ref<HTMLInputElement | null>(null)
const descriptionInputRef = ref<HTMLTextAreaElement | null>(null)

// ── Marketplace state ──
const skillViewMode = ref<'attached' | 'marketplace'>('attached')
const toolViewMode = ref<'attached' | 'marketplace'>('attached')
const skillSearch = ref('')
const toolSearch = ref('')

// ── Composio marketplace ──
interface MarketplaceTool {
  id: string
  name: string
  description: string
  icon: string
  category: string
  source: 'composio' | 'built_in' | 'marketplace'
  connected: boolean
  tags: string[]
}

const composioTools = ref<MarketplaceTool[]>([])
const composioCategories = ref<string[]>([])
const composioLoading = ref(false)
const composioCategoryFilter = ref('all')
const composioSearch = ref('')

async function fetchComposioTools() {
  composioLoading.value = true
  try {
    const result = await $fetch('/api/marketplace/tools', {
      query: {
        category: composioCategoryFilter.value !== 'all' ? composioCategoryFilter.value : undefined,
        search: composioSearch.value || undefined,
      },
    }) as { tools: MarketplaceTool[]; categories: string[] }
    composioTools.value = result.tools
    composioCategories.value = result.categories
  } catch {
    composioTools.value = []
  } finally {
    composioLoading.value = false
  }
}

// Fetch on mode change
watch([toolViewMode, composioCategoryFilter], () => {
  if (toolViewMode.value === 'marketplace') {
    fetchComposioTools()
  }
})

// Debounced search for composio
let composioSearchTimeout: ReturnType<typeof setTimeout>
watch(composioSearch, () => {
  clearTimeout(composioSearchTimeout)
  composioSearchTimeout = setTimeout(() => {
    if (toolViewMode.value === 'marketplace') {
      fetchComposioTools()
    }
  }, 300)
})

// ── Skills marketplace (API-backed) ──
interface MarketplaceSkill {
  id: string
  name: string
  description: string
  icon: string
  category: string
  source: 'built_in' | 'marketplace'
  tags: string[]
}

const mpSkills = ref<MarketplaceSkill[]>([])
const mpSkillCategories = ref<string[]>([])
const mpSkillsLoading = ref(false)
const mpSkillCategoryFilter = ref('all')
const mpSkillSearch = ref('')

async function fetchMarketplaceSkills() {
  mpSkillsLoading.value = true
  try {
    const result = await $fetch('/api/marketplace/skills', {
      query: {
        category: mpSkillCategoryFilter.value !== 'all' ? mpSkillCategoryFilter.value : undefined,
        search: mpSkillSearch.value || undefined,
      },
    }) as { skills: MarketplaceSkill[]; categories: string[] }
    mpSkills.value = result.skills
    mpSkillCategories.value = result.categories
  } catch {
    mpSkills.value = []
  } finally {
    mpSkillsLoading.value = false
  }
}

// Fetch on skill marketplace mode change
watch([skillViewMode, mpSkillCategoryFilter], () => {
  if (skillViewMode.value === 'marketplace') {
    fetchMarketplaceSkills()
  }
})

// Debounced search for skill marketplace
let mpSkillSearchTimeout: ReturnType<typeof setTimeout>
watch(mpSkillSearch, () => {
  clearTimeout(mpSkillSearchTimeout)
  mpSkillSearchTimeout = setTimeout(() => {
    if (skillViewMode.value === 'marketplace') {
      fetchMarketplaceSkills()
    }
  }, 300)
})

// ── Assign to campaign dialog ──
const showAssignDialog = ref(false)
const assigningAgent = ref(false)
const selectedCampaignForAssign = ref<string | null>(null)

// ── Skills marketplace computed ──
const attachedSkills = computed(() => {
  if (!currentAgent.value) return []
  return availableSkills.value.filter(s => currentAgent.value?.skills?.includes(s.name))
})

const unattachedSkills = computed(() => {
  if (!currentAgent.value) return []
  return availableSkills.value.filter(s => !currentAgent.value?.skills?.includes(s.name))
})

const marketplaceSkills = computed(() => {
  const q = skillSearch.value.toLowerCase()
  let items = availableSkills.value
  if (q) {
    items = items.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
    )
  }
  return items
})

const skillCategories = computed(() => {
  const cats = new Set(skills.value.map(s => s.category).filter(Boolean))
  return Array.from(cats) as string[]
})

// ── Tools marketplace computed ──
const attachedTools = computed(() => {
  if (!currentAgent.value) return []
  return availableTools.value.filter(t => currentAgent.value?.tools?.includes(t.name))
})

const unattachedTools = computed(() => {
  if (!currentAgent.value) return []
  return availableTools.value.filter(t => !currentAgent.value?.tools?.includes(t.name))
})

const marketplaceTools = computed(() => {
  const q = toolSearch.value.toLowerCase()
  let items = availableTools.value
  if (q) {
    items = items.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q)
    )
  }
  return items
})

const toolCategories = computed(() => {
  const cats = new Set(tools.value.map(t => t.category).filter(Boolean))
  return Array.from(cats) as string[]
})

// ── Campaigns available for assignment ──
const assignableCampaigns = computed(() =>
  campaigns.value.filter(c => c.status !== 'running')
)

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

// ── Save config (name + description) — used by inline edit ──
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
      description: 'Changes have been saved.',
    })
  } catch (error) {
    toast.error('Failed to save configuration')
  } finally {
    savingConfig.value = false
  }
}

// ── Inline edit handlers ──
function startEditName() {
  editingName.value = true
  nextTick(() => {
    nameInputRef.value?.focus()
    nameInputRef.value?.select()
  })
}

function finishEditName() {
  editingName.value = false
  if (editName.value && editName.value !== currentAgent.value?.name) {
    saveConfig()
  }
}

function startEditDescription() {
  editingDescription.value = true
  nextTick(() => {
    descriptionInputRef.value?.focus()
  })
}

function finishEditDescription() {
  editingDescription.value = false
  if (editDescription.value !== (currentAgent.value?.description || '')) {
    saveConfig()
  }
}

// ── Test Agent (real API call) ──
const showTestResultDialog = ref(false)
const testResult = ref<any>(null)

async function handleTestAgent() {
  if (!currentAgent.value || testingAgent.value) return
  testingAgent.value = true
  try {
    const result = await $fetch(`/api/agents/${currentAgent.value.id}/test`, { method: 'POST' }) as any
    testResult.value = result
    showTestResultDialog.value = true
    if (result.success) {
      toast.success('Agent test passed', {
        description: result.testScenario?.summary || 'All checks passed.',
      })
    } else {
      toast.error('Agent test has issues', {
        description: result.testScenario?.summary || 'Some checks failed. See details.',
      })
    }
  } catch (error: any) {
    toast.error('Test failed', {
      description: error?.data?.message || error?.message || 'Could not reach test endpoint.',
    })
  } finally {
    testingAgent.value = false
  }
}

// ── Assign to Campaign ──
async function handleAssignToCampaign() {
  if (!currentAgent.value || !selectedCampaignForAssign.value || assigningAgent.value) return
  assigningAgent.value = true
  try {
    await updateCampaign(selectedCampaignForAssign.value, { agent_id: currentAgent.value.id })
    const campaignName = campaigns.value.find(c => c.id === selectedCampaignForAssign.value)?.name
    showAssignDialog.value = false
    selectedCampaignForAssign.value = null
    toast.success('Agent assigned', {
      description: `"${currentAgent.value.name}" assigned to "${campaignName}".`,
    })
  } catch (error) {
    toast.error('Failed to assign agent')
  } finally {
    assigningAgent.value = false
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

function formatCategory(cat: string) {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
</script>

<template>
  <div>
    <!-- Grid View -->
    <template v-if="!selectedAgent">
      <div class="rounded-xl border border-border bg-card px-8 py-7 shadow-sm mb-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground tracking-wide uppercase">Intelligence</p>
            <h2 class="text-2xl font-bold tracking-tight mt-1">AI Agents</h2>
            <p class="text-muted-foreground mt-1 text-sm">
              Create and manage your AI-powered automation agents.
            </p>
          </div>
          <Button @click="openCreateDialog()">
            <Plus class="size-4 mr-1" />
            New Agent
          </Button>
        </div>
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

      <!-- Agent header — inline editable name + description -->
      <div class="rounded-xl border border-border bg-card px-8 py-6 shadow-sm mb-6">
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-5 flex-1 min-w-0">
            <div class="rounded-xl bg-primary/10 p-3 mt-0.5">
              <Bot class="size-6 text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <!-- Inline-editable name -->
              <div class="flex items-center gap-3 mb-1">
                <div
                  v-if="editingName"
                  class="flex-1 max-w-md"
                >
                  <div class="flex items-center gap-2 rounded-lg border border-primary bg-background px-3 py-1.5 shadow-sm ring-2 ring-primary/20">
                    <input
                      ref="nameInputRef"
                      v-model="editName"
                      class="text-xl font-bold tracking-tight bg-transparent outline-none w-full"
                      placeholder="Agent name..."
                      @blur="finishEditName"
                      @keydown.enter="finishEditName"
                      @keydown.escape="editingName = false; editName = currentAgent.name"
                    />
                    <Loader2 v-if="savingConfig" class="size-4 animate-spin text-primary shrink-0" />
                    <Check v-else class="size-4 text-primary/60 shrink-0" />
                  </div>
                  <p class="text-[11px] text-muted-foreground mt-1 ml-1">Press Enter to save, Escape to cancel</p>
                </div>
                <div
                  v-else
                  class="group/name flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1 -ml-2 hover:bg-muted/50 transition-colors"
                  @click="startEditName"
                >
                  <h2 class="text-xl font-bold tracking-tight">{{ currentAgent.name }}</h2>
                  <Pencil class="size-3.5 text-muted-foreground/0 group-hover/name:text-muted-foreground/50 transition-colors shrink-0" />
                </div>
                <Badge :variant="currentAgent.status === 'active' ? 'default' : 'secondary'" class="capitalize shrink-0">
                  <span v-if="currentAgent.status === 'active'" class="relative flex size-1.5 mr-1">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span class="relative inline-flex rounded-full size-1.5 bg-green-500" />
                  </span>
                  {{ currentAgent.status }}
                </Badge>
              </div>
              <!-- Inline-editable description -->
              <div v-if="editingDescription" class="max-w-lg ml-0.5">
                <div class="rounded-lg border border-primary bg-background px-3 py-2 shadow-sm ring-2 ring-primary/20">
                  <textarea
                    ref="descriptionInputRef"
                    v-model="editDescription"
                    rows="2"
                    class="text-sm text-foreground bg-transparent outline-none w-full resize-none"
                    placeholder="Describe what this agent does..."
                    @blur="finishEditDescription"
                    @keydown.escape="editingDescription = false; editDescription = currentAgent.description || ''"
                  />
                </div>
                <p class="text-[11px] text-muted-foreground mt-1 ml-1">Click outside to save, Escape to cancel</p>
              </div>
              <div
                v-else
                class="group/desc flex items-center gap-2 cursor-pointer rounded-lg px-2 py-0.5 -ml-2 hover:bg-muted/50 transition-colors"
                @click="startEditDescription"
              >
                <p class="text-sm text-muted-foreground">{{ currentAgent.description || 'Click to add a description...' }}</p>
                <Pencil class="size-3 text-muted-foreground/0 group-hover/desc:text-muted-foreground/50 transition-colors shrink-0" />
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 ml-4">
            <Button variant="outline" size="sm" :disabled="togglingStatus" @click="toggleStatus">
              <Loader2 v-if="togglingStatus" class="size-4 mr-1 animate-spin" />
              <component v-else :is="currentAgent.status === 'active' ? Activity : Play" class="size-4 mr-1" />
              {{ togglingStatus ? 'Updating...' : (currentAgent.status === 'active' ? 'Deactivate' : 'Activate') }}
            </Button>
          </div>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Left: Skills + Activity -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Skills (with marketplace toggle) -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div class="flex items-center justify-between mb-1">
              <h3 class="text-lg font-semibold">Skills</h3>
              <div class="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <button
                  :class="[
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                    skillViewMode === 'attached'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  ]"
                  @click="skillViewMode = 'attached'"
                >
                  Attached ({{ attachedSkills.length }})
                </button>
                <button
                  :class="[
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1',
                    skillViewMode === 'marketplace'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  ]"
                  @click="skillViewMode = 'marketplace'"
                >
                  <Store class="size-3" />
                  Marketplace
                </button>
              </div>
            </div>

            <!-- Attached view -->
            <template v-if="skillViewMode === 'attached'">
              <p class="text-sm text-muted-foreground mb-4">
                Click to attach or detach skills from this agent.
              </p>
              <div v-if="availableSkills.length === 0" class="flex flex-col items-center py-6 text-center">
                <div class="size-10 rounded-full bg-muted flex items-center justify-center mb-2">
                  <Sparkles class="size-5 text-muted-foreground/40" />
                </div>
                <p class="text-sm text-muted-foreground">No skills available</p>
                <p class="text-xs text-muted-foreground/70 mt-1">Browse the marketplace to add skills</p>
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
                    <div class="flex items-center gap-1.5">
                      <p class="text-sm font-medium">{{ skill.name }}</p>
                      <Badge v-if="skill.source === 'marketplace'" variant="outline" class="text-[9px] px-1 py-0 h-3.5 border-amber-500/30 text-amber-600">
                        <Store class="size-2 mr-0.5" /> MP
                      </Badge>
                    </div>
                    <p class="text-xs text-muted-foreground truncate">{{ skill.description }}</p>
                  </div>
                  <div v-if="loadingSkillId === skill.id" class="shrink-0">
                    <Loader2 class="size-4 animate-spin text-primary" />
                  </div>
                  <Badge
                    v-else-if="currentAgent.skills?.includes(skill.name)"
                    :variant="hoveredSkillId === skill.id ? 'destructive' : 'default'"
                    class="text-xs transition-all duration-150 shrink-0"
                  >
                    {{ hoveredSkillId === skill.id ? 'Unattach' : 'Active' }}
                  </Badge>
                  <Badge v-else variant="outline" class="text-xs shrink-0">Add</Badge>
                </div>
              </div>
            </template>

            <!-- Marketplace view (API-backed) -->
            <template v-else>
              <div class="flex items-center gap-2 mb-3">
                <p class="text-sm text-muted-foreground flex-1">
                  Browse skills from the <span class="font-semibold text-foreground">Skills Marketplace</span> to enhance your agent.
                </p>
                <Badge variant="outline" class="text-[10px] shrink-0 border-violet-500/30 text-violet-600">
                  <Sparkles class="size-2.5 mr-0.5" /> Marketplace
                </Badge>
              </div>
              <!-- Search -->
              <div class="relative mb-3">
                <Search class="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input v-model="mpSkillSearch" placeholder="Search discovery, outreach, scoring..." class="pl-9" />
              </div>
              <!-- Category filter -->
              <div class="flex flex-wrap gap-1.5 mb-3">
                <Badge
                  :variant="mpSkillCategoryFilter === 'all' ? 'default' : 'secondary'"
                  class="text-[10px] cursor-pointer transition-colors"
                  @click="mpSkillCategoryFilter = 'all'"
                >
                  All
                </Badge>
                <Badge
                  v-for="cat in ['discovery', 'enrichment', 'qualification', 'outreach', 'operations', 'advanced']"
                  :key="cat"
                  :variant="mpSkillCategoryFilter === cat ? 'default' : 'secondary'"
                  class="text-[10px] cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors capitalize"
                  @click="mpSkillCategoryFilter = cat"
                >
                  {{ formatCategory(cat) }}
                </Badge>
              </div>
              <!-- Loading -->
              <div v-if="mpSkillsLoading" class="flex items-center justify-center py-8">
                <Loader2 class="size-5 animate-spin text-primary mr-2" />
                <span class="text-sm text-muted-foreground">Loading marketplace...</span>
              </div>
              <!-- No results -->
              <div v-else-if="mpSkills.length === 0" class="text-center py-6">
                <Search class="size-5 text-muted-foreground/30 mx-auto mb-2" />
                <p class="text-sm text-muted-foreground">No skills match your search</p>
              </div>
              <!-- Results -->
              <div v-else class="grid gap-2 md:grid-cols-2">
                <div
                  v-for="mpSkill in mpSkills"
                  :key="mpSkill.id"
                  :class="[
                    'flex items-center gap-3 rounded-lg border p-3 transition-all',
                    currentAgent.skills?.includes(mpSkill.name)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50 hover:border-primary/40',
                  ]"
                >
                  <div class="rounded-md bg-muted p-2">
                    <component :is="iconMap[mpSkill.icon] || Sparkles" class="size-4 text-muted-foreground" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <p class="text-sm font-medium">{{ mpSkill.name }}</p>
                      <Badge v-if="mpSkill.source === 'marketplace'" variant="outline" class="text-[9px] px-1 py-0 h-3.5 border-violet-500/30 text-violet-600">
                        <Store class="size-2 mr-0.5" /> MP
                      </Badge>
                    </div>
                    <p class="text-xs text-muted-foreground line-clamp-2">{{ mpSkill.description }}</p>
                    <div class="flex items-center gap-1.5 mt-1">
                      <Badge variant="secondary" class="text-[9px] capitalize">
                        {{ formatCategory(mpSkill.category) }}
                      </Badge>
                    </div>
                  </div>
                  <div class="shrink-0">
                    <div v-if="currentAgent.skills?.includes(mpSkill.name)">
                      <div class="size-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check class="size-3.5 text-primary" />
                      </div>
                    </div>
                    <Button
                      v-else
                      variant="outline"
                      size="sm"
                      class="h-7 text-[11px]"
                      @click="toggleSkill(mpSkill.id, mpSkill.name)"
                    >
                      <Plus class="size-3 mr-0.5" /> Add
                    </Button>
                  </div>
                </div>
              </div>
              <p class="text-[11px] text-muted-foreground text-center mt-3">
                {{ mpSkills.length }} skills shown · {{ mpSkillCategoryFilter === 'all' ? 'All categories' : formatCategory(mpSkillCategoryFilter) }}
              </p>
            </template>
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

        <!-- Right: Actions (top) + Tools + Performance -->
        <div class="space-y-6">
          <!-- Actions (moved to top, meaningful) -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 class="text-sm font-semibold mb-3">Actions</h3>
            <div class="space-y-2">
              <Button class="w-full" variant="outline" size="sm" :disabled="testingAgent" @click="handleTestAgent">
                <Loader2 v-if="testingAgent" class="size-4 mr-1 animate-spin" />
                <Zap v-else class="size-4 mr-1" />
                {{ testingAgent ? 'Testing...' : 'Test Agent' }}
              </Button>
              <Button class="w-full" variant="outline" size="sm" @click="showAssignDialog = true">
                <Link2 class="size-4 mr-1" />
                Assign to Campaign
              </Button>
              <Button class="w-full" variant="destructive" size="sm" @click="showDeleteConfirm = true">
                <Trash2 class="size-4 mr-1" />
                Delete Agent
              </Button>
            </div>
          </div>

          <!-- Tools (with marketplace toggle) -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div class="flex items-center justify-between mb-1">
              <h3 class="text-lg font-semibold">Tools</h3>
              <div class="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <button
                  :class="[
                    'px-2 py-1 rounded-md text-[11px] font-medium transition-all',
                    toolViewMode === 'attached'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  ]"
                  @click="toolViewMode = 'attached'"
                >
                  Installed ({{ attachedTools.length }})
                </button>
                <button
                  :class="[
                    'px-2 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1',
                    toolViewMode === 'marketplace'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  ]"
                  @click="toolViewMode = 'marketplace'"
                >
                  <Store class="size-3" />
                  Browse
                </button>
              </div>
            </div>

            <!-- Attached tools view -->
            <template v-if="toolViewMode === 'attached'">
              <p class="text-sm text-muted-foreground mb-4">
                Click to attach or detach integrations.
              </p>
              <div v-if="availableTools.length === 0" class="flex flex-col items-center py-6 text-center">
                <div class="size-10 rounded-full bg-muted flex items-center justify-center mb-2">
                  <Wrench class="size-5 text-muted-foreground/40" />
                </div>
                <p class="text-sm text-muted-foreground">No tools available</p>
                <p class="text-xs text-muted-foreground/70 mt-1">Browse the marketplace to add tools</p>
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
                    <div class="flex items-center gap-1.5">
                      <p class="text-sm font-medium">{{ tool.name }}</p>
                      <Badge v-if="tool.source === 'marketplace'" variant="outline" class="text-[9px] px-1 py-0 h-3.5 border-amber-500/30 text-amber-600">
                        <Store class="size-2 mr-0.5" /> MP
                      </Badge>
                    </div>
                    <p class="text-xs text-muted-foreground truncate">{{ tool.description }}</p>
                  </div>
                  <div v-if="loadingToolId === tool.id" class="shrink-0">
                    <Loader2 class="size-4 animate-spin text-primary" />
                  </div>
                  <Badge
                    v-else-if="currentAgent.tools?.includes(tool.name)"
                    :variant="hoveredToolId === tool.id ? 'destructive' : 'default'"
                    class="text-xs transition-all duration-150 shrink-0"
                  >
                    {{ hoveredToolId === tool.id ? 'Unattach' : 'Active' }}
                  </Badge>
                  <Badge v-else variant="outline" class="text-xs shrink-0">Add</Badge>
                </div>
              </div>
            </template>

            <!-- Marketplace tools view (Composio-powered) -->
            <template v-else>
              <div class="flex items-center gap-2 mb-3">
                <p class="text-sm text-muted-foreground flex-1">
                  Powered by <span class="font-semibold text-foreground">Composio</span> — 250+ integrations for AI agents.
                </p>
                <Badge variant="outline" class="text-[10px] shrink-0 border-emerald-500/30 text-emerald-600">
                  <Globe class="size-2.5 mr-0.5" /> Live Catalog
                </Badge>
              </div>
              <!-- Search -->
              <div class="relative mb-3">
                <Search class="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input v-model="composioSearch" placeholder="Search enrichment, email, scraping..." class="pl-9" />
              </div>
              <!-- Category filter -->
              <div class="flex flex-wrap gap-1.5 mb-3">
                <Badge
                  :variant="composioCategoryFilter === 'all' ? 'default' : 'secondary'"
                  class="text-[10px] cursor-pointer transition-colors"
                  @click="composioCategoryFilter = 'all'"
                >
                  All
                </Badge>
                <Badge
                  v-for="cat in ['enrichment', 'email', 'scraping', 'crm', 'social', 'intelligence', 'communication', 'search']"
                  :key="cat"
                  :variant="composioCategoryFilter === cat ? 'default' : 'secondary'"
                  class="text-[10px] cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors capitalize"
                  @click="composioCategoryFilter = cat"
                >
                  {{ formatCategory(cat) }}
                </Badge>
              </div>
              <!-- Loading -->
              <div v-if="composioLoading" class="flex items-center justify-center py-8">
                <Loader2 class="size-5 animate-spin text-primary mr-2" />
                <span class="text-sm text-muted-foreground">Loading marketplace...</span>
              </div>
              <!-- Results -->
              <div v-else-if="composioTools.length === 0" class="text-center py-6">
                <Search class="size-5 text-muted-foreground/30 mx-auto mb-2" />
                <p class="text-sm text-muted-foreground">No tools match your search</p>
              </div>
              <div v-else class="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                <div
                  v-for="mpTool in composioTools"
                  :key="mpTool.id"
                  :class="[
                    'flex items-center gap-3 rounded-lg border p-3 transition-all',
                    currentAgent.tools?.includes(mpTool.name)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50 hover:border-primary/40',
                  ]"
                >
                  <div class="rounded-md bg-muted p-2">
                    <component :is="iconMap[mpTool.icon] || Globe" class="size-4 text-muted-foreground" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <p class="text-sm font-medium">{{ mpTool.name }}</p>
                      <Badge variant="outline" class="text-[9px] px-1 py-0 h-3.5 border-emerald-500/30 text-emerald-600">
                        <Store class="size-2.5 mr-0.5" /> Composio
                      </Badge>
                    </div>
                    <p class="text-xs text-muted-foreground line-clamp-2">{{ mpTool.description }}</p>
                    <div class="flex items-center gap-1.5 mt-1">
                      <Badge variant="secondary" class="text-[9px] capitalize">
                        {{ formatCategory(mpTool.category) }}
                      </Badge>
                    </div>
                  </div>
                  <div class="shrink-0">
                    <div v-if="currentAgent.tools?.includes(mpTool.name)">
                      <div class="size-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check class="size-3.5 text-primary" />
                      </div>
                    </div>
                    <Button
                      v-else
                      variant="outline"
                      size="sm"
                      class="h-7 text-[11px]"
                      @click="toggleTool(mpTool.id, mpTool.name)"
                    >
                      <Plus class="size-3 mr-0.5" /> Install
                    </Button>
                  </div>
                </div>
              </div>
              <p class="text-[11px] text-muted-foreground text-center mt-3">
                {{ composioTools.length }} tools shown · Browse <a href="https://composio.dev" target="_blank" class="text-primary hover:underline">composio.dev</a> for full catalog
              </p>
            </template>
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

    <!-- Assign to Campaign Dialog -->
    <Dialog :open="showAssignDialog" @update:open="showAssignDialog = $event">
      <DialogContent class="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Assign to Campaign</DialogTitle>
          <DialogDescription>
            Select a campaign to assign "{{ currentAgent?.name }}" to. The agent will be used when the campaign runs.
          </DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <div v-if="assignableCampaigns.length === 0" class="text-center py-6">
            <div class="size-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
              <Radar class="size-5 text-muted-foreground/40" />
            </div>
            <p class="text-sm text-muted-foreground">No campaigns available</p>
            <p class="text-xs text-muted-foreground/70 mt-1">Create a campaign first in Discovery.</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="campaign in assignableCampaigns"
              :key="campaign.id"
              :class="[
                'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all',
                selectedCampaignForAssign === campaign.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50 hover:border-primary/40'
              ]"
              @click="selectedCampaignForAssign = campaign.id"
            >
              <div class="rounded-md bg-primary/10 p-2">
                <Target class="size-4 text-primary" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium">{{ campaign.name }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ campaign.target_industry }} · {{ campaign.target_region }}</p>
              </div>
              <div v-if="campaign.agent_id === currentAgent?.id" class="shrink-0">
                <Badge variant="default" class="text-[10px]">Current</Badge>
              </div>
              <div v-else-if="selectedCampaignForAssign === campaign.id" class="shrink-0">
                <div class="size-5 rounded-full bg-primary flex items-center justify-center">
                  <Check class="size-3 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showAssignDialog = false; selectedCampaignForAssign = null" :disabled="assigningAgent">
            Cancel
          </Button>
          <Button
            :disabled="!selectedCampaignForAssign || assigningAgent"
            @click="handleAssignToCampaign"
          >
            <Loader2 v-if="assigningAgent" class="size-4 mr-1 animate-spin" />
            <Link2 v-else class="size-4 mr-1" />
            {{ assigningAgent ? 'Assigning...' : 'Assign Agent' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Test Result Dialog -->
    <Dialog :open="showTestResultDialog" @update:open="showTestResultDialog = $event">
      <DialogContent class="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Zap class="size-5" />
            Agent Test Results
          </DialogTitle>
          <DialogDescription>
            {{ testResult?.testScenario?.summary || 'Test complete.' }}
          </DialogDescription>
        </DialogHeader>
        <div v-if="testResult" class="space-y-5 py-2">
          <!-- Overall Status -->
          <div :class="['rounded-xl border p-4', testResult.success ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5']">
            <div class="flex items-center gap-2.5 mb-1">
              <CheckCircle2 v-if="testResult.success" class="size-5 text-emerald-600" />
              <Activity v-else class="size-5 text-amber-600" />
              <span :class="['text-sm font-semibold', testResult.success ? 'text-emerald-700' : 'text-amber-700']">
                {{ testResult.success ? 'All Checks Passed' : 'Some Checks Need Attention' }}
              </span>
            </div>
            <p class="text-xs text-muted-foreground ml-7.5">
              {{ testResult.toolCount }} tool(s) · {{ testResult.skillCount }} skill(s)
            </p>
          </div>

          <!-- Test Scenario -->
          <div v-if="testResult.testScenario?.steps?.length > 0">
            <h4 class="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Sparkles class="size-4 text-primary" />
              What This Agent Can Do
            </h4>
            <div class="space-y-2">
              <div
                v-for="(step, i) in testResult.testScenario.steps"
                :key="i"
                class="flex items-start gap-2.5 rounded-lg border border-border p-3"
              >
                <div class="size-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span class="text-[10px] font-bold text-primary">{{ i + 1 }}</span>
                </div>
                <p class="text-sm text-foreground">{{ step }}</p>
              </div>
            </div>
          </div>

          <!-- Tool Results -->
          <div v-if="Object.keys(testResult.toolResults || {}).length > 0">
            <h4 class="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Wrench class="size-4" />
              Tool Verification
            </h4>
            <div class="space-y-1.5">
              <div
                v-for="(info, name) in testResult.toolResults"
                :key="name"
                class="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <CheckCircle2 v-if="info.ok" class="size-4 text-emerald-600 shrink-0" />
                <Activity v-else class="size-4 text-red-500 shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">{{ name }}</p>
                  <p class="text-[11px] text-muted-foreground">{{ info.capability || info.message }}</p>
                </div>
                <Badge :variant="info.ok ? 'default' : 'destructive'" class="text-[10px] shrink-0">
                  {{ info.ok ? 'Ready' : 'Missing' }}
                </Badge>
              </div>
            </div>
          </div>

          <!-- Skill Results -->
          <div v-if="Object.keys(testResult.skillResults || {}).length > 0">
            <h4 class="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Sparkles class="size-4" />
              Skills
            </h4>
            <div class="space-y-1.5">
              <div
                v-for="(info, name) in testResult.skillResults"
                :key="name"
                class="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <CheckCircle2 class="size-4 text-emerald-600 shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">{{ name }}</p>
                  <p class="text-[11px] text-muted-foreground">{{ info.capability }}</p>
                </div>
                <Badge variant="default" class="text-[10px] shrink-0">Active</Badge>
              </div>
            </div>
          </div>

          <!-- AI Providers -->
          <div v-if="testResult.aiProviders">
            <h4 class="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Brain class="size-4" />
              AI Providers
            </h4>
            <div class="space-y-1.5">
              <div
                v-for="(info, name) in testResult.aiProviders"
                :key="name"
                class="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <CheckCircle2 v-if="info.ok" class="size-4 text-emerald-600 shrink-0" />
                <Activity v-else class="size-4 text-muted-foreground shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">{{ name }}</p>
                  <p class="text-[11px] text-muted-foreground">{{ info.message }}</p>
                </div>
                <Badge :variant="info.ok ? 'default' : 'secondary'" class="text-[10px] shrink-0">
                  {{ info.ok ? 'Ready' : 'Not Set' }}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showTestResultDialog = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
