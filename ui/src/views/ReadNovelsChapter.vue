<template>
  <div class="flex h-full flex-col">
    <!-- 工具栏 -->
    <header class="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface px-3">
      <VIconButton :icon="ArrowLeftIcon" label="返回小说" size="sm" @click="goBack" />
      <div class="min-w-0">
        <h1 class="truncate text-sm font-semibold text-ink">{{ ws.chapter.value?.title || "章节工作台" }}</h1>
      </div>
      <VBadge v-if="ws.segments.value.length" class="num">{{ ws.segments.value.length }} 段</VBadge>
      <VBadge
        v-if="ws.segments.value.length"
        class="num"
        :tone="ws.allSegmentsHaveAudio.value ? 'success' : 'neutral'"
        title="已合成段落"
      >
        {{ ws.synthesizedCount.value }}/{{ ws.segments.value.length }} 已合成
      </VBadge>

      <div class="ml-auto flex items-center gap-2">
        <VSegmented v-model="parseMode" :options="parseModeOptions" size="sm" label="解析方式" />
        <input
          v-if="ws.skipLlm.value"
          v-model="ws.plainSpeaker.value"
          maxlength="80"
          class="field field-sm w-24"
          placeholder="说话者"
          aria-label="说话者"
          title="全文由该说话者朗读"
        />
        <VSelect
          v-else-if="ws.llmProviders.value.length"
          v-model="ws.selectedLLMProvider.value"
          size="sm"
          wrapper-class="w-40"
          aria-label="解析使用的语言模型"
          :options="ws.llmProviders.value.map((p) => ({ label: p.name || p.id, value: p.id }))"
        />
        <VButton
          size="sm"
          :variant="ws.segments.value.length ? 'secondary' : 'primary'"
          :icon="DocumentMagnifyingGlassIcon"
          :loading="ws.isParsing.value"
          @click="confirmParse"
        >
          {{ ws.skipLlm.value ? "生成分段" : ws.segments.value.length ? "重新解析" : "AI 解析" }}
        </VButton>
        <span class="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        <span class="flex items-center gap-1.5 text-2xs" :class="dirty ? 'text-warning' : 'text-ink-subtle'">
          <span class="status-dot" :class="dirty ? 'bg-warning' : 'bg-success'" aria-hidden="true" />
          {{ dirty ? (ws.draftCached.value ? "已暂存本机" : "未保存") : "已保存" }}
        </span>
        <button
          v-if="ws.draftCached.value"
          type="button"
          class="text-2xs text-ink-subtle underline-offset-2 hover:text-ink hover:underline"
          @click="discardLocal"
        >
          恢复已保存版本
        </button>
        <VButton size="sm" :loading="ws.isSaving.value || ws.isUpdating.value" :disabled="!dirty" @click="saveAll">
          保存 <span class="kbd ml-1">Ctrl S</span>
        </VButton>
      </div>
    </header>

    <div v-if="ws.loading.value" class="flex flex-1 gap-4 p-6">
      <VSkeleton class="h-full w-1/3" />
      <div class="flex-1 space-y-2">
        <VSkeleton v-for="i in 8" :key="i" class="h-14" />
      </div>
    </div>

    <div v-else class="flex min-h-0 flex-1">
      <!-- 原文 -->
      <section
        v-if="sourceOpen"
        class="flex w-[34%] min-w-[280px] max-w-[520px] shrink-0 flex-col border-r border-line bg-surface"
      >
        <div class="flex h-10 shrink-0 items-center gap-2 border-b border-line px-3">
          <span class="section-title">原文</span>
          <span class="num text-2xs text-ink-subtle">{{ countChars(ws.editedContent.value).toLocaleString() }} 字</span>
          <VIconButton :icon="ChevronDoubleLeftIcon" label="收起原文" size="sm" class="ml-auto" @click="sourceOpen = false" />
        </div>
        <textarea
          v-model="ws.editedContent.value"
          class="min-h-0 flex-1 resize-none bg-transparent px-4 py-3 text-sm leading-7 text-ink outline-none placeholder:text-ink-subtle focus-visible:outline-none"
          placeholder="粘贴章节原文…"
          aria-label="章节原文"
        />
      </section>
      <button
        v-else
        type="button"
        class="flex w-9 shrink-0 flex-col items-center gap-2 border-r border-line bg-surface pt-3 text-ink-muted hover:bg-soft hover:text-ink"
        title="展开原文"
        @click="sourceOpen = true"
      >
        <ChevronDoubleRightIcon class="h-4 w-4" aria-hidden="true" />
        <span class="text-xs [writing-mode:vertical-rl]">原文</span>
      </button>

      <!-- 分段时间线 -->
      <section class="flex min-w-0 flex-1 flex-col bg-canvas">
        <div v-if="ws.segments.value.length" class="flex h-10 shrink-0 items-center gap-2 border-b border-line px-3">
          <VButton size="sm" variant="ghost" @click="toggleSelectAll">
            {{ selected.length === visibleIndexes.length && selected.length ? "取消全选" : "全选" }}
          </VButton>
          <span v-if="selected.length" class="num text-2xs text-ink-muted">已选 {{ selected.length }} 段</span>
          <VSelect
            v-model="roleFilter"
            size="sm"
            wrapper-class="w-32"
            placeholder="全部角色"
            aria-label="按角色筛选"
            :options="roleOptions"
          />
          <div class="ml-auto flex items-center gap-2">
            <span v-if="ws.batchProgress.value" class="num text-2xs text-accent">
              合成中 {{ ws.batchProgress.value.done }}/{{ ws.batchProgress.value.total }}
            </span>
            <VButton
              v-if="selected.length > 1"
              size="sm"
              :icon="SparklesIcon"
              :disabled="busy"
              @click="ws.synthesizeSegments([...selected].sort((a, b) => a - b))"
            >
              合成选中
            </VButton>
            <VButton size="sm" variant="primary" :icon="SpeakerWaveIcon" :loading="ws.isGeneratingAll.value" :disabled="busy && !ws.isGeneratingAll.value" @click="ws.synthesizeAll()">
              {{ ws.isGeneratingAll.value ? "全部合成中…" : "全部合成" }}
            </VButton>
          </div>
        </div>

        <VEmptyState
          v-if="!ws.segments.value.length"
          class="flex-1"
          :icon="DocumentMagnifyingGlassIcon"
          :title="ws.skipLlm.value ? '尚未生成分段' : '尚未解析'"
          :description="
            ws.skipLlm.value
              ? '全文将由指定说话者朗读，点击「生成分段」开始。'
              : 'AI 会把原文拆分为旁白与角色对白，并自动提取出场角色。'
          "
        >
          <VButton variant="primary" :icon="DocumentMagnifyingGlassIcon" :loading="ws.isParsing.value" @click="ws.parse()">
            {{ ws.skipLlm.value ? "生成分段" : "AI 解析" }}
          </VButton>
        </VEmptyState>

        <div v-else ref="listEl" class="min-h-0 flex-1 space-y-1 overflow-y-auto p-3" role="listbox" aria-multiselectable="true" aria-label="分段列表">
          <SegmentRow
            v-for="index in visibleIndexes"
            :key="index"
            :segment="ws.segments.value[index]"
            :index="index"
            :selected="selected.includes(index)"
            :processing="!!ws.processingSegments[index]"
            :has-audio="!!ws.segmentAudios[index]"
            :playing="playingIndex === index && isPlaying"
            :busy="busy"
            :emotion-label="emotionLabel(index)"
            @select="onSelect(index, $event)"
            @play="playSegment(index)"
            @synthesize="ws.synthesizeSegment(index)"
            @update-text="updateText(index, $event)"
          />
        </div>
      </section>

      <!-- 检查器 -->
      <aside class="flex w-80 shrink-0 flex-col border-l border-line bg-surface">
        <div class="flex shrink-0 gap-4 border-b border-line px-4" role="tablist">
          <button
            v-for="tab in inspectorTabs"
            :key="tab.value"
            type="button"
            role="tab"
            :aria-selected="inspectorTab === tab.value"
            class="tab"
            :class="inspectorTab === tab.value && 'tab-active'"
            @click="inspectorTab = tab.value"
          >
            {{ tab.label }}
            <span v-if="tab.count !== undefined" class="num text-2xs text-ink-subtle">{{ tab.count }}</span>
          </button>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <SegmentInspector
            v-if="inspectorTab === 'segment'"
            :segments="selectedSegments"
            :indexes="selected"
            :emotions="selectedSegments[0] ? ws.emotionsFor(selectedSegments[0]) : []"
            :voice-label="voiceLabel"
            :has-audio="selected.length === 1 && !!ws.segmentAudios[selected[0]]"
            :busy="selected.some((i) => ws.processingSegments[i]) || !!ws.batchProgress.value"
            @apply="applyPatch"
            @synthesize="synthesizeSelected"
            @play="playSegment(selected[0])"
          />
          <ChapterCharacterPanel
            v-else
            :characters="ws.characters.value"
            :segments="ws.segments.value"
            :character-for="ws.characterFor"
            :model-name="ws.modelName"
            @edit="editingCharacter = $event"
          />
        </div>
      </aside>
    </div>

    <VAudioBar ref="audioBar" :src="playerSrc" :title="playerTitle" :subtitle="playerSubtitle" :autoplay="autoplay" @ended="onEnded">
      <template #actions>
        <VButton
          size="sm"
          :variant="ws.allSegmentsHaveAudio.value ? 'primary' : 'secondary'"
          :icon="RectangleStackIcon"
          :loading="ws.isMerging.value"
          :disabled="!ws.allSegmentsHaveAudio.value"
          :title="ws.allSegmentsHaveAudio.value ? '把全部段落拼接为整章音频' : '需先合成全部段落'"
          @click="mergeChapter"
        >
          {{ chapterAudio ? "重新生成整章" : "生成整章音频" }}
        </VButton>
        <VIconButton
          v-if="chapterAudio"
          :icon="playingIndex === null ? MusicalNoteIcon : QueueListIcon"
          :label="playingIndex === null ? '整章音频' : '切回整章音频'"
          size="sm"
          :active="playingIndex === null"
          @click="playChapter"
        />
        <VIconButton
          :icon="FolderOpenIcon"
          label="在文件夹中显示"
          size="sm"
          :disabled="!playerSrc"
          @click="ws.revealAudio(playerSrc)"
        />
      </template>
    </VAudioBar>

    <CharacterModal
      :open="!!editingCharacter"
      :novel-id="ws.chapter.value?.novelId"
      :character="editingCharacter"
      @close="editingCharacter = null"
      @update="(id, data) => ws.updateCharacter(id, data)"
    />

    <VConfirmDialog
      :open="reparseConfirm"
      title="重新解析章节"
      message="重新解析会覆盖当前全部分段及其参数，已合成的段落音频需要重新生成。确定继续吗？"
      confirm-text="重新解析"
      @close="reparseConfirm = false"
      @confirm="doReparse"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import {
  ArrowLeftIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  DocumentMagnifyingGlassIcon,
  FolderOpenIcon,
  MusicalNoteIcon,
  QueueListIcon,
  RectangleStackIcon,
  SparklesIcon,
  SpeakerWaveIcon,
} from "@heroicons/vue/24/outline";
import VAudioBar from "@/components/ui/VAudioBar.vue";
import VBadge from "@/components/ui/VBadge.vue";
import VButton from "@/components/ui/VButton.vue";
import VConfirmDialog from "@/components/ui/VConfirmDialog.vue";
import VEmptyState from "@/components/ui/VEmptyState.vue";
import VIconButton from "@/components/ui/VIconButton.vue";
import VSegmented from "@/components/ui/VSegmented.vue";
import VSelect from "@/components/ui/VSelect.vue";
import VSkeleton from "@/components/ui/VSkeleton.vue";
import SegmentRow from "@/components/novels/SegmentRow.vue";
import SegmentInspector from "@/components/novels/SegmentInspector.vue";
import ChapterCharacterPanel from "@/components/novels/ChapterCharacterPanel.vue";
import CharacterModal from "@/components/ReadNovels/CharacterModal.vue";
import { isNarratorName, useChapterWorkstation, type SegmentTtsConfig } from "@/composables/useChapterWorkstation";
import type { Character } from "@/types/ReadNovels";
import { countChars } from "@/utils/format";

