<template>
  <div :class="wrapperClass">
    <div v-if="label || counter" class="flex items-baseline justify-between">
      <label v-if="label" :for="inputId" class="field-label">
        {{ label }}<span v-if="required" class="text-danger"> *</span>
      </label>
      <span v-if="counter" class="num text-2xs text-ink-subtle">{{ length }}</span>
    </div>
    <textarea
      :id="inputId"
      v-bind="$attrs"
      :value="modelValue ?? ''"
      :rows="rows"
      :required="required"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
      :class="['field', mono && 'font-mono', error && 'border-danger']"
      @input="onInput"
    />
    <p v-if="error" :id="`${inputId}-msg`" class="field-error">{{ error }}</p>
    <p v-else-if="hint" :id="`${inputId}-msg`" class="field-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    label?: string;
    hint?: string;
    error?: string;
    rows?: number;
    mono?: boolean;
    counter?: boolean;
    required?: boolean;
    id?: string;
    wrapperClass?: string;
  }>(),
  { rows: 4 }
);

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const autoId = useId();
const inputId = computed(() => props.id || `vt-${autoId}`);
const describedBy = computed(() => (props.error || props.hint ? `${inputId.value}-msg` : undefined));
const length = computed(() => (props.modelValue || "").length.toLocaleString());

function onInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLTextAreaElement).value);
}
</script>
