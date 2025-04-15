<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">设置</h1>

    <div class="space-y-6">
      <!-- 服务商设置 -->
      <ServiceProviderList />

      <!-- 导出设置 -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          存储设置
        </h2>
        <div class="mb-4">
          <label
            for="exportPath"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >默认存储路径</label
          >
          <div class="flex">
            <input
              type="text"
              id="exportPath"
              v-model="defaultExportPath"
              class="input max-w-md"
              readonly
              placeholder="请选择默认的音频文件导出路径"
            />
            <button @click="selectExportPath" class="btn btn-primary ml-2">
              选择路径
            </button>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            选择一个路径，用于保存生成的音频文件
          </p>
        </div>
      </div>

      <!-- 关于信息 -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          关于
        </h2>
        <div class="text-gray-700 dark:text-gray-300">
          <p>文本转语音软件 v1.0.0</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            © 2025 VwordAI
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useToast } from "vue-toastification";
import { useSettingsStore } from "@/stores/settings";
import { SunIcon, MoonIcon } from "@heroicons/vue/24/outline";
import ServiceProviderList from "@/components/settings/ServiceProviderList.vue";

const toast = useToast();
const settingsStore = useSettingsStore();

// 主题设置
const isDarkMode = computed(() => settingsStore.theme === "dark");
const defaultExportPath = ref(settingsStore.defaultExportPath);

function toggleTheme() {
  settingsStore.toggleTheme();
}

function selectExportPath() {
  // 使用electron API选择文件夹
  window.electron
    .selectFolder()
    .then((path) => {
      if (path) {
        // 设置导出路径
        window.electron
          .setDefaultExportPath(path)
          .then(() => {
            defaultExportPath.value = path;
            toast.success("导出路径已更新");
          })
          .catch((err) => {
            toast.error(`设置导出路径失败: ${err}`);
          });
      }
    })
    .catch((err) => {
      toast.error(`选择文件夹失败: ${err}`);
    });
}
</script>
