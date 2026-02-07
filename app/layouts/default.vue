<script setup lang="ts">
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header
        class="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
      >
        <h1 class="text-sm font-medium">
          <slot name="header-title">Dashboard</slot>
        </h1>
      </header>
      <main class="flex-1 overflow-auto p-4 md:p-6">
        <slot />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
