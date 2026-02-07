<script setup lang="ts">
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  DollarSign,
  Calendar,
  LayoutGrid,
  List,
  Loader2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Deal, DealInsert } from '~/composables/useDeals'

const { deals, loading, pipelineStages, fetchDeals, createDeal, updateDeal, deleteDeal } = useDeals()

onMounted(() => {
  fetchDeals()
})

// ── View mode ──
const viewMode = ref<'board' | 'table'>('board')

// ── Search ──
const searchQuery = ref('')

const filteredDeals = computed(() => {
  if (!searchQuery.value) return deals.value
  return deals.value.filter(deal =>
    deal.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (deal.notes || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// ── Kanban columns ──
const stages = [
  { key: 'prospecting', label: 'Prospecting', color: 'bg-blue-500' },
  { key: 'qualification', label: 'Qualification', color: 'bg-yellow-500' },
  { key: 'proposal', label: 'Proposal', color: 'bg-purple-500' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { key: 'closed_won', label: 'Closed Won', color: 'bg-green-500' },
  { key: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500' },
]

function dealsByStage(stageKey: string) {
  return filteredDeals.value.filter(d => d.stage === stageKey)
}

function stageTotal(stageKey: string) {
  return dealsByStage(stageKey).reduce((sum, d) => sum + Number(d.value || 0), 0)
}

// ── Drag & drop between stages ──
function onDragStart(e: DragEvent, dealId: string) {
  if (!e.dataTransfer) return
  e.dataTransfer.setData('text/plain', dealId)
  e.dataTransfer.effectAllowed = 'move'
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

async function onDrop(e: DragEvent, newStage: string) {
  e.preventDefault()
  const dealId = e.dataTransfer?.getData('text/plain')
  if (!dealId) return

  const deal = deals.value.find(d => d.id === dealId)
  if (!deal || deal.stage === newStage) return

  droppingDealId.value = dealId
  try {
    await updateDeal(dealId, { stage: newStage })
    const stageLabel = stages.find(s => s.key === newStage)?.label || newStage
    toast.success('Deal moved', {
      description: `"${deal.title}" moved to ${stageLabel}.`,
    })
  } catch (error) {
    toast.error('Failed to move deal')
  } finally {
    droppingDealId.value = null
  }
}

// ── Dialog state ──
const showDialog = ref(false)
const editingDeal = ref<Deal | null>(null)
const showDeleteConfirm = ref(false)
const deletingDeal = ref<Deal | null>(null)
const savingDeal = ref(false)
const deletingDealLoading = ref(false)
const droppingDealId = ref<string | null>(null)

const form = ref({
  title: '',
  value: 0,
  stage: 'prospecting',
  probability: undefined as number | undefined,
  expected_close_date: '',
  notes: '',
})

function openCreateDialog(stage?: string) {
  editingDeal.value = null
  form.value = {
    title: '',
    value: 0,
    stage: stage || 'prospecting',
    probability: undefined,
    expected_close_date: '',
    notes: '',
  }
  showDialog.value = true
}

function openEditDialog(deal: Deal) {
  editingDeal.value = deal
  form.value = {
    title: deal.title,
    value: deal.value,
    stage: deal.stage,
    probability: deal.probability ?? undefined,
    expected_close_date: deal.expected_close_date || '',
    notes: deal.notes || '',
  }
  showDialog.value = true
}

async function saveDeal() {
  if (savingDeal.value) return
  savingDeal.value = true
  try {
    const payload: DealInsert = {
      title: form.value.title,
      value: form.value.value,
      stage: form.value.stage,
      probability: form.value.probability ?? null,
      expected_close_date: form.value.expected_close_date || null,
      notes: form.value.notes || null,
    }

    if (editingDeal.value) {
      await updateDeal(editingDeal.value.id, payload)
      toast.success('Deal updated', {
        description: `"${payload.title}" has been saved.`,
      })
    } else {
      await createDeal(payload)
      toast.success('Deal created', {
        description: `"${payload.title}" has been added.`,
      })
    }
    showDialog.value = false
  } catch (error) {
    toast.error('Failed to save deal')
  } finally {
    savingDeal.value = false
  }
}

function confirmDelete(deal: Deal) {
  deletingDeal.value = deal
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingDeal.value || deletingDealLoading.value) return
  deletingDealLoading.value = true
  try {
    const title = deletingDeal.value.title
    await deleteDeal(deletingDeal.value.id)
    showDeleteConfirm.value = false
    deletingDeal.value = null
    toast.success('Deal deleted', {
      description: `"${title}" has been removed.`,
    })
  } catch (error) {
    toast.error('Failed to delete deal')
  } finally {
    deletingDealLoading.value = false
  }
}

function formatCurrency(val: number) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
  return `$${val.toLocaleString()}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Total pipeline value ──
const totalValue = computed(() => deals.value.reduce((sum, d) => sum + Number(d.value || 0), 0))
const totalDeals = computed(() => deals.value.length)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Deals</h2>
        <p class="text-muted-foreground">
          {{ totalDeals }} deals &middot; {{ formatCurrency(totalValue) }} total pipeline
        </p>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center rounded-md border border-border">
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :class="viewMode === 'board' ? 'bg-muted' : ''"
            @click="viewMode = 'board'"
          >
            <LayoutGrid class="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :class="viewMode === 'table' ? 'bg-muted' : ''"
            @click="viewMode = 'table'"
          >
            <List class="size-4" />
          </Button>
        </div>
        <Button @click="openCreateDialog()">
          <Plus class="size-4 mr-1" />
          Add Deal
        </Button>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-4 flex items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Search deals..." class="pl-9" />
      </div>
    </div>

    <!-- Board View -->
    <template v-if="viewMode === 'board'">
      <div class="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        <div
          v-for="stage in stages"
          :key="stage.key"
          class="w-72 shrink-0 rounded-xl border border-border bg-muted/30"
          @dragover="onDragOver"
          @drop="(e) => onDrop(e, stage.key)"
        >
          <!-- Column header -->
          <div class="flex items-center justify-between p-3 border-b border-border">
            <div class="flex items-center gap-2">
              <div :class="[stage.color, 'size-2.5 rounded-full']" />
              <h3 class="text-sm font-semibold">{{ stage.label }}</h3>
              <Badge variant="secondary" class="text-xs">{{ dealsByStage(stage.key).length }}</Badge>
            </div>
            <span class="text-xs text-muted-foreground font-medium">
              {{ formatCurrency(stageTotal(stage.key)) }}
            </span>
          </div>

          <!-- Cards -->
          <div class="p-2 space-y-2 min-h-[100px]">
            <div
              v-for="deal in dealsByStage(stage.key)"
              :key="deal.id"
              draggable="true"
              :class="[
                'rounded-lg border border-border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow',
                droppingDealId === deal.id ? 'opacity-50 pointer-events-none' : '',
              ]"
              @dragstart="(e) => onDragStart(e, deal.id)"
            >
              <div class="flex items-start justify-between mb-2">
                <p class="text-sm font-medium leading-tight">{{ deal.title }}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-6 w-6 shrink-0 -mr-1 -mt-1">
                      <MoreHorizontal class="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="openEditDialog(deal)">
                      <Pencil class="size-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem class="text-destructive" @click="confirmDelete(deal)">
                      <Trash2 class="size-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div class="flex items-center gap-3 text-xs text-muted-foreground">
                <span class="flex items-center gap-1 font-medium text-foreground">
                  <DollarSign class="size-3" />
                  {{ formatCurrency(deal.value) }}
                </span>
                <span v-if="deal.probability !== null" class="flex items-center gap-1">
                  {{ deal.probability }}%
                </span>
                <span v-if="deal.expected_close_date" class="flex items-center gap-1">
                  <Calendar class="size-3" />
                  {{ formatDate(deal.expected_close_date) }}
                </span>
              </div>
            </div>

            <!-- Add deal button -->
            <button
              class="w-full rounded-lg border-2 border-dashed border-border/60 p-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              @click="openCreateDialog(stage.key)"
            >
              <Plus class="size-3 inline mr-1" />
              Add Deal
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Table View -->
    <template v-else>
      <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                <th class="px-4 py-3 font-medium">Title</th>
                <th class="px-4 py-3 font-medium text-right">Value</th>
                <th class="px-4 py-3 font-medium">Stage</th>
                <th class="px-4 py-3 font-medium text-center">Probability</th>
                <th class="px-4 py-3 font-medium">Expected Close</th>
                <th class="px-4 py-3 font-medium">Notes</th>
                <th class="px-4 py-3 font-medium w-10" />
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" class="border-b border-border">
                <td colspan="7" class="px-4 py-8 text-center text-muted-foreground">Loading...</td>
              </tr>
              <tr v-else-if="filteredDeals.length === 0" class="border-b border-border">
                <td colspan="7" class="px-4 py-8 text-center text-muted-foreground">
                  {{ searchQuery ? 'No deals match your search.' : 'No deals yet. Create your first deal!' }}
                </td>
              </tr>
              <tr
                v-for="deal in filteredDeals"
                :key="deal.id"
                class="border-b border-border hover:bg-muted/30 transition-colors"
              >
                <td class="px-4 py-3 text-sm font-medium">{{ deal.title }}</td>
                <td class="px-4 py-3 text-sm font-medium text-right">{{ formatCurrency(deal.value) }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div :class="[stages.find(s => s.key === deal.stage)?.color || 'bg-gray-500', 'size-2 rounded-full']" />
                    <span class="text-sm capitalize">{{ deal.stage.replace('_', ' ') }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-center">
                  {{ deal.probability !== null ? `${deal.probability}%` : '-' }}
                </td>
                <td class="px-4 py-3 text-sm text-muted-foreground">
                  {{ deal.expected_close_date ? formatDate(deal.expected_close_date) : '-' }}
                </td>
                <td class="px-4 py-3 text-sm text-muted-foreground truncate max-w-[200px]">
                  {{ deal.notes || '-' }}
                </td>
                <td class="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon" class="h-8 w-8">
                        <MoreHorizontal class="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="openEditDialog(deal)">
                        <Pencil class="size-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem class="text-destructive" @click="confirmDelete(deal)">
                        <Trash2 class="size-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <p class="text-sm text-muted-foreground">
            {{ filteredDeals.length }} of {{ deals.length }} deal{{ deals.length !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>
    </template>

    <!-- Create/Edit Dialog -->
    <Dialog :open="showDialog" @update:open="showDialog = $event">
      <DialogContent class="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{{ editingDeal ? 'Edit Deal' : 'Create Deal' }}</DialogTitle>
          <DialogDescription>
            {{ editingDeal ? 'Update deal information.' : 'Fill in the details to create a new deal.' }}
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div>
            <label class="text-sm font-medium mb-1.5 block">Title *</label>
            <Input v-model="form.title" placeholder="Enterprise Package - Acme Corp" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium mb-1.5 block">Value ($) *</label>
              <Input v-model.number="form.value" type="number" placeholder="10000" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1.5 block">Stage</label>
              <Select v-model="form.stage">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="s in stages" :key="s.key" :value="s.key">
                    {{ s.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium mb-1.5 block">Probability (%)</label>
              <Input v-model.number="form.probability" type="number" placeholder="0-100" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1.5 block">Expected Close</label>
              <Input v-model="form.expected_close_date" type="date" />
            </div>
          </div>
          <div>
            <label class="text-sm font-medium mb-1.5 block">Notes</label>
            <Textarea v-model="form.notes" placeholder="Deal notes..." rows="3" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showDialog = false" :disabled="savingDeal">Cancel</Button>
          <Button :disabled="!form.title || !form.value || savingDeal" @click="saveDeal">
            <Loader2 v-if="savingDeal" class="size-4 mr-1 animate-spin" />
            {{ savingDeal ? 'Saving...' : (editingDeal ? 'Update' : 'Create') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation -->
    <Dialog :open="showDeleteConfirm" @update:open="showDeleteConfirm = $event">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Deal</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ deletingDeal?.title }}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteConfirm = false" :disabled="deletingDealLoading">Cancel</Button>
          <Button variant="destructive" :disabled="deletingDealLoading" @click="handleDelete">
            <Loader2 v-if="deletingDealLoading" class="size-4 mr-1 animate-spin" />
            {{ deletingDealLoading ? 'Deleting...' : 'Delete' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
