<template>
  <div class="read-novels-view">
    <div class="flex justify-between mb-4">
      <h1 class="text-2xl font-bold text-ink">
        AI自动读小说系统
      </h1>
      <div>
        <button @click="openNovelModal()" class="btn btn-primary flex items-center">
          <PlusIcon class="h-5 w-5 mr-1" />
          新建小说
        </button>
      </div>
    </div>

    <!-- 主界面布局 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- 左侧小说列表 -->
      <div class="md:col-span-1 bg-surface-elevated rounded-lg shadow p-4">
        <NovelList :novels="novels" :selected-novel-id="currentNovel?.id" @select-novel="selectNovel" />
      </div>

      <!-- 右侧：基本信息、角色、章节 三区域 -->
      <div v-if="currentNovel" class="md:col-span-3 grid grid-cols-1 gap-3">
        <!-- 1. 小说基本信息 -->
        <NovelDetail :novel="currentNovel" @edit-novel="editNovel" />

        <!-- 2. 角色管理（wrap 卡片 + 添加/编辑弹窗/删除） -->
        <div class="bg-surface-elevated rounded-lg shadow p-3">
          <CharacterListInline :characters="characters" :get-model-display-name="getModelDisplayName"
            @add="openCharacterModal()" @edit="openCharacterModal($event)" @delete="deleteCharacter" />
        </div>

        <!-- 3. 章节列表 -->
        <div class="bg-surface-elevated rounded-lg shadow p-4 flex flex-col min-h-0">
          <div class="flex justify-between items-center mb-3">
            <h2 class="text-lg font-semibold text-ink">
              章节列表
            </h2>
            <button @click="openChapterModal" class="btn btn-sm btn-primary flex items-center">
              <PlusIcon class="h-4 w-4 mr-1" />
              新建章节
            </button>
          </div>
          <ChapterList :chapters="chapters" :selected-chapter-id="currentChapter?.id" @select-chapter="selectChapter" />
        </div>

        <!-- 章节编辑/处理区域 -->
        <!-- <ChapterProcessor
          v-if="currentChapter"
          :chapter="currentChapter"
          :parsed-chapter="parsedChapter"
          :characters="characters"
          :tts-results="ttsResults"
          @parse-chapter="parseChapter"
          @generate-tts="generateTts"
          @update-parsed-chapter="updateParsedChapter"
          @update-llm-provider="updateLLMProvider"
        /> -->
      </div>
    </div>

    <!-- 模态框 -->
    <NovelModal v-if="showNovelModal" :novel="editingNovel" @close="closeNovelModal" @save="saveNovel" />

    <!-- 添加/编辑角色弹窗（仅表单） -->
    <CharacterModal v-if="showCharacterModal" :novel-id="currentNovel?.id" :character="characterToEdit"
      @close="closeCharacterModal" @save="saveCharacter" @update="updateCharacter" />

    <ChapterModal v-if="showChapterModal" :novel-id="currentNovel?.id" @close="closeChapterModal" @save="saveChapter" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "vue-toastification";
import { useNovelsStore } from "@/stores/novels";
import { PlusIcon } from "@heroicons/vue/24/outline";
import type { Novel, Character } from "@/types/ReadNovels";
import type { LLMProviderType, TTSProviderType } from "@/types";
import { ttsApi } from "@/api/ttsApi";
import type { VoiceModelsCache } from "@/api/ttsApi";

// 导入组件
import NovelList from "@/components/ReadNovels/NovelList.vue";
import NovelDetail from "@/components/ReadNovels/NovelDetail.vue";
import ChapterList from "@/components/ReadNovels/ChapterList.vue";
import ChapterProcessor from "@/components/ReadNovels/ChapterProcessor.vue";
import NovelModal from "@/components/ReadNovels/NovelModal.vue";
import CharacterListInline from "@/components/ReadNovels/CharacterListInline.vue";
import CharacterModal from "@/components/ReadNovels/CharacterModal.vue";
import ChapterModal from "@/components/ReadNovels/ChapterModal.vue";

const toast = useToast();
const novelsStore = useNovelsStore();

// 组件状态
const showNovelModal = ref(false);
const showCharacterModal = ref(false);
const showChapterModal = ref(false);
const characterToEdit = ref<Character | null>(null);
const editingNovel = ref<Novel | null>(null);
const cachedVoiceModels = ref<VoiceModelsCache>({});

// 计算属性从store获取数据
const novels = computed(() => novelsStore.novels);
const currentNovel = computed(() => novelsStore.currentNovel);
const characters = computed(() => novelsStore.characters);
const chapters = computed(() => novelsStore.chapters);
const currentChapter = computed(() => novelsStore.currentChapter);
const parsedChapter = computed(() => novelsStore.parsedChapter);
const ttsResults = computed(() => novelsStore.ttsResults);
const isLoading = computed(() => novelsStore.isLoading);

/** 仅从同步缓存解析模型展示名，与角色可选列表一致 */
function getModelDisplayName(provider: TTSProviderType | undefined, modelCode: string): string {
  if (!provider || !modelCode) return modelCode || "";
  const list = cachedVoiceModels.value[provider];
  if (!Array.isArray(list)) return modelCode;
  const m = list.find((x) => x.code === modelCode);
  return m?.name ?? modelCode;
}

