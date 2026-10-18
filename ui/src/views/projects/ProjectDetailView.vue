<template>
  <div class="flex h-full flex-col">
    <!-- 顶栏 -->
    <header class="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface px-3">
      <VIconButton :icon="ArrowLeftIcon" label="返回项目列表" size="sm" @click="router.push('/projects')" />
      <template v-if="project">
        <button
          type="button"
          class="group flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-soft"
          title="编辑项目"
          @click="formOpen = true"
        >
          <h1 class="truncate text-sm font-semibold text-ink">{{ project.title }}</h1>
          <PencilSquareIcon class="h-3.5 w-3.5 shrink-0 text-ink-subtle group-hover:text-ink" aria-hidden="true" />
        </button>
        <VBadge>{{ chapters.length }} 章</VBadge>
        <VBadge v-if="defaultVoiceId" tone="accent">
          <SpeakerWaveIcon class="h-3 w-3" aria-hidden="true" />
          {{ accountStore.voiceName(defaultVoiceId) }}
        </VBadge>
        <div class="ml-auto flex items-center gap-1">
          <VButton variant="ghost" size="sm" :icon="ArrowUpTrayIcon" @click="exportProject">导出</VButton>
          <VButton variant="ghost" size="sm" :icon="Cog6ToothIcon" @click="formOpen = true">项目设置</VButton>
        </div>
      </template>
    </header>

    <div v-if="loading" class="flex min-h-0 flex-1">
      <div class="w-64 space-y-2 border-r border-line bg-surface p-3">
        <VSkeleton v-for="i in 6" :key="i" class="h-9" />
      </div>
      <div class="flex-1 space-y-3 p-8">
        <VSkeleton class="h-6 w-64" />
        <VSkeleton class="h-4 w-full" />
        <VSkeleton class="h-4 w-5/6" />
        <VSkeleton class="h-4 w-4/6" />
      </div>
    </div>

    <VEmptyState
      v-else-if="!project"
      class="flex-1"
      :icon="FolderIcon"
      title="项目不存在"
      description="该项目可能已被删除。"
    >
      <VButton variant="primary" @click="router.push('/projects')">返回项目列表</VButton>
    </VEmptyState>

    <div v-else class="flex min-h-0 flex-1">
      <!-- 左：章节列表 -->
      <aside class="flex w-64 shrink-0 flex-col border-r border-line bg-surface">
        <div class="flex items-center justify-between px-3 pb-2 pt-3">
          <span class="section-title">章节</span>
          <VIconButton :icon="PlusIcon" label="新建章节" size="sm" variant="secondary" @click="createChapterQuick" />
        </div>
        <div class="px-3 pb-2">
          <VInput v-model="listKeyword" size="sm" :icon="MagnifyingGlassIcon" placeholder="筛选章节" aria-label="筛选章节" />
        </div>
        <ul class="min-h-0 flex-1 overflow-y-auto px-2 pb-2" role="listbox" aria-label="章节列表">
          <li v-for="(chapter, index) in visibleChapters" :key="chapter.id">
            <button
              type="button"
              role="option"
              :aria-selected="chapter.id === selectedId"
              class="group flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors duration-fast"
              :class="chapter.id === selectedId ? 'bg-accent/10' : 'hover:bg-soft'"
              @click="selectChapter(chapter.id)"
            >
              <span class="num w-5 shrink-0 text-right text-2xs text-ink-subtle">{{ index + 1 }}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm" :class="chapter.id === selectedId ? 'font-medium text-ink' : 'text-ink'">
                  {{ chapter.id === selectedId ? draft.name || "未命名章节" : chapter.name }}
                </span>
                <span class="num block text-2xs text-ink-subtle">{{ countChars(chapter.id === selectedId ? draft.text : chapter.text).toLocaleString() }} 字</span>
              </span>
              <span
                class="status-dot"
                :class="statusOf(chapter).dot"
                :title="statusOf(chapter).label"
                aria-hidden="true"
              />
              <span class="sr-only">{{ statusOf(chapter).label }}</span>
            </button>
          </li>
          <li v-if="!chapters.length" class="px-2 py-8 text-center text-xs text-ink-subtle">
            暂无章节
          </li>
        </ul>
      </aside>

      <!-- 中：章节编辑 -->
      <section class="flex min-w-0 flex-1 flex-col bg-canvas">
        <VEmptyState
          v-if="!selected"
          class="flex-1"
          :icon="DocumentTextIcon"
          title="选择或新建一个章节"
          description="章节文本会按项目或章节音色合成为一个音频文件。"
        >
          <VButton variant="primary" :icon="PlusIcon" @click="createChapterQuick">新建章节</VButton>
        </VEmptyState>

        <template v-else>
          <div class="flex items-center gap-3 border-b border-line px-6 py-2.5">
            <input
              v-model="draft.name"
              class="min-w-0 flex-1 bg-transparent text-base font-semibold text-ink outline-none placeholder:text-ink-subtle focus-visible:outline-none"
              placeholder="章节名称"
              aria-label="章节名称"
            />
            <span class="flex items-center gap-1.5 text-2xs" :class="dirty ? 'text-warning' : 'text-ink-subtle'">
              <span class="status-dot" :class="dirty ? 'bg-warning' : 'bg-success'" aria-hidden="true" />
              {{ dirty ? "未保存" : "已保存" }}
            </span>
            <VButton size="sm" :loading="saving" :disabled="!dirty" @click="saveDraft()">
              保存 <span class="kbd ml-1">Ctrl S</span>
            </VButton>
            <VIconButton :icon="TrashIcon" label="删除章节" size="sm" @click="deletingChapter = selected" />
          </div>
          <textarea
            ref="textEl"
            v-model="draft.text"
            class="min-h-0 flex-1 resize-none bg-transparent px-8 py-6 text-[15px] leading-7 text-ink outline-none placeholder:text-ink-subtle focus-visible:outline-none"
            placeholder="在此粘贴或输入要朗读的文本…"
            aria-label="章节文本"
          />
          <div class="flex h-8 shrink-0 items-center gap-4 border-t border-line px-6 text-2xs text-ink-subtle">
            <span class="num">{{ countChars(draft.text).toLocaleString() }} 字</span>
            <span>预计 {{ estimateDuration(draft.text) }}</span>
            <span class="ml-auto hidden lg:inline">
              <span class="kbd">Ctrl Enter</span> 合成 · <span class="kbd">Space</span> 播放/暂停
            </span>
          </div>
        </template>
      </section>

      <!-- 右：检查器 -->
      <aside v-if="selected" class="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-line bg-surface">
        <div class="space-y-4 border-b border-line p-4">
          <p class="section-title">本章声音</p>
          <VoiceSelect
            v-model="draft.voiceId"
            label="音色"
            :placeholder="defaultVoiceId ? `跟随项目（${accountStore.voiceName(defaultVoiceId)}）` : '请选择音色'"
          />
          <VSlider
            v-model="draft.speed"
            label="语速"
            :min="0.5"
            :max="2"
            :step="0.05"
            :default-value="1"
            :format="(v) => `${v.toFixed(2)}×`"
          />
        </div>

        <div class="space-y-3 border-b border-line p-4">
          <VButton
            variant="primary"
            size="lg"
            block
            :icon="SparklesIcon"
            :loading="synthesizing"
            :disabled="!canSynthesize"
            @click="synthesize"
          >
            {{ synthesizing ? "正在合成…" : selected.audioPath ? "重新合成本章" : "合成本章" }}
          </VButton>
          <p v-if="!effectiveVoiceId" class="text-xs text-warning">请先为本章或项目选择音色。</p>
          <p v-else-if="!countChars(draft.text)" class="text-xs text-ink-subtle">输入文本后即可合成。</p>
          <div v-else class="flex items-center gap-2 text-xs text-ink-muted">
            <span class="status-dot" :class="statusOf(selected).dot" aria-hidden="true" />
            {{ statusOf(selected).label }}
            <span v-if="selected.status === 'completed'" class="text-ink-subtle">· {{ formatRelative(selected.updateAt) }}</span>
          </div>
        </div>

        <div class="space-y-3 p-4">
          <div class="flex items-center justify-between">
            <p class="section-title">角色预览</p>
            <VButton size="sm" variant="ghost" :loading="analyzing" :disabled="!countChars(draft.text)" @click="analyzeRoles">
              分析
            </VButton>
          </div>
          <p class="text-xs text-ink-subtle">
            用 AI 识别文本中的说话人，便于检查分段。项目合成使用单一音色；需要多角色配音请使用「小说」工作台。
          </p>
          <ul v-if="analysis.length" class="space-y-1.5">
            <li
              v-for="(segment, index) in analysis"
              :key="index"
              class="rounded-md border-l-2 bg-raised px-2.5 py-1.5"
              :class="roleTone(segment.speaker).border"
            >
              <p class="text-2xs font-medium" :class="roleTone(segment.speaker).text">{{ segment.speaker || "旁白" }}</p>
              <p class="line-clamp-3 text-xs text-ink">{{ segment.text }}</p>
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <VAudioBar
      v-if="project"
      ref="audioBar"
      :src="audioUrl"
      :title="selected?.audioPath ? selected.name : undefined"
      :subtitle="selected?.audioPath ? project.title : undefined"
      :autoplay="autoplayNext"
    >
      <template #actions>
        <VIconButton :icon="FolderOpenIcon" label="打开所在文件夹" size="sm" :disabled="!selected?.audioPath" @click="openAudioFolder" />
      </template>
    </VAudioBar>

    <ProjectFormModal
      :open="formOpen"
      title="项目设置"
      :initial-data="project"
      :submitting="savingProject"
      @close="formOpen = false"
      @submit="updateProject"
    />

    <VConfirmDialog
      :open="!!deletingChapter"
      title="删除章节"
      :message="`确定删除「${deletingChapter?.name}」吗？此操作无法恢复。`"
      confirm-text="删除"
      @close="deletingChapter = null"
      @confirm="deleteChapter"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  SparklesIcon,
  SpeakerWaveIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";
