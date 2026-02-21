<template>
  <div class="flex flex-col h-[calc(100vh-4rem)] max-w-[1600px] mx-auto p-2">
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center">
        <button @click="goBack" class="btn btn-sm flex items-center mr-2 text-blue-500 hover:text-blue-400"
          title="返回小说">
          <ArrowLeftIcon class="h-4 w-4 mr-1" />
          返回
        </button>
        <h1 class="text-2xl font-bold text-ink">
          {{ chapterTitle }}
        </h1>
      </div>
      <div class="flex items-center space-x-2">
        <div class="flex items-center mr-2">
          <label class="text-sm text-ink mr-1">LLM服务商:</label>
          <select v-model="selectedLLMProvider"
            class="input select select-sm border border-border rounded-md bg-surface-elevated text-ink">
            <option value="" disabled>请先配置 LLM 服务商</option>
            <option v-for="provider in llmProviders" :key="provider.id" :value="provider.id">
              {{ provider.name || provider.id }}
            </option>
          </select>
        </div>
        <button @click="parseChapter" class="btn btn-sm btn-primary flex items-center" :disabled="isProcessing">
          <DocumentMagnifyingGlassIcon v-if="!isProcessing" class="h-4 w-4 mr-1" />
          <div v-else class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
          {{ isProcessing ? "解析中..." : "解析" }}
        </button>
        <button @click="saveChapterContent" class="btn btn-sm btn-primary" :disabled="isSaving">
          {{ isSaving ? "保存中..." : "保存修改" }}
        </button>
      </div>
    </div>

    <!-- 主编辑区域（上部分） -->
    <div class="flex-1 flex items-center">
      <!-- 左侧 - 原文编辑 -->
      <div class="bg-surface-elevated rounded-lg shadow p-4 flex-1 h-full flex flex-col">
        <h2 class="text-lg font-semibold text-ink mb-3">
          章节原文
        </h2>
        <textarea v-model="editedContent" class="input w-full flex-1 resize-none" placeholder="请输入章节内容..."
          @input="contentChanged = true"></textarea>
      </div>

      <div class="mx-2 flex flex-col justify-center items-center">
        <ArrowRightIcon class="h-6 w-6 text-ink-muted" />
      </div>

      <!-- 右侧 - 解析结果编辑 -->
      <div class="bg-surface-elevated rounded-lg shadow p-4 flex-1 h-full flex flex-col">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold text-ink">
            解析结果
          </h2>
          <div class="flex space-x-2">
            <button v-if="parsedChapter && parsedChapter.segments.length > 0" @click="generateAllSegmentTts"
              class="btn btn-sm btn-primary flex items-center" :disabled="isGeneratingAll">
              <SpeakerWaveIcon v-if="!isGeneratingAll" class="h-4 w-4 mr-1" />
              <div v-else class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1">
              </div>
              {{ isGeneratingAll ? "合成中..." : "全部合成" }}
            </button>
          </div>
        </div>

        <div v-if="!parsedChapter" class="text-center py-8">
          <p class="text-ink-muted mb-4">
            该章节尚未解析，请点击"解析"按钮进行LLM解析
          </p>
        </div>

        <template v-else>
          <div class="space-y-3 max-h-[calc(100vh-18rem)] overflow-y-auto flex-1">
            <div v-for="(segment, index) in displaySegments" :key="`segment-${index}`"
              class="bg-surface-hover p-3 rounded-md">
              <div v-if="segment.character" class="flex justify-between items-start mb-1"></div>

              <div class="mt-2">
                <textarea v-model="segment.text"
                  class="input w-full py-1 px-2 text-sm resize-none min-h-6 max-h-12"></textarea>
              </div>

              <div class="mt-2 flex flex-wrap gap-2 justify-between items-center">
                <span
                  class="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
                  {{ segment.character == "dft" ? "旁白" : segment.character }}
                </span>
                <!-- <span class="text-xs text-ink-muted">
                  {{ segment.character && segment.character !== "旁白" ? "语音沿用角色" : "旁白默认" }}
                </span> -->
                <div class="flex gap-2 flex-1 min-w-[200px] flex-wrap items-center">
                  <!-- 情感：根据当前段落生效的语音模型动态选项 -->
                  <select v-model="segment.ttsConfig.emotion"
                    class="input text-xs py-0.5 px-1 rounded border border-border bg-surface-elevated text-ink w-24">
                    <option value="">无情感</option>
                    <option v-for="emotion in getEmotionsForSegment(segment)" :key="emotion.code" :value="emotion.code">
                      {{ emotion.name }}
                    </option>
                  </select>
                  <span class="text-xs text-ink-muted">语速 {{ segment.ttsConfig.speed ?? 0 }}</span>
                  <span class="text-xs text-ink-muted">音量 {{ segment.ttsConfig.volume ?? 100 }}</span>
                </div>

                <div class="flex gap-2 text-sm">
                  <button @click="showTtsConfig(index)" class="btn btn-xs btn-outline flex items-center"
                    title="语速/情感/音量">
                    <CogIcon class="h-3 w-3" />
                  </button>
                  <button @click="generateSegmentTts(index)" class="btn btn-xs btn-secondary flex items-center"
                    :disabled="isProcessingSegment[index] || !segment.ttsConfig?.provider">
                    <SpeakerWaveIcon v-if="!isProcessingSegment[index]" class="h-3 w-3 mr-1" />
                    <div v-else
                      class="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                    {{ isProcessingSegment[index] ? "合成中" : "合成" }}
                  </button>
                </div>
              </div>

              <!-- 单个段落的音频播放器 -->
              <div v-if="segmentAudios[index]" class="mt-2">
                <audio :src="segmentAudios[index]" controls class="w-full h-8"></audio>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 中间连接按钮 - 生成TTS -->
    <div class="flex flex-col items-center my-2">
      <button v-if="parsedChapter" @click="generateTts" class="btn btn-primary flex items-center"
        :disabled="isProcessing || !allSegmentsHaveAudio">
        <SpeakerWaveIcon v-if="!isProcessing" class="h-5 w-5 mr-2" />
        <div v-else class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
        {{ isProcessing ? "生成中..." : "合成整章音频" }}
      </button>
      <div v-if="parsedChapter && !allSegmentsHaveAudio" class="mt-2 text-sm text-yellow-400">
        请先为所有段落生成TTS，再合成整章音频
      </div>
    </div>

    <!-- TTS播放区域（下部分） -->
    <div v-if="ttsResults.length > 0" class="bg-surface-elevated rounded-lg shadow p-4">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-lg font-semibold text-ink">
          整章音频
        </h2>
        <div>
          <button @click="generateTts" class="btn btn-sm btn-primary flex items-center" :disabled="isProcessing">
            <ArrowPathIcon class="h-4 w-4 mr-1" />
            重新生成
          </button>
        </div>
      </div>

      <div class="mt-4 p-4 border border-border rounded-md">
        <div v-for="(result, index) in ttsResults" :key="`tts-${index}`" class="mb-4 last:mb-0">
          <audio :src="result.audioUrl" controls class="w-full"></audio>
          <div class="text-xs text-ink-muted mt-1 flex justify-between items-center">
            <div class="flex flex-col">
              <span>时长: {{ formatDuration(result.duration) }}</span>
              <span>生成时间: {{ formatDate(result.createdAt) }}</span>
            </div>
            <button @click="openAudioFolder(result.audioUrl)" class="btn btn-xs btn-outline flex items-center"
              title="打开文件夹">
              <FolderOpenIcon class="h-3 w-3 mr-1" />
              打开文件夹
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 段落 TTS 参数弹窗：仅编辑语速、情感、音调、音量（服务商与模型沿用角色） -->
    <div v-if="showTtsConfigModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-surface-elevated rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
        <h3 class="text-lg font-semibold text-ink mb-4">
          段落 {{ currentConfigSegmentIndex + 1 }} - 语速 / 情感 / 音量
        </h3>

        <div class="grid grid-cols-1 gap-4">
          <!-- 情感：根据该段落当前生效的语音模型动态选项 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-ink">情感</span>
            </label>
            <select v-model="currentTtsConfig.emotion" class="select select-bordered w-full bg-surface-hover text-ink">
              <option value="">无情感</option>
              <option v-for="emotion in configModalEmotionOptions" :key="emotion.code" :value="emotion.code">
                {{ emotion.name }}
              </option>
            </select>
          </div>

          <!-- 语速 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-ink">语速</span>
              <span class="label-text-alt text-ink-muted">{{
                currentTtsConfig.speed
              }}</span>
            </label>
            <input v-model="currentTtsConfig.speed" type="range" min="-50" max="50" class="range range-sm" />
            <div class="flex justify-between text-xs text-ink-muted px-1">
              <span>慢</span>
              <span>正常</span>
              <span>快</span>
            </div>
          </div>

          <!-- 音调 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-ink">音调</span>
              <span class="label-text-alt text-ink-muted">{{
                currentTtsConfig.pitch
              }}</span>
            </label>
            <input v-model="currentTtsConfig.pitch" type="range" min="-50" max="50" class="range range-sm" />
            <div class="flex justify-between text-xs text-ink-muted px-1">
              <span>低</span>
              <span>正常</span>
              <span>高</span>
            </div>
          </div>

          <!-- 音量 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-ink">音量</span>
              <span class="label-text-alt text-ink-muted">{{
                currentTtsConfig.volume
              }}</span>
            </label>
            <input v-model="currentTtsConfig.volume" type="range" min="0" max="100" class="range range-sm" />
            <div class="flex justify-between text-xs text-ink-muted px-1">
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
import type { LLMProviderType } from "@/types";
import {
  DocumentMagnifyingGlassIcon,
  SpeakerWaveIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CogIcon,
  FolderOpenIcon,
} from "@heroicons/vue/24/outline";
import { novelApi } from "@/api";
import { ttsApi } from "@/api/ttsApi";
import type { VoiceModelsCache } from "@/api/ttsApi";
import type { TTSProviderType } from "@/types";
import type {
  Chapter,
  ParsedChapter,
  ParsedSegment,
  Character,
  TtsResult,
} from "@/types/ReadNovels";
import { getEmotionDisplayName } from "@/utils/voice-utils";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const novelsStore = useNovelsStore();
const settingsStore = useSettingsStore();

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
const isAutoConfiguring = ref(false);
const isProcessingSegment = reactive<Record<number, boolean>>({});
const segmentAudios = reactive<Record<number, string>>({});