const route = useRoute();
const router = useRouter();
const ws = useChapterWorkstation();

const sourceOpen = ref(true);
const selected = ref<number[]>([]);
const anchor = ref<number | null>(null);
const roleFilter = ref("");
const inspectorTab = ref<"segment" | "characters">("segment");
const editingCharacter = ref<Character | null>(null);
const reparseConfirm = ref(false);
const parsedDirty = ref(false);
const listEl = ref<HTMLElement | null>(null);
const audioBar = ref<InstanceType<typeof VAudioBar> | null>(null);
const playingIndex = ref<number | null>(null);
const autoplay = ref(false);
let saveTimer: ReturnType<typeof setTimeout> | undefined;

const parseModeOptions = [
  { label: "AI 分角色", value: "ai" as const },
  { label: "单一说话者", value: "plain" as const },
];
const parseMode = computed({
  get: () => (ws.skipLlm.value ? "plain" : "ai"),
  set: (value: "ai" | "plain") => (ws.skipLlm.value = value === "plain"),
});

const dirty = computed(() => ws.contentChanged.value || parsedDirty.value);
const busy = computed(() => ws.isGeneratingAll.value || !!ws.batchProgress.value);

const speakerOf = (character?: string) => (isNarratorName(character) ? "旁白" : character || "");
const roleOptions = computed(() => {
  const names = new Set(ws.segments.value.map((s) => speakerOf(s.character)));
  return [...names].map((name) => ({ label: name, value: name }));
});
const visibleIndexes = computed(() =>
  ws.segments.value
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment }) => !roleFilter.value || speakerOf(segment.character) === roleFilter.value)
    .map(({ index }) => index)
);
const selectedSegments = computed(() => selected.value.map((i) => ws.segments.value[i]).filter(Boolean));

