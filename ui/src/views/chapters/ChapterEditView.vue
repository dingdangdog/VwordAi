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

              <div v-if="showVoiceSettings" class="p-2 rounded-md">
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
import { ref, reactive, watchEffect, watch, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useProjectsStore } from "@/stores/projects";
import { useToast } from "vue-toastification";
import type { VoiceSettings } from "@/types";
import { SUPPORTED_TTS_PROVIDERS } from "@/stores/settings";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const projectsStore = useProjectsStore();

// Get service providers from the settings
const serviceProviders = ref(SUPPORTED_TTS_PROVIDERS);
const isLoadingVoiceRoles = ref(false);

// Component state
const loading = ref(true);
const isSubmitting = ref(false);
const showVoiceSettings = ref(true);
const isNewChapter = ref(true);

// Refs for voice models and emotions
const voiceRoleModels = ref<any[]>([]);
const emotionModels = ref<any[]>([]);

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
  } as VoiceSettings,
});

// Watch for service provider changes to load voice roles
watch(
  () => form.settings.serviceProvider,
  async (newProvider) => {
    if (!newProvider) {
      voiceRoleModels.value = [];
      return;
    }

    isLoadingVoiceRoles.value = true;
    try {
      const models = await projectsStore.getVoiceModelsByProvider(newProvider);
      voiceRoleModels.value = models.map((model) => ({
        id: model.code,
        name: model.name,
        gender: model.gender === "0" ? "female" : "male",
        language: model.lang.includes("中文") ? "zh-CN" : "en-US",
      }));
    } catch (error) {
      console.error("Failed to load voice roles:", error);
      voiceRoleModels.value = [];
    } finally {
      isLoadingVoiceRoles.value = false;
    }
  },
  { immediate: true }
);

// Watch for voice changes to load emotions
watch(
  [() => form.settings.serviceProvider, () => form.settings.voice],
  async ([newProvider, newVoice]) => {
    if (!newProvider || !newVoice) {
      emotionModels.value = [];
      return;
    }

    try {
      // First try to get emotions from the selected voice model
      const selectedModel = await projectsStore.getVoiceModelByCode(newVoice);

      if (
        selectedModel &&
        selectedModel.emotions &&
        selectedModel.emotions.length > 0
      ) {
        emotionModels.value = selectedModel.emotions.map((emotion) => ({
          id: emotion.code,
          name: emotion.name,
        }));
        return;
      }

      // If not found, try to find emotions from any model with same provider
      const providerModels =
        await projectsStore.getVoiceModelsByProvider(newProvider);
      for (const model of providerModels) {
        if (model.emotions && model.emotions.length > 0) {
          emotionModels.value = model.emotions.map((emotion) => ({
            id: emotion.code,
            name: emotion.name,
          }));
          return;
        }
      }

      // Fallback to empty array
      emotionModels.value = [];
    } catch (error) {
      console.error("Failed to load emotions:", error);
      emotionModels.value = [];
    }
  },
  { immediate: true }
);

// Use the refs in our component
const voiceRoles = computed(() => voiceRoleModels.value);
const emotions = computed(() => emotionModels.value);

const errors = reactive({
  name: "",
});

const projectId = computed(() => route.params.projectId as string);
const chapterId = computed(() => route.params.chapterId as string);

// Load chapter data if editing
onMounted(async () => {
  try {
    // Make sure voice models are loaded
    if (projectsStore.voiceModels.length === 0) {
      await projectsStore.loadVoiceModels();
    }

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
      }
    }
  } catch (error) {
    console.error("Error loading chapter:", error);
    toast.error("章节加载失败");
  } finally {
    loading.value = false;
  }
});

// Watch for changes in the service provider
watchEffect(async () => {
  if (form.settings.serviceProvider) {
    // Reset voice and emotion when service provider changes
    const currentProvider = form.settings.serviceProvider;
    const currentVoice = form.settings.voice;

    // Check if current voice belongs to this provider
    if (currentVoice) {
      try {
        const models =
          await projectsStore.getVoiceModelsByProvider(currentProvider);
        const voiceExists = models.some((model) => model.code === currentVoice);

        if (!voiceExists) {
          form.settings.voice = "";
          form.settings.emotion = "";
        }
      } catch (error) {
        console.error("Error checking voice compatibility:", error);
      }
    }
  }
});

// 监听语音角色变化，更新情感选项
watch(
  () => form.settings.voice,
  async (newVoice, oldVoice) => {
    if (newVoice && newVoice !== oldVoice) {
      console.log(
        `Voice changed from ${oldVoice} to ${newVoice}, updating emotions`
      );

      // 检查当前情感是否对该声音有效
      const currentEmotion = form.settings.emotion;
      if (currentEmotion) {
        try {
          const model = await projectsStore.getVoiceModelByCode(newVoice);

          // 检查这个模型是否有情感选项
          if (model && model.emotions && model.emotions.length > 0) {
            const emotionExists = model.emotions.some(
              (e) => e.code === currentEmotion
            );

            if (!emotionExists) {
              console.log(
                `Emotion ${currentEmotion} is not valid for voice ${newVoice}, resetting`
              );
              form.settings.emotion = ""; // 重置情感设置
            } else {
              console.log(
                `Emotion ${currentEmotion} is valid for voice ${newVoice}, keeping it`
              );
            }
          } else {
            console.log(
              `Voice ${newVoice} has no emotions, resetting emotion setting`
            );
            form.settings.emotion = ""; // 如果新声音没有情感设置，重置情感
          }
        } catch (error) {
          console.error("Error checking emotion compatibility:", error);
          form.settings.emotion = ""; // 如果出错，重置情感设置
        }
      }
    }
  },
  { immediate: true }
);

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

    // Create a serializable copy of the settings object
    const serializedSettings = JSON.parse(JSON.stringify(form.settings));

    if (isNewChapter.value) {
      // Create new chapter
      result = await projectsStore.createChapter(
        projectId.value,
        form.name,
        form.text,
        serializedSettings
      );
    } else {
      // Update existing chapter
      result = await projectsStore.updateChapter(chapterId.value, {
        name: form.name,
        text: form.text,
        settings: serializedSettings,
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
