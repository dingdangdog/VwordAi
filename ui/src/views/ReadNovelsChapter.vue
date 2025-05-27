<template>
  <div class="flex flex-col h-[calc(100vh-4rem)] max-w-[1600px] mx-auto p-2">
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center">
        <button
          @click="goBack"
          class="btn btn-sm flex items-center mr-2 text-blue-500 hover:text-blue-400"
          title="返回小说"
        >
          <ArrowLeftIcon class="h-4 w-4 mr-1" />
          返回
        </button>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ chapterTitle }}
        </h1>
      </div>
      <div class="flex items-center space-x-2">
        <div class="flex items-center mr-2">
          <label class="text-sm text-gray-700 dark:text-gray-300 mr-1"
            >LLM服务商:</label
          >
          <select
            v-model="selectedLLMProvider"
            class="input select select-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option
              v-for="provider in llmProviders"
              :key="provider.id"
              :value="provider.type"
            >
              {{ provider.name }}
            </option>
          </select>
        </div>
        <button
          @click="parseChapter"
          class="btn btn-sm btn-primary flex items-center"
          :disabled="isProcessing"
        >
          <DocumentMagnifyingGlassIcon
            v-if="!isProcessing"
            class="h-4 w-4 mr-1"
          />
          <div
            v-else
            class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"
          ></div>
          {{ isProcessing ? "解析中..." : "解析" }}
        </button>
        <button
          @click="saveChapterContent"
          class="btn btn-sm btn-primary"
          :disabled="isSaving"
        >
          {{ isSaving ? "保存中..." : "保存修改" }}
        </button>
      </div>
    </div>

    <!-- 主编辑区域（上部分） -->
    <div class="flex-1 flex items-center">
      <!-- 左侧 - 原文编辑 -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex-1 h-full flex flex-col"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          章节原文
        </h2>
        <textarea
          v-model="editedContent"
          class="input w-full flex-1 resize-none"
          placeholder="请输入章节内容..."
          @input="contentChanged = true"
        ></textarea>
      </div>

      <div class="mx-2 flex flex-col justify-center items-center">
        <ArrowRightIcon class="h-6 w-6 text-gray-600 dark:text-gray-400" />
      </div>

      <!-- 右侧 - 解析结果编辑 -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex-1 h-full flex flex-col"
      >
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            解析结果
          </h2>
          <button
            v-if="parsedChapter && parsedChapter.segments.length > 0"
            @click="generateAllSegmentTts"
            class="btn btn-sm btn-primary flex items-center"
            :disabled="isGeneratingAll"
          >
            <SpeakerWaveIcon v-if="!isGeneratingAll" class="h-4 w-4 mr-1" />
            <div
              v-else
              class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"
            ></div>
            {{ isGeneratingAll ? "合成中..." : "全部合成" }}
          </button>
        </div>

        <div v-if="!parsedChapter" class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400 mb-4">
            该章节尚未解析，请点击"解析"按钮进行LLM解析
          </p>
        </div>

        <template v-else>
          <div
            class="space-y-3 max-h-[calc(100vh-18rem)] overflow-y-auto flex-1"
          >
            <div
              v-for="(segment, index) in parsedChapter.segments"
              :key="`segment-${index}`"
              class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md"
            >
              <div
                v-if="segment.character"
                class="flex justify-between items-start mb-1"
              ></div>

              <div class="mt-2">
                <textarea
                  v-model="segment.text"
                  class="input w-full py-1 px-2 text-sm resize-none min-h-6 max-h-12"
                ></textarea>
              </div>

              <div
                class="mt-2 flex flex-wrap gap-2 justify-between items-center"
              >
                <span
                  class="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200"
                >
                  {{ segment.character }}
                </span>
                <div class="flex gap-2 flex-1 min-w-[200px]">
                  <!-- TTS服务商选择 -->
                  <select
                    v-model="segment.ttsConfig.provider"
                    class="input text-xs py-0.5 px-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex-1"
                    @change="onProviderChange(segment, index)"
                  >
                    <option value="">选择服务商</option>
                    <option
                      v-for="provider in ttsProviders"
                      :key="provider.type"
                      :value="provider.type"
                    >
                      {{ provider.name }}
                    </option>
                  </select>

                  <!-- 语音模型选择 -->
                  <select
                    v-model="segment.voice"
                    class="input text-xs py-0.5 px-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex-1"
                    :disabled="!segment.ttsConfig?.provider"
                    @change="onVoiceChange(segment, index)"
                  >
                    <option value="">
                      {{ segment.character ? "自动选择" : "默认旁白音" }}
                    </option>
                    <option
                      v-if="segment.character"
                      v-for="character in matchingCharacters(segment.character)"
                      :key="character.id"
                      :value="character.voiceModel"
                    >
                      {{ character.name }} -
                      {{ characterVoiceLabel(character) }}
                    </option>
                    <option
                      v-for="model in getAvailableVoiceModels(
                        segment.ttsConfig?.provider
                      )"
                      :key="model.code"
                      :value="model.code"
                    >
                      {{ model.name }} ({{
                        model.gender === "0" ? "女" : "男"
                      }})
                    </option>
                  </select>

                  <!-- 情感选择 -->
                  <select
                    v-model="segment.ttsConfig.emotion"
                    class="input text-xs py-0.5 px-1 ml-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex-1"
                    :disabled="!segment.voice || !segment.ttsConfig?.provider"
                  >
                    <option value="">无情感</option>
                    <option
                      v-for="emotion in getAvailableEmotions(
                        segment.voice,
                        segment.ttsConfig?.provider
                      )"
                      :key="emotion.code"
                      :value="emotion.code"
                    >
                      {{ emotion.name }}
                    </option>
                  </select>
                </div>

                <div class="flex gap-2 text-sm">
                  <button
                    @click="showTtsConfig(index)"
                    class="btn btn-xs btn-outline flex items-center"
                    title="详细配置"
                  >
                    <CogIcon class="h-3 w-3" />
                  </button>
                  <button
                    @click="generateSegmentTts(index)"
                    class="btn btn-xs btn-secondary flex items-center"
                    :disabled="
                      isProcessingSegment[index] || !segment.ttsConfig?.provider
                    "
                  >
                    <SpeakerWaveIcon
                      v-if="!isProcessingSegment[index]"
                      class="h-3 w-3 mr-1"
                    />
                    <div
                      v-else
                      class="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1"
                    ></div>
                    {{ isProcessingSegment[index] ? "合成中" : "合成" }}
                  </button>
                </div>
              </div>

              <!-- 单个段落的音频播放器 -->
              <div v-if="segmentAudios[index]" class="mt-2">
                <audio
                  :src="segmentAudios[index]"
                  controls
                  class="w-full h-8"
                ></audio>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 中间连接按钮 - 生成TTS -->
    <div class="flex flex-col items-center my-2">
      <button
        v-if="parsedChapter"
        @click="generateTts"
        class="btn btn-primary flex items-center"
        :disabled="isProcessing || !allSegmentsHaveAudio"
      >
        <SpeakerWaveIcon v-if="!isProcessing" class="h-5 w-5 mr-2" />
        <div
          v-else
          class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"
        ></div>
        {{ isProcessing ? "生成中..." : "合成整章音频" }}
      </button>
      <div
        v-if="parsedChapter && !allSegmentsHaveAudio"
        class="mt-2 text-sm text-yellow-400"
      >
        请先为所有段落生成TTS，再合成整章音频
      </div>
    </div>

    <!-- TTS播放区域（下部分） -->
    <div
      v-if="ttsResults.length > 0"
      class="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
    >
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          整章音频
        </h2>
        <div>
          <button
            @click="generateTts"
            class="btn btn-sm btn-primary flex items-center"
            :disabled="isProcessing"
          >
            <ArrowPathIcon class="h-4 w-4 mr-1" />
            重新生成
          </button>
        </div>
      </div>

      <div
        class="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md"
      >
        <div
          v-for="(result, index) in ttsResults"
          :key="`tts-${index}`"
          class="mb-4 last:mb-0"
        >
          <audio :src="result.audioUrl" controls class="w-full"></audio>
          <div
            class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between"
          >
            <span>时长: {{ formatDuration(result.duration) }}</span>
            <span>生成时间: {{ formatDate(result.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- TTS详细配置弹窗 -->
    <div
      v-if="showTtsConfigModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          TTS 详细配置 - 段落 {{ currentConfigSegmentIndex + 1 }}
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- TTS 服务商 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-gray-700 dark:text-gray-300"
                >TTS 服务商</span
              >
            </label>
            <select
              v-model="currentTtsConfig.provider"
              class="select select-bordered w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              @change="onConfigProviderChange"
            >
              <option value="">选择服务商</option>
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
          <div class="form-control">
            <label class="label">
              <span class="label-text text-gray-700 dark:text-gray-300"
                >语音模型</span
              >
            </label>
            <select
              v-model="currentTtsConfig.model"
              class="select select-bordered w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              :disabled="!currentTtsConfig.provider"
            >
              <option value="">选择模型</option>
              <option
                v-for="model in getAvailableVoiceModels(
                  currentTtsConfig.provider
                )"
                :key="model.code"
                :value="model.code"
              >
                {{ model.name }} ({{ model.gender === "0" ? "女" : "男" }})
              </option>
            </select>
          </div>

          <!-- 情感 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-gray-700 dark:text-gray-300"
                >情感</span
              >
            </label>
            <select
              v-model="currentTtsConfig.emotion"
              class="select select-bordered w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              :disabled="!currentTtsConfig.model"
            >
              <option value="">无情感</option>
              <option
                v-for="emotion in getAvailableEmotions(
                  currentTtsConfig.model,
                  currentTtsConfig.provider
                )"
                :key="emotion.code"
                :value="emotion.code"
              >
                {{ emotion.name }}
              </option>
            </select>
          </div>

          <!-- 语速 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-gray-700 dark:text-gray-300"
                >语速</span
              >
              <span class="label-text-alt text-gray-500">{{
                currentTtsConfig.speed
              }}</span>
            </label>
            <input
              v-model="currentTtsConfig.speed"
              type="range"
              min="-50"
              max="50"
              class="range range-sm"
            />
            <div class="flex justify-between text-xs text-gray-500 px-1">
              <span>慢</span>
              <span>正常</span>
              <span>快</span>
            </div>
          </div>

          <!-- 音调 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-gray-700 dark:text-gray-300"
                >音调</span
              >
              <span class="label-text-alt text-gray-500">{{
                currentTtsConfig.pitch
              }}</span>
            </label>
            <input
              v-model="currentTtsConfig.pitch"
              type="range"
              min="-50"
              max="50"
              class="range range-sm"
            />
            <div class="flex justify-between text-xs text-gray-500 px-1">
              <span>低</span>
              <span>正常</span>
              <span>高</span>
            </div>
          </div>

          <!-- 音量 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-gray-700 dark:text-gray-300"
                >音量</span
              >
              <span class="label-text-alt text-gray-500">{{
                currentTtsConfig.volume
              }}</span>
            </label>
            <input
              v-model="currentTtsConfig.volume"
              type="range"
              min="0"
              max="100"
              class="range range-sm"
            />
            <div class="flex justify-between text-xs text-gray-500 px-1">
              <span>小</span>
              <span>中</span>
              <span>大</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6 space-x-2">
          <button @click="closeTtsConfig" class="btn btn-outline">取消</button>
          <button @click="saveTtsConfig" class="btn btn-primary">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useNovelsStore } from "@/stores/novels";
