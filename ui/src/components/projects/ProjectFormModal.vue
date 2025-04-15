<template>
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="w-full h-full flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="close"
      ></div>

      <!-- Modal panel -->
      <div class="w-full h-full align-bottom flex justify-center items-center">
        <div
          class="text-left bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 sm:p-6 shadow-xl transform transition-all"
        >
          <div class="flex justify-between items-center mb-4">
            <h3
              class="text-lg leading-6 font-medium text-gray-900 dark:text-white"
              id="modal-title"
            >
              {{ title }}
            </h3>
            <button
              @click="close"
              class="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>

          <form @submit.prevent="submitForm">
            <div class="mb-4">
              <label
                for="title"
                class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >项目名称</label
              >
              <input
                type="text"
                id="title"
                v-model="form.title"
                class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="请输入项目名称"
                required
              />
              <p
                v-if="errors.title"
                class="mt-1 text-sm text-red-600 dark:text-red-500"
              >
                {{ errors.title }}
              </p>
            </div>

            <div class="mb-4">
              <label
                for="description"
                class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >项目描述 (可选)</label
              >
              <textarea
                id="description"
                v-model="form.description"
                rows="3"
                class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="请输入项目描述"
              ></textarea>
            </div>

            <div class="mb-4">
              <h4
                class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                默认语音设置 (可选)
              </h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
                这些设置将作为新建章节的默认值，您可以在创建章节后单独修改每个章节的设置。
              </p>

              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    for="serviceProvider"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >服务商</label
                  >
                  <select
                    id="serviceProvider"
                    v-model="form.defaultVoiceSettings.serviceProvider"
                    class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    @change="onProviderChange"
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

                <div>
                  <label
                    for="voice"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >声音角色</label
                  >
                  <select
                    id="voice"
                    v-model="form.defaultVoiceSettings.voice"
                    class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    :disabled="!form.defaultVoiceSettings.serviceProvider"
                    @change="onVoiceChange"
                  >
                    <option value="">未选择</option>
                    <option
                      v-for="role in filteredVoiceRoles"
                      :key="role.code"
                      :value="role.code"
                    >
                      {{ role.name }} ({{
                        role.gender === "0" ? "女声" : "男声"
                      }})
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    for="speed"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >语速 ({{ form.defaultVoiceSettings.speed || 1 }})</label
                  >
                  <input
                    type="range"
                    id="speed"
                    v-model.number="form.defaultVoiceSettings.speed"
                    min="0.5"
                    max="2"
                    step="0.1"
                    class="w-full mt-1"
                  />
                </div>

                <!-- <div>
                  <label for="pitch" class="block text-sm font-medium text-gray-700 dark:text-gray-300">音调 ({{ form.defaultVoiceSettings.pitch || 0 }})</label>
                  <input
                    type="range"
                    id="pitch"
                    v-model.number="form.defaultVoiceSettings.pitch"
                    min="-10"
                    max="10"
                    step="1"
                    class="w-full mt-1"
                  />
                </div> -->

                <!-- <div>
                  <label for="volume" class="block text-sm font-medium text-gray-700 dark:text-gray-300">音量 ({{ form.defaultVoiceSettings.volume || 100 }})</label>
                  <input
                    type="range"
                    id="volume"
                    v-model.number="form.defaultVoiceSettings.volume"
                    min="0"
                    max="100"
                    step="1"
                    class="w-full mt-1"
                  />
                </div> -->

                <div>
                  <label
                    for="emotion"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >情感</label
                  >
                  <select
                    id="emotion"
                    v-model="form.defaultVoiceSettings.emotion"
                    class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    :disabled="
                      !form.defaultVoiceSettings.serviceProvider ||
                      !form.defaultVoiceSettings.voice ||
                      filteredEmotions.length === 0
                    "
                  >
                    <option value="">未选择</option>
                    <option
                      v-for="emotion in filteredEmotions"
                      :key="emotion.code"
                      :value="emotion.code"
                    >
                      {{ emotion.name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                class="btn btn-primary w-full sm:w-auto sm:ml-3"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" class="mr-2">处理中...</span>
                {{ submitText }}
              </button>
              <button
                type="button"
                class="btn btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
                @click="close"
                :disabled="isSubmitting"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watchEffect, computed } from "vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";
import type { VoiceSettings } from "@/types";
import { useProjectsStore } from "@/stores/projects";

const projectsStore = useProjectsStore();

// Make sure voice models are loaded
if (projectsStore.voiceModels.length === 0) {
  projectsStore.loadVoiceModels();
}

// Service providers definition
const serviceProviders = ref([
  { id: "aliyun", name: "阿里云" },
  { id: "tencent", name: "腾讯云" },
  { id: "baidu", name: "百度智能云" },
  { id: "azure", name: "Azure Speech Service" },
]);

// Computed properties for filtered voice roles and emotions based on model data
const filteredVoiceRoles = computed(() => {
  if (!form.defaultVoiceSettings.serviceProvider) return [];
  return projectsStore.getVoiceModelsByProvider(
    form.defaultVoiceSettings.serviceProvider
  );
});

const filteredEmotions = computed(() => {
  if (!form.defaultVoiceSettings.voice) return [];

  // Find selected voice model
  const selectedModel = projectsStore.getVoiceModelByCode(
    form.defaultVoiceSettings.voice
  );

  if (selectedModel && selectedModel.emotions) {
    return selectedModel.emotions;
  }

  // If the selected model doesn't have emotions, try to find emotions from another model of the same provider
  if (form.defaultVoiceSettings.serviceProvider) {
    const providerModels = projectsStore.getVoiceModelsByProvider(
      form.defaultVoiceSettings.serviceProvider
    );
    for (const model of providerModels) {
      if (model.emotions && model.emotions.length > 0) {
        return model.emotions;
      }
    }
  }

  return [];
});

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  submitText: {
    type: String,
    default: "提交",
  },
  initialData: {
    type: Object,
    default: () => ({
      title: "",
      description: "",
      defaultVoiceSettings: {
        speed: 1,
        pitch: 0,
        volume: 100,
      },
    }),
  },
});

