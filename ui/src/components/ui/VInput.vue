<template>
  <div :class="wrapperClass">
    <label v-if="label" :for="inputId" class="field-label">
      {{ label }}<span v-if="required" class="text-danger"> *</span>
    </label>
    <div class="relative">
      <component
        :is="icon"
        v-if="icon"
        class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
        aria-hidden="true"
      />
      <input
        :id="inputId"
        v-bind="$attrs"
        :value="modelValue"
        :type="type"
        :required="required"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        :class="['field', size === 'sm' && 'field-sm', icon && 'pl-8', mono && 'font-mono', error && 'border-danger']"
        @input="onInput"
      />
    </div>
    <p v-if="error" :id="`${inputId}-msg`" class="field-error">{{ error }}</p>
    <p v-else-if="hint" :id="`${inputId}-msg`" class="field-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId, type Component } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    label?: string;
    hint?: string;
    error?: string;
    type?: string;
    size?: "sm" | "md";
    icon?: Component;
    mono?: boolean;
    required?: boolean;
    id?: string;
    wrapperClass?: string;
  }>(),
  { type: "text", size: "md" }
);

const emit = defineEmits<{ "update:modelValue": [value: string | number] }>();

const autoId = useId();
const inputId = computed(() => props.id || `vi-${autoId}`);
const describedBy = computed(() => (props.error || props.hint ? `${inputId.value}-msg` : undefined));

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", props.type === "number" ? Number(target.value) : target.value);
}
</script>
