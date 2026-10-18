<template>
  <div class="space-y-1.5">
    <div v-if="label || showValue" class="flex items-baseline justify-between gap-2 text-2xs">
      <span class="truncate text-ink-muted">{{ label }}</span>
      <span v-if="showValue" class="num shrink-0 text-ink-muted">
        <span :class="toneText">{{ formatNumber(value) }}</span>
        <template v-if="max > 0"> / {{ formatNumber(max) }}</template>
        <template v-else> / ∞</template>
      </span>
    </div>
    <div
      class="h-1 overflow-hidden rounded-full bg-soft"
      role="meter"
      :aria-label="label"
      :aria-valuenow="value"
      :aria-valuemin="0"
      :aria-valuemax="max > 0 ? max : undefined"
    >
      <div class="h-full rounded-full transition-[width] duration-base ease-standard" :class="toneBg" :style="{ width: `${ratio * 100}%` }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{ value: number; max: number; label?: string; showValue?: boolean }>(),
  { showValue: true }
);

const ratio = computed(() => (props.max > 0 ? Math.min(1, Math.max(0, props.value / props.max)) : 0));
const level = computed(() => (ratio.value >= 0.95 ? "danger" : ratio.value >= 0.8 ? "warning" : "accent"));
const toneBg = computed(() => ({ danger: "bg-danger", warning: "bg-warning", accent: "bg-accent" })[level.value]);
const toneText = computed(() => ({ danger: "text-danger", warning: "text-warning", accent: "text-ink" })[level.value]);

function formatNumber(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)}万`;
  return n.toLocaleString();
}
</script>