const emit = defineEmits(["close", "submit"]);

const isSubmitting = ref(false);
const errors = reactive({
  title: "",
});

// Initialize form with props or default values
const form = reactive({
  title: "",
  description: "",
  defaultVoiceSettings: {
    serviceProvider: "",
    voice: "",
    speed: 1,
    pitch: 0,
    volume: 100,
    emotion: "",
  } as VoiceSettings,
});

// Watch for changes in initialData and update form
watchEffect(() => {
  if (props.initialData) {
    form.title = props.initialData.title || "";
    form.description = props.initialData.description || "";
    form.defaultVoiceSettings = {
      serviceProvider:
        props.initialData.defaultVoiceSettings?.serviceProvider || "",
      voice: props.initialData.defaultVoiceSettings?.voice || "",
      speed:
        props.initialData.defaultVoiceSettings?.speed !== undefined
          ? props.initialData.defaultVoiceSettings.speed
          : 1,
      pitch:
        props.initialData.defaultVoiceSettings?.pitch !== undefined
          ? props.initialData.defaultVoiceSettings.pitch
          : 0,
      volume:
        props.initialData.defaultVoiceSettings?.volume !== undefined
          ? props.initialData.defaultVoiceSettings.volume
          : 100,
      emotion: props.initialData.defaultVoiceSettings?.emotion || "",
    };
  }
});

function onProviderChange() {
  // Reset voice and emotion when provider changes
  form.defaultVoiceSettings.voice = "";
  form.defaultVoiceSettings.emotion = "";
}

function onVoiceChange() {
  // Reset emotion when voice changes
  form.defaultVoiceSettings.emotion = "";
}

function close() {
  emit("close");
}

function validateForm() {
  let isValid = true;
  errors.title = "";

  if (!form.title.trim()) {
    errors.title = "项目名称不能为空";
    isValid = false;
  }

  return isValid;
}

function submitForm() {
  if (!validateForm()) return;

  isSubmitting.value = true;

  try {
    // Prepare data for submission
    const projectData = {
      title: form.title.trim(),
      description: form.description.trim(),
      defaultVoiceSettings: { ...form.defaultVoiceSettings },
    };

    // Emit submit event with form data
    emit("submit", projectData);
  } catch (error) {
    console.error("Form submission error:", error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
