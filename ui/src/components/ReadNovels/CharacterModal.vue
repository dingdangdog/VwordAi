<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- 背景遮罩 -->
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div
          class="absolute inset-0 bg-ink/60 opacity-75"
        ></div>
      </div>

      <!-- 模态框居中技巧 -->
      <span
        class="hidden sm:inline-block sm:align-middle sm:h-screen"
        aria-hidden="true"
        >&#8203;</span
      >

      <!-- 模态框内容 -->
      <div
        class="inline-block align-bottom bg-surface-elevated rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3
                class="text-lg leading-6 font-medium text-ink"
                id="modal-headline"
              >
                {{ editingCharacter ? "编辑角色" : "角色管理" }}
              </h3>

              <div class="mt-4 space-y-4">
                <!-- 角色表单 -->
                <div
                  v-if="showForm"
                  class="bg-surface-hover p-4 rounded-lg"
                >
                  <div class="flex justify-between items-center mb-3">
                    <h4
                      class="text-md font-medium text-ink"
                    >
                      {{ editingCharacter ? "编辑角色信息" : "添加新角色" }}
                    </h4>
                    <button
                      v-if="editingCharacter"
                      @click="cancelEdit"
                      class="text-sm text-ink-muted hover:text-ink"
                    >
                      取消编辑
                    </button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      id="name"
                      v-model="form.name"
                      label="角色名称"
                      placeholder="请输入角色名称"
                    >
                      <template #label>角色名称 <span class="text-red-500">*</span></template>
                    </FormInput>

                    <FormSelect
                      id="type"
                      v-model="form.type"
                      label="角色类型"
                      :options="typeOptions"
                    >
                      <template #label>角色类型 <span class="text-red-500">*</span></template>
                    </FormSelect>

                    <FormSelect
                      id="gender"
                      v-model="form.gender"
                      label="性别"
                      :options="genderOptions"
                    >
                      <template #label>性别 <span class="text-red-500">*</span></template>
                    </FormSelect>

                    <FormSelect
                      id="age"
                      v-model="form.age"
                      label="年龄段"
                      :options="ageOptions"
                    >
                      <template #label>年龄段 <span class="text-red-500">*</span></template>
                    </FormSelect>

                    <div class="md:col-span-2">
                      <FormTextarea
                        id="description"
                        v-model="form.description"
                        label="角色描述"
                        placeholder="请输入角色描述（选填）"
                        :rows="2"
                      />
                    </div>

                    <!-- TTS配置区域 -->
                    <div class="md:col-span-2">
                      <h5
                        class="text-sm font-medium text-ink mb-3"
                      >
                        TTS语音配置
                      </h5>

                      <div
                        class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface-hover rounded-lg"
                      >
                        <FormSelect
                          id="tts-provider"
                          v-model="form.ttsConfig.provider"
                          label="TTS服务商"
                          placeholder="请选择服务商"
                          :options="ttsProviderOptions"
                          @change="onTtsProviderChange"
                        />

                        <FormSelect
                          id="tts-model"
                          v-model="form.ttsConfig.model"
                          label="语音模型"
                          placeholder="请选择语音模型"
                          :options="ttsModelOptions"
                          :disabled="!form.ttsConfig.provider"
                        />

                        <div>
                          <label
                            for="tts-speed"
                            class="block text-sm font-medium text-ink"
                          >
                            语速 ({{ form.ttsConfig.speed }})
                          </label>
                          <input
                            id="tts-speed"
                            v-model.number="form.ttsConfig.speed"
                            type="range"
                            min="-50"
                            max="50"
                            step="5"
                            class="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div>
                          <label
                            for="tts-pitch"
                            class="block text-sm font-medium text-ink"
                          >
                            音调 ({{ form.ttsConfig.pitch }})
                          </label>
                          <input
                            id="tts-pitch"
                            v-model.number="form.ttsConfig.pitch"
                            type="range"
                            min="-50"
                            max="50"
                            step="5"
                            class="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div>
                          <label
                            for="tts-volume"
                            class="block text-sm font-medium text-ink"
                          >
                            音量 ({{ form.ttsConfig.volume }})
                          </label>
                          <input
                            id="tts-volume"
                            v-model.number="form.ttsConfig.volume"
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            class="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <FormInput
                          id="tts-emotion"
                          v-model="form.ttsConfig.emotion"
                          label="情感"
                          placeholder="如：开心、悲伤、愤怒等"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="mt-4 flex justify-end space-x-2">
                    <button
                      v-if="editingCharacter"
                      @click="cancelEdit"
                      class="btn btn-secondary"
                    >
                      取消
                    </button>
                    <button
                      @click="saveCharacter"
                      class="btn btn-primary"
                      :disabled="!isFormValid || isSaving"
                    >
                      {{
                        isSaving
                          ? "保存中..."
                          : editingCharacter
                            ? "更新角色"
                            : "添加角色"
                      }}
                    </button>
                  </div>
                </div>

                <!-- 现有角色列表 -->
                <div v-if="!editingCharacter">
                  <div class="flex justify-between items-center mb-3">
                    <h4
                      class="text-md font-medium text-ink"
                    >
                      现有角色
                    </h4>
                    <button
                      v-if="!showForm"
                      @click="showForm = true"
                      class="btn btn-sm btn-primary"
                    >
                      添加角色
                    </button>
                  </div>

                  <div v-if="characters.length === 0" class="text-center py-4">
                    <p class="text-ink-muted">
                      暂无角色，请使用上方表单添加
                    </p>
                  </div>

                  <div v-else class="grid grid-cols-1 gap-4">
                    <div
                      v-for="character in characters"
                      :key="character.id"
                      class="p-4 border border-border rounded-md hover:border-primary/70 transition-colors"
                    >
                      <div class="flex justify-between items-start">
                        <div class="flex-1">
                          <div class="flex items-center space-x-3 mb-2">
                            <h5
                              class="text-sm font-medium text-ink"
                            >
                              {{ character.name }}
                            </h5>
                            <div class="flex items-center space-x-2">
                              <span
                                class="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200"
                              >
                                {{ characterTypeLabel(character.type) }}
                              </span>
                              <span
                                class="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-200"
                              >
                                {{ genderAgeLabel(character) }}
                              </span>
                            </div>
                          </div>

                          <p
                            v-if="character.description"
                            class="text-xs text-ink-muted mb-2"
                          >
                            {{ character.description }}
                          </p>

                          <!-- TTS配置信息 -->
                          <div
                            v-if="character.ttsConfig?.provider"
                            class="text-xs text-primary"
                          >
                            <span class="font-medium">TTS:</span>
                            {{
                              getTtsProviderName(character.ttsConfig.provider)
                            }}
                            <span v-if="character.ttsConfig.model">
                              - {{ character.ttsConfig.model }}
                            </span>
                            <span
                              v-if="
                                character.ttsConfig.speed !== undefined &&
                                character.ttsConfig.speed !== 0
                              "
                            >
                              (语速:
                              {{ character.ttsConfig.speed > 0 ? "+" : ""
                              }}{{ character.ttsConfig.speed }})
                            </span>
                          </div>
                        </div>

                        <!-- 操作按钮 -->
                        <div class="flex items-center space-x-2 ml-4">
                          <button
                            @click="editCharacter(character)"
                            class="text-primary hover:text-primary-hover text-sm"
                            title="编辑角色"
                          >
                            编辑
                          </button>
                          <button
                            @click="deleteCharacter(character)"
                            class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                            title="删除角色"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-surface-hover px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
        >
          <button
            type="button"
            class="btn btn-primary w-full inline-flex justify-center sm:ml-3 sm:w-auto sm:text-sm"
            @click="$emit('close')"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import FormInput from "@/components/common/FormInput.vue";
