<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
    >
      <!-- 标题栏 -->
      <div
        class="bg-blue-500 dark:bg-blue-600 text-white py-4 px-6 flex justify-between items-center"
      >
        <h2 class="text-xl font-bold flex items-center">
          <ArrowUpCircleIcon class="h-6 w-6 mr-2" />
          发现新版本
        </h2>
        <button @click="close" class="focus:outline-none">
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="py-6 px-6">
        <div class="mb-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ updateInfo.version }} 已发布
          </h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm">
            发布日期: {{ updateInfo.releaseDate }}
          </p>
        </div>

        <!-- 更新内容 -->
        <div
          class="mb-6 bg-gray-50 dark:bg-gray-700 p-3 rounded-md max-h-48 overflow-y-auto"
        >
          <h4 class="font-medium text-gray-900 dark:text-white mb-2">
            更新内容:
          </h4>
          <div
            class="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-line"
            v-html="formattedReleaseNotes"
          ></div>
        </div>

        <!-- 当前版本信息 -->
        <div class="mb-6 text-sm text-gray-500 dark:text-gray-400">
          当前版本: {{ currentVersion }}
        </div>

        <!-- 按钮区域 -->
        <div class="flex space-x-3 justify-end">
          <button @click="close" class="btn btn-secondary">稍后更新</button>
          <button @click="downloadUpdate" class="btn btn-primary">
            <ArrowDownTrayIcon class="h-5 w-5 mr-1" />
            立即更新
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { XMarkIcon, ArrowDownTrayIcon, ArrowUpCircleIcon } from "@heroicons/vue/24/outline";
import type { UpdateInfo } from "@/services/updateService";

// Props
const props = defineProps<{
  show: boolean;
  updateInfo: UpdateInfo;
  currentVersion: string;
}>();

// Emits
const emit = defineEmits<{
  (e: "close"): void;
  (e: "download"): void;
}>();

// 格式化发布说明
const formattedReleaseNotes = computed(() => {
  return props.updateInfo.releaseNotes
    .replace(/\n/g, "<br>")
    .replace(
      /\*\*(.*?)\*\*/g,
      '<span class="font-bold text-blue-600 dark:text-blue-400">$1</span>'
    );
});

// 关闭对话框
function close() {
  emit("close");
}

// 下载更新
function downloadUpdate() {
  emit("download");
  window.open(props.updateInfo.downloadUrl, "_blank");
  close();
}
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