<script setup lang="ts">
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
  Eye,
  ArrowUpDown,
  FileText,
  Loader2,
  Upload,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { documents, loading, fetchDocuments, createDocument, deleteDocument, stats } = useDocuments()

onMounted(() => {
  fetchDocuments()
})

// ── Search & filters ──
const searchQuery = ref('')
const typeFilter = ref<string>('all')
const statusFilter = ref<string>('all')

const documentTypes = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'contract', label: 'Contract' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'report', label: 'Report' },
  { value: 'template', label: 'Template' },
]
const documentStatuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'signed', label: 'Signed' },
  { value: 'expired', label: 'Expired' },
]

const filteredDocuments = computed(() => {
  return documents.value.filter(doc => {
    const matchesSearch = !searchQuery.value ||
      doc.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (doc.notes || '').toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesType = typeFilter.value === 'all' || doc.type === typeFilter.value
    const matchesStatus = statusFilter.value === 'all' || doc.status === statusFilter.value

    return matchesSearch && matchesType && matchesStatus
  })
})

// ── Sort ──
const sortBy = ref<'name' | 'created_at' | 'updated_at' | 'type'>('updated_at')
const sortAsc = ref(false)

const sortedDocuments = computed(() => {
  return [...filteredDocuments.value].sort((a, b) => {
    let cmp = 0
    if (sortBy.value === 'name') {
      cmp = a.name.localeCompare(b.name)
    } else if (sortBy.value === 'created_at') {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (sortBy.value === 'updated_at') {
      cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    } else if (sortBy.value === 'type') {
      cmp = a.type.localeCompare(b.type)
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

// ── Upload dialog ──
const showUploadDialog = ref(false)
const savingDocument = ref(false)

const uploadForm = ref({
  name: '',
  type: 'proposal',
  description: '',
})

function openUploadDialog() {
  uploadForm.value = {
    name: '',
    type: 'proposal',
    description: '',
  }
  showUploadDialog.value = true
}

async function handleUpload() {
  if (savingDocument.value) return
  savingDocument.value = true
  try {
    await createDocument({
      name: uploadForm.value.name,
      type: uploadForm.value.type.toLowerCase(),
      status: 'draft',
      notes: uploadForm.value.description || null,
    })
    showUploadDialog.value = false
    toast.success('Document uploaded', { description: `"${uploadForm.value.name}" has been added to your documents.` })
  } catch (error) {
    toast.error('Failed to upload document')
  } finally {
    savingDocument.value = false
  }
}

// ── Delete confirmation ──
const showDeleteConfirm = ref(false)
const deletingDoc = ref<(typeof documents.value)[number] | null>(null)
const deletingDocumentLoading = ref(false)

function confirmDelete(doc: (typeof documents.value)[number]) {
  deletingDoc.value = doc
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingDoc.value || deletingDocumentLoading.value) return
  deletingDocumentLoading.value = true
  try {
    const name = deletingDoc.value.name
    await deleteDocument(deletingDoc.value.id)
    showDeleteConfirm.value = false
    deletingDoc.value = null
    toast.success('Document deleted', { description: `"${name}" has been removed.` })
  } catch (error) {
    toast.error('Failed to delete document')
  } finally {
    deletingDocumentLoading.value = false
  }
}

// ── Helpers ──
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status.toLowerCase()) {
    case 'signed': return 'default'
    case 'sent': return 'secondary'
    case 'draft': return 'outline'
    case 'expired': return 'destructive'
    default: return 'secondary'
  }
}

function typeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'proposal': return 'bg-blue-500'
    case 'contract': return 'bg-purple-500'
    case 'invoice': return 'bg-emerald-500'
    case 'report': return 'bg-amber-500'
    case 'template': return 'bg-gray-500'
    default: return 'bg-gray-500'
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 KB'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Documents</h2>
        <p class="text-sm text-muted-foreground">Manage proposals, contracts, and shared files.</p>
      </div>
      <Button @click="openUploadDialog">
        <Upload class="size-4 mr-1" />
        Upload Document
      </Button>
    </div>

    <!-- Stats row -->
    <div class="grid gap-4 md:grid-cols-3 mb-6">
      <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Total Documents</span>
          <FileText class="size-4 text-muted-foreground" />
        </div>
        <p class="text-2xl font-bold mt-1">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Signed</span>
          <div class="size-2 rounded-full bg-emerald-500" />
        </div>
        <p class="text-2xl font-bold mt-1">{{ stats.signed }}</p>
      </div>
      <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Drafts</span>
          <div class="size-2 rounded-full bg-amber-500" />
        </div>
        <p class="text-2xl font-bold mt-1">{{ stats.drafts }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Search documents..." class="pl-9" />
      </div>
      <Select v-model="typeFilter">
        <SelectTrigger class="w-[160px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem v-for="t in documentTypes" :key="t.value" :value="t.value">{{ t.label }}</SelectItem>
        </SelectContent>
      </Select>
      <Select v-model="statusFilter">
        <SelectTrigger class="w-[160px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem v-for="s in documentStatuses" :key="s.value" :value="s.value">{{ s.label }}</SelectItem>
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
              <th class="px-4 py-3 font-medium cursor-pointer select-none" @click="toggleSort('type')">
                <span class="flex items-center gap-1">Type <ArrowUpDown class="size-3" /></span>
              </th>
              <th class="px-4 py-3 font-medium">Notes</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium cursor-pointer select-none" @click="toggleSort('created_at')">
                <span class="flex items-center gap-1">Created <ArrowUpDown class="size-3" /></span>
              </th>
              <th class="px-4 py-3 font-medium cursor-pointer select-none" @click="toggleSort('updated_at')">
                <span class="flex items-center gap-1">Last Modified <ArrowUpDown class="size-3" /></span>
              </th>
              <th class="px-4 py-3 font-medium w-10" />
            </tr>
          </thead>
          <tbody>
            <tr v-if="sortedDocuments.length === 0" class="border-b border-border">
              <td colspan="7" class="px-4 py-16 text-center">
                <div class="flex flex-col items-center">
                  <div class="rounded-full bg-muted p-4 mb-4">
                    <FileText class="size-8 text-muted-foreground" />
                  </div>
                  <h3 class="text-base font-semibold mb-1 text-muted-foreground">No documents found</h3>
                  <p class="text-sm text-muted-foreground max-w-sm">
                    {{ searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                      ? 'No documents match your current filters. Try adjusting your search or filter criteria.'
                      : 'Upload your first document to get started.' }}
                  </p>
                  <Button
                    v-if="searchQuery || typeFilter !== 'all' || statusFilter !== 'all'"
                    variant="outline"
                    size="sm"
                    class="mt-4"
                    @click="searchQuery = ''; typeFilter = 'all'; statusFilter = 'all'"
                  >
                    Clear Filters
                  </Button>
                  <Button
                    v-else
                    size="sm"
                    class="mt-4"
                    @click="openUploadDialog"
                  >
                    <Upload class="size-4 mr-1" />
                    Upload Document
                  </Button>
                </div>
              </td>
            </tr>
            <tr
              v-for="doc in sortedDocuments"
              :key="doc.id"
              class="border-b border-border hover:bg-muted/30 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="shrink-0 rounded-lg bg-muted p-2">
                    <FileText class="size-4 text-muted-foreground" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium truncate max-w-[300px]">{{ doc.name }}</p>
                    <p class="text-xs text-muted-foreground truncate max-w-[300px]">{{ formatSize(doc.size) }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div :class="[typeColor(doc.type), 'size-2 rounded-full']" />
                  <span class="text-sm capitalize">{{ doc.type }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="min-w-0">
                  <p class="text-sm text-muted-foreground truncate max-w-[200px]">{{ doc.notes || '—' }}</p>
                </div>
              </td>
              <td class="px-4 py-3">
                <Badge :variant="statusVariant(doc.status)" class="text-xs capitalize">
                  {{ doc.status }}
                </Badge>
              </td>
              <td class="px-4 py-3 text-sm text-muted-foreground">{{ formatDate(doc.created_at) }}</td>
              <td class="px-4 py-3 text-sm text-muted-foreground">{{ formatDate(doc.updated_at) }}</td>
              <td class="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8">
                      <MoreHorizontal class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye class="size-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download class="size-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Pencil class="size-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem class="text-destructive" @click="confirmDelete(doc)">
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
      <div
        v-if="sortedDocuments.length > 0"
        class="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30"
      >
        <p class="text-sm text-muted-foreground">
          {{ sortedDocuments.length }} of {{ documents.length }} document{{ documents.length !== 1 ? 's' : '' }}
        </p>
      </div>
    </div>

    <!-- Upload Document Dialog -->
    <Dialog :open="showUploadDialog" @update:open="showUploadDialog = $event">
      <DialogContent class="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Add a new document to your library. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div>
            <label class="text-sm font-medium mb-1.5 block">Document Name *</label>
            <Input v-model="uploadForm.name" placeholder="e.g. Q1 Proposal - Client Name" />
          </div>
          <div>
            <label class="text-sm font-medium mb-1.5 block">Type</label>
            <Select v-model="uploadForm.type">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="t in documentTypes" :key="t.value" :value="t.value">{{ t.label }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label class="text-sm font-medium mb-1.5 block">Description</label>
            <Textarea v-model="uploadForm.description" placeholder="Brief description of the document..." rows="3" />
          </div>
          <!-- Mock file drop zone -->
          <div class="rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
            <Upload class="size-8 text-muted-foreground mx-auto mb-2" />
            <p class="text-sm font-medium text-muted-foreground">
              Click to upload or drag and drop
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              PDF, DOCX, XLSX up to 25MB
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showUploadDialog = false" :disabled="savingDocument">Cancel</Button>
          <Button :disabled="!uploadForm.name || savingDocument" @click="handleUpload">
            <Loader2 v-if="savingDocument" class="size-4 mr-1 animate-spin" />
            {{ savingDocument ? 'Uploading...' : 'Upload' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation -->
    <Dialog :open="showDeleteConfirm" @update:open="showDeleteConfirm = $event">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Document</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ deletingDoc?.name }}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteConfirm = false" :disabled="deletingDocumentLoading">Cancel</Button>
          <Button variant="destructive" :disabled="deletingDocumentLoading" @click="handleDelete">
            <Loader2 v-if="deletingDocumentLoading" class="size-4 mr-1 animate-spin" />
            {{ deletingDocumentLoading ? 'Deleting...' : 'Delete' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
