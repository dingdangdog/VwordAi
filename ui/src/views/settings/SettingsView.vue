<template>
  <div class="settings-view">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">设置</h1>

    <!-- 设置选项卡 -->
    <div class="mb-6">
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex -mb-px">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="setActiveTab(tab.id)"
            class="py-3 px-4 text-center border-b-2 font-medium text-sm whitespace-nowrap"
            :class="
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            "
          >
            <component :is="tab.icon" class="h-5 w-5 inline-block mr-2" />
            {{ tab.name }}
          </button>
        </nav>
      </div>
    </div>

    <!-- 设置内容 -->
    <div class="tab-content">
      <!-- 服务商设置 -->
      <ProviderSetting v-if="activeTab === 'provider'" />
      
      <!-- 存储设置 -->
      <StorageSetting v-else-if="activeTab === 'storage'" />
      
      <!-- 关于信息 -->
      <AboutSetting v-else-if="activeTab === 'about'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { useSettingsStore } from "@/stores/settings";
import type { SettingsTab } from "@/stores/settings";
import {
  ServerIcon,
  FolderIcon,
  InformationCircleIcon
} from "@heroicons/vue/24/outline";

// 导入设置组件
import ProviderSetting from "@/components/settings/ProviderSetting.vue";
import StorageSetting from "@/components/settings/StorageSetting.vue";
import AboutSetting from "@/components/settings/AboutSetting.vue";

const toast = useToast();
const settingsStore = useSettingsStore();

// 定义选项卡
const tabs = [
  { id: 'provider' as SettingsTab, name: '服务商配置', icon: ServerIcon },
  { id: 'storage' as SettingsTab, name: '存储配置', icon: FolderIcon },
  { id: 'about' as SettingsTab, name: '关于', icon: InformationCircleIcon }
];

// 选项卡状态
const activeTab = computed(() => settingsStore.activeTab);

// 初始化
onMounted(() => {
  // 初始化主题
  settingsStore.initTheme();
  
  // 加载设置
  settingsStore.loadDefaultExportPath();
  settingsStore.loadServiceProviders();
});

// 切换选项卡
function setActiveTab(tab: SettingsTab) {
  settingsStore.setActiveTab(tab);
}
</script>

<style scoped>
.settings-view {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
