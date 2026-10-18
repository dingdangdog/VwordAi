<template>
  <span :class="['badge', tone !== 'neutral' && `badge-${tone}`]">
    <span v-if="dot" class="status-dot" :class="pulse && 'animate-pulse-dot'" aria-hidden="true" />
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info" | "live";
    dot?: boolean;
    pulse?: boolean;
  }>(),
  { tone: "neutral" }
);
</script>