const inspectorTabs = computed(() => [
  { value: "segment" as const, label: "段落", count: selected.value.length || undefined },
  { value: "characters" as const, label: "角色", count: ws.characters.value.length },
]);

const voiceLabel = computed(() => {
  const segment = selectedSegments.value[0];
  if (!segment) return "";
  const { provider, modelCode } = ws.effectiveTts(segment);
  return ws.modelName(provider, modelCode);
});

const chapterAudio = computed(() => ws.chapterAudios.value[0] || null);
const playerSrc = computed(() =>
  playingIndex.value !== null ? ws.segmentAudios[playingIndex.value] || "" : chapterAudio.value?.audioUrl || ""
);
const playerTitle = computed(() => {
  if (playingIndex.value !== null) {
    const segment = ws.segments.value[playingIndex.value];
    return `#${playingIndex.value + 1} ${speakerOf(segment?.character)}`;
  }
  return chapterAudio.value ? "整章音频" : undefined;
});
const playerSubtitle = computed(() => ws.chapter.value?.title);
const isPlaying = computed(() => Boolean(audioBar.value?.playing));

function emotionLabel(index: number) {
  const segment = ws.segments.value[index];
  const code = segment?.ttsConfig?.emotion;
  if (!code) return "";
  return ws.emotionsFor(segment).find((e) => e.code === code)?.name || code;
}

