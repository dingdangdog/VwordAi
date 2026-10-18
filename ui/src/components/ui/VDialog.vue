<template>
  <TransitionRoot appear :show="open" as="template">
    <Dialog as="div" class="relative z-50" :initial-focus="initialFocus" @close="onClose">
      <TransitionChild
        as="template"
        enter="duration-base ease-standard"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-fast ease-standard"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-scrim/60 backdrop-blur-[2px]" aria-hidden="true" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="duration-base ease-standard"
            enter-from="opacity-0 scale-[0.97] translate-y-1"
            enter-to="opacity-100 scale-100 translate-y-0"
            leave="duration-fast ease-standard"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-[0.98]"
          >
            <DialogPanel
              class="flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-lg border border-line bg-raised shadow-overlay"
              :class="sizeClass"
            >
              <div v-if="title || $slots.header" class="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                <slot name="header">
                  <div class="min-w-0">
                    <DialogTitle class="text-base font-semibold text-ink">{{ title }}</DialogTitle>
                    <p v-if="description" class="mt-1 text-sm text-ink-muted">{{ description }}</p>
                  </div>
                </slot>
                <button
                  v-if="closable"
                  type="button"
                  class="btn btn-ghost btn-icon btn-sm -mr-1.5 -mt-0.5"
                  aria-label="关闭"
                  @click="emitClose"
                >
                  <XMarkIcon aria-hidden="true" />
                </button>
              </div>

              <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4" :class="bodyClass">
                <slot />
              </div>

              <div v-if="$slots.footer" class="flex items-center justify-end gap-2 border-t border-line bg-surface/60 px-5 py-3">
                <slot name="footer" />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { XMarkIcon } from "@heroicons/vue/20/solid";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    description?: string;
    size?: "sm" | "md" | "lg" | "xl";
    closable?: boolean;
    persistent?: boolean;
    bodyClass?: string;
    initialFocus?: HTMLElement | null;
  }>(),
  { size: "md", closable: true }
);

const emit = defineEmits<{ close: []; "update:open": [value: boolean] }>();

const sizeClass = computed(
  () => ({ sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" })[props.size]
);

function emitClose() {
  emit("update:open", false);
  emit("close");
}

function onClose() {
  if (!props.persistent) emitClose();
}
</script>