import { useSettingsStore } from "@/stores/settings";
import { useProjectsStore } from "@/stores/projects";
import type { LLMProviderType } from "@/types";
import {
  DocumentMagnifyingGlassIcon,
  SpeakerWaveIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CogIcon,
} from "@heroicons/vue/24/outline";
import { novelApi } from "@/api";
import type {
  Chapter,
  ParsedChapter,
  Character,
  TtsResult,
} from "@/types/ReadNovels";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const novelsStore = useNovelsStore();
const settingsStore = useSettingsStore();
const projectsStore = useProjectsStore();

// 状态
const chapter = ref<Chapter | null>(null);
const parsedChapter = ref<ParsedChapter | null>(null);
const characters = ref<Character[]>([]);
const ttsResults = ref<TtsResult[]>([]);
const editedContent = ref("");
const contentChanged = ref(false);
const isSaving = ref(false);
const isProcessing = ref(false);
const isUpdating = ref(false);
const novelId = ref("");
const isGeneratingAll = ref(false);
const isProcessingSegment = reactive<Record<number, boolean>>({});
const segmentAudios = reactive<Record<number, string>>({});

// TTS配置弹窗状态
const showTtsConfigModal = ref(false);
const currentConfigSegmentIndex = ref(-1);
const currentTtsConfig = reactive({
  provider: "",
  model: "",
  speed: 0,
  pitch: 0,
  volume: 100,
  emotion: "",
  style: "",
});

