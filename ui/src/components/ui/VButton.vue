<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <svg
      v-if="loading"
      class="animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
    <component :is="icon" v-else-if="icon" aria-hidden="true" />
    <slot />
    <component :is="iconRight" v-if="iconRight" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";

const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    type?: "button" | "submit" | "reset";
    icon?: Component;
    iconRight?: Component;
    loading?: boolean;
    disabled?: boolean;
    block?: boolean;
  }>(),
  { variant: "secondary", size: "md", type: "button" }
);

const classes = computed(() => [
  "btn",
  `btn-${props.variant}`,
  props.size === "sm" && "btn-sm",
  props.size === "lg" && "btn-lg",
  props.block && "w-full",
]);
</script>
