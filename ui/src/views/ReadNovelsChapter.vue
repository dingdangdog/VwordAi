<template>
  <div class="flex flex-col h-[calc(100vh-4rem)] max-w-[1600px] mx-auto overflow-hidden">
    <!-- 顶栏：固定高度，不滚动 -->
    <header class="flex-shrink-0 flex justify-between items-center px-2 py-1.5 border-b border-border">
      <div class="flex items-center min-w-0">
        <button @click="goBack" class="btn btn-sm flex items-center shrink-0 mr-2 text-blue-500 hover:text-blue-400"
          title="返回小说">
          <ArrowLeftIcon class="h-4 w-4 mr-1" />
          返回
        </button>
        <h1 class="text-lg font-bold text-ink truncate">
          {{ chapterTitle }}
        </h1>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button @click="parseChapter" class="btn btn-sm btn-primary flex items-center" :disabled="isProcessing">
          <DocumentMagnifyingGlassIcon v-if="!isProcessing" class="h-4 w-4 mr-1" />
          <div v-else class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
          {{ isProcessing ? "解析中..." : "解析" }}
        </button>
        <button @click="saveChapterContent" class="btn btn-sm btn-primary" :disabled="isSaving">
          {{ isSaving ? "保存中..." : "保存" }}
        </button>
      </div>
    </header>

    <!-- 主内容：两列，占满剩余高度，内部滚动 -->
    <div class="flex-1 min-h-0 flex gap-2 p-2">
      <!-- 左侧 - 章节原文 -->
      <div class="w-1/2 min-w-0 flex flex-col bg-surface-elevated rounded-md shadow overflow-hidden">
        <h2 class="flex-shrink-0 text-sm font-semibold text-ink px-3 py-2 border-b border-border">
          章节原文
        </h2>
        <div class="flex-1 min-h-0 relative flex flex-col">
          <textarea v-model="editedContent"
            class="input w-full flex-1 min-h-0 resize-none overflow-auto text-sm py-2 px-3 rounded-none border-0 focus:ring-0"
            placeholder="请输入章节内容..." @input="contentChanged = true"></textarea>
          <span class="absolute bottom-2 right-3 text-xs text-ink-muted pointer-events-none">
            {{ editedContentLength }} 字
          </span>
        </div>
      </div>

      <!-- 右侧 - 解析结果 + 整章音频 -->
      <div class="w-1/2 min-w-0 flex flex-col gap-2 min-h-0">
        <!-- 解析结果 -->
        <div class="flex-1 min-h-0 flex flex-col bg-surface-elevated rounded-lg shadow overflow-hidden">
          <div class="flex-shrink-0 flex justify-between items-center px-3 py-2 border-b border-border">
            <h2 class="text-sm font-semibold text-ink">
              解析结果
            </h2>
            <button v-if="parsedChapter && parsedChapter.segments.length > 0" @click="generateAllSegmentTts"
              class="btn btn-sm btn-primary flex items-center" :disabled="isGeneratingAll">
              <SpeakerWaveIcon v-if="!isGeneratingAll" class="h-4 w-4 mr-1" />
              <div v-else class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1">
              </div>
              {{ isGeneratingAll ? "合成中..." : "全部合成" }}
            </button>
          </div>
          <div v-if="!parsedChapter" class="flex-1 flex items-center justify-center p-4">
            <p class="text-sm text-ink-muted text-center">
              该章节尚未解析，请点击「解析」进行 LLM 解析
            </p>
          </div>
          <div v-else class="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
            <div v-for="(segment, index) in displaySegments" :key="`segment-${index}`"
              class="bg-surface-hover p-2 rounded-md">
              <div class="mt-1">
                <textarea v-model="segment.text"
                  class="input w-full py-1 px-2 text-sm resize-none min-h-[2.5rem] max-h-24 overflow-auto" />
              </div>
              <div class="mt-2 flex flex-wrap gap-2 justify-between items-center">
                <span
                  class="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
                  {{ segment.character == "dft" ? "旁白" : segment.character }}
                </span>
                <div class="flex gap-2 flex-1 min-w-[180px] flex-wrap items-center">
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
                <div class="flex gap-1 text-sm">
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
              <div v-if="segmentAudios[index]" class="mt-2">
                <audio :key="segmentAudios[index]" :src="segmentAudios[index]" controls class="w-full h-8"></audio>
              </div>
            </div>
          </div>
        </div>

        <!-- 整章音频：输出区，用左侧色条+标题样式与上方「解析结果」区分 -->
        <div
          class="flex-shrink-0 flex flex-col rounded-lg overflow-hidden max-h-[180px] border border-emerald-200 dark:border-emerald-800 border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
        >
          <div
            class="flex-shrink-0 flex justify-between items-center px-3 py-2 bg-emerald-100/80 dark:bg-emerald-900/40"
          >
            <h2 class="text-sm font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
              <SpeakerWaveIcon class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              整章音频
            </h2>
            <div class="flex items-center gap-2">
              <span v-if="parsedChapter && !allSegmentsHaveAudio" class="text-xs text-amber-600 dark:text-amber-400">
                需先为所有段落合成
              </span>
              <button v-if="parsedChapter" @click="generateTts" class="btn btn-xs btn-primary flex items-center"
                :disabled="isProcessing || !allSegmentsHaveAudio">
                <SpeakerWaveIcon v-if="!isProcessing" class="h-3.5 w-3.5 mr-1" />
                <div v-else
                  class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                {{ isProcessing ? "生成中..." : "合成整章" }}
              </button>
              <button v-if="ttsResults.length > 0" @click="generateTts" class="btn btn-xs btn-outline flex items-center"
                :disabled="isProcessing">
                <ArrowPathIcon class="h-3.5 w-3.5 mr-1" />
                重新生成
              </button>
            </div>
          </div>
          <div class="flex-1 min-h-0 overflow-y-auto p-2 bg-white/50 dark:bg-black/20">
            <template v-if="ttsResults.length === 0">
              <p class="text-xs text-ink-muted py-2">暂无整章音频，合成所有段落后可生成</p>
            </template>
            <template v-else>
              <div v-for="(result, index) in ttsResults" :key="`tts-${index}`" class="mb-2 last:mb-0">
                <audio :src="result.audioUrl" controls class="w-full h-8"></audio>
                <div class="text-xs text-ink-muted mt-0.5 flex justify-between items-center">
                  <span>{{ formatDuration(result.duration) }} · {{ formatDate(result.createdAt) }}</span>
                  <button @click="openAudioFolder(result.audioUrl)" class="btn btn-xs btn-ghost py-0" title="打开文件夹">
                    <FolderOpenIcon class="h-3 w-3" />
                  </button>
                </div>
              </div>
            </template>
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
const editedContentLength = computed(() => (editedContent.value || "").length);
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