// LLM服务商
const selectedLLMProvider = ref<LLMProviderType>("volcengine"); // 默认使用火山引擎
const llmProviders = computed(() => settingsStore.getLLMProviders());

// TTS服务商和语音模型
const ttsProviders = computed(() => {
  const providers = settingsStore.getTTSProviders();
  console.log("TTS Providers:", providers);
  return providers;
});

// 计算属性
const chapterTitle = computed(() => chapter.value?.title || "章节编辑");
const allSegmentsHaveAudio = computed(() => {
  if (!parsedChapter.value || parsedChapter.value.segments.length === 0)
    return false;
  return parsedChapter.value.segments.every((_, index) => segmentAudios[index]);
});

// 根据角色名称匹配角色
function matchingCharacters(characterName: string): Character[] {
  if (!characters.value || characters.value.length === 0) return [];

  // 尝试精确匹配
  const exactMatch = characters.value.filter(
    (c) => c.name === characterName || c.aliases?.includes(characterName)
  );

  if (exactMatch.length > 0) return exactMatch;

  // 尝试部分匹配
  return characters.value.filter(
    (c) =>
      c.name.includes(characterName) ||
      characterName.includes(c.name) ||
      c.aliases?.some(
        (alias) =>
          alias.includes(characterName) || characterName.includes(alias)
      )
  );
}

// 获取可用的语音模型 - 同步版本，直接从projectsStore.voiceModels获取
function getAvailableVoiceModels(provider?: string | null) {
  if (!provider) return [];

  try {
    // 直接从projectsStore.voiceModels中过滤
    const models = projectsStore.voiceModels.filter(
      (model: any) => model.provider === provider
    );
    return models.map((model: any) => ({
      code: model.code,
      name: model.name,
      gender: model.gender,
      lang: model.lang,
      emotions: model.emotions || [],
    }));
  } catch (error) {
    console.error("Failed to load voice models:", error);
    return [];
  }
}

