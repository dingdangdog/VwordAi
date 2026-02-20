<template>
  <div class="form-input-root" :class="rootClass">
    <label v-if="label || $slots.label" class="form-input-label">
      <slot name="label">{{ label }}</slot>
    </label>
    <div v-if="$slots.prefix || $slots.suffix" class="form-input-wrap relative flex">
      <span
        v-if="$slots.prefix"
        class="form-input-addon form-input-prefix absolute left-0 inset-y-0 flex items-center pl-3 pointer-events-none text-ink-muted"
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
        class="form-input-addon form-input-suffix absolute right-0 inset-y-0 flex items-center pr-1 text-ink-muted"
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
  @apply block text-sm font-medium text-ink;
}
.form-input {
  @apply w-full rounded-md border border-border bg-surface text-ink placeholder-ink-muted;
  @apply outline-none transition-colors;
  @apply focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20;
  @apply hover:border-primary;
  @apply disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface-hover;
  -webkit-appearance: none;
  appearance: none;
  box-shadow: none;
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
  @apply text-sm text-ink-muted;
}
</style>