function onSelect(index: number, event: MouseEvent) {
  if (event.shiftKey && anchor.value !== null) {
    const list = visibleIndexes.value;
    const a = list.indexOf(anchor.value);
    const b = list.indexOf(index);
    const [from, to] = a < b ? [a, b] : [b, a];
    selected.value = list.slice(from, to + 1);
    return;
  }
  if (event.ctrlKey || event.metaKey) {
    selected.value = selected.value.includes(index)
      ? selected.value.filter((i) => i !== index)
      : [...selected.value, index];
  } else {
    selected.value = [index];
  }
  anchor.value = index;
  inspectorTab.value = "segment";
}

function toggleSelectAll() {
  selected.value = selected.value.length === visibleIndexes.value.length ? [] : [...visibleIndexes.value];
}

function moveSelection(delta: number) {
  const list = visibleIndexes.value;
  if (!list.length) return;
  const current = selected.value.length ? list.indexOf(selected.value[selected.value.length - 1]) : -1;
  const next = list[Math.min(list.length - 1, Math.max(0, current + delta))];
  selected.value = [next];
  anchor.value = next;
  nextTick(() => listEl.value?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" }));
}

function scheduleSave() {
  parsedDirty.value = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushParsed, 1200);
}

function discardLocal() {
  clearTimeout(saveTimer);
  parsedDirty.value = false;
  ws.discardLocalDraft();
}

