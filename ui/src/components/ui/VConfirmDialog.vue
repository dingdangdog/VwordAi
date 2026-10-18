<template>
  <VDialog :open="open" size="sm" :closable="false" @close="emit('close')">
    <div class="flex gap-3">
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        :class="tone === 'danger' ? 'bg-danger/15 text-danger' : 'bg-accent/15 text-accent'"
      >
        <ExclamationTriangleIcon v-if="tone === 'danger'" class="h-5 w-5" aria-hidden="true" />
        <QuestionMarkCircleIcon v-else class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0 pt-1">
        <p class="text-sm font-semibold text-ink">{{ title }}</p>
        <p class="mt-1.5 whitespace-pre-line text-sm text-ink-muted">{{ message }}</p>
      </div>
    </div>
    <template #footer>
      <VButton variant="ghost" @click="onCancel">{{ cancelText }}</VButton>
      <VButton :variant="tone === 'danger' ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">
        {{ confirmText }}
      </VButton>
    </template>
  </VDialog>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon, QuestionMarkCircleIcon } from "@heroicons/vue/24/outline";
import VDialog from "./VDialog.vue";
import VButton from "./VButton.vue";

withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    tone?: "danger" | "primary";
    loading?: boolean;
  }>(),
  { confirmText: "确认", cancelText: "取消", tone: "danger" }
);

const emit = defineEmits<{ confirm: []; cancel: []; close: [] }>();

function onCancel() {
  emit("cancel");
  emit("close");
}
</script>
