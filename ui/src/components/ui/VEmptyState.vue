<template>
  <div class="flex flex-col items-center justify-center px-6 py-12 text-center" :class="compact && 'py-6'">
    <div
      v-if="icon"
      class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-soft text-ink-subtle"
    >
      <component :is="icon" class="h-5 w-5" aria-hidden="true" />
    </div>
    <p class="text-sm font-medium text-ink">{{ title }}</p>
    <p v-if="description" class="mt-1 max-w-sm text-sm text-ink-muted">{{ description }}</p>
    <div v-if="$slots.default" class="mt-4 flex flex-wrap items-center justify-center gap-2">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";

defineProps<{ title: string; description?: string; icon?: Component; compact?: boolean }>();
</script>
