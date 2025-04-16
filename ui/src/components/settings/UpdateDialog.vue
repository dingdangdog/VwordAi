<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click="$emit('close')"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
      @click.stop
    >
      <!-- 标题栏 -->
      <div
        class="bg-blue-500 dark:bg-blue-600 text-white py-4 px-6 flex justify-between items-center"
      >
        <h2 class="text-xl font-bold flex items-center">
          <ArrowUpCircleIcon class="h-6 w-6 mr-2" />
          发现新版本
        </h2>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="py-6 px-6">
        <div class="mb-4">
          <div class="flex justify-between mb-1">
            <span class="text-gray-700 dark:text-gray-300 font-medium"
              >当前版本:</span
            >
            <span class="text-gray-600 dark:text-gray-400">{{
              currentVersion
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-700 dark:text-gray-300 font-medium"
              >最新版本:</span
            >
            <span class="text-green-600 dark:text-green-400 font-medium">{{
              updateInfo.version
            }}</span>
          </div>
        </div>

        <div class="mb-4">
          <span class="text-gray-700 dark:text-gray-300 font-medium"
            >发布日期:</span
          >
          <span class="text-gray-600 dark:text-gray-400 ml-2">{{
            updateInfo.releaseDate
          }}</span>
        </div>

        <div v-if="updateInfo.releaseNotes" class="mb-4">
          <div class="text-gray-700 dark:text-gray-300 font-medium mb-2">
            更新内容:
          </div>
          <div
            class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line overflow-y-auto max-h-48"
            v-html="formattedReleaseNotes"
          ></div>
        </div>
        
        <!-- 下载进度 -->
        <div v-if="downloadState === 'downloading'" class="mb-4">
          <div class="flex justify-between mb-1">
            <span class="text-sm font-medium text-blue-700 dark:text-blue-400">正在下载更新 {{ Math.round(downloadProgress || 0) }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: `${downloadProgress || 0}%` }"></div>
          </div>
        </div>

        <!-- 按钮区域 -->
        <div class="flex space-x-3 justify-end">
          <button
            v-if="downloadState === 'idle'"
            @click="$emit('download')"
            class="btn btn-primary"
          >
            <ArrowDownTrayIcon class="h-5 w-5 mr-1" />
            下载更新
          </button>
          <button
            v-if="downloadState === 'downloaded'"
            @click="$emit('install')"
            class="btn btn-primary"
          >
            <ArrowDownTrayIcon class="h-5 w-5 mr-1" />
            立即安装
          </button>
          <button
            @click="$emit('close')"
            class="btn btn-secondary"
            :class="{ 'ml-auto': downloadState !== 'idle' && downloadState !== 'downloaded' }"
          >
            {{ downloadState === 'downloaded' ? '稍后安装' : '关闭' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ArrowDownTrayIcon, ArrowUpCircleIcon } from "@heroicons/vue/24/outline";
import type { UpdateInfo } from "@/services/updateService";

// Props
const props = defineProps<{
  show: boolean;
  updateInfo: UpdateInfo;
  currentVersion: string;
  downloadProgress?: number;
  downloadState?: 'idle' | 'downloading' | 'downloaded' | 'error';
}>();

// Emits
const emit = defineEmits<{
  (e: "close"): void;
  (e: "download"): void;
  (e: "install"): void;
}>();

// 格式化发布说明
const formattedReleaseNotes = computed(() => {
  if (!props.updateInfo.releaseNotes) return '';
  
  // 替换 Markdown 风格的标题和列表
  return props.updateInfo.releaseNotes
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n- /g, '<br>• ')
    .replace(/\n\n/g, '<br><br>');
});
</script>

<style scoped>
.btn {
  @apply px-4 py-2 rounded-md font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600 flex items-center;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600;
}
</style> 