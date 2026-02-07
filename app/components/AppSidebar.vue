<script setup lang="ts">
import { Zap, PanelLeftClose, PanelLeftOpen, Bug, Loader2 } from 'lucide-vue-next'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'vue-sonner'

const { toggleSidebar, state } = useSidebar()
const navGroups = useCrmNavigation()
const route = useRoute()
const isHovered = ref(false)

// Bug report
const showBugDialog = ref(false)
const bugTitle = ref('')
const bugDescription = ref('')
const { submitReport, submitting } = useBugReports()

async function handleSubmitBug() {
  if (!bugTitle.value.trim()) return
  await submitReport(bugTitle.value.trim(), bugDescription.value.trim())
  bugTitle.value = ''
  bugDescription.value = ''
  showBugDialog.value = false
  toast.success('Bug report submitted', { description: 'Thanks for helping us improve.' })
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" tooltip="Ledger CRM">
            <div
              class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground cursor-pointer relative overflow-hidden"
              @mouseenter="isHovered = true"
              @mouseleave="isHovered = false"
              @click.prevent.stop="toggleSidebar()"
            >
              <Transition name="icon-swap" mode="out-in">
                <PanelLeftClose
                  v-if="isHovered && state === 'expanded'"
                  key="collapse"
                  class="size-4"
                />
                <PanelLeftOpen
                  v-else-if="isHovered && state === 'collapsed'"
                  key="expand"
                  class="size-4"
                />
                <Zap v-else key="brand" class="size-4" />
              </Transition>
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">Ledger CRM</span>
              <span class="truncate text-xs text-muted-foreground">
                Lead Generation
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup v-for="group in navGroups" :key="group.label">
        <SidebarGroupLabel>{{ group.label }}</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem v-for="item in group.items" :key="item.title">
            <SidebarMenuButton
              as-child
              :is-active="route.path === item.url || (item.url !== '/' && route.path.startsWith(item.url))"
            >
              <NuxtLink :to="item.url">
                <component :is="item.icon" />
                <span>{{ item.title }}</span>
              </NuxtLink>
            </SidebarMenuButton>
            <SidebarMenuBadge v-if="item.badge">
              {{ item.badge }}
            </SidebarMenuBadge>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Avatar class="size-8 rounded-lg">
              <AvatarFallback class="rounded-lg">U</AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">User</span>
              <span class="truncate text-xs text-muted-foreground">
                user@example.com
              </span>
            </div>
            <button
              class="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              @click.prevent.stop="showBugDialog = true"
              title="Report a bug"
            >
              <Bug class="size-3.5" />
            </button>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>

  <!-- Bug Report Dialog -->
  <Dialog :open="showBugDialog" @update:open="showBugDialog = $event">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Report a Bug</DialogTitle>
        <DialogDescription>
          Describe the issue you're experiencing. Page context is captured automatically.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="rounded-lg bg-muted/50 border border-border p-3">
          <p class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Auto-captured</p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span class="text-muted-foreground">Page: </span>
              <span class="font-medium">{{ route.path }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">Viewport: </span>
              <span class="font-medium">{{ typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : '' }}</span>
            </div>
          </div>
        </div>

        <div>
          <label class="text-sm font-medium mb-1.5 block">Title *</label>
          <Input v-model="bugTitle" placeholder="Brief summary of the issue" />
        </div>
        <div>
          <label class="text-sm font-medium mb-1.5 block">Description</label>
          <Textarea
            v-model="bugDescription"
            placeholder="Steps to reproduce, what you expected vs what happened..."
            rows="4"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="showBugDialog = false">Cancel</Button>
        <Button
          :disabled="!bugTitle.trim() || submitting"
          variant="destructive"
          @click="handleSubmitBug"
        >
          <Loader2 v-if="submitting" class="size-4 mr-1 animate-spin" />
          {{ submitting ? 'Submitting...' : 'Submit Report' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.icon-swap-enter-active,
.icon-swap-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.icon-swap-enter-from {
  opacity: 0;
  transform: scale(0.8);
}
.icon-swap-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
