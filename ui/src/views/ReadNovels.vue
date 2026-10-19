<template>
  <div class="flex h-full">
    <!-- 有声小说列表 -->
    <aside class="flex w-64 shrink-0 flex-col border-r border-line bg-surface">
      <div class="flex items-center justify-between px-3 pb-2 pt-3">
        <span class="section-title">有声小说</span>
        <VIconButton :icon="PlusIcon" label="新建有声小说" size="sm" variant="secondary" @click="openNovelModal()" />
      </div>
      <div class="px-3 pb-2">
        <VInput v-model="keyword" size="sm" :icon="MagnifyingGlassIcon" placeholder="搜索书名或作者" aria-label="搜索有声小说" />
      </div>
      <ul class="min-h-0 flex-1 overflow-y-auto px-2 pb-2" role="listbox" aria-label="有声小说列表">
        <template v-if="novelsStore.isLoading && !novels.length">
          <li v-for="i in 4" :key="i" class="px-2 py-2"><VSkeleton class="h-9" /></li>
        </template>
        <li v-for="novel in filteredNovels" :key="novel.id">
          <button
            type="button"
            role="option"
            :aria-selected="novel.id === currentNovel?.id"
            class="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors duration-fast"
            :class="novel.id === currentNovel?.id ? 'bg-accent/10' : 'hover:bg-soft'"
            @click="selectNovel(novel.id)"
          >
            <span class="flex h-9 w-7 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-soft text-ink-subtle">
              <img v-if="novel.cover" :src="novel.cover" alt="" class="h-full w-full object-cover" />
              <BookOpenIcon v-else class="h-4 w-4" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm text-ink" :class="novel.id === currentNovel?.id && 'font-medium'">{{ novel.title }}</span>
              <span class="block truncate text-2xs text-ink-subtle">{{ novel.author || "佚名" }}</span>
            </span>
          </button>
        </li>
        <li v-if="!novelsStore.isLoading && !filteredNovels.length" class="px-2 py-8 text-center text-xs text-ink-subtle">
          {{ novels.length ? "没有匹配的有声小说" : "还没有有声小说" }}
        </li>
      </ul>
    </aside>

    <!-- 详情 -->
    <section class="min-w-0 flex-1 overflow-y-auto">
      <VEmptyState
        v-if="!currentNovel"
        class="h-full"
        :icon="BookOpenIcon"
        title="选择或新建一部有声小说"
        description="导入章节后，AI 会拆分旁白与角色对白，每个角色使用固定音色。"
      >
        <VButton variant="primary" :icon="PlusIcon" @click="openNovelModal()">新建有声小说</VButton>
      </VEmptyState>

      <div v-else class="mx-auto max-w-5xl px-6 py-6">
        <header class="flex items-start gap-4 pb-5">
          <div class="flex h-24 w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-soft text-ink-subtle">
            <img v-if="currentNovel.cover" :src="currentNovel.cover" alt="" class="h-full w-full object-cover" />
            <BookOpenIcon v-else class="h-6 w-6" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1">
            <h1 class="truncate text-lg font-semibold text-ink">{{ currentNovel.title }}</h1>
            <p class="text-sm text-ink-muted">{{ currentNovel.author || "佚名" }}</p>
            <p class="mt-2 line-clamp-2 text-sm text-ink-subtle">{{ currentNovel.description || "暂无简介" }}</p>
          </div>
          <VButton size="sm" :icon="PencilSquareIcon" @click="openNovelModal(currentNovel)">编辑</VButton>
        </header>

        <div class="flex items-center gap-5 border-b border-line" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.value"
            class="tab"
            :class="activeTab === tab.value && 'tab-active'"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
            <span class="num text-2xs text-ink-subtle">{{ tab.count }}</span>
          </button>
          <VButton
            class="ml-auto"
            size="sm"
            variant="primary"
            :icon="PlusIcon"
            @click="activeTab === 'chapters' ? (showChapterModal = true) : openCharacterModal()"
          >
            {{ activeTab === "chapters" ? "新建章节" : "添加角色" }}
          </VButton>
        </div>

        <!-- 章节 -->
        <div v-if="activeTab === 'chapters'" class="pt-3">
          <VEmptyState
            v-if="!sortedChapters.length"
            :icon="DocumentTextIcon"
            title="还没有章节"
            description="新建章节并粘贴正文，进入工作台用 AI 拆分角色。"
          />
          <ul v-else class="panel overflow-hidden">
            <li v-for="chapter in sortedChapters" :key="chapter.id">
              <RouterLink :to="`/chapters/${chapter.id}`" class="list-row group">
                <span class="num w-8 shrink-0 text-right text-2xs text-ink-subtle">{{ chapter.order }}</span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium text-ink group-hover:text-accent">{{ chapter.title }}</span>
                  <span class="block truncate text-xs text-ink-subtle">{{ preview(chapter.content) }}</span>
                </span>
                <span class="num hidden w-16 shrink-0 text-right text-2xs text-ink-subtle sm:block">
                  {{ countChars(chapter.content).toLocaleString() }} 字
                </span>
                <span class="w-20 shrink-0 text-right">
                  <VBadge v-if="chapter.ttsResults?.mergedAudioFile || chapter.ttsResults?.status === 'completed'" tone="success" dot>已成音</VBadge>
                  <VBadge v-else-if="chapter.processed" tone="accent" dot>已解析</VBadge>
                  <VBadge v-else>未解析</VBadge>
                </span>
                <span class="num hidden w-20 shrink-0 text-right text-2xs text-ink-subtle md:block">{{ formatRelative(chapter.updatedAt) }}</span>
                <ChevronRightIcon class="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- 角色阵容 -->
        <div v-else class="pt-3">
          <VEmptyState
            v-if="!characters.length"
            :icon="UserGroupIcon"
            title="还没有角色"
            description="解析章节时会自动提取角色，也可以手动添加。"
          />
          <ul v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <li v-for="character in characters" :key="character.id" class="panel group flex items-start gap-3 p-3">
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                :class="[roleTone(character.name).bg, roleTone(character.name).text]"
              >
                {{ character.name.slice(0, 1) }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="flex items-center gap-1.5">
                  <span class="truncate text-sm font-medium text-ink">{{ character.name }}</span>
                  <span class="badge h-4 px-1 text-2xs">{{ typeLabel(character.type) }}</span>
                </p>
                <p class="text-2xs text-ink-subtle">{{ profile(character) }}</p>
                <p class="mt-1 flex items-center gap-1 truncate text-xs text-ink-muted">
                  <SpeakerWaveIcon class="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
                  {{ voiceOf(character) || "未绑定音色" }}
                </p>
              </div>
              <div class="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <VIconButton :icon="PencilSquareIcon" label="编辑角色" size="sm" @click="openCharacterModal(character)" />
                <VIconButton :icon="TrashIcon" label="删除角色" size="sm" @click="deletingCharacter = character" />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <NovelModal :open="showNovelModal" :novel="editingNovel" @close="closeNovelModal" @save="saveNovel" />
    <CharacterModal
      :open="showCharacterModal"
      :novel-id="currentNovel?.id"
      :character="characterToEdit"
      @close="closeCharacterModal"
      @save="saveCharacter"
      @update="updateCharacter"
    />
    <ChapterModal :open="showChapterModal" :novel-id="currentNovel?.id" @close="showChapterModal = false" @save="saveChapter" />
    <VConfirmDialog
      :open="!!deletingCharacter"
      title="删除角色"
      :message="`确定删除角色「${deletingCharacter?.name}」吗？已解析的段落会改用默认音色。`"
      confirm-text="删除"
      @close="deletingCharacter = null"
      @confirm="deleteCharacter"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import {
  BookOpenIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  SpeakerWaveIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/vue/24/outline";
import VBadge from "@/components/ui/VBadge.vue";
import VButton from "@/components/ui/VButton.vue";
import VConfirmDialog from "@/components/ui/VConfirmDialog.vue";
import VEmptyState from "@/components/ui/VEmptyState.vue";
import VIconButton from "@/components/ui/VIconButton.vue";
import VInput from "@/components/ui/VInput.vue";
import VSkeleton from "@/components/ui/VSkeleton.vue";
import NovelModal from "@/components/ReadNovels/NovelModal.vue";
import CharacterModal from "@/components/ReadNovels/CharacterModal.vue";
import ChapterModal from "@/components/ReadNovels/ChapterModal.vue";
import { useNovelsStore } from "@/stores/novels";
import { ttsApi, type VoiceModelsCache } from "@/api/ttsApi";
import type { Character, Novel } from "@/types/ReadNovels";
import { countChars, formatRelative } from "@/utils/format";
import { roleTone } from "@/utils/roleColor";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const novelsStore = useNovelsStore();

const keyword = ref("");
const activeTab = ref<"chapters" | "characters">("chapters");
const showNovelModal = ref(false);
const showCharacterModal = ref(false);
const showChapterModal = ref(false);
const editingNovel = ref<Novel | null>(null);
const characterToEdit = ref<Character | null>(null);
const deletingCharacter = ref<Character | null>(null);
const voiceModels = ref<VoiceModelsCache>({});

const novels = computed(() => novelsStore.novels);
const currentNovel = computed(() => novelsStore.currentNovel);
const characters = computed(() => novelsStore.characters);
const sortedChapters = computed(() => [...novelsStore.chapters].sort((a, b) => a.order - b.order));
const filteredNovels = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  if (!q) return novels.value;
  return novels.value.filter((n) => n.title.toLowerCase().includes(q) || (n.author || "").toLowerCase().includes(q));
});

