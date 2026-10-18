<template>
  <button
    :type="type"
    :class="classes"
    :title="label"
    :aria-label="label"
    :aria-pressed="active === undefined ? undefined : active"
    :disabled="disabled"
  >
    <component :is="icon" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";

const props = withDefaults(
  defineProps<{
    icon: Component;
    label: string;
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    type?: "button" | "submit";
    active?: boolean;
    disabled?: boolean;
  }>(),
  { variant: "ghost", size: "md", type: "button", active: undefined }
);

const classes = computed(() => [
  "btn btn-icon",
  `btn-${props.variant}`,
  props.size === "sm" && "btn-sm",
  props.size === "lg" && "btn-lg",
  props.active && "bg-soft text-ink",
]);
</script>
