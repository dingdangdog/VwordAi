<template>
  <header class="drag-area flex h-10 shrink-0 select-none items-center border-b border-line bg-surface">
    <div class="flex min-w-0 flex-1 items-center gap-2 pl-3">
      <img src="@/assets/logo.svg" alt="" class="h-4 w-4" />
      <span class="text-xs font-semibold text-ink">{{ appConfig.name }}</span>
      <template v-if="title">
        <span class="text-xs text-ink-subtle">/</span>
        <span class="truncate text-xs text-ink-muted">{{ title }}</span>
      </template>
    </div>

    <div class="no-drag flex h-full items-stretch">
      <button
        type="button"
        class="flex w-11 items-center justify-center text-ink-muted transition-colors duration-fast hover:bg-soft hover:text-ink"
        aria-label="最小化"
        title="最小化"
        @click="minimize"
      >
        <MinusIcon class="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="flex w-11 items-center justify-center text-ink-muted transition-colors duration-fast hover:bg-soft hover:text-ink"
        :aria-label="isMax ? '还原' : '最大化'"
        :title="isMax ? '还原' : '最大化'"
        @click="toggleMaximize"
      >
        <Square2StackIcon v-if="isMax" class="h-3.5 w-3.5" aria-hidden="true" />
        <StopIcon v-else class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="flex w-11 items-center justify-center text-ink-muted transition-colors duration-fast hover:bg-danger hover:text-white"
        aria-label="关闭"
        title="关闭"
        @click="close"
      >
        <XMarkIcon class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { MinusIcon, Square2StackIcon, StopIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { appConfig } from "@/stores/appConfig";

defineProps<{ title?: string }>();

const isMax = ref(false);

async function syncMaximized() {
  try {
    isMax.value = Boolean(await window.electron?.isMaximized?.());
  } catch {
    isMax.value = false;
  }
}

function minimize() {
  window.electron?.minimize();
}

function toggleMaximize() {
  window.electron?.maximize();
  setTimeout(syncMaximized, 150);
}

function close() {
  window.electron?.close();
}

onMounted(() => {
  syncMaximized();
  window.addEventListener("resize", syncMaximized);
});

onBeforeUnmount(() => window.removeEventListener("resize", syncMaximized));
</script>