// TTS配置弹窗状态
const showTtsConfigModal = ref(false);
const currentConfigSegmentIndex = ref(-1);
const currentTtsConfig = reactive({
  speed: 0,
  pitch: 0,
  volume: 100,
  emotion: "",
  style: "",
});

// LLM服务商（使用 providerId）
const llmProviders = computed(() => settingsStore.getLLMProviders());
const selectedLLMProvider = ref<LLMProviderType>("");

// 与 CharacterModal / 设置页一致：语音模型与情感选项来自 tts:get-voice-models 的 voiceModelsCache
const voiceModelsCache = ref<VoiceModelsCache>({});

type SegmentWithTts = ParsedSegment & { ttsConfig: NonNullable<ParsedSegment["ttsConfig"]> };

// 计算属性
const chapterTitle = computed(() => chapter.value?.title || "章节编辑");
const allSegmentsHaveAudio = computed(() => {
  if (!parsedChapter.value || parsedChapter.value.segments.length === 0)
    return false;
  return parsedChapter.value.segments.every((_, index) => segmentAudios[index]);
});

/** 展示用段落列表：保证每项都有 ttsConfig，便于模板类型安全 */
const displaySegments = computed((): SegmentWithTts[] => {
  const segs = parsedChapter.value?.segments ?? [];
  segs.forEach((s) => {
    if (!s.ttsConfig)
      s.ttsConfig = {
        provider: (settingsStore.activeTTSProviderType as TTSProviderType) ?? undefined,
        model: "",
        speed: 0,
        pitch: 0,
        volume: 100,
        emotion: "",
        style: "",
      };
  });
  return segs as SegmentWithTts[];
});

