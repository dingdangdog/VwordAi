<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
      ></div>
    </div>

    <div v-else-if="!project" class="text-center py-12">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        项目不存在
      </h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">
        您请求的项目不存在或已被删除。
      </p>
      <router-link to="/projects" class="btn btn-primary">
        返回项目列表
      </router-link>
    </div>

    <div v-else>
      <!-- Project Header -->
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ project.title }}
          </h1>
          <p
            v-if="project.description"
            class="text-gray-600 dark:text-gray-300 mt-1"
          >
            {{ project.description }}
          </p>
        </div>
        <div class="flex mt-4 md:mt-0">
          <button
            @click="openCreateChapterModal"
            class="btn btn-primary flex items-center mr-2"
          >
            <PlusIcon class="h-5 w-5 mr-2" />
            新建章节
          </button>
          <button
            @click="openEditProjectModal"
            class="btn btn-secondary flex items-center"
          >
            <PencilSquareIcon class="h-5 w-5 mr-2" />
            编辑项目
          </button>
        </div>
      </div>

      <!-- Project Settings Summary -->
      <div class="card mb-6 p-4">
        <h3 class="text-md font-medium text-gray-900 dark:text-white mb-2">
          项目默认语音设置
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-if="project.defaultVoiceSettings?.serviceProvider"
            class="text-sm"
          >
            <span class="text-gray-500 dark:text-gray-400">服务商：</span>
            <span class="text-gray-900 dark:text-white">{{
              getServiceProviderName(
                project.defaultVoiceSettings?.serviceProvider
              )
            }}</span>
          </div>
          <div v-if="project.defaultVoiceSettings?.voice" class="text-sm">
            <span class="text-gray-500 dark:text-gray-400">声音角色：</span>
            <span class="text-gray-900 dark:text-white">{{
              getVoiceRoleName(project.defaultVoiceSettings?.voice)
            }}</span>
          </div>
          <div v-if="project.defaultVoiceSettings?.speed" class="text-sm">
            <span class="text-gray-500 dark:text-gray-400">语速：</span>
            <span class="text-gray-900 dark:text-white">{{
              project.defaultVoiceSettings?.speed
            }}</span>
          </div>
          <!-- <div v-if="project.defaultVoiceSettings?.pitch" class="text-sm">
            <span class="text-gray-500 dark:text-gray-400">音调：</span>
            <span class="text-gray-900 dark:text-white">{{ project.defaultVoiceSettings?.pitch }}</span>
          </div>
          <div v-if="project.defaultVoiceSettings?.volume" class="text-sm">
            <span class="text-gray-500 dark:text-gray-400">音量：</span>
            <span class="text-gray-900 dark:text-white">{{ project.defaultVoiceSettings?.volume }}</span>
          </div> -->
          <div v-if="project.defaultVoiceSettings?.emotion" class="text-sm">
            <span class="text-gray-500 dark:text-gray-400">情感：</span>
            <span class="text-gray-900 dark:text-white">{{
              getEmotionName(project.defaultVoiceSettings?.emotion)
            }}</span>
          </div>
        </div>
        <div
          v-if="!hasDefaultSettings"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          未设置默认语音参数，请在编辑项目中设置默认参数或在创建章节时单独设置。
        </div>
      </div>

      <!-- Chapters List -->
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          章节列表
        </h2>

        <div v-if="chapters.length === 0" class="card text-center py-8">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
            暂无章节
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-5">
            该项目还没有任何章节，请点击"新建章节"按钮开始创建。
          </p>
          <button
            @click="openCreateChapterModal"
            class="btn btn-primary mx-auto"
          >
            创建第一个章节
          </button>
        </div>

        <div v-else>
          <div
            class="overflow-hidden bg-white dark:bg-gray-800 shadow sm:rounded-md"
          >
            <ul class="divide-y divide-gray-200 dark:divide-gray-700">
              <li v-for="chapter in chapters" :key="chapter.id">
                <div class="block hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div class="px-4 py-4 sm:px-6">
                    <div
                      class="flex items-center justify-between"
                      @click="toggleExpandChapter(chapter.id)"
                    >
                      <div class="min-w-0 flex-1 cursor-pointer">
                        <div class="flex items-center justify-between">
                          <p class="text-md font-medium text-blue-600 truncate">
                            {{ chapter.name }}
                          </p>
                          <div class="ml-2 flex-shrink-0 flex">
                            <p
                              class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                              :class="{
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
                                  chapter.text.length > 0,
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200':
                                  chapter.text.length === 0,
                              }"
                            >
                              {{
                                chapter.text.length > 0
                                  ? "已添加内容"
                                  : "无内容"
                              }}
                            </p>
                          </div>
                        </div>
                        <div class="mt-2 flex justify-between">
                          <div class="text-sm text-gray-500 dark:text-gray-400">
                            <p>
                              最后更新：{{ formatDate(chapter.updateBy) }}
                            </p>
                            <p class="mt-1 line-clamp-1">
                              {{ chapter.text || "暂无内容" }}
                            </p>
                          </div>
                          <div class="ml-4 flex-shrink-0 flex">
                            <button
                              @click.stop="openEditChapterModal(chapter)"
                              class="mr-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              编辑
                            </button>
                            <button
                              @click.stop="confirmDeleteChapter(chapter)"
                              class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                      <div class="ml-5 flex-shrink-0 cursor-pointer">
                        <ChevronDownIcon
                          v-if="expandedChapters[chapter.id]"
                          class="h-5 w-5 text-gray-400"
                        />
                        <ChevronRightIcon
                          v-else
                          class="h-5 w-5 text-gray-400"
                        />
                      </div>
                    </div>

                    <!-- Expanded Chapter Content -->
                    <div
                      v-if="expandedChapters[chapter.id]"
                      class="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4"
                    >
                      <div class="mb-4">
                        <h4
                          class="text-md font-medium text-gray-900 dark:text-white mb-2"
                        >
                          章节内容
                        </h4>
                        <div
                          class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md max-h-60 overflow-y-auto"
                        >
                          <p
                            class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
                          >
                            {{ chapter.text || "暂无内容" }}
                          </p>
                        </div>
                      </div>

                      <!-- Chapter Synthesis Component -->
                      <ChapterSynthesis
                        :chapter="chapter"
                        @edit-settings="openEditChapterModal(chapter)"
                      />
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Batch Operations -->
      <div v-if="chapters.length > 0" class="card p-4 text-center">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
          批量操作
        </h3>
        <div class="flex flex-wrap justify-center gap-4">
          <button
            class="btn btn-primary flex items-center"
            @click="startBatchSynthesis"
          >
            <SpeakerWaveIcon class="h-5 w-5 mr-2" />
            合成全部章节
          </button>
          <button
            class="btn btn-secondary flex items-center"
            @click="exportProject"
          >
            <ArrowDownTrayIcon class="h-5 w-5 mr-2" />
            导出项目设置
          </button>
        </div>
      </div>

      <!-- Edit Project Modal -->
      <ProjectFormModal
        v-if="showEditProjectModal"
        title="编辑项目"
        submitText="保存"
        :initialData="project"
        @close="showEditProjectModal = false"
        @submit="updateProject"
      />

      <!-- Create Chapter Modal -->
      <ChapterFormModal
        v-if="showCreateChapterModal"
        title="创建新章节"
        submitText="创建"
        :initialData="{
          name: '',
          text: '',
          settings: { ...project?.defaultVoiceSettings },
        }"
        @close="showCreateChapterModal = false"
        @submit="createChapter"
      />

      <!-- Edit Chapter Modal -->
      <ChapterFormModal
        v-if="showEditChapterModal"
        title="编辑章节"
        submitText="保存"
        :initialData="editingChapter || {}"
        @close="showEditChapterModal = false"
        @submit="updateChapter"
      />

      <!-- Delete Confirmation Modal -->
      <ConfirmationModal
        v-if="showDeleteChapterModal"
        title="删除章节"
        :message="getDeleteMessage()"
        confirmText="删除"
        confirmButtonClass="btn-danger"
        @close="showDeleteChapterModal = false"
        @confirm="deleteChapter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useProjectsStore } from "@/stores/projects";
