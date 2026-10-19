<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="inline-flex items-center gap-0.5 rounded-md border border-line bg-soft p-0.5"
    :class="block && 'flex w-full'"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      role="radio"
      :aria-checked="option.value === modelValue"
      :title="option.title || (iconOnly ? option.label : undefined)"
      :aria-label="iconOnly ? option.label : undefined"
      :disabled="option.disabled"
      class="inline-flex items-center justify-center gap-1.5 rounded-[5px] font-medium transition-colors duration-fast disabled:opacity-40"
      :class="[
        size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3.5 text-sm',
        block && 'flex-1',
        option.value === modelValue
          ? 'bg-raised text-ink shadow-sm ring-1 ring-line'
          : 'text-ink-muted hover:text-ink',
      ]"
      @click="emit('update:modelValue', option.value)"
    >
      <component :is="option.icon" v-if="option.icon" class="h-3.5 w-3.5" aria-hidden="true" />
      <span v-if="!iconOnly">{{ option.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string | number">
import type { Component } from "vue";

export interface SegmentedOption<V> {
  label: string;
  value: V;
  icon?: Component;
  title?: string;
  disabled?: boolean;
}

withDefaults(
  defineProps<{
    modelValue: T;
    options: SegmentedOption<T>[];
    label?: string;
    size?: "sm" | "md";
    iconOnly?: boolean;
    block?: boolean;
  }>(),
  { size: "md" }
);

const emit = defineEmits<{ "update:modelValue": [value: T] }>();
</script>
