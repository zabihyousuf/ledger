<script setup lang="ts">
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  Loader2,
  Linkedin,
  Mail,
  MessageSquare,
  Copy,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Lead, LeadInsert } from '~/composables/useLeads'

const { leads, loading, fetchLeads, createLead, updateLead, deleteLead } = useLeads()

onMounted(() => {
  fetchLeads()
})

// ── Search & filters ──
const searchQuery = ref('')
const statusFilter = ref<string>('all')
const sourceFilter = ref<string>('all')

const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
const sources = ['website', 'referral', 'linkedin', 'cold_call', 'email', 'event', 'other']

const filteredLeads = computed(() => {
  return leads.value.filter(lead => {
    const matchesSearch = !searchQuery.value ||
      lead.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (lead.company || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesStatus = statusFilter.value === 'all' || lead.status === statusFilter.value
    const matchesSource = sourceFilter.value === 'all' || lead.source === sourceFilter.value

    return matchesSearch && matchesStatus && matchesSource
  })
})

// ── Sort ──
const sortBy = ref<'name' | 'created_at' | 'value' | 'score'>('created_at')
const sortAsc = ref(false)

const sortedLeads = computed(() => {
  return [...filteredLeads.value].sort((a, b) => {
    let cmp = 0
    if (sortBy.value === 'name') {
      cmp = a.name.localeCompare(b.name)
    } else if (sortBy.value === 'created_at') {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (sortBy.value === 'value') {
      cmp = (a.value || 0) - (b.value || 0)
    } else if (sortBy.value === 'score') {
      cmp = (a.score || 0) - (b.score || 0)
    }
    return sortAsc.value ? cmp : -cmp
  })
})

function toggleSort(col: typeof sortBy.value) {
  if (sortBy.value === col) {
    sortAsc.value = !sortAsc.value
  } else {
    sortBy.value = col
    sortAsc.value = true
  }
}

// ── Dialog state ──
const showDialog = ref(false)
const editingLead = ref<Lead | null>(null)
const showDeleteConfirm = ref(false)
const deletingLead = ref<Lead | null>(null)
const savingLead = ref(false)
const deletingLeadLoading = ref(false)

const form = ref({
  name: '',
  email: '',
  phone: '',
  company: '',
  position: '',
  status: 'new',
  source: 'website',
  score: undefined as number | undefined,
  value: undefined as number | undefined,
  notes: '',
})

function openCreateDialog() {
  editingLead.value = null
  form.value = {
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    status: 'new',
    source: 'website',
    score: undefined,
    value: undefined,
    notes: '',
  }
  showDialog.value = true
}

function openEditDialog(lead: Lead) {
  editingLead.value = lead
  form.value = {
    name: lead.name,
    email: lead.email || '',
    phone: lead.phone || '',
    company: lead.company || '',
    position: lead.position || '',
    status: lead.status,
    source: lead.source,
    score: lead.score ?? undefined,
    value: lead.value ?? undefined,
    notes: lead.notes || '',
  }
  showDialog.value = true
}

async function saveLead() {
  if (savingLead.value) return
  savingLead.value = true
  try {
    const payload: LeadInsert = {
      name: form.value.name,
      email: form.value.email || null,
      phone: form.value.phone || null,
      company: form.value.company || null,
      position: form.value.position || null,
      status: form.value.status,
      source: form.value.source,
      score: form.value.score ?? null,
      value: form.value.value ?? null,
      notes: form.value.notes || null,
    }

    if (editingLead.value) {
      await updateLead(editingLead.value.id, payload)
      toast.success('Lead updated', { description: `"${payload.name}" has been saved.` })
    } else {
      await createLead(payload)
      toast.success('Lead created', { description: `"${payload.name}" has been added.` })
    }
    showDialog.value = false
  } finally {
    savingLead.value = false
  }
}

function confirmDelete(lead: Lead) {
  deletingLead.value = lead
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingLead.value || deletingLeadLoading.value) return
  deletingLeadLoading.value = true
  try {
    const name = deletingLead.value.name
    await deleteLead(deletingLead.value.id)
    showDeleteConfirm.value = false
    deletingLead.value = null
    toast.success('Lead deleted', { description: `"${name}" has been removed.` })
  } finally {
    deletingLeadLoading.value = false
  }
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'qualified': return 'default'
    case 'closed_won': return 'default'
    case 'closed_lost': return 'destructive'
    case 'new': return 'secondary'
    default: return 'outline'
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Message generation ──
function generateMessage(lead: Lead, channel: 'linkedin' | 'email'): string {
  const name = lead.name.split(' ')[0]
  const company = lead.company || 'your company'

  if (channel === 'linkedin') {
    return `Hi ${name}, I came across your profile and was impressed by the work at ${company}. I'd love to connect and explore how we might be able to help ${company} achieve its goals. Looking forward to hearing from you!`
  }
  return `Hi ${name},\n\nI hope this message finds you well. I recently came across ${company} and wanted to reach out to see if there's an opportunity for us to collaborate.\n\nI'd love to schedule a brief call to discuss how we can help ${company} grow.\n\nBest regards`
}

async function copyMessageToClipboard(lead: Lead, channel: 'linkedin' | 'email') {
  const message = generateMessage(lead, channel)
  try {
    await navigator.clipboard.writeText(message)
    toast.success('Message copied to clipboard', {
      description: `${channel === 'linkedin' ? 'LinkedIn' : 'Email'} message for ${lead.name} is ready to paste.`,
    })
  } catch {
    toast.error('Failed to copy message')
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Leads</h2>
        <p class="text-muted-foreground">Manage and track your incoming leads.</p>
      </div>
      <Button @click="openCreateDialog">
        <Plus class="size-4 mr-1" />
        Add Lead
      </Button>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Search leads..." class="pl-9" />
      </div>
      <Select v-model="statusFilter">
        <SelectTrigger class="w-[160px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem v-for="s in statuses" :key="s" :value="s">
            {{ s.replace('_', ' ') }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Select v-model="sourceFilter">
        <SelectTrigger class="w-[160px]">
          <SelectValue placeholder="All Sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          <SelectItem v-for="s in sources" :key="s" :value="s">
            {{ s.replace('_', ' ') }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Table -->
    <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
              <th class="px-4 py-3 font-medium cursor-pointer select-none" @click="toggleSort('name')">
                <span class="flex items-center gap-1">Name <ArrowUpDown class="size-3" /></span>
              </th>
              <th class="px-4 py-3 font-medium">Email</th>
              <th class="px-4 py-3 font-medium">Company</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Source</th>
              <th class="px-4 py-3 font-medium cursor-pointer select-none" @click="toggleSort('score')">
                <span class="flex items-center gap-1">Score <ArrowUpDown class="size-3" /></span>
              </th>
              <th class="px-4 py-3 font-medium cursor-pointer select-none text-right" @click="toggleSort('value')">
                <span class="flex items-center gap-1 justify-end">Value <ArrowUpDown class="size-3" /></span>
              </th>
              <th class="px-4 py-3 font-medium cursor-pointer select-none" @click="toggleSort('created_at')">
                <span class="flex items-center gap-1">Created <ArrowUpDown class="size-3" /></span>
              </th>
              <th class="px-4 py-3 font-medium">Message</th>
              <th class="px-4 py-3 font-medium w-10" />
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="border-b border-border">
              <td colspan="10" class="px-4 py-8 text-center text-muted-foreground">Loading...</td>
            </tr>
            <tr v-else-if="sortedLeads.length === 0" class="border-b border-border">
              <td colspan="10" class="px-4 py-8 text-center text-muted-foreground">
                {{ searchQuery || statusFilter !== 'all' || sourceFilter !== 'all' ? 'No leads match your filters.' : 'No leads yet. Create your first lead!' }}
              </td>
            </tr>
            <tr
              v-for="lead in sortedLeads"
              :key="lead.id"
              class="border-b border-border hover:bg-muted/30 transition-colors"
            >
              <td class="px-4 py-3 text-sm font-medium">{{ lead.name }}</td>
              <td class="px-4 py-3 text-sm text-muted-foreground">{{ lead.email || '-' }}</td>
              <td class="px-4 py-3 text-sm text-muted-foreground">{{ lead.company || '-' }}</td>
              <td class="px-4 py-3">
                <Badge :variant="statusVariant(lead.status)" class="capitalize text-xs">
                  {{ lead.status.replace('_', ' ') }}
                </Badge>
              </td>
              <td class="px-4 py-3 text-sm text-muted-foreground capitalize">{{ lead.source.replace('_', ' ') }}</td>
              <td class="px-4 py-3 text-sm">
                <span v-if="lead.score !== null" class="font-medium">{{ lead.score }}</span>
                <span v-else class="text-muted-foreground">-</span>
              </td>
              <td class="px-4 py-3 text-sm text-right font-medium">
                {{ lead.value ? `$${lead.value.toLocaleString()}` : '-' }}
              </td>
              <td class="px-4 py-3 text-sm text-muted-foreground">{{ formatDate(lead.created_at) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7"
                    title="Copy LinkedIn message"
                    @click.stop="copyMessageToClipboard(lead, 'linkedin')"
                  >
                    <Linkedin class="size-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7"
                    title="Copy email message"
                    @click.stop="copyMessageToClipboard(lead, 'email')"
                  >
                    <Mail class="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </td>
              <td class="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8">
                      <MoreHorizontal class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="openEditDialog(lead)">
                      <Pencil class="size-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem class="text-destructive" @click="confirmDelete(lead)">
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
          {{ sortedLeads.length }} of {{ leads.length }} lead{{ leads.length !== 1 ? 's' : '' }}
        </p>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog :open="showDialog" @update:open="showDialog = $event">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ editingLead ? 'Edit Lead' : 'Create Lead' }}</DialogTitle>
          <DialogDescription>
            {{ editingLead ? 'Update the lead information below.' : 'Fill in the details to create a new lead.' }}
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium mb-1.5 block">Name *</label>
              <Input v-model="form.name" placeholder="John Doe" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1.5 block">Email</label>
              <Input v-model="form.email" placeholder="john@example.com" type="email" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium mb-1.5 block">Phone</label>
              <Input v-model="form.phone" placeholder="+1 234 567 890" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1.5 block">Company</label>
              <Input v-model="form.company" placeholder="Acme Inc" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium mb-1.5 block">Position</label>
              <Input v-model="form.position" placeholder="CEO" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1.5 block">Source</label>
              <Select v-model="form.source">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="s in sources" :key="s" :value="s">
                    {{ s.replace('_', ' ') }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="text-sm font-medium mb-1.5 block">Status</label>
              <Select v-model="form.status">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="s in statuses" :key="s" :value="s">
                    {{ s.replace('_', ' ') }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label class="text-sm font-medium mb-1.5 block">Score</label>
              <Input v-model.number="form.score" type="number" placeholder="0-100" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1.5 block">Value ($)</label>
              <Input v-model.number="form.value" type="number" placeholder="0" />
            </div>
          </div>
          <div>
            <label class="text-sm font-medium mb-1.5 block">Notes</label>
            <Textarea v-model="form.notes" placeholder="Additional notes..." rows="3" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showDialog = false" :disabled="savingLead">Cancel</Button>
          <Button :disabled="!form.name || savingLead" @click="saveLead">
            <Loader2 v-if="savingLead" class="size-4 mr-1 animate-spin" />
            {{ savingLead ? 'Saving...' : (editingLead ? 'Update' : 'Create') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog :open="showDeleteConfirm" @update:open="showDeleteConfirm = $event">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Lead</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ deletingLead?.name }}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteConfirm = false" :disabled="deletingLeadLoading">Cancel</Button>
          <Button variant="destructive" :disabled="deletingLeadLoading" @click="handleDelete">
            <Loader2 v-if="deletingLeadLoading" class="size-4 mr-1 animate-spin" />
            {{ deletingLeadLoading ? 'Deleting...' : 'Delete' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
