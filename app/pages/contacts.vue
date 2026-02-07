<script setup lang="ts">
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  Building2,
} from 'lucide-vue-next'
import type { Contact, ContactInsert } from '~/composables/useContacts'

const { contacts, loading, fetchContacts, createContact, updateContact, deleteContact } = useContacts()

onMounted(() => {
  fetchContacts()
})

// ── Search ──
const searchQuery = ref('')
const companyFilter = ref<string>('all')

const companies = computed(() => {
  const set = new Set(contacts.value.map(c => c.company).filter(Boolean) as string[])
  return Array.from(set).sort()
})

const filteredContacts = computed(() => {
  return contacts.value.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase()
    const matchesSearch = !searchQuery.value ||
      fullName.includes(searchQuery.value.toLowerCase()) ||
      (contact.email || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (contact.company || '').toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesCompany = companyFilter.value === 'all' || contact.company === companyFilter.value

    return matchesSearch && matchesCompany
  })
})

// ── Sort ──
const sortBy = ref<'name' | 'created_at' | 'company'>('created_at')
const sortAsc = ref(false)

const sortedContacts = computed(() => {
  return [...filteredContacts.value].sort((a, b) => {
    let cmp = 0
    if (sortBy.value === 'name') {
      cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    } else if (sortBy.value === 'created_at') {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (sortBy.value === 'company') {
      cmp = (a.company || '').localeCompare(b.company || '')
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
const editingContact = ref<Contact | null>(null)
const showDeleteConfirm = ref(false)
const deletingContact = ref<Contact | null>(null)

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  company: '',
  position: '',
  linkedin_url: '',
  twitter_url: '',
  tags: '' as string,
  notes: '',
})

function openCreateDialog() {
  editingContact.value = null
  form.value = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    linkedin_url: '',
    twitter_url: '',
    tags: '',
    notes: '',
  }
  showDialog.value = true
}

function openEditDialog(contact: Contact) {
  editingContact.value = contact
  form.value = {
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    phone: contact.phone || '',
    company: contact.company || '',
    position: contact.position || '',
    linkedin_url: contact.linkedin_url || '',
    twitter_url: contact.twitter_url || '',
    tags: (contact.tags || []).join(', '),
    notes: contact.notes || '',
  }
  showDialog.value = true
}

async function saveContact() {
  const tagsArray = form.value.tags
    ? form.value.tags.split(',').map(t => t.trim()).filter(Boolean)
    : null

  const payload: ContactInsert = {
    first_name: form.value.first_name,
    last_name: form.value.last_name,
    email: form.value.email,
    phone: form.value.phone || null,
    company: form.value.company || null,
    position: form.value.position || null,
    linkedin_url: form.value.linkedin_url || null,
    twitter_url: form.value.twitter_url || null,
    tags: tagsArray,
    notes: form.value.notes || null,
  }

  if (editingContact.value) {
    await updateContact(editingContact.value.id, payload)
  } else {
    await createContact(payload)
  }
  showDialog.value = false
}

function confirmDelete(contact: Contact) {
  deletingContact.value = contact
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingContact.value) return
  await deleteContact(deletingContact.value.id)
  showDeleteConfirm.value = false
  deletingContact.value = null
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Contacts</h2>
        <p class="text-muted-foreground">View and manage your contact directory.</p>
      </div>
      <Button @click="openCreateDialog">
        <Plus class="size-4 mr-1" />
        Add Contact
      </Button>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Search contacts..." class="pl-9" />
      </div>
      <Select v-model="companyFilter">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="All Companies" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Companies</SelectItem>
          <SelectItem v-for="c in companies" :key="c" :value="c">{{ c }}</SelectItem>
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
              <th class="px-4 py-3 font-medium">Phone</th>
              <th class="px-4 py-3 font-medium cursor-pointer select-none" @click="toggleSort('company')">
                <span class="flex items-center gap-1">Company <ArrowUpDown class="size-3" /></span>
              </th>
              <th class="px-4 py-3 font-medium">Position</th>
              <th class="px-4 py-3 font-medium">Tags</th>
              <th class="px-4 py-3 font-medium">Links</th>
              <th class="px-4 py-3 font-medium cursor-pointer select-none" @click="toggleSort('created_at')">
                <span class="flex items-center gap-1">Added <ArrowUpDown class="size-3" /></span>
              </th>
              <th class="px-4 py-3 font-medium w-10" />
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="border-b border-border">
              <td colspan="9" class="px-4 py-8 text-center text-muted-foreground">Loading...</td>
            </tr>
            <tr v-else-if="sortedContacts.length === 0" class="border-b border-border">
              <td colspan="9" class="px-4 py-8 text-center text-muted-foreground">
                {{ searchQuery || companyFilter !== 'all' ? 'No contacts match your filters.' : 'No contacts yet. Add your first contact!' }}
              </td>
            </tr>
            <tr
              v-for="contact in sortedContacts"
              :key="contact.id"
              class="border-b border-border hover:bg-muted/30 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                    {{ getInitials(contact.first_name, contact.last_name) }}
                  </div>
                  <span class="text-sm font-medium">{{ contact.first_name }} {{ contact.last_name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-muted-foreground">{{ contact.email }}</td>
              <td class="px-4 py-3 text-sm text-muted-foreground">{{ contact.phone || '-' }}</td>
              <td class="px-4 py-3 text-sm text-muted-foreground">{{ contact.company || '-' }}</td>
              <td class="px-4 py-3 text-sm text-muted-foreground">{{ contact.position || '-' }}</td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <Badge
                    v-for="tag in (contact.tags || []).slice(0, 3)"
                    :key="tag"
                    variant="secondary"
                    class="text-xs"
                  >
                    {{ tag }}
                  </Badge>
                  <Badge
                    v-if="(contact.tags || []).length > 3"
                    variant="outline"
                    class="text-xs"
                  >
                    +{{ (contact.tags || []).length - 3 }}
                  </Badge>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <a
                    v-if="contact.linkedin_url"
                    :href="contact.linkedin_url"
                    target="_blank"
                    class="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Linkedin class="size-4" />
                  </a>
                  <a
                    v-if="contact.twitter_url"
                    :href="contact.twitter_url"
                    target="_blank"
                    class="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Twitter class="size-4" />
                  </a>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-muted-foreground">{{ formatDate(contact.created_at) }}</td>
              <td class="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8">
                      <MoreHorizontal class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="openEditDialog(contact)">
                      <Pencil class="size-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem class="text-destructive" @click="confirmDelete(contact)">
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
          {{ sortedContacts.length }} of {{ contacts.length }} contact{{ contacts.length !== 1 ? 's' : '' }}
        </p>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog :open="showDialog" @update:open="showDialog = $event">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ editingContact ? 'Edit Contact' : 'Add Contact' }}</DialogTitle>
          <DialogDescription>
            {{ editingContact ? 'Update contact information.' : 'Fill in the details to add a new contact.' }}
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium mb-1.5 block">First Name *</label>
              <Input v-model="form.first_name" placeholder="John" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1.5 block">Last Name *</label>
              <Input v-model="form.last_name" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label class="text-sm font-medium mb-1.5 block">Email *</label>
            <Input v-model="form.email" placeholder="john@example.com" type="email" />
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
          <div>
            <label class="text-sm font-medium mb-1.5 block">Position</label>
            <Input v-model="form.position" placeholder="CEO" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium mb-1.5 block">LinkedIn URL</label>
              <Input v-model="form.linkedin_url" placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label class="text-sm font-medium mb-1.5 block">Twitter URL</label>
              <Input v-model="form.twitter_url" placeholder="https://twitter.com/..." />
            </div>
          </div>
          <div>
            <label class="text-sm font-medium mb-1.5 block">Tags</label>
            <Input v-model="form.tags" placeholder="vip, enterprise, tech (comma separated)" />
          </div>
          <div>
            <label class="text-sm font-medium mb-1.5 block">Notes</label>
            <Textarea v-model="form.notes" placeholder="Additional notes..." rows="3" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showDialog = false">Cancel</Button>
          <Button :disabled="!form.first_name || !form.last_name || !form.email" @click="saveContact">
            {{ editingContact ? 'Update' : 'Create' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation -->
    <Dialog :open="showDeleteConfirm" @update:open="showDeleteConfirm = $event">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Contact</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ deletingContact?.first_name }} {{ deletingContact?.last_name }}"? This action cannot be undone.
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