// 根据角色名称匹配角色
function matchingCharacters(characterName: string): Character[] {
  if (!characters.value || characters.value.length === 0) return [];

  const exactMatch = characters.value.filter(
    (c) => c.name === characterName || c.aliases?.includes(characterName)
  );
  if (exactMatch.length > 0) return exactMatch;

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

/** 段落当前生效的 TTS 来源：角色管理中的配置（或旁白默认），不在此页编辑 */
function getEffectiveTtsForSegment(segment: SegmentWithTts): { provider: TTSProviderType; modelCode: string } {
  const provider = (settingsStore.activeTTSProviderType as TTSProviderType) || "azure";
  const defaultVoice = "zh-CN-XiaoxiaoNeural";

  if (segment.character && segment.character.trim() && segment.character !== "旁白") {
    const matched = matchingCharacters(segment.character);
    if (matched.length > 0 && matched[0].ttsConfig?.provider && matched[0].ttsConfig?.model) {
      return {
        provider: matched[0].ttsConfig.provider as TTSProviderType,
        modelCode: matched[0].ttsConfig.model,
      };
    }
  }

  if (segment.ttsConfig?.provider && segment.ttsConfig?.model) {
    return {
      provider: segment.ttsConfig.provider as TTSProviderType,
      modelCode: segment.ttsConfig.model,
    };
  }
  return { provider, modelCode: defaultVoice };
}

/** 根据段落当前生效的语音模型，返回该模型支持的情感/风格选项（动态，不写死） */
function getEmotionsForSegment(segment: SegmentWithTts): { code: string; name: string }[] {
  const { provider, modelCode } = getEffectiveTtsForSegment(segment);
  const list = voiceModelsCache.value[provider];
  if (!Array.isArray(list)) return [];
  const model = list.find((m) => m.code === modelCode);
  const items = model?.emotions ?? model?.styles;
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map((e) => ({
    code: e.code,
    name: getEmotionDisplayName(e),
  }));
}

/** 将角色管理中的服务商/语音写入段落（用于合成与展示），不在此页编辑服务商与模型 */
function ensureSegmentTtsFromCharacter(segment: SegmentWithTts) {
  const { provider, modelCode } = getEffectiveTtsForSegment(segment);
  if (!segment.ttsConfig) {
    segment.ttsConfig = {
      provider: undefined,
      model: "",
      speed: 0,
      pitch: 0,
      volume: 100,
      emotion: "",
      style: "",
    };
  }
  segment.ttsConfig.provider = provider;
  segment.ttsConfig.model = modelCode;
  if (!segment.voice) segment.voice = modelCode;
}

/** 加载解析结果或角色变化后，为所有段落填充来自角色的 provider/model */
function ensureAllSegmentsTtsFromCharacters() {
  if (!parsedChapter.value?.segments) return;
  parsedChapter.value.segments.forEach((s) => {
    if (s.ttsConfig) ensureSegmentTtsFromCharacter(s as SegmentWithTts);
  });
}

/** 配置弹窗中当前段落的情感选项（根据该段落生效的模型动态） */
const configModalEmotionOptions = computed(() => {
  if (currentConfigSegmentIndex.value < 0 || !parsedChapter.value?.segments) return [];
  const segment = parsedChapter.value.segments[currentConfigSegmentIndex.value];
  return segment && segment.ttsConfig ? getEmotionsForSegment(segment as SegmentWithTts) : [];
});

// 显示段落 TTS 参数弹窗（仅编辑语速/情感/音调/音量）
function showTtsConfig(index: number) {
  if (!parsedChapter.value || !parsedChapter.value.segments[index]) return;

  const segment = parsedChapter.value.segments[index];
  currentConfigSegmentIndex.value = index;
  ensureSegmentTtsFromCharacter(segment as SegmentWithTts);

  currentTtsConfig.speed = segment.ttsConfig?.speed ?? 0;
  currentTtsConfig.pitch = segment.ttsConfig?.pitch ?? 0;
  currentTtsConfig.volume = segment.ttsConfig?.volume ?? 100;
  currentTtsConfig.emotion = segment.ttsConfig?.emotion ?? "";
  currentTtsConfig.style = segment.ttsConfig?.style ?? "";

  showTtsConfigModal.value = true;
}

// 关闭TTS配置弹窗
function closeTtsConfig() {
  showTtsConfigModal.value = false;
  currentConfigSegmentIndex.value = -1;
}

// 保存段落 TTS 参数（仅写入语速/情感/音调/音量，不修改 provider/model）
function saveTtsConfig() {
  if (currentConfigSegmentIndex.value >= 0 && parsedChapter.value) {
    const segment = parsedChapter.value.segments[currentConfigSegmentIndex.value];
    if (segment.ttsConfig) {
      segment.ttsConfig.speed = currentTtsConfig.speed;
      segment.ttsConfig.pitch = currentTtsConfig.pitch;
      segment.ttsConfig.volume = currentTtsConfig.volume;
      segment.ttsConfig.emotion = currentTtsConfig.emotion;
      segment.ttsConfig.style = currentTtsConfig.style;
    }
    updateParsedChapter();
  }
  closeTtsConfig();
}

// 无选中且已有列表时默认选第一个
watch(
  llmProviders,
  (list) => {
    if (!selectedLLMProvider.value && list.length > 0) {
      selectedLLMProvider.value = list[0].id;
    }
  },
  { immediate: true }
);

// 监听LLM提供商变化
watch(selectedLLMProvider, async (newProvider) => {
  if (chapter.value && newProvider && newProvider !== chapter.value.llmProvider) {
    try {
      await novelApi.updateChapter(chapter.value.id, {
        llmProvider: newProvider,
      });
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
    await settingsStore.loadLLMSettings();
    await settingsStore.loadTTSSettings();

    // 与角色弹窗/设置页一致：用于情感等选项的语音模型缓存
    const voiceRes = await ttsApi.getVoiceModels();
    if (voiceRes.success && voiceRes.data) voiceModelsCache.value = voiceRes.data;

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
        ensureAllSegmentsTtsFromCharacters();
      }

      // 加载TTS结果
      const ttsResponse = await novelApi.getTtsResults(chapterId);
      if (ttsResponse.success && ttsResponse.data) {
        // 处理TTS结果数据结构
        if (Array.isArray(ttsResponse.data)) {
          // 如果是数组，直接使用
          ttsResults.value = ttsResponse.data;
        } else if (ttsResponse.data && typeof ttsResponse.data === 'object' && 'mergedAudioFile' in ttsResponse.data) {
          // 如果是对象结构且有合并的音频文件，转换为数组
          const ttsData = ttsResponse.data as any;
          if (ttsData.mergedAudioFile) {
            ttsResults.value = [ttsData.mergedAudioFile];
          } else {
            ttsResults.value = [];
          }
        } else {
          // 其他情况，初始化为空数组
          ttsResults.value = [];
        }
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

    // 解析请求日志
    const requestPayload = {
      chapterId: chapter.value.id,
      chapterTitle: chapter.value.title,
      llmProvider: selectedLLMProvider.value,
      contentLength: chapter.value.content?.length ?? 0,
      contentPreview:
        chapter.value.content?.slice(0, 500) ?? "(无内容)",
    };
    console.log("[解析-请求]", requestPayload);
    if (chapter.value.content && chapter.value.content.length > 500) {
      console.log("[解析-请求] 完整正文(供后端使用)", chapter.value.content);
    }

    // 调用解析API
    const response = await novelApi.parseChapter(chapter.value.id);

    // 解析响应日志
    console.log("[解析-响应] success:", response.success, "message:", response.message);
    console.log("[解析-响应] data:", response.data);
    if (response.data?.segments) {
      console.log(
        "[解析-响应] segments 数量:",
        response.data.segments.length,
        "segments 详情:",
        response.data.segments
      );
      console.log(
        "[解析-响应] segments JSON:",
        JSON.stringify(response.data.segments, null, 2)
      );
    }

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

            // 角色仅绑定语音（provider/model），情感语速等由段落单独设置
            if (character.ttsConfig) {
              ttsConfig = {
                provider:
                  character.ttsConfig.provider ||
                  settingsStore.activeTTSProviderType ||
                  "azure",
                model: character.ttsConfig.model || "",
                speed: 0,
                pitch: 0,
                volume: 100,
                emotion: "",
                style: "",
              };
              if (character.ttsConfig.model) voice = character.ttsConfig.model;
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
      console.warn("[解析-响应] 业务失败:", response.message, response);
      throw new Error(response.message || "解析失败");
    }
  } catch (error) {
    console.error("[解析-失败]", error);
    toast.error(
      `解析失败: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    isProcessing.value = false;
  }
}

/** 根据性别从当前 TTS 服务商的语音模型中选一个默认模型 code */
function pickDefaultModelByGender(
  voiceCache: VoiceModelsCache,
  provider: TTSProviderType,
  gender: "male" | "female"
): string {
  const list = voiceCache[provider];
  if (!Array.isArray(list) || list.length === 0) return "";
  const wantFemale = gender === "female";
  const match = list.find((m) =>
    wantFemale
      ? m.gender === "0" || m.gender === "female"
      : m.gender === "1" || m.gender === "male"
  );
  if (match) return match.code;
  return list[0]?.code ?? "";
}

// 从解析结果中提取角色并添加到小说中，新角色按性别自动选择默认语音模型
async function extractAndAddCharacters() {
  if (!parsedChapter.value || !chapter.value) return;

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

  const existingCharacterNames = new Set(characters.value.map((c) => c.name));
  const newCharacterNames = Array.from(characterNames).filter(
    (name) => !existingCharacterNames.has(name)
  );

  if (newCharacterNames.length === 0) return;

  let voiceCache: VoiceModelsCache = {};
  try {
    const res = await ttsApi.getVoiceModels();
    if (res.success && res.data) voiceCache = res.data;
  } catch (e) {
    console.warn("Failed to load voice models for auto character:", e);
  }

  const provider = (settingsStore.activeTTSProviderType as TTSProviderType) || "azure";

  for (const name of newCharacterNames) {
    try {
      const gender: "male" | "female" =
        name.includes("女") || name.includes("妹") || name.includes("姐")
          ? "female"
          : "male";

      const model = pickDefaultModelByGender(voiceCache, provider, gender);
      const fallbackModel =
        gender === "female" ? "zh-CN-XiaoxiaoNeural" : "zh-CN-YunxiNeural";

      const newCharacter = {
        novelId: chapter.value.novelId,
        name,
        type: "secondary" as const,
        gender,
        age: "youth" as const,
        description: `从章节「${chapter.value.title}」中自动提取`,
        aliases: [],
        ttsConfig: {
          provider,
          model: model || fallbackModel,
        },
        createdAt: new Date().toISOString(),
      };

      const response = await novelApi.createCharacter(newCharacter);
      if (response.success && response.data) {
        characters.value.push(response.data);
        toast.success(`已自动添加角色「${name}」并绑定默认语音`);
      }
    } catch (error) {
      console.error(`添加角色 ${name} 失败:`, error);
      toast.error(`添加角色「${name}」失败`);
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

        // 仅用角色的 provider/model 更新，保留段落已有的情感/语速等
        if (character.ttsConfig) {
          segment.ttsConfig = {
            ...segment.ttsConfig,
            provider:
              character.ttsConfig.provider ||
              settingsStore.activeTTSProviderType ||
              "azure",
            model: character.ttsConfig.model || "",
            speed: segment.ttsConfig?.speed ?? 0,
            pitch: segment.ttsConfig?.pitch ?? 0,
            volume: segment.ttsConfig?.volume ?? 100,
            emotion: segment.ttsConfig?.emotion ?? "",
            style: segment.ttsConfig?.style ?? "",
          };
          if (character.ttsConfig.model) segment.voice = character.ttsConfig.model;
          console.log(
            `Updated segment ${index + 1} TTS config:`,
            segment.ttsConfig
          );
        }
      }
    }
  });
}

// 自动配置TTS - 检测并应用角色的TTS配置
async function autoConfigureTts() {
  if (!parsedChapter.value || parsedChapter.value.segments.length === 0) {
    toast.warning("没有可配置的解析结果");
    return;
  }

  isAutoConfiguring.value = true;

  try {
    console.log("Starting auto TTS configuration...");

    let configuredCount = 0;
    let totalCharacterSegments = 0;

    // 遍历所有段落，为角色对话应用TTS配置
    parsedChapter.value.segments.forEach((segment, index) => {
      if (
        segment.character &&
        segment.character.trim() &&
        segment.character !== "旁白"
      ) {
        totalCharacterSegments++;

        const matchedCharacters = matchingCharacters(segment.character);
        if (matchedCharacters.length > 0) {
          const character = matchedCharacters[0];

          console.log(
            `Auto-configuring segment ${index + 1}, character: ${segment.character}`,
            character
          );

          // 仅应用角色的语音（provider/model），保留段落的情感/语速等
          if (character.ttsConfig) {
            segment.ttsConfig = {
              ...segment.ttsConfig,
              provider:
                character.ttsConfig.provider ||
                settingsStore.activeTTSProviderType ||
                "azure",
              model: character.ttsConfig.model || "",
              speed: segment.ttsConfig?.speed ?? 0,
              pitch: segment.ttsConfig?.pitch ?? 0,
              volume: segment.ttsConfig?.volume ?? 100,
              emotion: segment.ttsConfig?.emotion ?? "",
              style: segment.ttsConfig?.style ?? "",
            };
            if (character.ttsConfig.model) segment.voice = character.ttsConfig.model;
            configuredCount++;
            console.log(
              `Applied TTS config for ${segment.character}:`,
              segment.ttsConfig
            );
          } else {
            console.log(
              `Character ${segment.character} has no TTS config, using defaults`
            );
            if (!segment.voice) {
              segment.voice = segment.character.includes("女")
                ? "zh-CN-XiaoxiaoNeural"
                : "zh-CN-YunxiNeural";
            }
            if (!segment.ttsConfig) {
              segment.ttsConfig = {
                provider: (settingsStore.activeTTSProviderType as TTSProviderType) ?? undefined,
                model: "",
                speed: 0,
                pitch: 0,
                volume: 100,
                emotion: "",
                style: "",
              };
            }
            if (!segment.ttsConfig!.model) segment.ttsConfig!.model = segment.voice;
          }
        } else {
          console.log(
            `No matching character found for: ${segment.character}, using defaults`
          );
          if (!segment.voice) {
            segment.voice = segment.character.includes("女")
              ? "zh-CN-XiaoxiaoNeural"
              : "zh-CN-YunxiNeural";
          }
          if (!segment.ttsConfig) {
            segment.ttsConfig = {
              provider: (settingsStore.activeTTSProviderType as TTSProviderType) ?? undefined,
              model: "",
              speed: 0,
              pitch: 0,
              volume: 100,
              emotion: "",
              style: "",
            };
          }
          if (!segment.ttsConfig!.model) segment.ttsConfig!.model = segment.voice;
        }
      }
    });

    // 保存更新后的解析结果
    await updateParsedChapter();

    // 显示配置结果
    if (totalCharacterSegments === 0) {
      toast.info("没有找到角色对话段落");
    } else if (configuredCount === 0) {
      toast.warning(`找到 ${totalCharacterSegments} 个角色对话段落，但没有角色有TTS配置`);
    } else {
      toast.success(
        `自动配置完成！成功为 ${configuredCount}/${totalCharacterSegments} 个角色对话段落应用了TTS配置`
      );
    }

    console.log(
      `Auto configuration completed: ${configuredCount}/${totalCharacterSegments} segments configured`
    );
  } catch (error) {
    toast.error(
      `自动配置失败: ${error instanceof Error ? error.message : String(error)}`
    );
    console.error("Auto TTS configuration failed:", error);
  } finally {
    isAutoConfiguring.value = false;
  }
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
    ensureSegmentTtsFromCharacter(segment as SegmentWithTts);

    if (!segment.voice || !segment.ttsConfig) {
      // 如果是角色对话，尝试根据角色名称匹配声音和TTS配置
      if (segment.character) {
        const matchedCharacters = matchingCharacters(segment.character);
        if (matchedCharacters.length > 0) {
          const character = matchedCharacters[0];

          if (!segment.ttsConfig && character.ttsConfig) {
            segment.ttsConfig = {
              provider:
                character.ttsConfig.provider ||
                settingsStore.activeTTSProviderType ||
                "azure",
              model: character.ttsConfig.model || "",
              speed: 0,
              pitch: 0,
              volume: 100,
              emotion: "",
              style: "",
            };
            if (!segment.voice && character.ttsConfig.model) segment.voice = character.ttsConfig.model;
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

// 生成所有段落的TTS（后端角色映射 + 逐段合成，一键完成）
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
    const response = await novelApi.synthesizeAllSegments(chapter.value.id);
    if (!response.success || !response.data) {
      throw new Error(response.message || "全部分段合成失败");
    }
    const { segments: updatedSegments, audioUrls } = response.data;
    if (updatedSegments && Array.isArray(updatedSegments)) {
      parsedChapter.value.segments = updatedSegments;
      updatedSegments.forEach((seg, i) => {
        if (seg.audioUrl) segmentAudios[i] = seg.audioUrl;
      });
    }
    if (audioUrls && audioUrls.length) {
      audioUrls.forEach((url, i) => {
        segmentAudios[i] = url;
      });
    }
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
      // 更新TTS结果
      ttsResults.value = response.data;

      // 更新章节状态
      if (chapter.value) {
        await novelApi.updateChapter(chapter.value.id, {
          processed: true,
        });
      }

      console.log("Full chapter TTS generation completed:", response.data);
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

// 打开音频文件所在文件夹
async function openAudioFolder(audioUrl: string) {
  try {
    // 从音频URL中提取文件路径
    let filePath = audioUrl.replace(/^file:\/\//, "")
      .replace(/%23/g, "#")
      .replace(/%3F/g, "?")
      .replace(/%20/g, " ");

    // 标准化路径
    filePath = filePath.replace(/\//g, "\\");

    console.log("Opening folder for audio file:", filePath);

    // 调用系统API打开文件夹并选中文件
    // @ts-ignore - window.electron由preload.js提供
    const result = await window.electron.showItemInFolder(filePath);

    if (!result.success) {
      throw new Error(result.message || "无法打开文件夹");
    }

    console.log("Successfully opened folder for:", filePath);
  } catch (error) {
    console.error("Failed to open audio folder:", error);
    toast.error(
      `打开文件夹失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
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
