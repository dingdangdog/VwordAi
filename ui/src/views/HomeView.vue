<template>
  <div class="max-w-6xl mx-auto">
    <!-- 分类菜单 -->
    <div class="flex flex-col space-y-4">
      <!-- TTS类别 -->
      <div class="menu-category">
        <h2 class="menu-category-title">
          <SpeakerWaveIcon class="h-6 w-6 mr-2" />
          TTS
        </h2>
        <div class="menu-blocks-grid">
          <router-link to="/projects" class="menu-block">
            <DocumentTextIcon class="menu-icon" />
            <span>项目管理</span>
          </router-link>
          <router-link to="/read-novels" class="menu-block">
            <DocumentTextIcon class="menu-icon" />
            <span>小说管理</span>
          </router-link>
        </div>
      </div>

      <!-- 直播类别 -->
      <div class="menu-category">
        <h2 class="menu-category-title">
          <VideoCameraIcon class="h-6 w-6 mr-2" />
          直播工具
        </h2>
        <div class="menu-blocks-grid">
          <router-link to="/bililive" class="menu-block">
            <BilibiliIcon class="menu-icon" />
            <!-- <span>Blive</span> -->
          </router-link>
        </div>
      </div>

      <!-- 设置类别 -->
      <div class="menu-category">
        <h2 class="menu-category-title">
          <AdjustmentsHorizontalIcon class="h-6 w-6 mr-2" />
          设置
        </h2>
        <div class="menu-blocks-grid">
          <router-link to="/settings?tab=tts" class="menu-block">
            <MicrophoneIcon class="menu-icon" />
            <span>TTS</span>
          </router-link>
          <router-link to="/settings?tab=llm" class="menu-block">
            <CubeTransparentIcon class="menu-icon" />
            <span>LLM</span>
          </router-link>
          <router-link to="/settings?tab=system" class="menu-block">
            <ServerIcon class="menu-icon" />
            <span>系统</span>
          </router-link>
        </div>
      </div>

      <!-- 关于 -->
      <div class="menu-category">
        <h2 class="menu-category-title">
          <PuzzlePieceIcon class="h-6 w-6 mr-2" />
          系统
        </h2>
        <div class="menu-blocks-grid">
          <router-link to="/settings?tab=voice" class="menu-block">
            <SpeakerWaveIcon class="menu-icon" />
            <span>语音模型</span>
          </router-link>
          <router-link to="/about" class="menu-block">
            <InformationCircleIcon class="menu-icon" />
            <span>关于</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useProjectsStore } from "@/stores/projects";
import BilibiliIcon from "@/components/icon/bilibili.vue";
import {
  DocumentTextIcon,
  SpeakerWaveIcon,
  AdjustmentsHorizontalIcon,
  CubeTransparentIcon,
  VideoCameraIcon,
  PuzzlePieceIcon,
  ServerIcon,
  MicrophoneIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/outline";

const projectsStore = useProjectsStore();

onMounted(() => {
  projectsStore.loadProjects();
});
</script>

<style scoped>
.menu-category {
  @apply bg-white/50 dark:bg-blue-800/20 rounded-lg p-4 shadow-sm;
}

.menu-category-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center;
}

.menu-blocks-grid {
  @apply flex space-x-4;
}

.menu-block {
  @apply flex flex-col items-center justify-center p-4 w-28 h-24 rounded-lg bg-gray-50 dark:bg-blue-800/30 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors duration-200 text-center;
}

.menu-icon {
  @apply h-7 w-14 text-blue-500 mb-2;
}

.menu-block span {
  @apply font-medium text-gray-800 dark:text-gray-200;
}
</style>
