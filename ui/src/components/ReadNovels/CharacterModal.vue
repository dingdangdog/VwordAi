<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- 背景遮罩 -->
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div
          class="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"
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
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3
                class="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                id="modal-headline"
              >
                角色管理
              </h3>

              <div class="mt-4 space-y-4">
                <!-- 添加新角色表单 -->
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4
                    class="text-md font-medium text-gray-900 dark:text-white mb-3"
                  >
                    添加新角色
                  </h4>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        for="name"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        角色名称 <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        v-model="form.name"
                        class="input"
                        placeholder="请输入角色名称"
                      />
                    </div>

                    <div>
                      <label
                        for="type"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        角色类型 <span class="text-red-500">*</span>
                      </label>
                      <select id="type" v-model="form.type" class="input">
                        <option value="main">主要角色</option>
                        <option value="secondary">次要角色</option>
                        <option value="minor">路人角色</option>
                      </select>
                    </div>

                    <div>
                      <label
                        for="gender"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        性别 <span class="text-red-500">*</span>
                      </label>
                      <select id="gender" v-model="form.gender" class="input">
                        <option value="male">男</option>
                        <option value="female">女</option>
                      </select>
                    </div>

                    <div>
                      <label
                        for="age"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        年龄段 <span class="text-red-500">*</span>
                      </label>
                      <select id="age" v-model="form.age" class="input">
                        <option value="child">儿童</option>
                        <option value="youth">青年</option>
                        <option value="middle">中年</option>
                        <option value="elder">老年</option>
                      </select>
                    </div>

                    <div class="md:col-span-2">
                      <label
                        for="description"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        角色描述
                      </label>
                      <textarea
                        id="description"
                        v-model="form.description"
                        rows="2"
                        class="input"
                        placeholder="请输入角色描述（选填）"
                      ></textarea>
                    </div>

                    <!-- TTS配置区域 -->
                    <div class="md:col-span-2">
                      <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        TTS语音配置
                      </h5>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-100 dark:bg-gray-600 rounded-lg">
                        <!-- TTS服务商 -->
                        <div>
                          <label
                            for="tts-provider"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            TTS服务商
                          </label>
                          <select
                            id="tts-provider"
                            v-model="form.ttsConfig.provider"
                            class="input"
                            @change="onTtsProviderChange"
                          >
                            <option value="">请选择服务商</option>
                            <option
                              v-for="provider in ttsProviders"
                              :key="provider.type"
                              :value="provider.type"
                            >
                              {{ provider.name }}
                            </option>
                          </select>
                        </div>

                        <!-- 语音模型 -->
                        <div>
                          <label
                            for="tts-model"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            语音模型
                          </label>
                          <select
                            id="tts-model"
                            v-model="form.ttsConfig.model"
                            class="input"
                            :disabled="!form.ttsConfig.provider"
                          >
                            <option value="">请选择语音模型</option>
                            <option
                              v-for="model in availableVoiceModels"
                              :key="model.code"
                              :value="model.code"
                            >
                              {{ model.name }} ({{ model.gender === "0" ? "女" : "男" }})
                            </option>
                          </select>
                        </div>

                        <!-- 语速 -->
                        <div>
                          <label
                            for="tts-speed"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          />
                        </div>

                        <!-- 音调 -->
                        <div>
                          <label
                            for="tts-pitch"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          />
                        </div>

                        <!-- 音量 -->
                        <div>
                          <label
                            for="tts-volume"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          />
                        </div>

                        <!-- 情感 -->
                        <div>
                          <label
                            for="tts-emotion"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            情感
                          </label>
                          <input
                            id="tts-emotion"
                            v-model="form.ttsConfig.emotion"
                            type="text"
                            class="input"
                            placeholder="如：开心、悲伤、愤怒等"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-4 flex justify-end">
                    <button
                      @click="saveCharacter"
                      class="btn btn-primary"
                      :disabled="!isFormValid || isSaving"
                    >
                      {{ isSaving ? "保存中..." : "添加角色" }}
                    </button>
                  </div>
                </div>

                <!-- 现有角色列表 -->
                <div>
                  <h4
                    class="text-md font-medium text-gray-900 dark:text-white mb-3"
                  >
                    现有角色
                  </h4>

                  <div v-if="characters.length === 0" class="text-center py-4">
                    <p class="text-gray-500 dark:text-gray-400">
                      暂无角色，请使用上方表单添加
                    </p>
                  </div>

                  <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      v-for="character in characters"
                      :key="character.id"
                      class="p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                    >
                      <div class="flex justify-between">
                        <div>
                          <h5
                            class="text-sm font-medium text-gray-900 dark:text-white"
                          >
                            {{ character.name }}
                          </h5>
                          <div class="mt-1 flex items-center space-x-2">
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
                          <p
                            v-if="character.description"
                            class="mt-1 text-xs text-gray-500 dark:text-gray-400"
                          >
                            {{ character.description }}
                          </p>
                          <!-- TTS配置信息 -->
                          <div
                            v-if="character.ttsConfig?.provider"
                            class="mt-2 text-xs text-blue-600 dark:text-blue-400"
                          >
                            <span class="font-medium">TTS:</span>
                            {{ getTtsProviderName(character.ttsConfig.provider) }}
                            <span v-if="character.ttsConfig.model">
                              - {{ character.ttsConfig.model }}
                            </span>
                          </div>
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
          class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
        >
          <button
            type="button"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
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
import { ref, reactive, computed, onMounted } from "vue";
import type { Character } from "@/types/ReadNovels";
import type { TTSProviderType } from "@/types";
import { useSettingsStore } from "@/stores/settings";

