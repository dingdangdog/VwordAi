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
      <div class="flex space-x-2">
        <button
          @click="saveChapterContent"
          class="btn btn-sm btn-primary"
          :disabled="!contentChanged || isSaving"
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

      <button
        @click="parseChapter"
        class="mx-2 btn btn-primary btn-sm w-8"
        :disabled="isProcessing"
      >
        <DocumentMagnifyingGlassIcon v-if="!isProcessing" class="h-4 w-4" />
        <div
          v-else
          class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"
        ></div>
        {{ isProcessing ? "解析中..." : "解析" }}
      </button>

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
            {{ isGeneratingAll ? "生成中..." : "全部合成" }}
          </button>
        </div>

        <div v-if="!parsedChapter" class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400 mb-4">
            该章节尚未解析，请点击"解析"按钮进行LLM解析
          </p>
        </div>

        <template v-else>
          <div class="space-y-3 overflow-y-auto flex-1">
            <div
              v-for="(segment, index) in parsedChapter.segments"
              :key="`segment-${index}`"
              class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md"
            >
              <div
                v-if="segment.character"
                class="flex justify-between items-start mb-1"
              >
                <span
                  class="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200"
                >
                  {{ segment.character }}
                </span>
                <span
                  v-if="segment.tone"
                  class="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900 px-2 py-0.5 text-xs font-medium text-purple-800 dark:text-purple-200"
                >
                  {{ segment.tone }}
                </span>
              </div>

              <div class="mt-2">
                <textarea
                  v-model="segment.text"
                  class="input w-full py-1 px-2 text-sm resize-none min-h-[60px]"
                ></textarea>
              </div>

              <div
                class="mt-2 flex flex-wrap gap-2 justify-between items-center"
              >
                <div class="flex gap-2 flex-1 min-w-[200px]">
                  <select
                    v-model="segment.voice"
                    class="text-xs py-0.5 px-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex-1"
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
                    <option value="narrator-1">旁白音 1</option>
                    <option value="narrator-2">旁白音 2</option>
                    <option value="female-1">女声 1</option>
                    <option value="male-1">男声 1</option>
                  </select>
                  <select
                    v-if="segment.character"
                    v-model="segment.tone"
                    class="text-xs py-0.5 px-1 ml-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex-1"
                  >
                    <option value="">无语气</option>
                    <option value="平静">平静</option>
                    <option value="激动">激动</option>
                    <option value="愤怒">愤怒</option>
                    <option value="悲伤">悲伤</option>
                    <option value="欢快">欢快</option>
                  </select>
                </div>

                <div class="flex gap-2">
                  <button
                    @click="generateSegmentTts(index)"
                    class="btn btn-xs btn-secondary flex items-center"
                    :disabled="isProcessingSegment[index]"
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
    <div class="flex justify-center my-2">
      <button
        v-if="parsedChapter"
        @click="generateTts"
        class="btn btn-primary flex items-center"
        :disabled="isProcessing"
      >
        <SpeakerWaveIcon v-if="!isProcessing" class="h-5 w-5 mr-2" />
        <div
          v-else
          class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"
        ></div>
        {{ isProcessing ? "生成中..." : "合成整章音频" }}
      </button>
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
  </div>
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

// 计算属性
const chapterTitle = computed(() => chapter.value?.title || "章节编辑");

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
    const response = await novelApi.parseChapter(chapter.value.id);
    if (response.success && response.data) {
      parsedChapter.value = response.data;

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