async function flushParsed() {
  clearTimeout(saveTimer);
  if (!parsedDirty.value) return true;
  const ok = await ws.saveParsed(true);
  if (ok) parsedDirty.value = false;
  return ok;
}

function applyPatch(patch: Partial<SegmentTtsConfig>) {
  for (const segment of selectedSegments.value) Object.assign(segment.ttsConfig, patch);
  scheduleSave();
}

function updateText(index: number, value: string) {
  const segment = ws.segments.value[index];
  if (!segment) return;
  segment.text = value;
  scheduleSave();
}

async function saveAll() {
  clearTimeout(saveTimer);
  await ws.saveAll();
  parsedDirty.value = false;
}

async function synthesizeSelected() {
  if (!selected.value.length) return;
  await flushParsed();
  await ws.synthesizeSegments([...selected.value].sort((a, b) => a - b));
}

function confirmParse() {
  if (ws.segments.value.length) reparseConfirm.value = true;
  else ws.parse();
}

async function doReparse() {
  reparseConfirm.value = false;
  selected.value = [];
  playingIndex.value = null;
  await ws.parse();
  parsedDirty.value = false;
}

async function mergeChapter() {
  await flushParsed();
  await ws.mergeChapter();
  playChapter();
}

function playSegment(index: number) {
  if (!ws.segmentAudios[index]) return;
  if (playingIndex.value === index) {
    audioBar.value?.toggle();
    return;
  }
  autoplay.value = true;
  playingIndex.value = index;
}

function playChapter() {
  if (!chapterAudio.value) return;
  autoplay.value = playingIndex.value !== null;
  playingIndex.value = null;
}

function onEnded() {
  if (playingIndex.value === null) return;
  const list = visibleIndexes.value;
  const next = list[list.indexOf(playingIndex.value) + 1];
  if (next !== undefined && ws.segmentAudios[next]) {
    selected.value = [next];
    playSegment(next);
  }
}

function goBack() {
  const novelId = ws.chapter.value?.novelId;
  router.push(novelId ? { path: "/read-novels", query: { novel: novelId } } : "/read-novels");
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

function onKeydown(event: KeyboardEvent) {
  if (editingCharacter.value || reparseConfirm.value) return;
  const mod = event.ctrlKey || event.metaKey;
  if (mod && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveAll();
    return;
  }
  if (mod && event.key === "Enter") {
    event.preventDefault();
    synthesizeSelected();
    return;
  }
  if (isTyping(event.target) || mod || event.altKey) return;
  if (event.key === "j" || event.key === "ArrowDown") {
    event.preventDefault();
    moveSelection(1);
  } else if (event.key === "k" || event.key === "ArrowUp") {
    event.preventDefault();
    moveSelection(-1);
  } else if (event.key === " ") {
    event.preventDefault();
    if (selected.value.length === 1 && ws.segmentAudios[selected.value[0]] && playingIndex.value !== selected.value[0]) {
      playSegment(selected.value[0]);
    } else {
      audioBar.value?.toggle();
    }
  } else if (event.key === "Escape") {
    selected.value = [];
  }
}

watch(
  () => ws.draftSegmentsDirty.value,
  (value) => {
    if (value) scheduleSave();
  }
);

watch(
  () => ws.loading.value,
  (loading) => {
    if (!loading) sourceOpen.value = !ws.segments.value.length;
  }
);

watch(
  () => route.params.chapterId,
  (id) => {
    if (id) ws.load(String(id));
  },
  { immediate: true }
);

onMounted(() => window.addEventListener("keydown", onKeydown));

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  clearTimeout(saveTimer);
});

onBeforeRouteLeave(async () => {
  if (ws.contentChanged.value) await ws.saveContent(true);
  await flushParsed();
});
</script>
