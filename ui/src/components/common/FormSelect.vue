<template>
  <div class="form-select-root" :class="rootClass">
    <label v-if="label || $slots.label" class="form-select-label">
      <slot name="label">{{ label }}</slot>
    </label>
    <select
      :value="modelValue"
      :disabled="disabled"
      :name="name"
      class="form-select"
      :class="selectClass"
      v-bind="$attrs"
      @change="onChange"
      @blur="onBlur"
      @focus="onFocus"
    >
      <option v-if="placeholder && (modelValue === undefined || modelValue === null || modelValue === '')" value="" disabled>
        {{ placeholder }}
      </option>
      <option
        v-for="opt in options"
        :key="String(opt.value)"
        :value="opt.value"
        :disabled="opt.disabled"
      >
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" class="form-select-error">{{ error }}</p>
    <p v-else-if="hint || $slots.hint" class="form-select-hint">
      <slot name="hint">{{ hint }}</slot>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ inheritAttrs: false });

export interface FormSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    label?: string;
    placeholder?: string;
    name?: string;
    options?: FormSelectOption[];
    disabled?: boolean;
    error?: string;
    hint?: string;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { options: () => [], size: 'md' }
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | number): void;
  (e: 'change', v: Event): void;
  (e: 'blur', v: FocusEvent): void;
  (e: 'focus', v: FocusEvent): void;
}>();

const rootClass = computed(() => (props.label || props.error ? 'space-y-1' : ''));
const selectClass = computed(() => [
  props.size === 'sm' && 'form-select-sm',
  props.size === 'lg' && 'form-select-lg',
].filter(Boolean));

function onChange(e: Event) {
  const t = (e.target as HTMLSelectElement);
  const v = t.value;
  const numOpt = props.options?.find((o) => String(o.value) === v);
  const out = numOpt !== undefined && typeof numOpt.value === 'number' ? numOpt.value : v;
  emit('update:modelValue', out as string | number);
  emit('change', e);
}
function onBlur(e: FocusEvent) {
  emit('blur', e);
}
function onFocus(e: FocusEvent) {
  emit('focus', e);
}
</script>

<style scoped>
.form-select-label {
  @apply block text-sm font-medium text-ink;
}
.form-select {
  @apply w-full rounded-md border border-border bg-surface text-ink;
  @apply outline-none transition-colors;
  @apply focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20;
  @apply hover:border-primary;
  @apply disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface-hover;
  -webkit-appearance: none;
  appearance: none;
  box-shadow: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.25rem 1.25rem;
  padding-right: 2rem;
}
:deep(.dark .form-select),
.dark.form-select-root .form-select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}
.form-select:focus {
  @apply ring-2 ring-primary ring-opacity-20;
}
.form-select-sm {
  @apply py-1.5 pl-2.5 pr-7 text-sm;
}
.form-select:not(.form-select-sm):not(.form-select-lg) {
  @apply py-2 pl-3 pr-8 text-sm;
}
.form-select-lg {
  @apply py-2.5 pl-3.5 pr-9 text-base;
}
.form-select-error {
  @apply text-sm text-red-500 dark:text-red-400;
}
.form-select-hint {
  @apply text-sm text-ink-muted;
}
</style>
