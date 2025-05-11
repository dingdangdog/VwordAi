<template>
  <div class="settings-view">
    <!-- 设置选项卡 -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="flex -mb-px">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="setActiveTab(tab.id)"
          class="py-2 pl-3 pr-4 text-center border-b-2 font-medium text-sm whitespace-nowrap duration-200 transition-all"
          :class="
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600  dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          "
        >
          <component :is="tab.icon" class="h-5 w-5 inline-block mr-1" />
          {{ tab.name }}
        </button>
      </nav>
    </div>

    <!-- 设置内容 -->
    <div class="tab-content">
      <!-- TTS设置 -->
      <TTSSettings v-if="activeTab === 'tts'" />
      <!-- LLM设置 -->
      <LLMSettings v-if="activeTab === 'llm'" />
      <!-- 系统数据 -->
      <SystemSettings v-else-if="activeTab === 'system'" />

      <!-- 语音模型预览 -->
      <VoiceModelPreview v-else-if="activeTab === 'voice'" />
      <!-- 关于信息 -->
      <AboutSetting v-else-if="activeTab === 'about'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useSettingsStore } from "@/stores/settings";
import type { SettingsTab } from "@/stores/settings";
import {
  ServerIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
} from "@heroicons/vue/24/outline";

// 导入设置组件
import TTSSettings from "@/components/settings/TTSSettings.vue";
import LLMSettings from "@/components/settings/LLMSettings.vue";
import SystemSettings from "@/components/settings/SystemSettings.vue";
import VoiceModelPreview from "@/components/settings/VoiceModelPreview.vue";
import AboutSetting from "@/components/settings/AboutSetting.vue";

const settingsStore = useSettingsStore();

// 定义选项卡
const tabs = [
  { id: "tts" as SettingsTab, name: "TTS配置", icon: MicrophoneIcon },
  { id: "llm" as SettingsTab, name: "LLM配置", icon: ArrowPathIcon },
  {
    id: "system" as SettingsTab,
    name: "系统设置",
    icon: ServerIcon,
  },
  { id: "voice" as SettingsTab, name: "语音模型", icon: SpeakerWaveIcon },
  { id: "about" as SettingsTab, name: "关于", icon: InformationCircleIcon },
];

// 选项卡状态
const activeTab = computed(() => settingsStore.activeTab);

// 初始化
onMounted(async () => {
  // 加载所有设置（包含服务商配置、存储路径等）
  await settingsStore.loadSettings();
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
