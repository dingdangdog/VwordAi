<template>
  <label class="inline-flex cursor-pointer select-none items-center gap-2.5" :class="disabled && 'cursor-not-allowed opacity-50'">
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-fast"
      :class="modelValue ? 'border-accent bg-accent' : 'border-line-strong bg-soft'"
      @click="emit('update:modelValue', !modelValue)"
    >
      <span
        class="inline-block h-3.5 w-3.5 rounded-full shadow transition-transform duration-fast ease-standard"
        :class="modelValue ? 'translate-x-[18px] bg-accent-ink' : 'translate-x-[3px] bg-ink-muted'"
      />
    </button>
    <span v-if="label || $slots.default" class="text-sm text-ink">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; label?: string; disabled?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>
