<template>
  <div class="novel-list">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      我的小说
    </h2>
    
    <div v-if="novels.length === 0" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">
        暂无小说，请点击"新建小说"按钮创建
      </p>
    </div>
    
    <ul v-else class="space-y-2">
      <li 
        v-for="novel in novels" 
        :key="novel.id"
        @click="$emit('select-novel', novel.id)"
        class="p-3 rounded-md cursor-pointer transition-colors duration-200"
        :class="novel.id === selectedNovelId 
          ? 'bg-blue-100 dark:bg-blue-900' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-700'"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-300">
            <BookOpenIcon class="h-6 w-6" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ novel.title }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              作者: {{ novel.author }}
            </p>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { BookOpenIcon } from '@heroicons/vue/24/outline';
import type { Novel } from '@/types/ReadNovels';

defineProps<{
  novels: Novel[],
  selectedNovelId?: string
}>();

defineEmits<{
  (e: 'select-novel', novelId: string): void
}>();
</script>

<style scoped>
.novel-list {
  height: 100%;
  min-height: 300px;
}
</style> 