<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between">
      <label :for="inputId" class="text-xs font-medium text-ink-muted">{{ label }}</label>
      <button
        type="button"
        class="num rounded-sm px-1 text-xs text-ink hover:bg-soft"
        :title="defaultValue !== undefined ? '点击恢复默认值' : undefined"
        :disabled="defaultValue === undefined || disabled"
        @click="reset"
      >
        {{ display }}
      </button>
    </div>
    <input
      :id="inputId"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :disabled="disabled"
      class="vw-range w-full"
      :style="{ '--vw-range-fill': `${percent}%` }"
      @input="onInput"
      @dblclick="reset"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: number;
    label: string;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    defaultValue?: number;
    disabled?: boolean;
    format?: (value: number) => string;
  }>(),
  { min: 0, max: 100, step: 1, unit: "" }
);

const emit = defineEmits<{ "update:modelValue": [value: number] }>();

const inputId = `vr-${useId()}`;
const percent = computed(() => ((props.modelValue - props.min) / (props.max - props.min || 1)) * 100);
const display = computed(() =>
  props.format ? props.format(props.modelValue) : `${props.modelValue}${props.unit}`
);

function onInput(event: Event) {
  emit("update:modelValue", Number((event.target as HTMLInputElement).value));
}

function reset() {
  if (props.defaultValue !== undefined && !props.disabled) emit("update:modelValue", props.defaultValue);
}
</script>

<style scoped>
.vw-range {
  appearance: none;
  height: 16px;
  background: transparent;
  cursor: pointer;
}
.vw-range:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.vw-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 9999px;
  background: linear-gradient(
    to right,
    rgb(var(--vw-accent)) var(--vw-range-fill),
    rgb(var(--vw-line-strong)) var(--vw-range-fill)
  );
}
.vw-range::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -5px;
  border-radius: 9999px;
  border: 2px solid rgb(var(--vw-accent));
  background: rgb(var(--vw-raised));
  transition: transform 120ms;
}
.vw-range:hover::-webkit-slider-thumb {
  transform: scale(1.15);
}
.vw-range::-moz-range-track {
  height: 4px;
  border-radius: 9999px;
  background: rgb(var(--vw-line-strong));
}
.vw-range::-moz-range-progress {
  height: 4px;
  border-radius: 9999px;
  background: rgb(var(--vw-accent));
}
.vw-range::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  border: 2px solid rgb(var(--vw-accent));
  background: rgb(var(--vw-raised));
}
</style>
