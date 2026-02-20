<template>
  <div class="form-input-root" :class="rootClass">
    <label v-if="label || $slots.label" class="form-input-label">
      <slot name="label">{{ label }}</slot>
    </label>
    <div v-if="$slots.prefix || $slots.suffix" class="form-input-wrap relative flex">
      <span
        v-if="$slots.prefix"
        class="form-input-addon form-input-prefix absolute left-0 inset-y-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400"
      >
        <slot name="prefix" />
      </span>
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :name="name"
        class="form-input"
        :class="inputClass"
        v-bind="$attrs"
        @input="onInput"
        @change="onChange"
        @blur="onBlur"
        @focus="onFocus"
      />
      <span
        v-if="$slots.suffix"
        class="form-input-addon form-input-suffix absolute right-0 inset-y-0 flex items-center pr-1 text-gray-500 dark:text-gray-400"
      >
        <slot name="suffix" />
      </span>
    </div>
    <input
      v-else
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :name="name"
      class="form-input"
      :class="inputClass"
      v-bind="$attrs"
      @input="onInput"
      @change="onChange"
      @blur="onBlur"
      @focus="onFocus"
    />
    <p v-if="error" class="form-input-error">{{ error }}</p>
    <p v-else-if="hint || $slots.hint" class="form-input-hint">
      <slot name="hint">{{ hint }}</slot>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    label?: string;
    type?: string;
    placeholder?: string;
    name?: string;
    disabled?: boolean;
    readonly?: boolean;
    error?: string;
    hint?: string;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { type: 'text', size: 'md' }
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | number): void;
  (e: 'change', v: Event): void;
  (e: 'blur', v: FocusEvent): void;
  (e: 'focus', v: FocusEvent): void;
}>();

const slots = useSlots();
const rootClass = computed(() => (props.label || props.error ? 'space-y-1' : ''));
const inputClass = computed(() => [
  props.size === 'sm' && 'form-input-sm',
  props.size === 'lg' && 'form-input-lg',
  slots.prefix && 'pl-9',
  slots.suffix && 'pr-9',
].filter(Boolean));

function onInput(e: Event) {
  const t = (e.target as HTMLInputElement);
  const v = props.type === 'number' ? (t.value === '' ? '' : Number(t.value)) : t.value;
  emit('update:modelValue', v as string | number);
}
function onChange(e: Event) {
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
.form-input-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}
.form-input {
  @apply w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500;
  @apply outline-none transition-colors;
  @apply focus:border-blue-500 dark:focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.2)];
  @apply hover:border-gray-400 dark:hover:border-gray-500;
  @apply disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700/50;
  -webkit-appearance: none;
  appearance: none;
  box-shadow: none;
}
.form-input:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
.form-input-sm {
  @apply py-1.5 px-2.5 text-sm;
}
.form-input:not(.form-input-sm):not(.form-input-lg) {
  @apply py-2 px-3 text-sm;
}
.form-input-lg {
  @apply py-2.5 px-3.5 text-base;
}
.form-input-error {
  @apply text-sm text-red-500 dark:text-red-400;
}
.form-input-hint {
  @apply text-sm text-gray-500 dark:text-gray-400;
}
</style>
