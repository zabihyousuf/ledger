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
} from 'lucide-vue-next'
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

// ── Create flow dialog ──
const showCreateDialog = ref(false)
const createForm = ref({ name: '', description: '', trigger_type: 'manual' })

const triggerTypes = [
  { value: 'manual', label: 'Manual Trigger' },
  { value: 'lead_created', label: 'New Lead Created' },
  { value: 'deal_stage_changed', label: 'Deal Stage Changed' },
  { value: 'contact_added', label: 'Contact Added' },
  { value: 'scheduled', label: 'Scheduled (Cron)' },
  { value: 'webhook', label: 'Incoming Webhook' },
]

function openCreateDialog() {
  createForm.value = { name: '', description: '', trigger_type: 'manual' }
  showCreateDialog.value = true
}

async function handleCreate() {
  const flow = await createFlow({
    name: createForm.value.name,
    description: createForm.value.description || null,
    status: 'draft',
    trigger_type: createForm.value.trigger_type,
  })
  showCreateDialog.value = false
  if (flow) {
    router.push(`/flows/${flow.id}`)
  }
}

// ── Delete confirmation ──
const showDeleteConfirm = ref(false)
const deletingFlow = ref<Flow | null>(null)

function confirmDelete(flow: Flow) {
  deletingFlow.value = flow
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingFlow.value) return
  await deleteFlow(deletingFlow.value.id)
  showDeleteConfirm.value = false
  deletingFlow.value = null
}

// ── Duplicate ──
async function handleDuplicate(flow: Flow) {
  const newFlow = await duplicateFlow(flow.id)
  if (newFlow) {
    router.push(`/flows/${newFlow.id}`)
  }
}

// ── Toggle status ──
async function toggleStatus(flow: Flow) {
  const newStatus = flow.status === 'active' ? 'draft' : 'active'
  await updateFlow(flow.id, { status: newStatus })
  await fetchFlows()
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
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Flows</h2>
        <p class="text-muted-foreground">Build and manage your automation workflows.</p>
      </div>
      <Button @click="openCreateDialog">
        <Plus class="size-4 mr-1" />
        New Flow
      </Button>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
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
      <p class="text-muted-foreground mb-4">Create your first automation flow to get started.</p>
      <Button @click="openCreateDialog">
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
        @click="openCreateDialog"
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
            <Select v-model="createForm.trigger_type">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="t in triggerTypes" :key="t.value" :value="t.value">
                  {{ t.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCreateDialog = false">Cancel</Button>
          <Button :disabled="!createForm.name" @click="handleCreate">Create & Edit</Button>
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
          <Button variant="outline" @click="showDeleteConfirm = false">Cancel</Button>
          <Button variant="destructive" @click="handleDelete">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
