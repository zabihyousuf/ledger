<script setup lang="ts">
import {
  Plus,
  Workflow,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Play,
  Pause,
  Clock,
  Search,
  Loader2,
  Mail,
  Zap,
  GitBranch,
  Target,
  UserPlus,
  MessageSquare,
  Sparkles,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Flow } from '~/composables/useFlows'

const { flows, loading, fetchFlows, createFlow, deleteFlow, duplicateFlow, updateFlow } = useFlows()
const router = useRouter()

onMounted(() => {
  fetchFlows()
})

// ── Search ──
const searchQuery = ref('')
const statusFilter = ref<string>('all')

const filteredFlows = computed(() => {
  return flows.value.filter(flow => {
    const matchesSearch = !searchQuery.value ||
      flow.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (flow.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'all' || flow.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

// ── Flow templates (use cases) ──
const flowTemplates = [
  {
    name: 'Lead Nurture Sequence',
    description: 'Automated email drip campaign that warms up newly discovered leads over 2 weeks with personalized touchpoints.',
    icon: Mail,
    color: 'bg-green-500',
    trigger_type: 'lead_created',
    category: 'outreach',
  },
  {
    name: 'Discovery Follow-up',
    description: 'Automatically enrich and score leads from AI discovery campaigns, then route qualified ones to outreach.',
    icon: Sparkles,
    color: 'bg-indigo-500',
    trigger_type: 'lead_created',
    category: 'enrichment',
  },
  {
    name: 'Re-engagement Campaign',
    description: 'Win back cold leads that haven\'t responded in 30+ days with a fresh approach and new value proposition.',
    icon: Target,
    color: 'bg-amber-500',
    trigger_type: 'scheduled',
    category: 'outreach',
  },
  {
    name: 'Welcome & Onboarding',
    description: 'Multi-step welcome flow for new contacts: intro email → company overview → meeting request.',
    icon: UserPlus,
    color: 'bg-blue-500',
    trigger_type: 'contact_added',
    category: 'onboarding',
  },
  {
    name: 'Qualification Pipeline',
    description: 'Score leads based on engagement signals, branch qualified vs unqualified, and auto-assign to reps.',
    icon: GitBranch,
    color: 'bg-purple-500',
    trigger_type: 'lead_created',
    category: 'qualification',
  },
  {
    name: 'Meeting Scheduler',
    description: 'After a lead opens your email, wait for the right moment, then send a calendly link with a personalized note.',
    icon: Clock,
    color: 'bg-orange-500',
    trigger_type: 'webhook',
    category: 'outreach',
  },
]

// ── Create flow dialog ──
const showCreateDialog = ref(false)
const createForm = ref({ name: '', description: '', trigger_type: 'manual' })

const triggerTypes = [
  { value: 'manual', label: 'Manual Trigger', description: 'Trigger this flow manually from the UI or API' },
  { value: 'lead_created', label: 'New Lead Created', description: 'Automatically runs when a new lead is added to the system' },
  { value: 'contact_added', label: 'Contact Added', description: 'Automatically runs when a new contact is created' },
  { value: 'scheduled', label: 'Scheduled (Hourly)', description: 'Runs automatically every hour via background job' },
  { value: 'webhook', label: 'Incoming Webhook', description: 'Triggered by an external service via POST /api/flows/webhook' },
]

function openCreateDialog(template?: typeof flowTemplates[number]) {
  if (template) {
    createForm.value = {
      name: template.name,
      description: template.description,
      trigger_type: template.trigger_type,
    }
  } else {
    createForm.value = { name: '', description: '', trigger_type: 'manual' }
  }
  showCreateDialog.value = true
}

async function handleCreate() {
  if (creatingFlow.value) return
  creatingFlow.value = true
  try {
    const flow = await createFlow({
      name: createForm.value.name,
      description: createForm.value.description || null,
      status: 'draft',
      trigger_type: createForm.value.trigger_type,
    })
    showCreateDialog.value = false
    toast.success('Flow created', {
      description: `"${createForm.value.name}" is ready to edit.`,
    })
    if (flow) {
      router.push(`/flows/${flow.id}`)
    }
  } catch (error) {
    toast.error('Failed to create flow')
  } finally {
    creatingFlow.value = false
  }
}

// ── Loading states ──
const creatingFlow = ref(false)
const deletingFlowLoading = ref(false)
const duplicatingFlowId = ref<string | null>(null)
const togglingStatusId = ref<string | null>(null)

// ── Delete confirmation ──
const showDeleteConfirm = ref(false)
const deletingFlow = ref<Flow | null>(null)

function confirmDelete(flow: Flow) {
  deletingFlow.value = flow
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingFlow.value || deletingFlowLoading.value) return
  deletingFlowLoading.value = true
  try {
    const name = deletingFlow.value.name
    await deleteFlow(deletingFlow.value.id)
    showDeleteConfirm.value = false
    deletingFlow.value = null
    toast.success('Flow deleted', {
      description: `"${name}" has been removed.`,
    })
  } catch (error) {
    toast.error('Failed to delete flow')
  } finally {
    deletingFlowLoading.value = false
  }
}

// ── Duplicate ──
async function handleDuplicate(flow: Flow) {
  if (duplicatingFlowId.value) return
  duplicatingFlowId.value = flow.id
  try {
    const newFlow = await duplicateFlow(flow.id)
    toast.success('Flow duplicated', {
      description: `Copy of "${flow.name}" created.`,
    })
    if (newFlow) {
      router.push(`/flows/${newFlow.id}`)
    }
  } catch (error) {
    toast.error('Failed to duplicate flow')
  } finally {
    duplicatingFlowId.value = null
  }
}

// ── Toggle status ──
async function toggleStatus(flow: Flow) {
  if (togglingStatusId.value) return
  togglingStatusId.value = flow.id
  try {
    const newStatus = flow.status === 'active' ? 'draft' : 'active'
    await updateFlow(flow.id, { status: newStatus })
    await fetchFlows()
    toast.success(newStatus === 'active' ? 'Flow activated' : 'Flow deactivated', {
      description: `"${flow.name}" is now ${newStatus}.`,
    })
  } catch (error) {
    toast.error('Failed to update flow status')
  } finally {
    togglingStatusId.value = null
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'active': return 'default'
    case 'draft': return 'secondary'
    case 'paused': return 'outline'
    case 'error': return 'destructive'
    default: return 'secondary'
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="rounded-xl border border-border bg-card px-8 py-7 shadow-sm mb-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-muted-foreground tracking-wide uppercase">Automation</p>
          <h2 class="text-2xl font-bold tracking-tight mt-1">Flows</h2>
          <p class="text-muted-foreground mt-1 text-sm">Build outreach sequences, lead nurture campaigns, and automation pipelines.</p>
        </div>
        <Button @click="openCreateDialog()">
          <Plus class="size-4 mr-1" />
          New Flow
        </Button>
      </div>
    </div>

    <!-- Flow Templates -->
    <div class="mb-6">
      <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Start from a Template</h3>
      <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="template in flowTemplates"
          :key="template.name"
          class="rounded-xl border border-dashed border-border bg-card/50 p-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group"
          @click="openCreateDialog(template)"
        >
          <div class="flex items-center gap-3 mb-2">
            <div :class="[template.color, 'rounded-lg p-2 text-white']">
              <component :is="template.icon" class="size-4" />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold group-hover:text-primary transition-colors">{{ template.name }}</h4>
              <Badge variant="secondary" class="text-[9px] capitalize mt-0.5">{{ template.category }}</Badge>
            </div>
          </div>
          <p class="text-xs text-muted-foreground line-clamp-2">{{ template.description }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Flows</h3>
      </div>
      <div class="relative min-w-[200px] max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Search flows..." class="pl-9" />
      </div>
      <Select v-model="statusFilter">
        <SelectTrigger class="w-[140px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="paused">Paused</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Flow cards -->
    <div v-if="loading" class="text-center py-12 text-muted-foreground">Loading flows...</div>

    <div v-else-if="filteredFlows.length === 0 && flows.length === 0" class="text-center py-20">
      <div class="rounded-full bg-muted p-4 inline-block mb-4">
        <Workflow class="size-8 text-muted-foreground" />
      </div>
      <h3 class="text-lg font-semibold mb-1">No flows yet</h3>
      <p class="text-muted-foreground mb-4">Choose a template above or create a custom flow.</p>
      <Button @click="openCreateDialog()">
        <Plus class="size-4 mr-1" />
        Create Flow
      </Button>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="flow in filteredFlows"
        :key="flow.id"
        :to="`/flows/${flow.id}`"
        class="block"
      >
        <div class="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow h-full">
          <div class="flex items-start justify-between mb-3">
            <div class="rounded-lg bg-muted p-2">
              <Workflow class="size-5 text-muted-foreground" />
            </div>
            <div class="flex items-center gap-2" @click.prevent.stop>
              <Badge :variant="statusVariant(flow.status)" class="capitalize">
                {{ flow.status }}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-7 w-7">
                    <MoreHorizontal class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="router.push(`/flows/${flow.id}`)">
                    <Pencil class="size-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="handleDuplicate(flow)">
                    <Copy class="size-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="toggleStatus(flow)">
                    <component :is="flow.status === 'active' ? Pause : Play" class="size-4 mr-2" />
                    {{ flow.status === 'active' ? 'Deactivate' : 'Activate' }}
                  </DropdownMenuItem>
                  <DropdownMenuItem class="text-destructive" @click="confirmDelete(flow)">
                    <Trash2 class="size-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <h3 class="text-base font-semibold mb-1">{{ flow.name }}</h3>
          <p class="text-sm text-muted-foreground mb-4 line-clamp-2">
            {{ flow.description || 'No description' }}
          </p>
          <div class="flex items-center gap-3 text-xs text-muted-foreground">
            <span v-if="flow.trigger_type" class="capitalize flex items-center gap-1">
              <Workflow class="size-3" />
              {{ flow.trigger_type.replace('_', ' ') }}
            </span>
            <span class="flex items-center gap-1">
              <Clock class="size-3" />
              {{ formatDate(flow.updated_at) }}
            </span>
          </div>
        </div>
      </NuxtLink>

      <!-- New flow card -->
      <div
        class="rounded-xl border-2 border-dashed border-border bg-card/50 p-6 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer min-h-[200px]"
        @click="openCreateDialog()"
      >
        <div class="rounded-full bg-muted p-3 mb-3">
          <Plus class="size-5" />
        </div>
        <p class="text-sm font-medium">Create New Flow</p>
      </div>
    </div>

    <!-- Create Flow Dialog -->
    <Dialog :open="showCreateDialog" @update:open="showCreateDialog = $event">
      <DialogContent class="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Create New Flow</DialogTitle>
          <DialogDescription>Set up your automation workflow.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div>
            <label class="text-sm font-medium mb-1.5 block">Name *</label>
            <Input v-model="createForm.name" placeholder="Lead Nurture Sequence" />
          </div>
          <div>
            <label class="text-sm font-medium mb-1.5 block">Description</label>
            <Textarea v-model="createForm.description" placeholder="What does this flow do?" rows="2" />
          </div>
          <div>
            <label class="text-sm font-medium mb-1.5 block">Trigger Type</label>
            <div class="space-y-2">
              <div
                v-for="t in triggerTypes"
                :key="t.value"
                :class="[
                  'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all',
                  createForm.trigger_type === t.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50 hover:border-primary/40'
                ]"
                @click="createForm.trigger_type = t.value"
              >
                <div class="mt-0.5">
                  <div
                    :class="[
                      'size-4 rounded-full border-2 flex items-center justify-center transition-colors',
                      createForm.trigger_type === t.value ? 'border-primary' : 'border-muted-foreground/30'
                    ]"
                  >
                    <div v-if="createForm.trigger_type === t.value" class="size-2 rounded-full bg-primary" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">{{ t.label }}</p>
                  <p class="text-[11px] text-muted-foreground mt-0.5">{{ t.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCreateDialog = false" :disabled="creatingFlow">Cancel</Button>
          <Button :disabled="!createForm.name || creatingFlow" @click="handleCreate">
            <Loader2 v-if="creatingFlow" class="size-4 mr-1 animate-spin" />
            {{ creatingFlow ? 'Creating...' : 'Create & Edit' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation -->
    <Dialog :open="showDeleteConfirm" @update:open="showDeleteConfirm = $event">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Flow</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ deletingFlow?.name }}"? All nodes and connections will be removed. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteConfirm = false" :disabled="deletingFlowLoading">Cancel</Button>
          <Button variant="destructive" :disabled="deletingFlowLoading" @click="handleDelete">
            <Loader2 v-if="deletingFlowLoading" class="size-4 mr-1 animate-spin" />
            {{ deletingFlowLoading ? 'Deleting...' : 'Delete' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
