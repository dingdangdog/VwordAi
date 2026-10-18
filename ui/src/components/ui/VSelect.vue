<template>
  <div :class="wrapperClass">
    <label v-if="label" :for="inputId" class="field-label">
      {{ label }}<span v-if="required" class="text-danger"> *</span>
    </label>
    <select
      :id="inputId"
      v-bind="$attrs"
      :value="modelValue ?? ''"
      :required="required"
      :aria-describedby="hint ? `${inputId}-msg` : undefined"
      :class="['field', size === 'sm' && 'field-sm']"
      @change="onChange"
    >
      <option v-if="placeholder !== undefined" value="">{{ placeholder }}</option>
      <slot>
        <option
          v-for="option in options"
          :key="String(option.value)"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </slot>
    </select>
    <p v-if="hint" :id="`${inputId}-msg`" class="field-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    options?: SelectOption[];
    label?: string;
    hint?: string;
    placeholder?: string;
    size?: "sm" | "md";
    required?: boolean;
    id?: string;
    wrapperClass?: string;
  }>(),
  { options: () => [], size: "md" }
);

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const autoId = useId();
const inputId = computed(() => props.id || `vs-${autoId}`);

function onChange(event: Event) {
  emit("update:modelValue", (event.target as HTMLSelectElement).value);
}
</script>