import VAudioBar from "@/components/ui/VAudioBar.vue";
import VBadge from "@/components/ui/VBadge.vue";
import VButton from "@/components/ui/VButton.vue";
import VConfirmDialog from "@/components/ui/VConfirmDialog.vue";
import VEmptyState from "@/components/ui/VEmptyState.vue";
import VIconButton from "@/components/ui/VIconButton.vue";
import VInput from "@/components/ui/VInput.vue";
import VSkeleton from "@/components/ui/VSkeleton.vue";
import VSlider from "@/components/ui/VSlider.vue";
import ProjectFormModal, { type ProjectFormData } from "@/components/projects/ProjectFormModal.vue";
import VoiceSelect from "@/components/projects/VoiceSelect.vue";
import { ttsApi } from "@/api";
import { useAccountStore } from "@/stores/account";
import { useProjectsStore } from "@/stores/projects";
import type { Chapter } from "@/types";
import { countChars, estimateDuration, folderOf, formatRelative, toMediaUrl } from "@/utils/format";
import { roleTone } from "@/utils/roleColor";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const projectsStore = useProjectsStore();
const accountStore = useAccountStore();

const loading = ref(true);
const selectedId = ref<string | null>(null);
const listKeyword = ref("");
const saving = ref(false);
const savingProject = ref(false);
const synthesizing = ref(false);
const analyzing = ref(false);
const analysis = ref<Array<{ text: string; speaker: string }>>([]);
const formOpen = ref(false);
const deletingChapter = ref<Chapter | null>(null);
const audioUrl = ref("");
const autoplayNext = ref(false);
const textEl = ref<HTMLTextAreaElement | null>(null);
const audioBar = ref<InstanceType<typeof VAudioBar> | null>(null);