import { useToast } from "vue-toastification";
import type { Project, Chapter } from "@/types";
import ProjectFormModal from "@/components/projects/ProjectFormModal.vue";
import ChapterFormModal from "@/components/chapters/ChapterFormModal.vue";
import ConfirmationModal from "@/components/common/ConfirmationModal.vue";
import ChapterSynthesis from "@/components/chapters/ChapterSynthesis.vue";
import {
  PlusIcon,
  PencilSquareIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  SpeakerWaveIcon,
  ArrowDownTrayIcon,
} from "@heroicons/vue/24/outline";
import { batchSynthesizeChapters } from "@/utils/tts-utils";
import { formatDate } from "@/utils/common";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const projectsStore = useProjectsStore();

const loading = ref(true);
const projectId = computed(() => route.params.id as string);
const project = computed(
  () => projectsStore.projects.find((p) => p.id === projectId.value) || null
);
const chapters = computed(() => {
  if (!projectId.value) return [];
  return projectsStore.chapters
    .filter((c) => c.projectId === projectId.value)
    .sort((a, b) => {
      return (
        new Date(a.createBy).getTime() - new Date(b.createBy).getTime()
      );
    });
});

const hasDefaultSettings = computed(() => {
  if (!project.value || !project.value.defaultVoiceSettings) return false;
  const settings = project.value.defaultVoiceSettings;
  return !!(
    settings.serviceProvider ||
    settings.voice ||
    settings.speed ||
    settings.pitch ||
    settings.volume ||
    settings.emotion
  );
});