const tabs = computed(() => [
  { value: "chapters" as const, label: "章节", count: novelsStore.chapters.length },
  { value: "characters" as const, label: "角色阵容", count: characters.value.length },
]);

const TYPE_LABELS: Record<string, string> = { main: "主角", secondary: "配角", minor: "路人" };
const GENDER_LABELS: Record<string, string> = { male: "男", female: "女", unknown: "性别未知" };
const AGE_LABELS: Record<string, string> = { child: "儿童", youth: "青年", middle: "中年", elder: "老年", unknown: "" };

function typeLabel(type: string) {
  return TYPE_LABELS[type] || type;
}

function profile(character: Character) {
  return [GENDER_LABELS[character.gender], AGE_LABELS[character.age]].filter(Boolean).join(" · ");
}

function voiceOf(character: Character) {
  const provider = character.ttsConfig?.provider;
  const code = character.ttsConfig?.model || character.voiceModel || "";
  if (!provider || !code) return code;
  const list = voiceModels.value[provider];
  return (Array.isArray(list) && list.find((m) => m.code === code)?.name) || code;
}

function preview(content: string) {
  return (content || "").replace(/\s+/g, " ").trim().slice(0, 60);
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function selectNovel(id: string) {
  await novelsStore.setCurrentNovel(id);
  if (novelsStore.error) toast.error(`加载有声小说失败：${novelsStore.error}`);
  router.replace({ query: { novel: id } });
}

function openNovelModal(novel?: Novel) {
  editingNovel.value = novel || null;
  showNovelModal.value = true;
}

function closeNovelModal() {
  showNovelModal.value = false;
}

async function saveNovel(data: Partial<Novel>) {
  try {
    if (editingNovel.value) {
      await novelsStore.updateNovel(editingNovel.value.id, data);
      toast.success("有声小说已更新");
    } else {
      const novel = await novelsStore.createNovel(data as Omit<Novel, "id" | "createdAt" | "updatedAt">);
      if (!novel) throw new Error(novelsStore.error || "创建失败");
      toast.success("有声小说已创建");
      await selectNovel(novel.id);
    }
    closeNovelModal();
  } catch (error) {
    toast.error(`保存有声小说失败：${errorText(error)}`);
  }
}

function openCharacterModal(character?: Character) {
  characterToEdit.value = character ?? null;
  showCharacterModal.value = true;
}

function closeCharacterModal() {
  showCharacterModal.value = false;
}

async function saveCharacter(data: Omit<Character, "id">) {
  const character = await novelsStore.createCharacter(data);
  if (character) toast.success(`已添加角色「${character.name}」`);
  else toast.error(`添加角色失败：${novelsStore.error || "未知错误"}`);
}

async function updateCharacter(id: string, data: Partial<Character>) {
  const result = await novelsStore.updateCharacter(id, data);
  if (result) toast.success("角色已更新");
  else toast.error(`更新角色失败：${novelsStore.error || "未知错误"}`);
}

async function deleteCharacter() {
  const target = deletingCharacter.value;
  deletingCharacter.value = null;
  if (!target) return;
  const ok = await novelsStore.deleteCharacter(target.id);
  if (ok) toast.success(`已删除角色「${target.name}」`);
  else toast.error(`删除角色失败：${novelsStore.error || "未知错误"}`);
}

async function saveChapter(data: { title: string; content: string; novelId: string }) {
  const chapter = await novelsStore.createChapter({
    ...data,
    order: novelsStore.chapters.length + 1,
    llmProvider: "",
  });
  if (!chapter) {
    toast.error(`创建章节失败：${novelsStore.error || "未知错误"}`);
    return;
  }
  showChapterModal.value = false;
  router.push(`/chapters/${chapter.id}`);
}

onMounted(async () => {
  await novelsStore.loadNovels();
  if (novelsStore.error) toast.error(`加载有声小说失败：${novelsStore.error}`);
  const wanted = (route.query.novel || route.query.novelId) as string | undefined;
  const target = novels.value.find((n) => n.id === wanted)?.id || currentNovel.value?.id || novels.value[0]?.id;
  if (target) await selectNovel(target);
  try {
    const res = await ttsApi.getVoiceModels();
    if (res.success && res.data) voiceModels.value = res.data;
  } catch (error) {
    console.error("Load voice models cache failed:", error);
  }
});
</script>
