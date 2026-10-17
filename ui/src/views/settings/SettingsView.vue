<template>
  <div class="settings-view">
    <!-- 设置选项卡 -->
    <div class="border-b border-border">
      <nav class="flex -mb-px">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="setActiveTab(tab.id)"
          class="py-2 pl-3 pr-4 text-center border-b-2 font-medium text-sm whitespace-nowrap duration-200 transition-all"
          :class="
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
          "
        >
          <component :is="tab.icon" class="h-5 w-5 inline-block mr-1" />
          {{ tab.name }}
        </button>
      </nav>
    </div>

    <!-- 设置内容 -->
    <div class="tab-content">
      <!-- 语音服务（TTS 配置 + 语音模型） -->
      <AccountSettings v-if="activeTab === 'account'" />
      <SystemSettings v-else-if="activeTab === 'system'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { useSettingsStore } from "@/stores/settings";
import type { SettingsTab } from "@/stores/settings";
import { useRoute } from "vue-router";
import {
  ServerIcon,
  UserCircleIcon,
} from "@heroicons/vue/24/outline";

import AccountSettings from "@/components/settings/AccountSettings.vue";
import SystemSettings from "@/components/settings/SystemSettings.vue";

const settingsStore = useSettingsStore();
const route = useRoute();

// 定义选项卡（语音服务 = TTS 配置 + 语音模型，同一页内 Tab 切换）
const tabs = [
  { id: "account" as SettingsTab, name: "账号", icon: UserCircleIcon },
  { id: "system" as SettingsTab, name: "系统设置", icon: ServerIcon },
];

// 选项卡状态
const activeTab = computed(() => settingsStore.activeTab);

// 兼容旧链接：tts 已合并到语音服务
function normalizeTabParam(tab: string): SettingsTab | null {
  if (tab === "tts" || tab === "voice" || tab === "llm") return "account";
  const validTab = tabs.find((t) => t.id === tab);
  return validTab ? (tab as SettingsTab) : null;
}

// 监听路由变化，更新选项卡
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && typeof newTab === "string") {
      const tab = normalizeTabParam(newTab);
      if (tab) settingsStore.setActiveTab(tab);
    }
  },
  { immediate: true }
);

// 初始化
onMounted(async () => {
  // 加载所有设置（包含服务商配置、存储路径等）
  await settingsStore.loadSettings();

  // 从URL获取tab参数（tts 重定向到 voice）
  const tabParam = route.query.tab;
  if (tabParam && typeof tabParam === "string") {
    const tab = normalizeTabParam(tabParam);
    if (tab) settingsStore.setActiveTab(tab);
  }
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