// Modal states
const showEditProjectModal = ref(false);
const showCreateChapterModal = ref(false);
const showEditChapterModal = ref(false);
const showDeleteChapterModal = ref(false);

// Form data
const editingChapter = ref<Chapter | null>(null);
const deletingChapter = ref<Chapter | null>(null);

// For expanded chapters
const expandedChapters = ref<Record<string, boolean>>({});

// Load data on mount and when project ID changes
onMounted(() => {
  loadData();
});

watch(
  () => route.params.id,
  () => {
    loadData();
  }
);

function loadData() {
  loading.value = true;
  projectsStore.loadProjects();
  projectsStore.loadChaptersByProjectId(projectId.value);

  // Set current project
  projectsStore.setCurrentProject(projectId.value);

  setTimeout(() => {
    loading.value = false;

    // If project doesn't exist, show error
    if (!project.value) {
      toast.error("项目不存在或已被删除");
    }
  }, 500);
}

// Modal functions
function openEditProjectModal() {
  showEditProjectModal.value = true;
}

function openCreateChapterModal() {
  showCreateChapterModal.value = true;
}

function openEditChapterModal(chapter: Chapter) {
  editingChapter.value = { ...chapter };
  showEditChapterModal.value = true;
}

function confirmDeleteChapter(chapter: Chapter) {
  deletingChapter.value = chapter;
  showDeleteChapterModal.value = true;
}

// CRUD operations
async function updateProject(projectData: {
  title: string;
  description: string;
  defaultVoiceSettings: any;
}) {
  if (!project.value) return;

  const result = await projectsStore.updateProject(project.value.id, {
    title: projectData.title,
    description: projectData.description,
    defaultVoiceSettings: projectData.defaultVoiceSettings,
  });

  if (result) {
    toast.success(`项目 "${projectData.title}" 更新成功！`);
    showEditProjectModal.value = false;
  } else {
    toast.error("更新项目失败！");
  }
}

async function createChapter(chapterData: {
  name: string;
  text: string;
  settings: any;
}) {
  if (!project.value) return;

  const newChapter = await projectsStore.createChapter(
    project.value.id,
    chapterData.name,
    chapterData.text
  );

  if (newChapter) {
    // Update settings if they differ from project defaults
    if (
      JSON.stringify(chapterData.settings) !==
      JSON.stringify(project.value.defaultVoiceSettings)
    ) {
      await projectsStore.updateChapter(newChapter.id, {
        settings: chapterData.settings,
      });
    }

    toast.success(`章节 "${chapterData.name}" 创建成功！`);
    showCreateChapterModal.value = false;
  } else {
    toast.error("创建章节失败！");
  }
}

