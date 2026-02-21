<template>
  <div class="novel-detail bg-surface-elevated rounded-lg shadow p-3">
    <!-- 一行：标题 + 编辑 -->
    <div class="flex justify-between items-center gap-3">
      <h2 class="text-lg font-semibold text-ink truncate flex-1 min-w-0">
        {{ novel.title }}
      </h2>
      <button
        @click="$emit('edit-novel', novel)"
        class="btn btn-sm flex items-center shrink-0"
        title="编辑小说信息"
      >
        <PencilSquareIcon class="h-4 w-4 mr-1" />
        编辑
      </button>
    </div>
    <!-- 一行：作者 + 日期 -->
    <div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm">
      <span class="text-ink"><span class="text-ink-muted">作者</span> {{ novel.author }}</span>
      <span class="text-ink-muted">创建于 {{ formatDate(novel.createdAt) }}</span>
      <span class="text-ink-muted">更新于 {{ formatDate(novel.updatedAt) }}</span>
    </div>
    <!-- 一行：简介（可选，最多两行省略） -->
    <p
      v-if="novel.description"
      class="mt-1.5 text-sm text-ink-muted line-clamp-2"
    >
      {{ novel.description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { PencilSquareIcon } from "@heroicons/vue/24/outline";
import type { Novel } from "@/types/ReadNovels";

defineProps<{
  novel: Novel;
}>();

defineEmits<{
  (e: "edit-novel", novel: Novel): void;
}>();

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
</script>
