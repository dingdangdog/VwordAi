<template>
  <div class="form-textarea-root" :class="rootClass">
    <label v-if="label || $slots.label" class="form-textarea-label">
      <slot name="label">{{ label }}</slot>
    </label>
    <textarea :value="modelValue" :placeholder="placeholder" :disabled="disabled" :readonly="readonly" :name="name"
      :rows="rows" class="form-textarea" :class="textareaClass" v-bind="$attrs" @input="onInput" @change="onChange"
      @blur="onBlur" @focus="onFocus"></textarea>
    <p v-if="error" class="form-textarea-error">{{ error }}</p>
    <p v-else-if="hint || $slots.hint" class="form-textarea-hint">
      <slot name="hint">{{ hint }}</slot>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    placeholder?: string;
    name?: string;
    rows?: number;
    disabled?: boolean;
    readonly?: boolean;
    error?: string;
    hint?: string;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { rows: 3, size: 'md' }
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'change', v: Event): void;
  (e: 'blur', v: FocusEvent): void;
  (e: 'focus', v: FocusEvent): void;
}>();

const rootClass = computed(() => (props.label || props.error ? 'space-y-1' : ''));
const textareaClass = computed(() => [
  props.size === 'sm' && 'form-textarea-sm',
  props.size === 'lg' && 'form-textarea-lg',
].filter(Boolean));

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value);
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
.form-textarea-label {
  @apply block text-sm font-medium text-ink;
}

.form-textarea {
  @apply w-full rounded-md border border-border bg-surface text-ink placeholder-ink-muted resize-y min-h-[4.5rem];
  @apply outline-none transition-colors;
  @apply focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20;
  @apply hover:border-primary;
  @apply disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface-hover;
  -webkit-appearance: none;
  appearance: none;
  box-shadow: none;
}

.form-textarea-sm {
  @apply py-1.5 px-2.5 text-sm;
}

.form-textarea:not(.form-textarea-sm):not(.form-textarea-lg) {
  @apply py-2 px-3 text-sm;
}

.form-textarea-lg {
  @apply py-2.5 px-3.5 text-base;
}

.form-textarea-error {
  @apply text-sm text-red-500 dark:text-red-400;
}

.form-textarea-hint {
  @apply text-sm text-ink-muted;
}
</style>