// 获取可用的情感选项 - 同步版本
function getAvailableEmotions(voiceCode?: string, provider?: string | null) {
  if (!provider || !voiceCode) return [];

  try {
    // 直接从projectsStore.voiceModels中查找
    const voiceModel = projectsStore.voiceModels.find(
      (model: any) => model.code === voiceCode
    );

    if (voiceModel && voiceModel.emotions && voiceModel.emotions.length > 0) {
      // 返回该语音模型支持的情感
      return voiceModel.emotions.map((emotion: any) => ({
        code: emotion.code,
        name: emotion.name,
      }));
    }

    // 如果没有找到特定模型的情感，返回该提供商的所有情感
    const models = projectsStore.voiceModels.filter(
      (model: any) => model.provider === provider
    );
    const allEmotions = new Map();

    models.forEach((model: any) => {
      if (model.emotions) {
        model.emotions.forEach((emotion: any) => {
          allEmotions.set(emotion.code, emotion);
        });
      }
    });

    return Array.from(allEmotions.values());
  } catch (error) {
    console.error("Failed to load emotions:", error);
    return [];
  }
}

// TTS服务商变化处理
function onProviderChange(segment: any, _index: number) {
  // 重置语音模型和情感
  segment.voice = "";
  if (segment.ttsConfig) {
    segment.ttsConfig.emotion = "";
    segment.ttsConfig.model = "";
  }
}

// 语音模型变化处理
function onVoiceChange(segment: any, _index: number) {
  // 重置情感选择
  if (segment.ttsConfig) {
    segment.ttsConfig.emotion = "";
    segment.ttsConfig.model = segment.voice;
  }
}

// 显示TTS详细配置
function showTtsConfig(index: number) {
  if (!parsedChapter.value || !parsedChapter.value.segments[index]) return;

  const segment = parsedChapter.value.segments[index];
  currentConfigSegmentIndex.value = index;

  // 确保段落有TTS配置
  if (!segment.ttsConfig) {
    segment.ttsConfig = {
      provider: settingsStore.activeTTSProviderType || "azure",
      model: segment.voice || "",
      speed: 0,
      pitch: 0,
      volume: 100,
      emotion: "",
      style: "",
    };
  }

  // 复制配置到当前编辑配置
  Object.assign(currentTtsConfig, segment.ttsConfig);

  showTtsConfigModal.value = true;
}

// 配置弹窗中的服务商变化处理
function onConfigProviderChange() {
  currentTtsConfig.model = "";
  currentTtsConfig.emotion = "";
}

// 关闭TTS配置弹窗
function closeTtsConfig() {
  showTtsConfigModal.value = false;
  currentConfigSegmentIndex.value = -1;
}

// 保存TTS配置
function saveTtsConfig() {
  if (currentConfigSegmentIndex.value >= 0 && parsedChapter.value) {
    const segment =
      parsedChapter.value.segments[currentConfigSegmentIndex.value];
    if (segment.ttsConfig) {
      Object.assign(segment.ttsConfig, currentTtsConfig);
      // 同步语音模型到segment.voice
      segment.voice = currentTtsConfig.model;
    }

    // 保存解析结果
    updateParsedChapter();
  }

  closeTtsConfig();
}

// 调试函数 - 检查TTS提供商加载状态
function debugTtsProviders() {
  console.log("=== TTS Providers Debug ===");
  console.log("settingsStore.ttsSettings:", settingsStore.ttsSettings);
  console.log("ttsProviders computed:", ttsProviders.value);
  console.log("activeTTSProviderType:", settingsStore.activeTTSProviderType);
  console.log(
    "projectsStore.voiceModels length:",
    projectsStore.voiceModels.length
  );

  // 测试语音模型获取
  if (ttsProviders.value.length > 0) {
    const firstProvider = ttsProviders.value[0];
    console.log(`Testing voice models for provider: ${firstProvider.type}`);
    const models = getAvailableVoiceModels(firstProvider.type);
    console.log(`Found ${models.length} voice models:`, models.slice(0, 3));
  }
}

