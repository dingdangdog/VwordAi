<template>
  <div class="py-8">
    <div class="text-center mb-12">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">文本转语音软件</h1>
      <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
        欢迎使用文本转语音软件。本软件可以让您轻松地将文本转换为高质量的语音。
      </p>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      <div class="card flex flex-col items-center p-6 text-center">
        <DocumentTextIcon class="h-12 w-12 text-blue-600 mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">项目与章节管理</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          方便地管理您的文本内容，以项目和章节为单位进行组织。
        </p>
        <router-link to="/projects" class="btn btn-primary mt-auto">开始使用</router-link>
      </div>

      <div class="card flex flex-col items-center p-6 text-center">
        <SpeakerWaveIcon class="h-12 w-12 text-blue-600 mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">语音合成</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          支持多种语音服务商，提供高质量的语音合成服务。
        </p>
        <router-link to="/settings" class="btn btn-primary mt-auto">配置服务</router-link>
      </div>

      <div class="card flex flex-col items-center p-6 text-center">
        <AdjustmentsHorizontalIcon class="h-12 w-12 text-blue-600 mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">个性化设置</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          调整语速、音调、音量等参数，满足您的个性化需求。
        </p>
        <router-link to="/projects" class="btn btn-primary mt-auto">创建项目</router-link>
      </div>
    </div>

    <div class="mt-12 text-center" v-if="recentProjects.length > 0">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">最近的项目</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div
          v-for="project in recentProjects"
          :key="project.id"
          class="card hover:shadow-lg transition-shadow duration-200"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ project.name }}
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {{ project.description || '无描述' }}
          </p>
          <div class="flex justify-between items-center mt-4">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(project.updatedAt) }}
            </span>
            <router-link :to="`/projects/${project.id}`" class="btn btn-primary">
              打开
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useProjectsStore } from '@/stores/projects';
import { DocumentTextIcon, SpeakerWaveIcon, AdjustmentsHorizontalIcon } from '@heroicons/vue/24/outline';

const projectsStore = useProjectsStore();

onMounted(() => {
  projectsStore.loadProjects();
});

const recentProjects = computed(() => {
  return projectsStore.projectsSorted.slice(0, 3);
});

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString();
}
</script> 