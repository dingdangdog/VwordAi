<template>
  <label
    class="form-checkbox-wrapper inline-flex items-center gap-2.5 cursor-pointer select-none"
    :class="{ 'opacity-60 cursor-not-allowed': disabled }"
  >
    <span class="form-checkbox-box relative flex shrink-0">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        :name="name"
        :value="value"
        class="form-checkbox-input peer sr-only"
        v-bind="$attrs"
        @change="onChange"
      />
      <span
        class="form-checkbox-dummy relative block w-[1.125rem] h-[1.125rem] rounded border-2 border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 transition-colors peer-focus:outline-none peer-focus:shadow-[0_0_0_2px_rgba(59,130,246,0.35)] peer-checked:border-blue-500 peer-checked:bg-blue-500 dark:peer-checked:bg-blue-500 dark:peer-checked:border-blue-500"
      >
        <CheckIcon
          v-if="modelValue"
          class="absolute inset-0 m-auto w-3.5 h-3.5 text-white pointer-events-none"
          aria-hidden
        />
      </span>
    </span>
    <span
      v-if="$slots.default || label"
      class="form-checkbox-label text-sm text-gray-700 dark:text-gray-300"
    >
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/24/solid';

defineOptions({ inheritAttrs: false });

defineProps<{
  modelValue?: boolean;
  label?: string;
  name?: string;
  value?: string | number;
  disabled?: boolean;
}>();

const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

function onChange(e: Event) {
  const t = (e.target as HTMLInputElement);
  emit('update:modelValue', t.checked);
}
</script>
