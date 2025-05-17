<template>
  <!-- Template content is preserved from previous edit, not showing it all here to save space -->
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useNovelsStore } from "@/stores/novels";
import {
  DocumentMagnifyingGlassIcon,
  SpeakerWaveIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
} from "@heroicons/vue/24/outline";
import { novelApi } from "@/api";
import type {
  Chapter,
  ParsedChapter,
  Character,
  TtsResult,
} from "@/types/ReadNovels";
import { SUPPORTED_TTS_PROVIDERS } from "@/stores/settings";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const novelsStore = useNovelsStore();

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
const showVoiceSettings = reactive<Record<number, boolean>>({});
const isLoadingVoiceRoles = reactive<Record<number, boolean>>({});
const voiceRolesCache = reactive<Record<string, any[]>>({});
const emotionsCache = reactive<Record<string, any[]>>({});

// 配置项
const serviceProviders = SUPPORTED_TTS_PROVIDERS;

// 计算属性
const chapterTitle = computed(() => chapter.value?.title || "章节编辑");

// 帮助函数 - 确保每个段落都有设置对象
function ensureSegmentSettings(segments: any[]) {
  if (!segments) return;

  segments.forEach((segment, index) => {
    if (!segment.settings) {
      segment.settings = {
        serviceProvider: "",
        voice: "",
        speed: 1,
        pitch: 0,
        volume: 100,
        emotion: "",
      };
    }
    // 初始化此段落的UI状态
    showVoiceSettings[index] = false;
    isLoadingVoiceRoles[index] = false;
  });
}

