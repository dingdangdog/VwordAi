<template>
  <div class="chapter-list">
    <div v-if="chapters.length === 0" class="text-center py-8">
      <p class="text-ink-muted">
        暂无章节，请点击"新建章节"按钮创建
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="chapter in sortedChapters"
        :key="chapter.id"
        @click="navigateToChapter(chapter.id)"
        class="p-2 border border-border rounded-md cursor-pointer transition-colors duration-200"
        :class="
          chapter.id === selectedChapterId
            ? 'bg-blue-50 border-blue-300 dark:bg-blue-900 dark:border-blue-700'
            : 'hover:bg-surface-hover'
        "
      >
        <div class="flex flex-col items-center">
          <div class="w-full flex items-center justify-between">
            <h3
              class="text-sm font-medium text-ink truncate"
              :title="chapter.title"
            >
              {{ chapter.title }}
            </h3>

            <div v-if="chapter.processed" class="flex-shrink-0">
              <span
                class="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-200"
              >
                已处理
              </span>
            </div>
          </div>
          <div
            class="flex mt-1 items-center text-xs text-ink-muted"
          >
            <span class="w-16">{{ formatDate(chapter.updatedAt) }}</span>
            <span class="mx-2">·</span>
            <span>{{ getContentPreview(chapter.content) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import type { Chapter } from "@/types/ReadNovels";

const router = useRouter();

const props = defineProps<{
  chapters: Chapter[];
  selectedChapterId?: string;
}>();

// 按章节顺序排序
const sortedChapters = computed(() => {
  return [...props.chapters].sort((a, b) => a.order - b.order);
});

// 导航到章节编辑页面
function navigateToChapter(chapterId: string) {
  router.push(`/chapters/${chapterId}`);
}

// 格式化日期
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(date);
}

// 获取内容预览
function getContentPreview(content: string): string {
  const preview = content.replace(/\n/g, " ").trim();
  return preview.length > 20 ? preview.substring(0, 20) + "..." : preview;
}
</script>