async function updateChapter(chapterData: {
  name: string;
  text: string;
  settings: any;
}) {
  if (!editingChapter.value) return;

  const result = await projectsStore.updateChapter(editingChapter.value.id, {
    name: chapterData.name,
    text: chapterData.text,
    settings: chapterData.settings,
  });

  if (result) {
    toast.success(`章节 "${chapterData.name}" 更新成功！`);
    showEditChapterModal.value = false;
  } else {
    toast.error("更新章节失败！");
  }
}

async function deleteChapter() {
  if (!deletingChapter.value) return;

  const result = await projectsStore.deleteChapter(deletingChapter.value.id);

  if (result) {
    toast.success(`章节 "${deletingChapter.value.name}" 已删除！`);
    showDeleteChapterModal.value = false;
  } else {
    toast.error("删除章节失败！");
  }
}

// Batch operations
async function startBatchSynthesis() {
  if (chapters.value.length === 0) {
    toast.error("项目中没有章节，无法进行批量合成");
    return;
  }

  const chaptersWithText = chapters.value.filter(
    (c) => c.text.trim().length > 0
  );
  if (chaptersWithText.length === 0) {
    toast.error("所有章节都是空的，无法进行合成");
    return;
  }

  // 检查章节是否都有语音设置
  const chaptersWithoutSettings = chaptersWithText.filter(
    (c) => !c.settings.serviceProvider || !c.settings.voice
  );

  if (chaptersWithoutSettings.length > 0) {
    toast.error(
      `有 ${chaptersWithoutSettings.length} 个章节缺少语音设置，请先配置`
    );
    return;
  }

  toast.info("开始批量合成，这可能需要一些时间...");

  try {
    // 显示进度通知
    const progressToastId = toast.info("合成进度: 0%", {
      timeout: false,
      closeOnClick: false,
    });

    // 执行批量合成
    const results = await batchSynthesizeChapters(
      chaptersWithText,
      (progress, chapterIndex) => {
        // 更新进度通知
        toast.update(progressToastId, {
          content: `合成进度: ${progress}% (${chapterIndex + 1}/${chaptersWithText.length})`,
        });
      }
    );

    // 关闭进度通知
    toast.dismiss(progressToastId);

    // 显示成功消息
    toast.success(`成功合成 ${Object.keys(results).length} 个章节的语音`);

    // 扩展已合成的章节，以便用户查看
    Object.keys(results).forEach((chapterId) => {
      expandedChapters.value[chapterId] = true;
    });
  } catch (error) {
    toast.error(
      `批量合成失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}

function exportProject() {
  toast.info("导出功能正在开发中...");
  // This will be implemented later
}

// Helper functions to get display names
function getServiceProviderName(id: string): string {
  const providers = [
    { id: "aliyun", name: "阿里云" },
    { id: "tencent", name: "腾讯云" },
    { id: "baidu", name: "百度智能云" },
    { id: "azure", name: "Azure Speech Service" },
  ];
  return providers.find((p) => p.id === id)?.name || id;
}

function getVoiceRoleName(id: string): string {
  // This would normally fetch from a store or API
  return id;
}

function getEmotionName(id: string): string {
  const emotions = [
    { id: "neutral", name: "平静" },
    { id: "happy", name: "快乐" },
    { id: "sad", name: "伤感" },
  ];
  return emotions.find((e) => e.id === id)?.name || id;
}

function getDeleteMessage(): string {
  if (!deletingChapter.value) return "";
  return `确定要删除章节 "${deletingChapter.value.name}" 吗？此操作无法恢复。`;
}

function toggleExpandChapter(chapterId: string) {
  expandedChapters.value[chapterId] = !expandedChapters.value[chapterId];
}
</script>