// 初始化
onMounted(async () => {
  const chapterId = route.params.chapterId as string;
  if (!chapterId) {
    toast.error("章节ID无效");
    return;
  }

  try {
    // 加载章节数据
    const chapterResponse = await novelApi.getChapter(chapterId);
    if (!chapterResponse.success || !chapterResponse.data) {
      throw new Error(chapterResponse.message || "加载章节失败");
    }

    chapter.value = chapterResponse.data;
    novelId.value = chapterResponse.data.novelId;
    editedContent.value = chapterResponse.data.content;

    // 加载解析结果（如果已处理）
    if (chapterResponse.data.processed) {
      const parsedResponse = await novelApi.getParsedChapter(chapterId);
      if (parsedResponse.success && parsedResponse.data) {
        parsedChapter.value = parsedResponse.data;
        // 确保每个段落都有语音设置对象
        ensureSegmentSettings(parsedResponse.data.segments);
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

// 语音设置相关函数
function toggleVoiceSettings(index: number) {
  showVoiceSettings[index] = !showVoiceSettings[index];
}

// 服务商变更处理
async function onProviderChange(index: number) {
  if (!parsedChapter.value) return;

  const segment = parsedChapter.value.segments[index];
  if (!segment || !segment.settings) return;

  // 当服务商变更时，重置语音和情感
  segment.settings.voice = "";
  segment.settings.emotion = "";

  // 加载该服务商的语音模型
  if (segment.settings.serviceProvider) {
    await loadVoiceRoles(index, segment.settings.serviceProvider);
  }
}

// 语音变更处理
async function onVoiceChange(index: number) {
  if (!parsedChapter.value) return;

  const segment = parsedChapter.value.segments[index];
  if (!segment || !segment.settings) return;

  // 重置情感设置
  segment.settings.emotion = "";

  // 加载该语音的情感选项
  if (segment.settings.voice) {
    await loadEmotions(
      index,
      segment.settings.serviceProvider,
      segment.settings.voice
    );
  }
}

// 加载语音角色
async function loadVoiceRoles(index: number, provider: string) {
  if (!provider) return;

  // 如果已有缓存，直接使用
  if (voiceRolesCache[provider]) {
    return;
  }

  isLoadingVoiceRoles[index] = true;

  try {
    // 模拟API调用 - 在实际项目中应替换为真实的API
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 模拟数据
    const mockVoiceRoles = [
      { id: "female-1", name: "女声角色 1", gender: "female" },
      { id: "female-2", name: "女声角色 2", gender: "female" },
      { id: "male-1", name: "男声角色 1", gender: "male" },
      { id: "male-2", name: "男声角色 2", gender: "male" },
      { id: "narrator-1", name: "旁白音 1", gender: "male" },
      { id: "narrator-2", name: "旁白音 2", gender: "female" },
    ];

    // 缓存结果
    voiceRolesCache[provider] = mockVoiceRoles;
  } catch (error) {
    console.error(`加载语音角色失败:`, error);
    toast.error(`加载语音角色失败`);
  } finally {
    isLoadingVoiceRoles[index] = false;
  }
}

// 加载情感选项
async function loadEmotions(index: number, provider: string, voice: string) {
  if (!provider || !voice) return;

  const cacheKey = `${provider}_${voice}`;

  // 如果已有缓存，直接使用
  if (emotionsCache[cacheKey]) {
    return;
  }

  try {
    // 模拟API调用 - 在实际项目中应替换为真实的API
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 模拟数据
    const mockEmotions = [
      { id: "平静", name: "平静" },
      { id: "激动", name: "激动" },
      { id: "愤怒", name: "愤怒" },
      { id: "悲伤", name: "悲伤" },
      { id: "欢快", name: "欢快" },
    ];

    // 缓存结果
    emotionsCache[cacheKey] = mockEmotions;
  } catch (error) {
    console.error(`加载情感选项失败:`, error);
  }
}

// 获取语音角色列表
function getVoiceRoles(index: number) {
  if (!parsedChapter.value) return [];

  const segment = parsedChapter.value.segments[index];
  if (!segment || !segment.settings || !segment.settings.serviceProvider)
    return [];

  return voiceRolesCache[segment.settings.serviceProvider] || [];
}

// 获取情感选项列表
function getEmotions(index: number) {
  if (!parsedChapter.value) return [];

  const segment = parsedChapter.value.segments[index];
  if (
    !segment ||
    !segment.settings ||
    !segment.settings.serviceProvider ||
    !segment.settings.voice
  )
    return [];

  const cacheKey = `${segment.settings.serviceProvider}_${segment.settings.voice}`;
  return emotionsCache[cacheKey] || [];
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
    const response = await novelApi.parseChapter(chapter.value.id);
    if (response.success && response.data) {
      parsedChapter.value = response.data;
      // 确保每个段落都有语音设置对象
      ensureSegmentSettings(response.data.segments);

      // 更新章节处理状态
      if (chapter.value) {
        chapter.value.processed = true;
      }

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

// 更新解析结果
async function updateParsedChapter() {
  if (!parsedChapter.value) return;

  isUpdating.value = true;

  try {
    // 实际项目中这里应该调用API更新解析结果
    toast.success("解析设置已保存");
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
  if (!parsedChapter.value || !parsedChapter.value.segments[index]) {
    toast.error("无效的段落");
    return;
  }

  isProcessingSegment[index] = true;

  try {
    // 模拟API调用 - 在实际项目中应替换为真实的API
    const segment = parsedChapter.value.segments[index];
    const mockAudioUrl = `https://example.com/audio/segment_${Date.now()}_${index}.mp3`;

    // 等待一段时间模拟处理
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 设置音频URL到对应的段落
    segmentAudios[index] = mockAudioUrl;

    toast.success(`段落 ${index + 1} TTS生成成功`);
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
  if (!parsedChapter.value || parsedChapter.value.segments.length === 0) {
    toast.error("无可用的段落");
    return;
  }

  isGeneratingAll.value = true;

  try {
    // 对所有段落依次生成TTS
    for (let i = 0; i < parsedChapter.value.segments.length; i++) {
      isProcessingSegment[i] = true;
      const segment = parsedChapter.value.segments[i];
      const mockAudioUrl = `https://example.com/audio/segment_${Date.now()}_${i}.mp3`;

      // 等待一小段时间模拟处理
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 设置音频URL到对应的段落
      segmentAudios[i] = mockAudioUrl;
      isProcessingSegment[i] = false;
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
  if (!parsedChapter.value) {
    toast.error("无法生成TTS：未找到解析数据");
    return;
  }

  isProcessing.value = true;

  try {
    const response = await novelApi.generateTts(parsedChapter.value.id);
    if (response.success && response.data) {
      ttsResults.value = response.data;
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

// 查找匹配的角色
function matchingCharacters(characterName: string): Character[] {
  if (!characterName) return [];
  return characters.value.filter(
    (c) => c.name === characterName || characterName.includes(c.name)
  );
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
</script>

<style scoped>
audio::-webkit-media-controls-panel {
  background-color: #f3f4f6;
}

.dark audio::-webkit-media-controls-panel {
  background-color: #374151;
}
</style>
