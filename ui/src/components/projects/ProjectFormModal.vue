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
        class="fixed inset-0 bg-ink/60 transition-opacity"
        @click="close"
      ></div>

      <!-- Modal panel -->
      <div class="w-full h-full align-bottom flex justify-center items-center">
        <div
          class="text-left bg-surface-elevated rounded-lg px-4 pt-5 pb-4 sm:p-6 shadow-xl transform transition-all"
        >
          <div class="flex justify-between items-center mb-4">
            <h3
              class="text-lg leading-6 font-medium text-ink"
              id="modal-title"
            >
              {{ title }}
            </h3>
            <button
              @click="close"
              class="text-ink-muted hover:text-ink focus:outline-none"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>

          <form @submit.prevent="submitForm">
            <div class="mb-4">
              <FormInput
                id="title"
                v-model="form.title"
                label="项目名称"
                placeholder="请输入项目名称"
                :error="errors.title"
                required
              />
            </div>

            <div class="mb-4">
              <FormTextarea
                id="description"
                v-model="form.description"
                label="项目描述 (可选)"
                placeholder="请输入项目描述"
                :rows="3"
              />
            </div>

            <div class="mb-4">
              <h4
                class="block text-sm font-semibold text-ink mb-2"
              >
                默认语音设置 (可选)
              </h4>
              <p class="text-xs text-ink-muted mb-4">
                这些设置将作为新建章节的默认值，您可以在创建章节后单独修改每个章节的设置。
              </p>

              <div class="grid md:grid-cols-2 gap-4">
                <FormSelect
                  id="serviceProvider"
                  v-model="form.defaultVoiceSettings.serviceProvider"
                  label="服务商"
                  placeholder="未选择"
                  :options="serviceProviderOptions"
                  @change="onProviderChange"
                />

                <FormSelect
                  id="voice"
                  v-model="form.defaultVoiceSettings.voice"
                  label="声音角色"
                  placeholder="未选择"
                  :options="voiceRoleOptions"
                  :disabled="!form.defaultVoiceSettings.serviceProvider"
                  @change="onVoiceChange"
                />

                <div>
                  <label
                    for="speed"
                    class="block text-sm font-medium text-ink"
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

                <FormSelect
                  id="emotion"
                  v-model="form.defaultVoiceSettings.emotion"
                  label="情感"
                  placeholder="未选择"
                  :options="emotionOptions"
                  :disabled="
                    !form.defaultVoiceSettings.serviceProvider ||
                    !form.defaultVoiceSettings.voice ||
                    filteredEmotions.length === 0
                  "
                />
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
import { ref, reactive, watchEffect, computed, watch } from "vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";
import FormInput from "@/components/common/FormInput.vue";
import FormTextarea from "@/components/common/FormTextarea.vue";
import FormSelect from "@/components/common/FormSelect.vue";
import type { VoiceSettings } from "@/types";
import { useProjectsStore } from "@/stores/projects";
import { getTTSProviders } from "@/utils/voice-utils";

const projectsStore = useProjectsStore();

// Make sure voice models are loaded
if (projectsStore.voiceModels.length === 0) {
  projectsStore.loadVoiceModels();
}

// Use the centralized provider definition via utility function
const serviceProviders = computed(() => getTTSProviders());

// Computed properties for filtered voice roles and emotions based on model data
const voiceRoles = ref<any[]>([]);
const emotions = ref<any[]>([]);

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

// Watch for changes to service provider to update voice roles
watch(
  () => form.defaultVoiceSettings.serviceProvider,
  async (newProvider) => {
    if (!newProvider) {
      voiceRoles.value = [];
      return;
    }

    try {
      const models = await projectsStore.getVoiceModelsByProvider(newProvider);
      voiceRoles.value = models;
    } catch (error) {
      console.error("Failed to load voice roles:", error);
      voiceRoles.value = [];
    }
  },
  { immediate: true }
);

// Watch for changes to selected voice to update emotions
watch(
  () => form.defaultVoiceSettings.voice,
  async (newVoice) => {
    if (!newVoice) {
      emotions.value = [];
      return;
    }

    try {
      // Find selected voice model
      const selectedModel = await projectsStore.getVoiceModelByCode(newVoice);

      if (selectedModel && selectedModel.emotions) {
        emotions.value = selectedModel.emotions;
        return;
      }

      // If the selected model doesn't have emotions, try to find emotions from another model of the same provider
      if (form.defaultVoiceSettings.serviceProvider) {
        const providerModels = await projectsStore.getVoiceModelsByProvider(
          form.defaultVoiceSettings.serviceProvider
        );

        for (const model of providerModels) {
          if (model.emotions && model.emotions.length > 0) {
            emotions.value = model.emotions;
            return;
          }
        }
      }

      emotions.value = [];
    } catch (error) {
      console.error("Failed to load emotions:", error);
      emotions.value = [];
    }
  },
  { immediate: true }
);

const filteredVoiceRoles = computed(() => voiceRoles.value);
const filteredEmotions = computed(() => emotions.value);

const serviceProviderOptions = computed(() =>
  serviceProviders.value.map((p) => ({ value: p.id, label: p.name }))
);
const voiceRoleOptions = computed(() =>
  filteredVoiceRoles.value.map((r) => ({
    value: r.code,
    label: `${r.name} (${r.gender === "0" ? "女声" : "男声"})`,
  }))
);
const emotionOptions = computed(() =>
  filteredEmotions.value.map((e) => ({ value: e.code, label: e.name }))
);

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