const props = defineProps<{
  novelId?: string;
  characters: Character[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", character: Omit<Character, "id">): void;
}>();

const isSaving = ref(false);
const settingsStore = useSettingsStore();

// 表单数据
const form = reactive({
  name: "",
  type: "main" as "main" | "secondary" | "minor",
  gender: "male" as "male" | "female",
  age: "youth" as "child" | "youth" | "middle" | "elder",
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

// 根据选择的服务商获取可用的语音模型
const availableVoiceModels = computed(() => {
  if (!form.ttsConfig.provider) return [];

  // 这里应该根据服务商类型返回对应的模型列表
  // 简化处理，返回一些示例模型
  return [
    { code: "zh-CN-XiaoxiaoNeural", name: "晓晓", gender: "0" },
    { code: "zh-CN-YunxiNeural", name: "云希", gender: "1" },
    { code: "zh-CN-YunyangNeural", name: "云扬", gender: "1" },
    { code: "zh-CN-XiaoyiNeural", name: "晓伊", gender: "0" },
  ];
});

// 表单验证
const isFormValid = computed(() => {
  return form.name.trim() !== "" && props.novelId;
});

// TTS服务商变化处理
function onTtsProviderChange() {
  form.ttsConfig.model = "";
  form.ttsConfig.emotion = "";
}

// 初始化
onMounted(async () => {
  // 加载TTS设置
  await settingsStore.loadTTSSettings();

  // 设置默认TTS服务商
  if (!form.ttsConfig.provider) {
    form.ttsConfig.provider = settingsStore.activeTTSProviderType || "azure";
  }
});

// 保存角色
function saveCharacter() {
  if (!isFormValid.value) return;

  isSaving.value = true;

  try {
    const characterData: Omit<Character, "id"> = {
      name: form.name.trim(),
      type: form.type,
      gender: form.gender,
      age: form.age,
      description: form.description.trim() || undefined,
      ttsConfig: form.ttsConfig.provider ? {
        provider: form.ttsConfig.provider as TTSProviderType,
        model: form.ttsConfig.model,
        speed: form.ttsConfig.speed,
        pitch: form.ttsConfig.pitch,
        volume: form.ttsConfig.volume,
        emotion: form.ttsConfig.emotion,
        style: form.ttsConfig.style,
      } : undefined,
      createdAt: new Date().toISOString(),
    };

    emit("save", characterData);

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
  // 重置TTS配置
  form.ttsConfig.model = "";
  form.ttsConfig.emotion = "";
  // 保留其他选择，以便于连续添加相似角色
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
  const gender = character.gender === "male" ? "男" : "女";
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
  }

  return `${gender}${age}`;
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