/** 段落当前生效的 TTS 来源：严格沿用角色管理中维护的 provider + 语音模型，不在此页编辑 */
function getEffectiveTtsForSegment(segment: SegmentWithTts): { provider: TTSProviderType; modelCode: string } {
  const provider = (settingsStore.activeTTSProviderType as TTSProviderType) || "azure";
  const defaultVoice = "zh-CN-XiaoxiaoNeural";

  if (segment.character && segment.character.trim() && segment.character !== "旁白") {
    const matched = matchingCharacters(segment.character);
    if (matched.length > 0) {
      const c = matched[0];
      const modelCode = c.ttsConfig?.model || c.voiceModel || "";
      const prov = (c.ttsConfig?.provider as TTSProviderType) || provider;
      if (modelCode) return { provider: prov, modelCode };
    }
  }

  if (segment.ttsConfig?.provider && (segment.ttsConfig?.model || segment.voice)) {
    return {
      provider: segment.ttsConfig.provider as TTSProviderType,
      modelCode: segment.ttsConfig.model || segment.voice || defaultVoice,
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

    // 先加载小说角色，再加载解析结果，这样 ensureAllSegmentsTtsFromCharacters 才能正确应用角色声音
    const charactersResponse = await novelApi.getCharacters(chapterResponse.data.novelId);
    if (charactersResponse.success && charactersResponse.data) {
      characters.value = charactersResponse.data;
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

// 生成单个段落的TTS（再次点击时先清除原语音，再按当前配置重新生成）
async function generateSegmentTts(index: number) {
  if (
    !parsedChapter.value ||
    !parsedChapter.value.segments[index] ||
    !chapter.value
  ) {
    toast.error("无效的段落");
    return;
  }

  const segment = parsedChapter.value.segments[index];
  // 先删除原有语音引用与状态并落盘，再按新配置生成
  delete segmentAudios[index];
  segment.audioUrl = undefined;
  segment.audioPath = undefined;
  segment.synthesisStatus = "unsynthesized";
  await updateParsedChapter();

  isProcessingSegment[index] = true;

  try {
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

    // voice 与 ttsConfig.model 保持一致，以角色/段落选定的模型为准
    const voiceModel = segment.ttsConfig?.model || segment.voice || "zh-CN-XiaoxiaoNeural";
    const response = await novelApi.generateSegmentTts(chapter.value.id, {
      text: segment.text,
      voice: voiceModel,
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

// 生成所有段落的TTS（再次点击时先清除所有原语音，再按当前配置逐段重新生成）
async function generateAllSegmentTts() {
  if (
    !parsedChapter.value ||
    parsedChapter.value.segments.length === 0 ||
    !chapter.value
  ) {
    toast.error("无可用的段落");
    return;
  }

  // 先删除所有段落的原有语音引用与状态
  parsedChapter.value.segments.forEach((seg, i) => {
    delete segmentAudios[i];
    seg.audioUrl = undefined;
    seg.audioPath = undefined;
    seg.synthesisStatus = "unsynthesized";
  });

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