const draft = reactive({ name: "", text: "", voiceId: "", speed: 1 });

const projectId = computed(() => route.params.id as string);
const project = computed(() => projectsStore.projects.find((p) => p.id === projectId.value) || null);
const defaultVoiceId = computed<string>(() => project.value?.defaultVoiceSettings?.voiceId || "");

const chapters = computed(() =>
  projectsStore.chapters
    .filter((c) => c.projectId === projectId.value)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || new Date(a.createAt).getTime() - new Date(b.createAt).getTime())
);
const visibleChapters = computed(() => {
  const q = listKeyword.value.trim().toLowerCase();
  return q ? chapters.value.filter((c) => c.name.toLowerCase().includes(q)) : chapters.value;
});
const selected = computed(() => chapters.value.find((c) => c.id === selectedId.value) || null);

const effectiveVoiceId = computed(() => draft.voiceId || defaultVoiceId.value);
const canSynthesize = computed(() => Boolean(selected.value && countChars(draft.text) && effectiveVoiceId.value));

const dirty = computed(() => {
  const c = selected.value;
  if (!c) return false;
  return (
    draft.name !== (c.name || "") ||
    draft.text !== (c.text || "") ||
    draft.voiceId !== (c.settings?.voiceId || "") ||
    draft.speed !== Number(c.settings?.speed ?? 1)
  );
});

