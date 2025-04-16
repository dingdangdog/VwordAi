<template>
  <div class="py-8">
    <div class="text-center mb-12">
      <div class="flex justify-center items-center mb-4 space-x-4">
        <img class="h-12 w-auto" src="@/assets/logo.svg" alt="Logo" />
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          文声AI（VwordAi）
        </h1>
      </div>
      <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
        欢迎使用文声AI（VwordAi）。本软件可以让您轻松地将文本转换为高质量的语音。
      </p>
    </div>

    <div class="grid grid-cols-3 gap-4 max-w-6xl mx-auto">
      <div class="card flex flex-col items-center p-6 text-center">
        <DocumentTextIcon class="h-12 w-12 text-blue-600 mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          作品管理
        </h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          轻松管理您的文本内容，按项目和章节进行高效组织。
        </p>
        <router-link to="/projects" class="btn btn-primary mt-auto"
          >立即开始</router-link
        >
      </div>
      <div class="card flex flex-col items-center p-6 text-center">
        <SpeakerWaveIcon class="h-12 w-12 text-blue-600 mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          语音合成
        </h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          将文本高效转换为语音，支持多种TTS服务选项，满足您的需求。
        </p>
        <router-link to="/projects" class="btn btn-primary mt-auto"
          >开始合成</router-link
        >
      </div>

      <div class="card flex flex-col items-center p-6 text-center">
        <AdjustmentsHorizontalIcon class="h-12 w-12 text-blue-600 mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          自有密钥
        </h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          轻松配置您的第三方服务密钥，享受所有功能的免费使用。
        </p>
        <router-link to="/settings" class="btn btn-primary mt-auto"
          >配置服务</router-link
        >
      </div>
    </div>

    <div class="mt-12 text-center" v-if="recentProjects.length > 0">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        最近的项目
      </h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div
          v-for="project in recentProjects"
          :key="project.id"
          class="card hover:shadow-lg transition-shadow duration-200"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ project.title }}
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {{ project.description || "无描述" }}
          </p>
          <div class="flex justify-between items-center mt-4">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(project.updateAt) }}
            </span>
            <router-link
              :to="`/projects/${project.id}`"
              class="btn btn-primary"
            >
              打开
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useProjectsStore } from "@/stores/projects";
import {
  DocumentTextIcon,
  SpeakerWaveIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/vue/24/outline";
import { formatDate } from "@/utils/common";

const projectsStore = useProjectsStore();

onMounted(() => {
  projectsStore.loadProjects();
});

const recentProjects = computed(() => {
  return projectsStore.projectsSorted.slice(0, 3);
});
</script>
