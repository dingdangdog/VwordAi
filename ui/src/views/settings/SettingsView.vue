<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">设置</h1>

    <div class="space-y-6">
      <!-- 主题设置 -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          显示设置
        </h2>
        <div class="flex items-center justify-between">
          <span class="text-gray-700 dark:text-gray-300">主题</span>
          <div
            class="relative inline-block w-14 align-middle select-none transition duration-200 ease-in"
          >
            <input
              type="checkbox"
              id="theme-toggle"
              name="theme-toggle"
              class="sr-only"
              :checked="isDarkMode"
              @change="toggleTheme"
            />
            <label
              for="theme-toggle"
              class="flex items-center justify-between cursor-pointer h-8 w-14 rounded-full bg-gray-200 dark:bg-blue-900 px-1"
            >
              <span
                class="h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-300"
                :class="{
                  'translate-x-0': isDarkMode,
                  'translate-x-6': !isDarkMode,
                }"
              ></span>
              <SunIcon
                class="h-5 w-5 text-yellow-500"
                :class="{ 'opacity-0': isDarkMode, 'opacity-100': !isDarkMode }"
              />
              <MoonIcon
                class="h-5 w-5 text-gray-300"
                :class="{ 'opacity-100': isDarkMode, 'opacity-0': !isDarkMode }"
              />
            </label>
          </div>
        </div>
      </div>

      <!-- 导出设置 -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          导出设置
        </h2>
        <div class="mb-4">
          <label
            for="exportPath"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >默认导出路径</label
          >
          <div class="flex">
            <input
              type="text"
              id="exportPath"
              v-model="defaultExportPath"
              class="input flex-grow dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              readonly
              placeholder="请选择默认的音频文件导出路径"
            />
            <button @click="selectExportPath" class="btn btn-primary ml-2">
              选择路径
            </button>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            选择一个默认路径，用于保存生成的音频文件
          </p>
        </div>
      </div>

      <!-- 服务商设置 -->
      <ServiceProviderList />

      <!-- 关于信息 -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          关于
        </h2>
        <div class="text-gray-700 dark:text-gray-300">
          <p>文本转语音软件 v1.0.0</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            © 2025 VoiceOfWords
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
