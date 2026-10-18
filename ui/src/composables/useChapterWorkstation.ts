import { computed, reactive, ref, watch } from "vue";
import { useToast } from "vue-toastification";
import { novelApi } from "@/api";
import { ttsApi, type VoiceModelsCache } from "@/api/ttsApi";
import { useSettingsStore } from "@/stores/settings";
import type { LLMProviderType, TTSProviderType } from "@/types";
import type { Chapter, Character, ParsedChapter, ParsedSegment } from "@/types/ReadNovels";
import { getEmotionDisplayName } from "@/utils/voice-utils";

export type SegmentTtsConfig = NonNullable<ParsedSegment["ttsConfig"]>;
export type SegmentWithTts = ParsedSegment & { ttsConfig: SegmentTtsConfig };

export interface ChapterAudio {
  audioUrl: string;
  duration?: number;
  createdAt?: string;
}

const DEFAULT_FEMALE_VOICE = "zh-CN-XiaoxiaoNeural";
const DEFAULT_MALE_VOICE = "zh-CN-YunxiNeural";

/** 旁白标识：LLM 可能返回 "dft"，统一按 "旁白" 判断 */
export function isNarratorName(character?: string) {
  const c = (character || "").trim();
  return c === "旁白" || c === "dft" || !c;
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * 小说章节工作台的数据与操作：加载章节/角色/解析结果，解析、逐段与整章合成。
 * 段落的服务商与语音模型沿用角色配置，段落只覆盖情感、语速、音调、音量。
 */
export function useChapterWorkstation() {
  const toast = useToast();
  const settingsStore = useSettingsStore();

  const chapter = ref<Chapter | null>(null);
  const parsedChapter = ref<ParsedChapter | null>(null);
  const characters = ref<Character[]>([]);
  const chapterAudios = ref<ChapterAudio[]>([]);
  const editedContent = ref("");
  const loading = ref(true);
  const isSaving = ref(false);
  const isParsing = ref(false);
  const isMerging = ref(false);
  const isUpdating = ref(false);
  const isGeneratingAll = ref(false);
  const batchProgress = ref<{ done: number; total: number } | null>(null);
  const processingSegments = reactive<Record<number, boolean>>({});
  const segmentAudios = reactive<Record<number, string>>({});
  const voiceModelsCache = ref<VoiceModelsCache>({});

  const llmProviders = computed(() => settingsStore.getLLMProviders());
  const selectedLLMProvider = ref<LLMProviderType>("");
  const skipLlm = ref(false);
  const plainSpeaker = ref("旁白");

  const contentChanged = computed(() => !!chapter.value && editedContent.value !== (chapter.value.content || ""));
  const segments = computed<SegmentWithTts[]>(() => {
    const list = parsedChapter.value?.segments ?? [];
    list.forEach((s) => {
      if (!s.ttsConfig) s.ttsConfig = blankTtsConfig();
    });
    return list as SegmentWithTts[];
  });
  const synthesizedCount = computed(() => segments.value.filter((_, i) => segmentAudios[i]).length);
  const allSegmentsHaveAudio = computed(
    () => segments.value.length > 0 && synthesizedCount.value === segments.value.length
  );

  function activeProvider(): TTSProviderType {
    return (settingsStore.activeTTSProviderType as TTSProviderType) || "azure";
  }

  function blankTtsConfig(model = ""): SegmentTtsConfig {
    return { provider: activeProvider(), model, speed: 0, pitch: 0, volume: 100, emotion: "", style: "" };
  }

  watch(
    llmProviders,
    (list) => {
      if (!selectedLLMProvider.value && list.length > 0) selectedLLMProvider.value = list[0].id;
    },
    { immediate: true }
  );

  watch(selectedLLMProvider, async (provider) => {
    if (!chapter.value || !provider || provider === chapter.value.llmProvider) return;
    try {
      await novelApi.updateChapter(chapter.value.id, { llmProvider: provider });
      chapter.value.llmProvider = provider;
    } catch (error) {
      toast.error(`更新语言模型失败：${errorText(error)}`);
    }
  });

  function matchingCharacters(name: string): Character[] {
    if (!characters.value.length) return [];
    const exact = characters.value.filter((c) => c.name === name || c.aliases?.includes(name));
    if (exact.length) return exact;
    return characters.value.filter(
      (c) =>
        c.name.includes(name) ||
        name.includes(c.name) ||
        c.aliases?.some((alias) => alias.includes(name) || name.includes(alias))
    );
  }

  function characterFor(segment: ParsedSegment): Character | null {
    if (isNarratorName(segment.character)) return null;
    return matchingCharacters(segment.character)[0] || null;
  }

  /** 段落当前生效的 TTS 来源：严格沿用角色管理中维护的 provider + 语音模型 */
  function effectiveTts(segment: SegmentWithTts): { provider: TTSProviderType; modelCode: string } {
    const provider = activeProvider();
    const matched = characterFor(segment);
    if (matched) {
      const modelCode = matched.ttsConfig?.model || matched.voiceModel || "";
      if (modelCode) return { provider: (matched.ttsConfig?.provider as TTSProviderType) || provider, modelCode };
    }
    if (segment.ttsConfig?.provider && (segment.ttsConfig.model || segment.voice)) {
      return {
        provider: segment.ttsConfig.provider as TTSProviderType,
        modelCode: segment.ttsConfig.model || segment.voice || DEFAULT_FEMALE_VOICE,
      };
    }
    return { provider, modelCode: DEFAULT_FEMALE_VOICE };
  }

  function modelName(provider: TTSProviderType | undefined, code: string) {
    if (!provider || !code) return code || "";
    const list = voiceModelsCache.value[provider];
    return (Array.isArray(list) && list.find((m) => m.code === code)?.name) || code;
  }

  /** 根据段落生效的语音模型返回支持的情感/风格选项 */
  function emotionsFor(segment: SegmentWithTts): { code: string; name: string }[] {
    const { provider, modelCode } = effectiveTts(segment);
    const list = voiceModelsCache.value[provider];
    if (!Array.isArray(list)) return [];
    const model = list.find((m) => m.code === modelCode);
    const items = model?.emotions ?? model?.styles;
    if (!Array.isArray(items)) return [];
    return items.map((e) => ({ code: e.code, name: getEmotionDisplayName(e) }));
  }

  function applyCharacterTts(segment: SegmentWithTts) {
    const { provider, modelCode } = effectiveTts(segment);
    if (!segment.ttsConfig) segment.ttsConfig = blankTtsConfig();
    segment.ttsConfig.provider = provider;
    segment.ttsConfig.model = modelCode;
    if (!segment.voice) segment.voice = modelCode;
  }

  function applyCharacterTtsToAll() {
    segments.value.forEach(applyCharacterTts);
  }

  function normalizeChapterAudios(data: unknown): ChapterAudio[] {
    if (Array.isArray(data)) {
      return data
        .map((item) => (typeof item === "string" ? { audioUrl: item } : item))
        .filter((item): item is ChapterAudio => !!item?.audioUrl);
    }
    if (data && typeof data === "object" && "mergedAudioFile" in data) {
      const merged = (data as { mergedAudioFile?: string }).mergedAudioFile;
      return merged ? [{ audioUrl: merged }] : [];
    }
    return [];
  }

  async function load(chapterId: string) {
    loading.value = true;
    try {
      await settingsStore.loadLLMSettings();
      await settingsStore.loadTTSSettings();
      const voiceRes = await ttsApi.getVoiceModels();
      if (voiceRes.success && voiceRes.data) voiceModelsCache.value = voiceRes.data;

      const chapterRes = await novelApi.getChapter(chapterId);
      if (!chapterRes.success || !chapterRes.data) throw new Error(chapterRes.message || "加载章节失败");
      chapter.value = chapterRes.data;
      editedContent.value = chapterRes.data.content || "";
      if (chapterRes.data.llmProvider) selectedLLMProvider.value = chapterRes.data.llmProvider as LLMProviderType;

      const charRes = await novelApi.getCharacters(chapterRes.data.novelId);
      if (charRes.success && charRes.data) characters.value = charRes.data;

      Object.keys(segmentAudios).forEach((k) => delete segmentAudios[Number(k)]);
      parsedChapter.value = null;
      chapterAudios.value = [];

      if (chapterRes.data.processed) {
        const parsedRes = await novelApi.getParsedChapter(chapterId);
        if (parsedRes.success && parsedRes.data) {
          parsedRes.data.segments = parsedRes.data.segments.map((segment, index) => {
            const next = {
              ...segment,
              ttsConfig: segment.ttsConfig || blankTtsConfig(segment.voice || ""),
              synthesisStatus: segment.synthesisStatus || "unsynthesized",
            };
            if (next.audioUrl) segmentAudios[index] = next.audioUrl;
            return next;
          });
          parsedChapter.value = parsedRes.data;
          applyCharacterTtsToAll();
        }
        const ttsRes = await novelApi.getTtsResults(chapterId);
        if (ttsRes.success) chapterAudios.value = normalizeChapterAudios(ttsRes.data);
      }
    } catch (error) {
      toast.error(`加载章节失败：${errorText(error)}`);
    } finally {
      loading.value = false;
    }
  }

  async function saveContent(silent = false) {
    if (!chapter.value || !contentChanged.value) return true;
    isSaving.value = true;
    try {
      const res = await novelApi.updateChapter(chapter.value.id, { content: editedContent.value });
      if (!res.success) throw new Error(res.message || "保存失败");
      chapter.value.content = editedContent.value;
      if (!silent) toast.success("章节原文已保存");
      return true;
    } catch (error) {
      toast.error(`保存失败：${errorText(error)}`);
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  async function saveParsed(silent = true) {
    if (!parsedChapter.value || !chapter.value) return true;
    isUpdating.value = true;
    try {
      const res = await novelApi.updateParsedChapter(chapter.value.id, parsedChapter.value);
      if (!res.success) throw new Error(res.message || "保存失败");
      chapter.value.parsedData = res.data;
      chapter.value.processed = true;
      if (!silent) toast.success("分段设置已保存");
      return true;
    } catch (error) {
      toast.error(`保存分段失败：${errorText(error)}`);
      return false;
    } finally {
      isUpdating.value = false;
    }
  }

  async function saveAll() {
    const okContent = await saveContent(true);
    const okParsed = await saveParsed(true);
    if (okContent && okParsed) toast.success("已保存");
  }

  function pickDefaultModelByGender(provider: TTSProviderType, gender: "male" | "female") {
    const list = voiceModelsCache.value[provider];
    if (!Array.isArray(list) || !list.length) return "";
    const female = gender === "female";
    const match = list.find((m) =>
      female ? m.gender === "0" || m.gender === "female" : m.gender === "1" || m.gender === "male"
    );
    return match?.code ?? list[0]?.code ?? "";
  }

  /** 从解析结果中提取新角色并按性别绑定默认语音 */
  async function extractAndAddCharacters() {
    if (!parsedChapter.value || !chapter.value) return;
    const names = new Set<string>();
    parsedChapter.value.segments.forEach((s) => {
      if (!isNarratorName(s.character)) names.add((s.character || "").trim());
    });
    const existing = new Set(characters.value.map((c) => c.name));
    const fresh = [...names].filter((name) => !existing.has(name));
    if (!fresh.length) return;

    const provider = activeProvider();
    const added: string[] = [];
    for (const name of fresh) {
      const gender: "male" | "female" = /[女妹姐]/.test(name) ? "female" : "male";
      const model =
        pickDefaultModelByGender(provider, gender) || (gender === "female" ? DEFAULT_FEMALE_VOICE : DEFAULT_MALE_VOICE);
      try {
        const res = await novelApi.createCharacter({
          novelId: chapter.value.novelId,
          name,
          type: "secondary",
          gender,
          age: "youth",
          description: `从章节「${chapter.value.title}」中自动提取`,
          aliases: [],
          ttsConfig: { provider, model },
          createdAt: new Date().toISOString(),
        } as Omit<Character, "id">);
        if (res.success && res.data) {
          characters.value.push(res.data);
          added.push(name);
        }
      } catch (error) {
        console.error(`添加角色 ${name} 失败:`, error);
        toast.error(`添加角色「${name}」失败`);
      }
    }
    if (added.length) toast.success(`已自动添加 ${added.length} 个角色：${added.join("、")}`);
  }

  function initialSegmentConfig(segment: ParsedSegment) {
    let ttsConfig = blankTtsConfig(segment.voice || "");
    let voice = segment.voice || "";
    if (!isNarratorName(segment.character)) {
      const matched = matchingCharacters(segment.character)[0];
      if (matched?.ttsConfig) {
        ttsConfig = { ...blankTtsConfig(), provider: matched.ttsConfig.provider || activeProvider(), model: matched.ttsConfig.model || "" };
        if (matched.ttsConfig.model) voice = matched.ttsConfig.model;
      } else if (!matched && !voice) {
        voice = segment.character.includes("女") ? DEFAULT_FEMALE_VOICE : DEFAULT_MALE_VOICE;
      }
    } else if (!voice) {
      voice = DEFAULT_FEMALE_VOICE;
    }
    if (voice && !ttsConfig.model) ttsConfig.model = voice;
    return { ...segment, voice, ttsConfig, synthesisStatus: "unsynthesized" as const };
  }

  async function parse() {
    if (!chapter.value) return;
    if (!(await saveContent(true))) return;
    isParsing.value = true;
    try {
      if (!skipLlm.value) {
        await novelApi.updateChapter(chapter.value.id, { llmProvider: selectedLLMProvider.value });
        chapter.value.llmProvider = selectedLLMProvider.value;
      }
      const res = await novelApi.parseChapter(
        chapter.value.id,
        skipLlm.value ? { useLlm: false, speaker: plainSpeaker.value.trim() || "旁白" } : undefined
      );
      if (!res.success || !res.data) throw new Error(res.message || "解析失败");
      res.data.segments = res.data.segments.map(initialSegmentConfig);
      Object.keys(segmentAudios).forEach((k) => delete segmentAudios[Number(k)]);
      parsedChapter.value = res.data;
      chapter.value.processed = true;
      await extractAndAddCharacters();
      applyCharacterTtsToAll();
      await saveParsed(true);
      toast.success(`解析完成，共 ${res.data.segments.length} 段`);
    } catch (error) {
      toast.error(`解析失败：${errorText(error)}`);
    } finally {
      isParsing.value = false;
    }
  }

  /** 生成单段语音：先清除原语音，再按当前配置重新生成 */
  async function synthesizeSegment(index: number, notify = true) {
    const segment = segments.value[index];
    if (!segment || !chapter.value) return false;
    delete segmentAudios[index];
    segment.audioUrl = undefined;
    segment.audioPath = undefined;
    segment.synthesisStatus = "unsynthesized";
    processingSegments[index] = true;
    try {
      applyCharacterTts(segment);
      if (!segment.voice) {
        const male = !isNarratorName(segment.character) && !segment.character.includes("女");
        segment.voice = male ? DEFAULT_MALE_VOICE : DEFAULT_FEMALE_VOICE;
      }
      const res = await novelApi.generateSegmentTts(chapter.value.id, {
        text: segment.text,
        voice: segment.ttsConfig?.model || segment.voice || DEFAULT_FEMALE_VOICE,
        tone: segment.tone || "平静",
        ttsConfig: segment.ttsConfig,
      });
      if (!res.success || !res.data) throw new Error(res.message || "生成语音失败");
      segmentAudios[index] = res.data.audioUrl;
      segment.synthesisStatus = "synthesized";
      segment.audioUrl = res.data.audioUrl;
      segment.audioPath = res.data.audioPath;
      await saveParsed(true);
      if (notify) toast.success(`第 ${index + 1} 段合成完成`);
      return true;
    } catch (error) {
      toast.error(`第 ${index + 1} 段合成失败：${errorText(error)}`);
      return false;
    } finally {
      processingSegments[index] = false;
    }
  }

  async function synthesizeSegments(indexes: number[]) {
    if (!indexes.length) return;
    if (indexes.length === 1) {
      await synthesizeSegment(indexes[0]);
      return;
    }
    batchProgress.value = { done: 0, total: indexes.length };
    let ok = 0;
    for (const index of indexes) {
      if (await synthesizeSegment(index, false)) ok += 1;
      batchProgress.value = { done: batchProgress.value.done + 1, total: indexes.length };
    }
    batchProgress.value = null;
    toast.success(`已合成 ${ok}/${indexes.length} 段`);
  }

  /** 全部分段合成：交给后端逐段生成 */
  async function synthesizeAll() {
    if (!chapter.value || !segments.value.length) return;
    segments.value.forEach((seg, i) => {
      delete segmentAudios[i];
      seg.audioUrl = undefined;
      seg.audioPath = undefined;
      seg.synthesisStatus = "unsynthesized";
    });
    isGeneratingAll.value = true;
    try {
      const res = await novelApi.synthesizeAllSegments(chapter.value.id);
      if (!res.success || !res.data) throw new Error(res.message || "全部分段合成失败");
      const { segments: updated, audioUrls } = res.data;
      if (Array.isArray(updated) && parsedChapter.value) {
        parsedChapter.value.segments = updated;
        updated.forEach((seg, i) => {
          if (seg.audioUrl) segmentAudios[i] = seg.audioUrl;
        });
      }
      (audioUrls || []).forEach((url, i) => {
        if (url) segmentAudios[i] = url;
      });
      toast.success("全部段落合成完成");
    } catch (error) {
      toast.error(`全部分段合成失败：${errorText(error)}`);
    } finally {
      isGeneratingAll.value = false;
    }
  }

  async function mergeChapter() {
    if (!parsedChapter.value || !chapter.value) return;
    if (!allSegmentsHaveAudio.value) {
      toast.warning("请先合成全部段落，再生成整章音频");
      return;
    }
    isMerging.value = true;
    try {
      const urls = parsedChapter.value.segments.map((s) => s.audioUrl || "");
      const res = await novelApi.generateFullChapterTts(chapter.value.id, urls);
      if (!res.success || !res.data) throw new Error(res.message || "生成整章音频失败");
      chapterAudios.value = normalizeChapterAudios(res.data);
      await novelApi.updateChapter(chapter.value.id, { processed: true });
      toast.success("整章音频已生成");
    } catch (error) {
      toast.error(`生成整章音频失败：${errorText(error)}`);
    } finally {
      isMerging.value = false;
    }
  }

  async function updateCharacter(id: string, data: Partial<Character>) {
    try {
      const res = await novelApi.updateCharacter(id, data);
      if (!res.success) throw new Error(res.message || "更新角色失败");
      const index = characters.value.findIndex((c) => c.id === id);
      if (index !== -1) characters.value[index] = { ...characters.value[index], ...data, ...(res.data || {}) };
      applyCharacterTtsToAll();
      await saveParsed(true);
      toast.success("角色已更新，相关段落已同步音色");
    } catch (error) {
      toast.error(`更新角色失败：${errorText(error)}`);
    }
  }

  async function revealAudio(audioUrl: string) {
    try {
      const filePath = audioUrl
        .replace(/^file:\/\//, "")
        .replace(/%23/g, "#")
        .replace(/%3F/g, "?")
        .replace(/%20/g, " ")
        .replace(/\//g, "\\");
      const res = await window.electron.showItemInFolder(filePath);
      if (res && res.success === false) throw new Error(res.message || "无法打开文件夹");
    } catch (error) {
      toast.error(`打开文件夹失败：${errorText(error)}`);
    }
  }

  return {
    chapter,
    parsedChapter,
    characters,
    chapterAudios,
    editedContent,
    contentChanged,
    loading,
    isSaving,
    isParsing,
    isMerging,
    isUpdating,
    isGeneratingAll,
    batchProgress,
    processingSegments,
    segmentAudios,
    segments,
    synthesizedCount,
    allSegmentsHaveAudio,
    llmProviders,
    selectedLLMProvider,
    skipLlm,
    plainSpeaker,
    load,
    saveContent,
    saveParsed,
    saveAll,
    parse,
    synthesizeSegment,
    synthesizeSegments,
    synthesizeAll,
    mergeChapter,
    updateCharacter,
    revealAudio,
    characterFor,
    effectiveTts,
    emotionsFor,
    modelName,
  };
}
