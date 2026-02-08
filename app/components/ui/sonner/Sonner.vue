<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner"
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon, XIcon } from "lucide-vue-next"
import { Toaster as Sonner } from "vue-sonner"
import { cn } from "@/lib/utils"

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    :class="cn('toaster group', props.class)"
    v-bind="props"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-4" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-4" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-4" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-4" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-4" />
    </template>
  </Sonner>
</template>

<style>
/* Ensure toasts always appear above sidebar and all other elements */
[data-sonner-toaster] {
  z-index: 99999 !important;
  position: fixed !important;
}

/* Sonner toast styles — Tailwind v4 OKLCH vars don't work in inline styles,
   so we set them here via CSS custom properties in the proper cascade */
:where([data-sonner-toaster]) {
  --normal-bg: oklch(0.995 0.002 85);
  --normal-text: oklch(0.17 0.02 265);
  --normal-border: oklch(0.90 0.01 85);
  --border-radius: 0.625rem;
  font-family: var(--font-sans) !important;
}

:where([data-sonner-toaster]) [data-sonner-toast] {
  --tw-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  box-shadow: var(--tw-shadow);
  border: 1px solid var(--normal-border);
  background: var(--normal-bg);
  color: var(--normal-text);
  border-radius: var(--border-radius);
  padding: 14px 16px;
  font-size: 14px;
  gap: 8px;
}

:where([data-sonner-toaster]) [data-sonner-toast] [data-title] {
  font-weight: 600;
  font-size: 13px;
  line-height: 1.4;
}

:where([data-sonner-toaster]) [data-sonner-toast] [data-description] {
  font-size: 12px;
  opacity: 0.72;
  line-height: 1.4;
}

:where([data-sonner-toaster]) [data-sonner-toast][data-type="success"] {
  --normal-bg: oklch(0.96 0.04 155);
  --normal-text: oklch(0.25 0.08 155);
  --normal-border: oklch(0.85 0.08 155);
}

:where([data-sonner-toaster]) [data-sonner-toast][data-type="error"] {
  --normal-bg: oklch(0.96 0.04 25);
  --normal-text: oklch(0.30 0.10 25);
  --normal-border: oklch(0.85 0.08 25);
}

:where([data-sonner-toaster]) [data-sonner-toast][data-type="warning"] {
  --normal-bg: oklch(0.96 0.06 85);
  --normal-text: oklch(0.30 0.08 75);
  --normal-border: oklch(0.85 0.08 75);
}

:where([data-sonner-toaster]) [data-sonner-toast][data-type="info"] {
  --normal-bg: oklch(0.96 0.03 265);
  --normal-text: oklch(0.25 0.06 265);
  --normal-border: oklch(0.85 0.05 265);
}

/* Dark mode */
.dark :where([data-sonner-toaster]) {
  --normal-bg: oklch(0.20 0.02 265);
  --normal-text: oklch(0.95 0.005 85);
  --normal-border: oklch(1 0 0 / 10%);
}

.dark :where([data-sonner-toaster]) [data-sonner-toast] {
  --tw-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dark :where([data-sonner-toaster]) [data-sonner-toast][data-type="success"] {
  --normal-bg: oklch(0.22 0.04 155);
  --normal-text: oklch(0.85 0.06 155);
  --normal-border: oklch(0.30 0.06 155);
}

.dark :where([data-sonner-toaster]) [data-sonner-toast][data-type="error"] {
  --normal-bg: oklch(0.22 0.04 25);
  --normal-text: oklch(0.85 0.06 25);
  --normal-border: oklch(0.30 0.06 25);
}
</style>