function statusOf(chapter: Chapter) {
  if (chapter.status === "processing") return { label: "合成中", dot: "bg-warning animate-pulse-dot" };
  if (chapter.status === "error") return { label: "上次合成失败", dot: "bg-danger" };
  if (chapter.audioPath && chapter.status === "completed") return { label: "已合成", dot: "bg-success" };
  return { label: "未合成", dot: "bg-line-strong" };
}

function loadDraft(chapter: Chapter | null) {
  draft.name = chapter?.name || "";
  draft.text = chapter?.text || "";
  draft.voiceId = chapter?.settings?.voiceId || "";
  draft.speed = Number(chapter?.settings?.speed ?? 1) || 1;
  analysis.value = [];
}

async function refreshAudio(chapter: Chapter | null, autoplay = false) {
  autoplayNext.value = autoplay;
  audioUrl.value = chapter?.audioPath ? await toMediaUrl(chapter.audioPath) : "";
}

async function selectChapter(id: string | null) {
  if (id === selectedId.value) return;
  if (dirty.value) await saveDraft(true);
  selectedId.value = id;
  loadDraft(selected.value);
  refreshAudio(selected.value);
  router.replace({ query: id ? { ...route.query, chapter: id } : {} });
}

async function saveDraft(silent = false) {
  const chapter = selected.value;
  if (!chapter || !dirty.value) return true;
  saving.value = true;
  try {
    const result = await projectsStore.updateChapter(chapter.id, {
      name: draft.name.trim() || "未命名章节",
      text: draft.text,
      settings: JSON.parse(JSON.stringify({ ...(chapter.settings || {}), voiceId: draft.voiceId, speed: draft.speed })),
    });
    if (!result) throw new Error("保存失败");
    if (!draft.name.trim()) draft.name = result.name;
    if (!silent) toast.success("已保存");
    return true;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "保存失败");
    return false;
  } finally {
    saving.value = false;
  }
}

async function createChapterQuick() {
  if (!project.value) return;
  if (dirty.value) await saveDraft(true);
  const chapter = await projectsStore.createChapter(project.value.id, `第 ${chapters.value.length + 1} 章`, "", {
    voiceId: "",
    speed: 1,
    pitch: 0,
    volume: 100,
  });
  if (!chapter) {
    toast.error("新建章节失败");
    return;
  }
  selectedId.value = null;
  await selectChapter(chapter.id);
  await nextTick();
  textEl.value?.focus();
}