import FormTextarea from "@/components/common/FormTextarea.vue";
import FormSelect from "@/components/common/FormSelect.vue";
import type { Character } from "@/types/ReadNovels";
import type { TTSProviderType, VoiceModel } from "@/types";
import { useSettingsStore } from "@/stores/settings";
import {
  getVoiceModelsByProvider,
  getProcessedVoiceModels,
} from "@/utils/voice-utils";

const props = defineProps<{
  novelId?: string;
  characters: Character[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", character: Omit<Character, "id">): void;
  (e: "update", characterId: string, character: Partial<Character>): void;
  (e: "delete", characterId: string): void;
}>();

const isSaving = ref(false);
const showForm = ref(false);
const editingCharacter = ref<Character | null>(null);
const settingsStore = useSettingsStore();

// 语音模型相关状态
const isLoadingVoiceModels = ref(false);
const voiceModelsData = ref<VoiceModel[]>([]);

// 表单数据
const form = reactive({
  name: "",
  type: "main" as "main" | "secondary" | "minor",
  gender: "male" as "male" | "female" | "unknown",
  age: "youth" as "child" | "youth" | "middle" | "elder" | "unknown",
  description: "",
  ttsConfig: {
    provider: "" as TTSProviderType | "",
    model: "",
    speed: 0,
    pitch: 0,
    volume: 100,
    emotion: "",
    style: "",
  },
});

// TTS服务商列表
const ttsProviders = computed(() => settingsStore.getTTSProviders());

const typeOptions = [
  { value: "main", label: "主要角色" },
  { value: "secondary", label: "次要角色" },
  { value: "minor", label: "路人角色" },
];
const genderOptions = [
  { value: "male", label: "男" },
  { value: "female", label: "女" },
  { value: "unknown", label: "未知" },
];
const ageOptions = [
  { value: "child", label: "儿童" },
  { value: "youth", label: "青年" },
  { value: "middle", label: "中年" },
  { value: "elder", label: "老年" },
  { value: "unknown", label: "未知" },
];
const ttsProviderOptions = computed(() =>
  ttsProviders.value.map((p) => ({ value: p.type, label: p.name }))
);
const ttsModelOptions = computed(() =>
  availableVoiceModels.value.map((m) => ({
    value: m.code,
    label: `${m.name} (${m.gender === "0" ? "女" : "男"})`,
  }))
);

// 根据选择的服务商获取可用的语音模型
const availableVoiceModels = computed(() => {
  if (!form.ttsConfig.provider) return [];

  try {
    const models = getVoiceModelsByProvider(form.ttsConfig.provider);
    return models.map((model) => ({
      code: model.code,
      name: model.name,
      gender: model.gender || "0",
      language: model.lang,
    }));
  } catch (error) {
    console.error(
      "Failed to get voice models for provider:",
      form.ttsConfig.provider,
      error
    );
    return [];
  }
});

// 表单验证
const isFormValid = computed(() => {
  return form.name.trim() !== "" && props.novelId;
});

// TTS服务商变化处理
function onTtsProviderChange() {
  form.ttsConfig.model = "";
  form.ttsConfig.emotion = "";

  // 加载新服务商的语音模型
  if (form.ttsConfig.provider) {
    isLoadingVoiceModels.value = true;
    try {
      // 触发计算属性重新计算
      // availableVoiceModels 会自动更新
    } catch (error) {
      console.error("Failed to load voice models:", error);
    } finally {
      isLoadingVoiceModels.value = false;
    }
  }
}

// 监听TTS服务商变化
watch(
  () => form.ttsConfig.provider,
  (newProvider) => {
    if (newProvider) {
      // 重置模型选择
      form.ttsConfig.model = "";
      form.ttsConfig.emotion = "";
    }
  }
);

// 初始化
onMounted(async () => {
  try {
    // 加载TTS设置
    await settingsStore.loadTTSSettings();

    // 预加载语音模型数据
    voiceModelsData.value = getProcessedVoiceModels();

    // 设置默认TTS服务商
    if (!form.ttsConfig.provider) {
      form.ttsConfig.provider = settingsStore.activeTTSProviderType || "azure";
    }
  } catch (error) {
    console.error("Failed to initialize character modal:", error);
  }
});

// 保存角色
function saveCharacter() {
  if (!isFormValid.value) return;

  isSaving.value = true;

  try {
    if (editingCharacter.value) {
      // 更新现有角色
      const updateData: Partial<Character> = {
        name: form.name.trim(),
        type: form.type,
        gender: form.gender,
        age: form.age,
        description: form.description.trim() || undefined,
        ttsConfig: form.ttsConfig.provider
          ? {
              provider: form.ttsConfig.provider as TTSProviderType,
              model: form.ttsConfig.model,
              speed: form.ttsConfig.speed,
              pitch: form.ttsConfig.pitch,
              volume: form.ttsConfig.volume,
              emotion: form.ttsConfig.emotion,
              style: form.ttsConfig.style,
            }
          : undefined,
        updatedAt: new Date().toISOString(),
      };

      emit("update", editingCharacter.value.id, updateData);
    } else {
      // 创建新角色
      const characterData: Omit<Character, "id"> = {
        name: form.name.trim(),
        type: form.type,
        gender: form.gender,
        age: form.age,
        description: form.description.trim() || undefined,
        ttsConfig: form.ttsConfig.provider
          ? {
              provider: form.ttsConfig.provider as TTSProviderType,
              model: form.ttsConfig.model,
              speed: form.ttsConfig.speed,
              pitch: form.ttsConfig.pitch,
              volume: form.ttsConfig.volume,
              emotion: form.ttsConfig.emotion,
              style: form.ttsConfig.style,
            }
          : undefined,
        createdAt: new Date().toISOString(),
      };

      emit("save", characterData);
    }

    // 重置表单
    resetForm();
  } finally {
    isSaving.value = false;
  }
}

// 重置表单
function resetForm() {
  form.name = "";
  form.description = "";
  form.type = "main";
  form.gender = "male";
  form.age = "youth";
  // 重置TTS配置
  form.ttsConfig.model = "";
  form.ttsConfig.emotion = "";
  form.ttsConfig.style = "";
  form.ttsConfig.speed = 0;
  form.ttsConfig.pitch = 0;
  form.ttsConfig.volume = 100;

  // 重置状态
  editingCharacter.value = null;
  showForm.value = false;
}

// 编辑角色
function editCharacter(character: Character) {
  editingCharacter.value = character;
  showForm.value = true;

  // 填充表单数据
  form.name = character.name;
  form.type = character.type;
  form.gender = character.gender;
  form.age = character.age;
  form.description = character.description || "";

  // 填充TTS配置
  if (character.ttsConfig) {
    form.ttsConfig.provider = character.ttsConfig.provider || "";
    form.ttsConfig.model = character.ttsConfig.model || "";
    form.ttsConfig.speed = character.ttsConfig.speed || 0;
    form.ttsConfig.pitch = character.ttsConfig.pitch || 0;
    form.ttsConfig.volume = character.ttsConfig.volume || 100;
    form.ttsConfig.emotion = character.ttsConfig.emotion || "";
    form.ttsConfig.style = character.ttsConfig.style || "";
  } else {
    // 重置TTS配置为默认值
    form.ttsConfig.provider = settingsStore.activeTTSProviderType || "azure";
    form.ttsConfig.model = "";
    form.ttsConfig.speed = 0;
    form.ttsConfig.pitch = 0;
    form.ttsConfig.volume = 100;
    form.ttsConfig.emotion = "";
    form.ttsConfig.style = "";
  }
}

// 取消编辑
function cancelEdit() {
  resetForm();
}

// 删除角色
function deleteCharacter(character: Character) {
  if (confirm(`确定要删除角色"${character.name}"吗？此操作不可撤销。`)) {
    emit("delete", character.id);
  }
}

// 获取角色类型标签
function characterTypeLabel(type: string): string {
  switch (type) {
    case "main":
      return "主要角色";
    case "secondary":
      return "次要角色";
    case "minor":
      return "路人角色";
    default:
      return type;
  }
}

// 获取性别年龄标签
function genderAgeLabel(character: Character): string {
  let gender = "";
  switch (character.gender) {
    case "male":
      gender = "男";
      break;
    case "female":
      gender = "女";
      break;
    case "unknown":
      gender = "未知性别";
      break;
  }

  let age = "";
  switch (character.age) {
    case "child":
      age = "儿童";
      break;
    case "youth":
      age = "青年";
      break;
    case "middle":
      age = "中年";
      break;
    case "elder":
      age = "老年";
      break;
    case "unknown":
      age = "未知年龄";
      break;
  }

  return character.gender === "unknown" || character.age === "unknown"
    ? `${gender}${age}`.replace("未知性别未知年龄", "未知")
    : `${gender}${age}`;
}

// 获取TTS服务商名称
function getTtsProviderName(provider: TTSProviderType): string {
  const providerMap: Record<TTSProviderType, string> = {
    azure: "Azure",
    aliyun: "阿里云",
    tencent: "腾讯云",
    baidu: "百度",
    openai: "OpenAI",
    blive: "B站直播",
  };
  return providerMap[provider] || provider;
}
</script>
