<template>
  <div class="chapter-processor bg-surface-elevated rounded-lg shadow">
    <!-- 标签切换 -->
    <div class="border-b border-border">
      <nav class="flex -mb-px">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="py-2 pl-3 pr-4 text-center border-b-2 font-medium text-sm whitespace-nowrap duration-200 transition-all"
          :class="
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
          "
        >
          <component :is="tab.icon" class="h-5 w-5 inline-block mr-1" />
          {{ tab.name }}
        </button>
      </nav>
    </div>

    <!-- 内容区域 -->
    <div class="p-4">
      <!-- 编辑章节 -->
      <div v-if="activeTab === 'edit'" class="space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold text-ink">
            {{ chapter.title }}
          </h2>
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

        <textarea
          v-model="editedContent"
          class="w-full h-96 p-2 border border-border rounded-md bg-surface-elevated text-ink resize-none"
          placeholder="请输入章节内容..."
          @input="contentChanged = true"
        ></textarea>

        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <label class="text-sm text-ink"
              >LLM服务商:</label
            >
            <select
              v-model="selectedLLMProvider"
              class="select select-sm border border-border rounded-md bg-surface-elevated text-ink"
            >
              <option value="" disabled>请先配置 LLM 服务商</option>
              <option
                v-for="provider in llmProviders"
                :key="provider.id"
                :value="provider.id"
              >
                {{ provider.name || provider.id }}
              </option>
            </select>
          </div>

          <button
            @click="parseChapter"
            class="btn btn-primary"
            :disabled="isProcessing"
          >
            <DocumentMagnifyingGlassIcon
              v-if="!isProcessing"
              class="h-5 w-5 mr-2"
            />
            <div
              v-else
              class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"
            ></div>
            {{ isProcessing ? "解析中..." : "LLM解析章节" }}
          </button>
        </div>
      </div>

      <!-- 查看解析结果 -->
      <div v-else-if="activeTab === 'parsed'" class="space-y-4">
        <div v-if="!parsedChapter" class="py-8 text-center">
          <p class="text-ink-muted mb-4">
            该章节尚未解析，请先在"编辑章节"选项卡中进行LLM解析
          </p>
          <button @click="activeTab = 'edit'" class="btn btn-primary">
            去解析章节
          </button>
        </div>

        <template v-else>
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-ink">
              {{ parsedChapter.title }}
            </h2>
            <div class="flex space-x-2">
              <button @click="activeTab = 'edit'" class="btn btn-sm">
                <PencilIcon class="h-4 w-4 mr-1" />
                重新编辑
              </button>
              <button
                @click="generateTts"
                class="btn btn-sm btn-primary"
                :disabled="isProcessing"
              >
                <SpeakerWaveIcon v-if="!isProcessing" class="h-4 w-4 mr-1" />
                <div
                  v-else
                  class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"
                ></div>
                {{ isProcessing ? "生成中..." : "生成TTS" }}
              </button>
            </div>
          </div>

          <!-- 解析结果 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 旁白部分 -->
            <div
              class="border border-border rounded-md p-4"
            >
              <h3
                class="text-md font-semibold text-ink mb-3"
              >
                旁白文本
              </h3>
              <div class="space-y-3">
                <div
                  v-for="(narration, index) in parsedChapter.narration"
                  :key="`narration-${index}`"
                  class="bg-surface-hover p-3 rounded-md"
                >
                  <p class="text-ink text-sm">
                    {{ narration.text }}
                  </p>
                  <div class="mt-2 flex justify-between items-center">
                    <select
                      v-model="narration.voice"
                      class="text-xs py-1 px-2 rounded border border-border bg-surface-elevated text-ink"
                    >
                      <option value="">默认旁白音</option>
                      <option value="narrator-1">旁白音 1</option>
                      <option value="narrator-2">旁白音 2</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- 对话部分 -->
            <div
              class="border border-border rounded-md p-4"
            >
              <h3
                class="text-md font-semibold text-ink mb-3"
              >
                对话内容
              </h3>
              <div class="space-y-3">
                <div
                  v-for="(dialogue, index) in parsedChapter.dialogues"
                  :key="`dialogue-${index}`"
                  class="bg-surface-hover p-3 rounded-md"
                >
                  <div class="flex justify-between items-start">
                    <span
                      class="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200"
                    >
                      {{ dialogue.character }}
                    </span>
                    <span
                      v-if="dialogue.tone"
                      class="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900 px-2 py-0.5 text-xs font-medium text-purple-800 dark:text-purple-200"
                    >
                      {{ dialogue.tone }}
                    </span>
                  </div>
                  <p class="text-ink text-sm mt-2">
                    {{ dialogue.text }}
                  </p>
                  <div class="mt-2 flex justify-between items-center">
                    <select
                      v-model="dialogue.voice"
                      class="text-xs py-1 px-2 rounded border border-border bg-surface-elevated text-ink"
                    >
                      <option value="">自动选择</option>
                      <option
                        v-for="character in matchingCharacters(
                          dialogue.character
                        )"
                        :key="character.id"
                        :value="character.voiceModel"
                      >
                        {{ character.name }} -
                        {{ characterVoiceLabel(character) }}
                      </option>
                      <option value="female-1">女声 1</option>
                      <option value="male-1">男声 1</option>
                    </select>
                    <select
                      v-model="dialogue.tone"
                      class="text-xs py-1 px-2 ml-2 rounded border border-border bg-surface-elevated text-ink"
                    >
                      <option value="">无语气</option>
                      <option value="平静">平静</option>
                      <option value="激动">激动</option>
                      <option value="愤怒">愤怒</option>
                      <option value="悲伤">悲伤</option>
                      <option value="欢快">欢快</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-center mt-4">
            <button
              @click="updateParsedChapter"
              class="btn btn-primary"
              :disabled="isUpdating"
            >
              {{ isUpdating ? "保存中..." : "保存解析设置" }}
            </button>
          </div>
        </template>
      </div>

      <!-- 播放TTS结果 -->
      <div v-else-if="activeTab === 'tts'" class="space-y-4">
        <div v-if="!ttsResults.length" class="py-8 text-center">
          <p class="text-ink-muted mb-4">
            该章节尚未生成TTS，请先在"解析结果"选项卡中生成TTS
          </p>
          <button @click="activeTab = 'parsed'" class="btn btn-primary">
            去生成TTS
          </button>
        </div>

        <template v-else>
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-ink">
              TTS音频播放
            </h2>
            <div>
              <button
                @click="generateTts"
                class="btn btn-sm btn-primary"
                :disabled="isProcessing"
              >
                <ArrowPathIcon class="h-4 w-4 mr-1" />
                重新生成
              </button>
            </div>
          </div>

          <div
            class="mt-4 p-4 border border-border rounded-md"
          >
            <div
              v-for="(result, index) in ttsResults"
              :key="`tts-${index}`"
              class="mb-4 last:mb-0"
            >
              <h3
                class="text-sm font-medium text-ink mb-2"
              >
                音频 {{ index + 1 }}
              </h3>
              <audio :src="result.audioUrl" controls class="w-full"></audio>
              <div
                class="text-xs text-ink-muted mt-1 flex justify-between"
              >
                <span>时长: {{ formatDuration(result.duration) }}</span>
                <span>生成时间: {{ formatDate(result.createdAt) }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "vue-toastification";
import {
  DocumentMagnifyingGlassIcon,
  PencilIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  ArrowPathIcon,
} from "@heroicons/vue/24/outline";
import { novelApi } from "@/api";
import { useSettingsStore } from "@/stores/settings";
import type {
  Chapter,
  ParsedChapter,
  Character,
  TtsResult,
} from "@/types/ReadNovels";
import type { LLMProviderType } from "@/types";

const props = defineProps<{
  chapter: Chapter;
  parsedChapter: ParsedChapter | null;
  characters: Character[];
  ttsResults: TtsResult[];
}>();

const emit = defineEmits<{
  (e: "parse-chapter"): void;
  (e: "generate-tts"): void;
  (e: "update-parsed-chapter", data: ParsedChapter): void;
  (e: "update-llm-provider", provider: LLMProviderType): void;
}>();

const toast = useToast();
const settingsStore = useSettingsStore();

// 状态管理
const activeTab = ref("edit");
const editedContent = ref(props.chapter.content);
const contentChanged = ref(false);
const isSaving = ref(false);
const isProcessing = ref(false);
const isUpdating = ref(false);

// LLM服务商（使用 providerId）
const llmProviders = computed(() => settingsStore.getLLMProviders());
const selectedLLMProvider = ref<LLMProviderType>(props.chapter.llmProvider || "");

// 标签定义
const tabs = [
  { id: "edit", name: "编辑章节", icon: DocumentTextIcon },
  { id: "parsed", name: "解析结果", icon: DocumentMagnifyingGlassIcon },
  { id: "tts", name: "播放TTS", icon: MusicalNoteIcon },
];

// 监听章节变化
watch(
  () => props.chapter,
  (newChapter) => {
    editedContent.value = newChapter.content;
    contentChanged.value = false;

    // 更新LLM提供商
    if (newChapter.llmProvider) {
      selectedLLMProvider.value = newChapter.llmProvider;
    }
  },
  { immediate: true }
);

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
watch(selectedLLMProvider, (newProvider) => {
  if (newProvider && newProvider !== props.chapter.llmProvider) {
    emit("update-llm-provider", newProvider);
  }
});

// 查找匹配的角色
function matchingCharacters(characterName: string): Character[] {
  return props.characters.filter(
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

// 保存章节内容
async function saveChapterContent() {
  if (!contentChanged.value) return;

  isSaving.value = true;

  try {
    await novelApi.updateChapter(props.chapter.id, {
      content: editedContent.value,
    });

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
  // 如果内容已修改但未保存，先保存内容
  if (contentChanged.value) {
    await saveChapterContent();
  }

  isProcessing.value = true;

  try {
    // 更新章节的LLM提供商
    await novelApi.updateChapter(props.chapter.id, {
      llmProvider: selectedLLMProvider.value,
    });

    // 触发解析事件，传递选中的LLM提供商
    emit("parse-chapter");

    // 解析完成后切换到解析结果标签
    activeTab.value = "parsed";
  } catch (error) {
    toast.error(
      `解析失败: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    isProcessing.value = false;
  }
}

// 更新解析数据
async function updateParsedChapter() {
  if (!props.parsedChapter) return;

  isUpdating.value = true;

  try {
    emit("update-parsed-chapter", props.parsedChapter);
    toast.success("解析设置已保存");
  } catch (error) {
    toast.error(
      `更新失败: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    isUpdating.value = false;
  }
}

// 生成TTS
async function generateTts() {
  if (!props.parsedChapter) {
    toast.error("无法生成TTS：未找到解析数据");
    return;
  }

  isProcessing.value = true;

  try {
    emit("generate-tts");
    // 生成完成后切换到TTS播放标签
    activeTab.value = "tts";
  } catch (error) {
    toast.error(
      `生成TTS失败: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    isProcessing.value = false;
  }
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

// 自动根据章节处理状态选择初始标签
onMounted(() => {
  if (props.ttsResults.length > 0) {
    activeTab.value = "tts";
  } else if (props.parsedChapter) {
    activeTab.value = "parsed";
  } else {
    activeTab.value = "edit";
  }
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
