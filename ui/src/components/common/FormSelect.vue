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
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}
.form-select {
  @apply w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white;
  @apply outline-none transition-colors;
  @apply focus:border-blue-500 dark:focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.2)];
  @apply hover:border-gray-400 dark:hover:border-gray-500;
  @apply disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700/50;
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
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
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
  @apply text-sm text-gray-500 dark:text-gray-400;
}
</style>
