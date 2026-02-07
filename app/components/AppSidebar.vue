<script setup lang="ts">
import { Zap, PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
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

const { toggleSidebar, state } = useSidebar()
const navGroups = useCrmNavigation()
const route = useRoute()
const isHovered = ref(false)
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
              :is-active="route.path === item.url"
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
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
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