// 初始化
onMounted(async () => {
  try {
    await novelsStore.loadNovels();
  } catch (error) {
    toast.error(
      `加载小说失败：${error instanceof Error ? error.message : String(error)}`
    );
  }
  try {
    const res = await ttsApi.getVoiceModels();
    if (res.success && res.data) cachedVoiceModels.value = res.data;
  } catch (e) {
    console.error("Load voice models cache failed:", e);
  }
});

// 选择小说
async function selectNovel(novelId: string) {
  try {
    await novelsStore.setCurrentNovel(novelId);
  } catch (error) {
    toast.error(
      `加载小说详情失败：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 选择章节
async function selectChapter(chapterId: string) {
  try {
    await novelsStore.setCurrentChapter(chapterId);
  } catch (error) {
    toast.error(
      `加载章节失败：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 打开新建/编辑小说模态框
function openNovelModal(novel?: Novel) {
  editingNovel.value = novel || null;
  showNovelModal.value = true;
}

// 关闭小说模态框
function closeNovelModal() {
  showNovelModal.value = false;
  editingNovel.value = null;
}

// 编辑小说
function editNovel(novel: Novel) {
  openNovelModal(novel);
}

// 保存小说
async function saveNovel(novelData: Partial<Novel>) {
  try {
    if (editingNovel.value) {
      // 更新现有小说
      await novelsStore.updateNovel(editingNovel.value.id, novelData);
      toast.success("小说更新成功");
    } else {
      // 创建新小说
      const novel = await novelsStore.createNovel(
        novelData as Omit<Novel, "id" | "createdAt" | "updatedAt">
      );
      if (novel) {
        toast.success("小说创建成功");
        selectNovel(novel.id);
      }
    }
    closeNovelModal();
  } catch (error) {
    toast.error(
      `保存小说失败：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 打开角色弹窗（添加或编辑）
function openCharacterModal(character?: Character) {
  characterToEdit.value = character ?? null;
  showCharacterModal.value = true;
}

function closeCharacterModal() {
  showCharacterModal.value = false;
  characterToEdit.value = null;
}

// 保存角色
async function saveCharacter(characterData: Omit<Character, "id">) {
  try {
    const character = await novelsStore.createCharacter(characterData);
    if (character) {
      toast.success("角色创建成功");
    }
  } catch (error) {
    toast.error(
      `保存角色失败：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 更新角色
async function updateCharacter(characterId: string, characterData: Partial<Character>) {
  try {
    await novelsStore.updateCharacter(characterId, characterData);
    toast.success("角色更新成功");
  } catch (error) {
    toast.error(
      `更新角色失败：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 删除角色
async function deleteCharacter(characterId: string) {
  try {
    await novelsStore.deleteCharacter(characterId);
    toast.success("角色删除成功");
  } catch (error) {
    toast.error(
      `删除角色失败：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 打开新建章节模态框
function openChapterModal() {
  showChapterModal.value = true;
}

// 关闭章节模态框
function closeChapterModal() {
  showChapterModal.value = false;
}

// 保存章节
async function saveChapter(chapterData: any) {
  try {
    if (currentNovel.value) {
      const chapterWithOrder = {
        ...chapterData,
        novelId: currentNovel.value.id,
        order: chapters.value.length + 1,
      };

      const chapter = await novelsStore.createChapter(chapterWithOrder);
      if (chapter) {
        toast.success("章节创建成功");
        selectChapter(chapter.id);
      }
    }
    closeChapterModal();
  } catch (error) {
    toast.error(
      `保存章节失败：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 解析章节
async function parseChapter() {
  if (!currentChapter.value) return;

  try {
    await novelsStore.parseChapter(currentChapter.value.id);
    toast.success("章节解析成功");
  } catch (error) {
    toast.error(
      `解析章节失败：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 更新解析后的章节数据
async function updateParsedChapter(updatedData: any) {
  if (!parsedChapter.value) return;

  try {
    // 在实际实现中，这里会调用API更新解析后的章节数据
    // 暂时使用mock数据
    toast.success("解析数据更新成功");
  } catch (error) {
    toast.error(
      `更新解析数据失败：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 生成TTS
async function generateTts() {
  if (!parsedChapter.value) return;

  try {
    await novelsStore.generateTts(parsedChapter.value.id);
    toast.success("TTS生成成功");
  } catch (error) {
    toast.error(
      `生成TTS失败：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 更新LLM服务商
async function updateLLMProvider(provider: LLMProviderType) {
  if (!currentChapter.value) return;

  try {
    await novelsStore.updateChapter(currentChapter.value.id, {
      llmProvider: provider
    });
    console.log(`LLM服务商已更新为: ${provider}`);
  } catch (error) {
    toast.error(
      `更新LLM服务商失败：${error instanceof Error ? error.message : String(error)}`
    );
  }
}
</script>

<style scoped>
.read-novels-view {
  max-width: 1600px;
  margin: 0 auto;
  padding: 1rem;
}
</style>
