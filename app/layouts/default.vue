<script setup lang="ts">
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <main class="flex-1 overflow-auto p-4 md:p-6">
        <slot />
      </main>
    </SidebarInset>
  </SidebarProvider>
  <Toaster position="bottom-right" :duration="3000" richColors />
</template>