// 监听LLM提供商变化
watch(selectedLLMProvider, async (newProvider) => {
  if (chapter.value && newProvider !== chapter.value.llmProvider) {
    try {
      await novelApi.updateChapter(chapter.value.id, {
        llmProvider: newProvider,
      });

      // 更新本地章节对象
      chapter.value.llmProvider = newProvider;

      console.log(`LLM服务商已更新为: ${newProvider}`);
    } catch (error) {
      toast.error(
        `更新LLM服务商失败：${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
});

// 保存所有更改
async function saveAll() {
  try {
    // 保存章节内容
    if (contentChanged.value) {
      await saveChapterContent();
    }

    // 保存解析结果
    if (parsedChapter.value) {
      await updateParsedChapter();
    }

    toast.success("所有更改已保存");
  } catch (error) {
    toast.error(
      `保存失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 处理键盘快捷键
function handleKeyDown(event: KeyboardEvent) {
  // CTRL+S 保存所有更改
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    event.preventDefault();
    saveAll();
  }
}

// 初始化
onMounted(async () => {
  // 添加键盘快捷键监听
  window.addEventListener("keydown", handleKeyDown);
  const chapterId = route.params.chapterId as string;
  if (!chapterId) {
    toast.error("章节ID无效");
    return;
  }

  try {
    // 加载LLM设置和TTS设置
    await settingsStore.loadLLMSettings();
    await settingsStore.loadTTSSettings();

    // 加载语音模型
    if (projectsStore.voiceModels.length === 0) {
      await projectsStore.loadVoiceModels();
    }

    // 调试TTS提供商加载状态
    debugTtsProviders();

    // 加载章节数据
    const chapterResponse = await novelApi.getChapter(chapterId);
    if (!chapterResponse.success || !chapterResponse.data) {
      throw new Error(chapterResponse.message || "加载章节失败");
    }

    chapter.value = chapterResponse.data;
    novelId.value = chapterResponse.data.novelId;
    editedContent.value = chapterResponse.data.content;

    // 设置LLM提供商
    if (chapterResponse.data.llmProvider) {
      selectedLLMProvider.value = chapterResponse.data
        .llmProvider as LLMProviderType;
    }

    // 加载解析结果（如果已处理）
    if (chapterResponse.data.processed) {
      const parsedResponse = await novelApi.getParsedChapter(chapterId);
      if (parsedResponse.success && parsedResponse.data) {
        // 确保每个段落都有完整的TTS配置
        parsedResponse.data.segments = parsedResponse.data.segments.map(
          (segment, index) => {
            const updatedSegment = {
              ...segment,
              ttsConfig: segment.ttsConfig || {
                provider: settingsStore.activeTTSProviderType || "azure",
                model: segment.voice || "",
                speed: 0,
                pitch: 0,
                volume: 100,
                emotion: "",
                style: "",
              },
              synthesisStatus: segment.synthesisStatus || "unsynthesized",
            };

            // 如果段落已经有音频URL，恢复到segmentAudios中
            if (updatedSegment.audioUrl) {
              segmentAudios[index] = updatedSegment.audioUrl;
            }

            return updatedSegment;
          }
        );

        parsedChapter.value = parsedResponse.data;
      }

      // 加载TTS结果
      const ttsResponse = await novelApi.getTtsResults(chapterId);
      if (ttsResponse.success && ttsResponse.data) {
        ttsResults.value = ttsResponse.data;
      }
    }

    // 加载小说角色
    const charactersResponse = await novelApi.getCharacters(
      chapterResponse.data.novelId
    );
    if (charactersResponse.success && charactersResponse.data) {
      characters.value = charactersResponse.data;
    }
  } catch (error) {
    toast.error(
      `加载章节失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

// 返回小说页面
function goBack() {
  if (novelId.value) {
    router.push({
      path: "/read-novels",
      query: { novelId: novelId.value },
    });
  } else {
    router.push("/read-novels");
  }
}

// 保存章节内容
async function saveChapterContent() {
  if (!chapter.value || !contentChanged.value) return;

  isSaving.value = true;

  try {
    await novelApi.updateChapter(chapter.value.id, {
      content: editedContent.value,
    });

    if (chapter.value) {
      chapter.value.content = editedContent.value;
    }

    contentChanged.value = false;
    toast.success("章节内容已保存");
  } catch (error) {
    toast.error(
      `保存失败: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    isSaving.value = false;
  }
}

// 解析章节
async function parseChapter() {
  if (!chapter.value) return;

  // 如果内容已修改但未保存，先保存内容
  if (contentChanged.value) {
    await saveChapterContent();
  }

  isProcessing.value = true;

  try {
    // 先更新章节的LLM提供商
    await novelApi.updateChapter(chapter.value.id, {
      llmProvider: selectedLLMProvider.value,
    });

    // 更新本地章节对象
    if (chapter.value) {
      chapter.value.llmProvider = selectedLLMProvider.value;
    }

    // 调用解析API
    const response = await novelApi.parseChapter(chapter.value.id);
    if (response.success && response.data) {
      // 初始化每个段落的TTS配置和合成状态，优先使用角色的TTS配置
      response.data.segments = response.data.segments.map((segment) => {
        let ttsConfig = {
          provider: settingsStore.activeTTSProviderType || "azure",
          model: segment.voice || "",
          speed: 0,
          pitch: 0,
          volume: 100,
          emotion: "",
          style: "",
        };

        let voice = segment.voice || "";

        // 如果是角色对话，尝试应用角色的TTS配置
        if (
          segment.character &&
          segment.character.trim() &&
          segment.character !== "旁白"
        ) {
          const matchedCharacters = matchingCharacters(segment.character);
          if (matchedCharacters.length > 0) {
            const character = matchedCharacters[0];

            console.log(
              `Found existing character for segment: ${segment.character}`,
              character
            );

            // 使用角色的TTS配置
            if (character.ttsConfig) {
              ttsConfig = {
                provider:
                  character.ttsConfig.provider ||
                  settingsStore.activeTTSProviderType ||
                  "azure",
                model: character.ttsConfig.model || "",
                speed: character.ttsConfig.speed || 0,
                pitch: character.ttsConfig.pitch || 0,
                volume: character.ttsConfig.volume || 100,
                emotion: character.ttsConfig.emotion || "",
                style: character.ttsConfig.style || "",
              };

              // 使用角色TTS配置中的语音模型
              if (character.ttsConfig.model) {
                voice = character.ttsConfig.model;
              }

              console.log(
                `Applied character TTS config for ${segment.character}:`,
                ttsConfig
              );
            }
          } else {
            // 如果角色不存在，使用默认配置
            if (!voice) {
              voice = segment.character.includes("女")
                ? "zh-CN-XiaoxiaoNeural"
                : "zh-CN-YunxiNeural";
            }
          }
        } else {
          // 旁白使用默认旁白声音
          if (!voice) {
            voice = "zh-CN-XiaoxiaoNeural";
          }
        }

        // 确保model字段与voice字段一致
        if (voice && !ttsConfig.model) {
          ttsConfig.model = voice;
        }

        console.log("Final segment TTS config:", {
          character: segment.character,
          voice,
          ttsConfig,
        });

        return {
          ...segment,
          voice,
          ttsConfig,
          synthesisStatus: "unsynthesized",
        };
      });

      parsedChapter.value = response.data;

      // 更新章节处理状态
      if (chapter.value) {
        chapter.value.processed = true;
      }

      // 提取并添加新角色
      await extractAndAddCharacters();

      // 重新应用角色TTS配置（因为可能有新角色被添加）
      await reapplyCharacterTtsConfigs();

      // 自动保存解析结果
      await updateParsedChapter();

      toast.success("章节解析成功");
    } else {
      throw new Error(response.message || "解析失败");
    }
  } catch (error) {
    toast.error(
      `解析失败: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    isProcessing.value = false;
  }
}

// 从解析结果中提取角色并添加到小说中
async function extractAndAddCharacters() {
  if (!parsedChapter.value || !chapter.value) return;

  // 提取所有角色名称
  const characterNames = new Set<string>();
  parsedChapter.value.segments.forEach((segment) => {
    if (
      segment.character &&
      segment.character.trim() &&
      segment.character !== "旁白"
    ) {
      characterNames.add(segment.character.trim());
    }
  });

  // 过滤掉已存在的角色
  const existingCharacterNames = new Set(characters.value.map((c) => c.name));
  const newCharacterNames = Array.from(characterNames).filter(
    (name) => !existingCharacterNames.has(name)
  );

  if (newCharacterNames.length === 0) {
    console.log("No new characters to add");
    return;
  }

  console.log(
    `Adding ${newCharacterNames.length} new characters:`,
    newCharacterNames
  );

  // 创建新角色
  for (const name of newCharacterNames) {
    try {
      // 根据名称推断性别
      const gender =
        name.includes("女") || name.includes("妹") || name.includes("姐")
          ? "female"
          : "male";

      // 创建新角色，包含默认TTS配置
      const newCharacter = {
        novelId: chapter.value.novelId,
        name,
        type: "secondary" as const,
        gender: gender as "male" | "female",
        age: "youth" as const,
        description: `从章节 "${chapter.value.title}" 中自动提取的角色`,
        aliases: [],
        ttsConfig: {
          provider: settingsStore.activeTTSProviderType || "azure",
          model:
            gender === "female" ? "zh-CN-XiaoxiaoNeural" : "zh-CN-YunxiNeural",
          speed: 0,
          pitch: 0,
          volume: 100,
          emotion: "",
          style: "",
        },
        createdAt: new Date().toISOString(),
      };

      // 调用API创建角色
      const response = await novelApi.createCharacter(newCharacter);
      if (response.success && response.data) {
        // 添加到本地角色列表
        characters.value.push(response.data);
        console.log(`已添加新角色: ${name}`, response.data);
      }
    } catch (error) {
      console.error(`添加角色 ${name} 失败:`, error);
    }
  }
}

// 重新应用角色TTS配置到解析结果中
async function reapplyCharacterTtsConfigs() {
  if (!parsedChapter.value) return;

  console.log("Reapplying character TTS configs to parsed segments");

  // 遍历所有段落，重新应用角色TTS配置
  parsedChapter.value.segments.forEach((segment, index) => {
    if (
      segment.character &&
      segment.character.trim() &&
      segment.character !== "旁白"
    ) {
      const matchedCharacters = matchingCharacters(segment.character);
      if (matchedCharacters.length > 0) {
        const character = matchedCharacters[0];

        console.log(
          `Reapplying TTS config for segment ${index + 1}, character: ${segment.character}`,
          character
        );

        // 更新TTS配置
        if (character.ttsConfig) {
          segment.ttsConfig = {
            provider:
              character.ttsConfig.provider ||
              settingsStore.activeTTSProviderType ||
              "azure",
            model: character.ttsConfig.model || "",
            speed: character.ttsConfig.speed || 0,
            pitch: character.ttsConfig.pitch || 0,
            volume: character.ttsConfig.volume || 100,
            emotion: character.ttsConfig.emotion || "",
            style: character.ttsConfig.style || "",
          };

          // 更新语音模型
          if (character.ttsConfig.model) {
            segment.voice = character.ttsConfig.model;
          }

          console.log(
            `Updated segment ${index + 1} TTS config:`,
            segment.ttsConfig
          );
        }
      }
    }
  });
}

// 更新解析结果
async function updateParsedChapter() {
  if (!parsedChapter.value || !chapter.value) return;

  isUpdating.value = true;

  try {
    // 调用API更新解析结果 - 现在直接保存到章节的内嵌数据中
    const response = await novelApi.updateParsedChapter(
      chapter.value.id, // 使用章节ID而不是解析结果ID
      parsedChapter.value
    );

    if (response.success) {
      // 更新当前章节的解析数据
      if (chapter.value) {
        chapter.value.parsedData = response.data;
        chapter.value.processed = true;
      }

      toast.success("解析设置已保存");
    } else {
      throw new Error(response.message || "保存失败");
    }
  } catch (error) {
    toast.error(
      `更新失败: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    isUpdating.value = false;
  }
}

// 生成单个段落的TTS
async function generateSegmentTts(index: number) {
  if (
    !parsedChapter.value ||
    !parsedChapter.value.segments[index] ||
    !chapter.value
  ) {
    toast.error("无效的段落");
    return;
  }

  isProcessingSegment[index] = true;

  try {
    const segment = parsedChapter.value.segments[index];

    // 确保段落有声音设置和TTS配置
    if (!segment.voice || !segment.ttsConfig) {
      // 如果是角色对话，尝试根据角色名称匹配声音和TTS配置
      if (segment.character) {
        const matchedCharacters = matchingCharacters(segment.character);
        if (matchedCharacters.length > 0) {
          const character = matchedCharacters[0];

          // 使用角色的TTS配置
          if (!segment.ttsConfig && character.ttsConfig) {
            segment.ttsConfig = {
              provider:
                character.ttsConfig.provider ||
                settingsStore.activeTTSProviderType ||
                "azure",
              model: character.ttsConfig.model || "",
              speed: character.ttsConfig.speed || 0,
              pitch: character.ttsConfig.pitch || 0,
              volume: character.ttsConfig.volume || 100,
              emotion: character.ttsConfig.emotion || "",
              style: character.ttsConfig.style || "",
            };

            // 使用角色TTS配置中的语音模型
            if (!segment.voice && character.ttsConfig.model) {
              segment.voice = character.ttsConfig.model;
            }
          }
        }

        // 如果仍然没有配置，使用默认配置
        if (!segment.voice) {
          segment.voice = segment.character.includes("女")
            ? "zh-CN-XiaoxiaoNeural"
            : "zh-CN-YunxiNeural";
        }
      } else {
        // 旁白使用默认旁白声音
        if (!segment.voice) {
          segment.voice = "zh-CN-XiaoxiaoNeural";
        }
      }

      // 确保有TTS配置
      if (!segment.ttsConfig) {
        segment.ttsConfig = {
          provider: settingsStore.activeTTSProviderType || "azure",
          model: segment.voice,
          speed: 0,
          pitch: 0,
          volume: 100,
          emotion: "",
          style: "",
        };
      }
    }

    // 调用API生成TTS
    const response = await novelApi.generateSegmentTts(chapter.value.id, {
      text: segment.text,
      voice: segment.voice || "zh-CN-XiaoxiaoNeural",
      tone: segment.tone || "平静",
      ttsConfig: segment.ttsConfig,
    });

    if (response.success && response.data) {
      // 设置音频URL到对应的段落
      segmentAudios[index] = response.data.audioUrl;

      // 更新段落的合成状态和音频路径
      segment.synthesisStatus = "synthesized";
      segment.audioUrl = response.data.audioUrl;
      segment.audioPath = response.data.audioPath;

      // 保存更新后的解析结果
      await updateParsedChapter();

      toast.success(`段落 ${index + 1} TTS生成成功`);
    } else {
      throw new Error(response.message || "生成TTS失败");
    }
  } catch (error) {
    toast.error(
      `生成段落TTS失败: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    isProcessingSegment[index] = false;
  }
}

// 生成所有段落的TTS
async function generateAllSegmentTts() {
  if (
    !parsedChapter.value ||
    parsedChapter.value.segments.length === 0 ||
    !chapter.value
  ) {
    toast.error("无可用的段落");
    return;
  }

  isGeneratingAll.value = true;

  try {
    // 对所有段落依次生成TTS
    for (let i = 0; i < parsedChapter.value.segments.length; i++) {
      // 如果段落已经合成过，则跳过
      if (
        parsedChapter.value.segments[i].synthesisStatus === "synthesized" &&
        parsedChapter.value.segments[i].audioUrl
      ) {
        segmentAudios[i] = parsedChapter.value.segments[i].audioUrl || "";
        continue;
      }

      isProcessingSegment[i] = true;
      const segment = parsedChapter.value.segments[i];

      // 确保段落有声音设置和TTS配置
      if (!segment.voice || !segment.ttsConfig) {
        // 如果是角色对话，尝试根据角色名称匹配声音和TTS配置
        if (segment.character) {
          const matchedCharacters = matchingCharacters(segment.character);
          if (matchedCharacters.length > 0) {
            const character = matchedCharacters[0];

            // 使用角色的TTS配置
            if (!segment.ttsConfig && character.ttsConfig) {
              segment.ttsConfig = {
                provider:
                  character.ttsConfig.provider ||
                  settingsStore.activeTTSProviderType ||
                  "azure",
                model: character.ttsConfig.model || "",
                speed: character.ttsConfig.speed || 0,
                pitch: character.ttsConfig.pitch || 0,
                volume: character.ttsConfig.volume || 100,
                emotion: character.ttsConfig.emotion || "",
                style: character.ttsConfig.style || "",
              };

              // 使用角色TTS配置中的语音模型
              if (!segment.voice && character.ttsConfig.model) {
                segment.voice = character.ttsConfig.model;
              }
            }
          }

          // 如果仍然没有配置，使用默认配置
          if (!segment.voice) {
            segment.voice = segment.character.includes("女")
              ? "zh-CN-XiaoxiaoNeural"
              : "zh-CN-YunxiNeural";
          }
        } else {
          // 旁白使用默认旁白声音
          if (!segment.voice) {
            segment.voice = "zh-CN-XiaoxiaoNeural";
          }
        }

        // 确保有TTS配置
        if (!segment.ttsConfig) {
          segment.ttsConfig = {
            provider: settingsStore.activeTTSProviderType || "azure",
            model: segment.voice,
            speed: 0,
            pitch: 0,
            volume: 100,
            emotion: "",
            style: "",
          };
        }
      }

      try {
        // 调用API生成TTS
        const response = await novelApi.generateSegmentTts(chapter.value.id, {
          text: segment.text,
          voice: segment.voice || "zh-CN-XiaoxiaoNeural",
          tone: segment.tone || "平静",
          ttsConfig: segment.ttsConfig,
        });

        if (response.success && response.data) {
          // 设置音频URL到对应的段落
          segmentAudios[i] = response.data.audioUrl;

          // 更新段落的合成状态和音频路径
          segment.synthesisStatus = "synthesized";
          segment.audioUrl = response.data.audioUrl;
          segment.audioPath = response.data.audioPath;
        } else {
          throw new Error(response.message || "生成TTS失败");
        }
      } catch (error) {
        toast.error(
          `段落 ${i + 1} TTS生成失败: ${error instanceof Error ? error.message : String(error)}`
        );
      } finally {
        isProcessingSegment[i] = false;
      }
    }

    // 保存更新后的解析结果
    await updateParsedChapter();

    toast.success("所有段落TTS生成成功");
  } catch (error) {
    toast.error(
      `生成所有段落TTS失败: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    isGeneratingAll.value = false;
  }
}

// 生成整章TTS
async function generateTts() {
  if (!parsedChapter.value || !chapter.value) {
    toast.error("无法生成TTS：未找到解析数据");
    return;
  }

  // 检查是否所有段落都已经生成了TTS
  if (!allSegmentsHaveAudio.value) {
    toast.warning("请先为所有段落生成TTS，再合成整章音频");
    return;
  }

  isProcessing.value = true;

  try {
    // 收集所有段落的音频URL
    const audioUrls = parsedChapter.value.segments.map(
      (segment) => segment.audioUrl || ""
    );

    // 调用API合成整章音频
    const response = await novelApi.generateFullChapterTts(
      chapter.value.id,
      audioUrls
    );

    if (response.success && response.data) {
      ttsResults.value = response.data;

      // 更新章节状态
      if (chapter.value) {
        await novelApi.updateChapter(chapter.value.id, {
          processed: true,
        });
      }

      toast.success("整章TTS生成成功");
    } else {
      throw new Error(response.message || "生成TTS失败");
    }
  } catch (error) {
    toast.error(
      `生成TTS失败: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    isProcessing.value = false;
  }
}

// 获取角色声音标签
function characterVoiceLabel(character: Character): string {
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

// 格式化时长
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// 组件卸载时清理事件监听
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
audio::-webkit-media-controls-panel {
  background-color: #f3f4f6;
}

.dark audio::-webkit-media-controls-panel {
  background-color: #374151;
}
</style>
