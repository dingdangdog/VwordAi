<template>
  <div class="container mx-auto p-4">
    <div v-if="loading" class="flex justify-center items-center py-4">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"
      ></div>
    </div>

    <div v-else>
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ isNewChapter ? "新建章节" : "编辑章节" }}
        </h1>
        <div class="flex space-x-4">
          <button @click="goBack" class="btn btn-secondary">返回</button>
          <button
            @click="submitForm"
            class="btn btn-primary"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="mr-2">处理中...</span>
            {{ isNewChapter ? "创建" : "保存" }}
          </button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-2">
          <form @submit.prevent="submitForm">
            <div class="mb-4">
              <label
                for="name"
                class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >章节名称</label
              >
              <input
                type="text"
                id="name"
                v-model="form.name"
                class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
                placeholder="请输入章节名称"
                required
              />
              <p
                v-if="errors.name"
                class="mt-1 text-sm text-red-600 dark:text-red-500"
              >
                {{ errors.name }}
              </p>
            </div>

            <div class="mb-4">
              <label
                for="text"
                class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >章节文本内容</label
              >
              <textarea
                id="text"
                v-model="form.text"
                rows="12"
                class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
                placeholder="请输入需要转换为语音的文本内容"
              ></textarea>
            </div>

            <div class="mb-4">
              <div class="flex justify-between items-center mb-2">
                <h4
                  class="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  章节语音设置
                </h4>
                <button
                  type="button"
                  class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  @click="showVoiceSettings = !showVoiceSettings"
                >
                  {{ showVoiceSettings ? "收起" : "展开" }}
                </button>
              </div>

              <div
                v-if="showVoiceSettings"
                class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md"
              >
                <div class="grid md:grid-cols-2 gap-4">
                  <div class="flex justify-between items-center space-x-4">
                    <label
                      for="serviceProvider"
                      class="w-24 text-right block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >服务商</label
                    >
                    <select
                      id="serviceProvider"
                      v-model="form.settings.serviceProvider"
                      class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
                    >
                      <option value="">未选择</option>
                      <option
                        v-for="provider in serviceProviders"
                        :key="provider.id"
                        :value="provider.id"
                      >
                        {{ provider.name }}
                      </option>
                    </select>
                  </div>

                  <div class="flex justify-between items-center space-x-4">
                    <label
                      for="voice"
                      class="w-24 text-right block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >声音角色</label
                    >
                    <div class="w-full">
                      <select
                        id="voice"
                        v-model="form.settings.voice"
                        class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
                        :disabled="
                          !form.settings.serviceProvider || isLoadingVoiceRoles
                        "
                      >
                        <option value="">未选择</option>
                        <option
                          v-for="role in voiceRoles"
                          :key="role.id"
                          :value="role.id"
                        >
                          {{ role.name }} ({{
                            role.gender === "male"
                              ? "男声"
                              : role.gender === "female"
                                ? "女声"
                                : "中性"
                          }})
                        </option>
                      </select>
                      <div
                        v-if="isLoadingVoiceRoles"
                        class="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        <div
                          class="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-between items-center space-x-4">
                    <label
                      for="speed"
                      class="w-24 text-right block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >语速 ({{ form.settings.speed || 1 }})</label
                    >
                    <input
                      type="range"
                      id="speed"
                      v-model.number="form.settings.speed"
                      min="0.5"
                      max="2"
                      step="0.1"
                      class="w-full mt-1"
                    />
                  </div>

                  <div class="flex justify-between items-center space-x-4">
                    <label
                      for="emotion"
                      class="w-24 text-right block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >情感</label
                    >
                    <select
                      id="emotion"
                      v-model="form.settings.emotion"
                      class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
                      :disabled="!form.settings.serviceProvider"
                    >
                      <option value="">未选择</option>
                      <option
                        v-for="emotion in emotions"
                        :key="emotion.id"
                        :value="emotion.id"
                      >
                        {{ emotion.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useProjectsStore } from "@/stores/projects";
import { useToast } from "vue-toastification";
import type { TTSSettings, VoiceRole } from "@/types";
import { ttsService, SUPPORTED_PROVIDERS } from "@/services/tts";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const projectsStore = useProjectsStore();

// Get service providers from the TTS service
const serviceProviders = ref(SUPPORTED_PROVIDERS);
const voiceRoles = ref<VoiceRole[]>([]);
const isLoadingVoiceRoles = ref(false);

// Component state
const loading = ref(true);
const isSubmitting = ref(false);
const showVoiceSettings = ref(true);
const isNewChapter = ref(true);

// Emotion options
const emotions = ref([
  { id: "neutral", name: "平静" },
  { id: "happy", name: "快乐" },
  { id: "sad", name: "伤感" },
]);

const errors = reactive({
  name: "",
});

// Initialize form
const form = reactive({
  name: "",
  text: "",
  settings: {
    serviceProvider: "",
    voice: "",
    speed: 1,
    pitch: 0,
    volume: 100,
    emotion: "",
  } as TTSSettings,
});

const projectId = computed(() => route.params.projectId as string);
const chapterId = computed(() => route.params.chapterId as string);

// Load chapter data if editing
onMounted(async () => {
  try {
    if (chapterId.value && chapterId.value !== "new") {
      isNewChapter.value = false;
      const chapter = await projectsStore.getChapter(chapterId.value);

      if (chapter) {
        form.name = chapter.name || "";
        form.text = chapter.text || "";
        form.settings = {
          serviceProvider: chapter.settings?.serviceProvider || "",
          voice: chapter.settings?.voice || "",
          speed:
            chapter.settings?.speed !== undefined ? chapter.settings.speed : 1,
          pitch:
            chapter.settings?.pitch !== undefined ? chapter.settings.pitch : 0,
          volume:
            chapter.settings?.volume !== undefined
              ? chapter.settings.volume
              : 100,
          emotion: chapter.settings?.emotion || "",
        };

        // Load voice roles if needed
        if (form.settings.serviceProvider) {
          loadVoiceRoles(form.settings.serviceProvider);
        }
      } else {
        toast.error("章节加载失败");
        goBack();
      }
    } else {
      // New chapter - load default settings from project
      const project = projectsStore.projects.find(
        (p) => p.id === projectId.value
      );
      if (project && project.defaultVoiceSettings) {
        form.settings = {
          serviceProvider: project.defaultVoiceSettings.serviceProvider || "",
          voice: project.defaultVoiceSettings.voice || "",
          speed: project.defaultVoiceSettings.speed || 1,
          pitch: project.defaultVoiceSettings.pitch || 0,
          volume: project.defaultVoiceSettings.volume || 100,
          emotion: project.defaultVoiceSettings.emotion || "",
        };

        // Load voice roles if needed
        if (form.settings.serviceProvider) {
          loadVoiceRoles(form.settings.serviceProvider);
        }
      }
    }
  } catch (error) {
    console.error("Error loading chapter:", error);
    toast.error("章节加载失败");
  } finally {
    loading.value = false;
  }
});

// Watch for changes in the service provider and update voice roles
watchEffect(() => {
  if (form.settings.serviceProvider) {
    loadVoiceRoles(form.settings.serviceProvider);
    // Reset voice role when changing provider if current voice isn't from this provider
    if (!isLoadingVoiceRoles.value && voiceRoles.value.length > 0) {
      const voiceExists = voiceRoles.value.some(
        (role) => role.id === form.settings.voice
      );
      if (!voiceExists) {
        form.settings.voice = "";
      }
    }
  }
});

async function loadVoiceRoles(providerId: string) {
  isLoadingVoiceRoles.value = true;
  try {
    const result = await ttsService.getVoiceRoles(providerId);
    if (result.success && result.data) {
      voiceRoles.value = result.data;
    } else {
      voiceRoles.value = [];
    }
  } catch (error) {
    console.error("Failed to load voice roles:", error);
    voiceRoles.value = [];
  } finally {
    isLoadingVoiceRoles.value = false;
  }
}

function validateForm() {
  errors.name = "";

  if (!form.name.trim()) {
    errors.name = "请输入章节名称";
    return false;
  }

  return true;
}

function goBack() {
  router.push(`/projects/${projectId.value}`);
}

async function submitForm() {
  if (!validateForm()) return;

  isSubmitting.value = true;

  try {
    let result;

    if (isNewChapter.value) {
      // Create new chapter
      result = await projectsStore.createChapter(
        projectId.value,
        form.name,
        form.text,
        form.settings
      );
    } else {
      // Update existing chapter
      result = await projectsStore.updateChapter(chapterId.value, {
        name: form.name,
        text: form.text,
        settings: form.settings,
      });
    }

    if (result) {
      toast.success(isNewChapter.value ? "章节创建成功" : "章节更新成功");
      goBack();
    } else {
      toast.error(isNewChapter.value ? "章节创建失败" : "章节更新失败");
    }
  } catch (error) {
    console.error("Error saving chapter:", error);
    toast.error(isNewChapter.value ? "章节创建失败" : "章节更新失败");
  } finally {
    isSubmitting.value = false;
  }
}
</script>
