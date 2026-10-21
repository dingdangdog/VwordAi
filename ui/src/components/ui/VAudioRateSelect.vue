<template>
  <Listbox :model-value="modelValue" :disabled="disabled" as="div" class="relative" @update:model-value="onSelect">
    <ListboxButton class="btn btn-ghost btn-sm num w-12" :disabled="disabled" :title="label" :aria-label="label">{{ modelValue }}×</ListboxButton>
    <ListboxOptions
      class="absolute bottom-full right-0 z-50 mb-1 w-20 origin-bottom-right rounded-md border border-line bg-raised py-1 shadow-overlay focus:outline-none"
    >
      <ListboxOption
        v-for="item in rates"
        :key="item"
        v-slot="{ active, selected }"
        :value="item"
        as="template"
      >
        <li
          class="cursor-pointer px-3 py-1.5 text-right text-sm num"
          :class="[active && 'bg-soft', selected ? 'font-medium text-accent' : 'text-ink']"
        >
          {{ item }}×
        </li>
      </ListboxOption>
    </ListboxOptions>
  </Listbox>
</template>

<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/vue";

const props = withDefaults(
  defineProps<{
    modelValue: number;
    disabled?: boolean;
    label: string;
    rates?: number[];
  }>(),
  { rates: () => [0.75, 1, 1.25, 1.5, 2] }
);

const emit = defineEmits<{ "update:modelValue": [value: number] }>();

function onSelect(value: unknown) {
  const next = Number(value);
  if (!Number.isFinite(next) || next === props.modelValue) return;
  emit("update:modelValue", next);
}
</script>
