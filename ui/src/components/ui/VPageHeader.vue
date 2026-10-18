<template>
  <header class="flex flex-wrap items-end justify-between gap-3 pb-5">
    <div class="min-w-0">
      <slot name="eyebrow" />
      <h1 class="truncate text-lg font-semibold text-ink">{{ title }}</h1>
      <p v-if="description" class="mt-0.5 text-sm text-ink-muted">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ title: string; description?: string }>();
</script>