async function synthesize() {
  const chapter = selected.value;
  if (!chapter || synthesizing.value) return;
  if (!countChars(draft.text)) return toast.error("章节文本为空");
  if (!effectiveVoiceId.value) return toast.error("请先选择音色");
  if (dirty.value && !(await saveDraft(true))) return;

  synthesizing.value = true;
  try {
    const response = await ttsApi.synthesize(chapter.id);
    const outputPath = response.success ? response.data?.outputPath : "";
    if (!outputPath) throw new Error(response.error || "合成失败，请稍后重试");
    await projectsStore.updateChapter(chapter.id, { audioPath: outputPath, status: "completed" });
    if (selectedId.value === chapter.id) await refreshAudio(selected.value, true);
    toast.success(`「${chapter.name}」合成完成`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "合成失败，请稍后重试");
    await projectsStore.loadChaptersByProjectId(projectId.value);
  } finally {
    synthesizing.value = false;
  }
}

async function analyzeRoles() {
  if (!countChars(draft.text)) return;
  analyzing.value = true;
  try {
    const result = await window.electron.invoke("cloud:script-split", { text: draft.text, useLlm: true });
    if (!result?.success) throw new Error(result?.error || "角色分析失败，请稍后重试");
    analysis.value = result.data?.segments || [];
    if (!analysis.value.length) toast.info("没有识别到可分段的内容");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "角色分析失败，请稍后重试");
  } finally {
    analyzing.value = false;
  }
}

async function openAudioFolder() {
  const path = selected.value?.audioPath;
  if (!path) return;
  const result = await window.electron.openFolder(folderOf(path));
  if (result && result.success === false) toast.error(`无法打开文件夹：${result.error || "未知错误"}`);
}

async function updateProject(data: ProjectFormData) {
  if (!project.value) return;
  savingProject.value = true;
  const result = await projectsStore.updateProject(project.value.id, data);
  savingProject.value = false;
  if (result) {
    toast.success("项目设置已保存");
    formOpen.value = false;
  } else {
    toast.error("保存项目失败");
  }
}

async function deleteChapter() {
  const target = deletingChapter.value;
  deletingChapter.value = null;
  if (!target) return;
  const index = chapters.value.findIndex((c) => c.id === target.id);
  const ok = await projectsStore.deleteChapter(target.id);
  if (!ok) return toast.error("删除章节失败");
  toast.success(`已删除「${target.name}」`);
  if (selectedId.value === target.id) {
    const next = chapters.value[Math.min(index, chapters.value.length - 1)] || null;
    selectedId.value = null;
    await selectChapter(next?.id || null);
  }
}

function exportProject() {
  if (!project.value) return;
  const data = { ...project.value, chapters: chapters.value };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.value.title}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("项目已导出为 JSON");
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

function onKeydown(event: KeyboardEvent) {
  if (formOpen.value || deletingChapter.value) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveDraft();
  } else if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    synthesize();
  } else if (event.key === " " && !isTyping(event.target) && audioUrl.value) {
    event.preventDefault();
    audioBar.value?.toggle();
  }
}

async function init() {
  loading.value = true;
  if (!projectsStore.projects.length) await projectsStore.loadProjects();
  await projectsStore.loadChaptersByProjectId(projectId.value);
  projectsStore.currentProjectId = projectId.value;
  loading.value = false;

  const wanted = route.query.chapter as string | undefined;
  selectedId.value = null;
  if (wanted === "new") await createChapterQuick();
  else await selectChapter(chapters.value.find((c) => c.id === wanted)?.id || chapters.value[0]?.id || null);
}

watch(projectId, (id, old) => {
  if (id && id !== old) init();
});

onMounted(() => {
  init();
  accountStore.loadVoices();
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));

onBeforeRouteLeave(async () => {
  if (dirty.value) await saveDraft(true);
});
</script>
