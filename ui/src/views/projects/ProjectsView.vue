<template>
  <div class="mx-auto max-w-5xl px-6 py-6">
    <VPageHeader title="项目" description="单音色朗读：粘贴文本，选好音色，一键合成整章音频。">
      <template #actions>
        <VButton :icon="ArrowDownTrayIcon" @click="fileInput?.click()">导入</VButton>
        <VButton variant="primary" :icon="PlusIcon" @click="openCreate">新建项目</VButton>
      </template>
    </VPageHeader>
    <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileImport" />

    <div class="panel overflow-hidden">
      <div class="flex items-center gap-3 border-b border-line px-3 py-2">
        <VInput
          v-model="keyword"
          :icon="MagnifyingGlassIcon"
          size="sm"
          placeholder="搜索项目名称或描述"
          wrapper-class="w-72"
          aria-label="搜索项目"
        />
        <span class="num ml-auto text-2xs text-ink-subtle">{{ filtered.length }} / {{ projects.length }}</span>
      </div>

      <template v-if="projectsStore.isLoading && !projects.length">
        <div v-for="i in 4" :key="i" class="list-row">
          <VSkeleton class="h-8 w-8" />
          <div class="flex-1 space-y-1.5">
            <VSkeleton class="h-3.5 w-48" />
            <VSkeleton class="h-3 w-72" />
          </div>
        </div>
      </template>

      <VEmptyState
        v-else-if="!projects.length"
        :icon="FolderIcon"
        title="还没有项目"
        description="新建一个项目，把小说章节、文章或讲稿粘贴进去即可合成语音。"
      >
        <VButton variant="primary" :icon="PlusIcon" @click="openCreate">新建项目</VButton>
        <VButton :icon="ArrowDownTrayIcon" @click="fileInput?.click()">导入 JSON</VButton>
      </VEmptyState>

      <VEmptyState v-else-if="!filtered.length" :icon="MagnifyingGlassIcon" title="没有匹配的项目" compact />

      <ul v-else>
        <li
          v-for="project in filtered"
          :key="project.id"
          class="list-row group cursor-pointer"
          @click="router.push(`/projects/${project.id}`)"
        >
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
            <FolderIcon class="h-4 w-4" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1">
            <RouterLink
              :to="`/projects/${project.id}`"
              class="block truncate text-sm font-medium text-ink hover:text-accent"
              @click.stop
            >
              {{ project.title }}
            </RouterLink>
            <p class="truncate text-xs text-ink-subtle">{{ project.description || "无描述" }}</p>
          </div>
          <div class="hidden w-40 shrink-0 text-xs text-ink-muted md:block">
            <span v-if="project.defaultVoiceSettings?.voiceId" class="inline-flex items-center gap-1 truncate">
              <SpeakerWaveIcon class="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
              {{ accountStore.voiceName(project.defaultVoiceSettings.voiceId) }}
            </span>
            <span v-else class="text-ink-subtle">未设默认音色</span>
          </div>
          <span class="num w-24 shrink-0 text-right text-2xs text-ink-subtle">{{ formatRelative(project.updateAt) }}</span>
          <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <VIconButton :icon="PencilSquareIcon" label="编辑" size="sm" @click.stop="openEdit(project)" />
            <VIconButton :icon="TrashIcon" label="删除" size="sm" @click.stop="deleting = project" />
          </div>
        </li>
      </ul>
    </div>

    <ProjectFormModal
      :open="formOpen"
      :title="editing ? '编辑项目' : '新建项目'"
      :submit-text="editing ? '保存' : '创建'"
      :initial-data="editing"
      :submitting="submitting"
      @close="formOpen = false"
      @submit="submitProject"
    />

    <VConfirmDialog
      :open="!!deleting"
      title="删除项目"
      :message="`确定删除「${deleting?.title}」吗？项目下的所有章节会一并删除，且无法恢复。`"
      confirm-text="删除"
      @close="deleting = null"
      @confirm="deleteProject"
    />

    <VConfirmDialog
      :open="!!pendingImport"
      tone="primary"
      title="项目已存在"
      :message="`「${pendingImport?.title}」已存在。覆盖会替换现有项目的全部章节；也可以另存为新项目。`"
      confirm-text="覆盖现有项目"
      cancel-text="另存为新项目"
      @cancel="importAsNew"
      @close="pendingImport = null"
      @confirm="importOverwrite"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import {
  ArrowDownTrayIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  SpeakerWaveIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";
import VPageHeader from "@/components/ui/VPageHeader.vue";
import VButton from "@/components/ui/VButton.vue";
import VIconButton from "@/components/ui/VIconButton.vue";
import VInput from "@/components/ui/VInput.vue";
import VEmptyState from "@/components/ui/VEmptyState.vue";
import VSkeleton from "@/components/ui/VSkeleton.vue";
import VConfirmDialog from "@/components/ui/VConfirmDialog.vue";
import ProjectFormModal, { type ProjectFormData } from "@/components/projects/ProjectFormModal.vue";
import { useProjectsStore } from "@/stores/projects";
import { useAccountStore } from "@/stores/account";
import type { Project } from "@/types";
import { formatRelative } from "@/utils/format";

const router = useRouter();
const toast = useToast();
const projectsStore = useProjectsStore();
const accountStore = useAccountStore();

const keyword = ref("");
const formOpen = ref(false);
const submitting = ref(false);
const editing = ref<Project | null>(null);
const deleting = ref<Project | null>(null);
const pendingImport = ref<any>(null);
const fileInput = ref<HTMLInputElement>();

const projects = computed(() => projectsStore.projectsSorted);
const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  if (!q) return projects.value;
  return projects.value.filter(
    (p) => p.title.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q)
  );
});

onMounted(() => {
  projectsStore.loadProjects();
  accountStore.loadVoices();
});

function openCreate() {
  editing.value = null;
  formOpen.value = true;
}

function openEdit(project: Project) {
  editing.value = project;
  formOpen.value = true;
}

async function submitProject(data: ProjectFormData) {
  submitting.value = true;
  try {
    if (editing.value) {
      const result = await projectsStore.updateProject(editing.value.id, data);
      if (!result) throw new Error("更新项目失败");
      toast.success("项目已保存");
    } else {
      const project = await projectsStore.createProject(data.title, data.description, data.defaultVoiceSettings);
      if (!project) throw new Error("创建项目失败");
      toast.success("项目已创建");
      router.push({ path: `/projects/${project.id}`, query: { chapter: "new" } });
    }
    formOpen.value = false;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "操作失败");
  } finally {
    submitting.value = false;
  }
}

async function deleteProject() {
  const target = deleting.value;
  if (!target) return;
  const ok = await projectsStore.deleteProject(target.id);
  if (ok) toast.success(`已删除「${target.title}」`);
  else toast.error("删除项目失败");
  deleting.value = null;
}

async function handleFileImport(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data.id || !data.title || !Array.isArray(data.chapters)) throw new Error("无效的项目导入文件格式");
    if (projectsStore.projects.some((p) => p.id === data.id)) {
      pendingImport.value = data;
    } else {
      await createFromImport(data);
    }
  } catch (error) {
    toast.error(`导入失败：${error instanceof Error ? error.message : "无效的文件格式"}`);
  }
}

async function importChapters(projectId: string, chapters: any[]) {
  for (const chapter of chapters || []) {
    const created = await projectsStore.createChapter(projectId, chapter.name, chapter.text || "", chapter.settings || {});
    if (!created) console.error(`导入章节「${chapter.name}」失败`);
  }
}

async function createFromImport(data: any) {
  const project = await projectsStore.createProject(data.title, data.description || "", data.defaultVoiceSettings || {});
  if (!project) throw new Error("创建项目失败");
  await importChapters(project.id, data.chapters);
  toast.success(`「${data.title}」导入成功`);
}

async function importAsNew() {
  const data = pendingImport.value;
  pendingImport.value = null;
  if (!data) return;
  try {
    await createFromImport(data);
  } catch (error) {
    toast.error(`导入失败：${error instanceof Error ? error.message : "未知错误"}`);
  }
}

async function importOverwrite() {
  const data = pendingImport.value;
  pendingImport.value = null;
  if (!data) return;
  try {
    const result = await projectsStore.updateProject(data.id, {
      title: data.title,
      description: data.description || "",
      defaultVoiceSettings: data.defaultVoiceSettings || {},
    });
    if (!result) throw new Error("更新项目失败");
    await projectsStore.loadChaptersByProjectId(data.id);
    const existing = projectsStore.chapters.filter((c) => c.projectId === data.id);
    for (const chapter of existing) await projectsStore.deleteChapter(chapter.id);
    await importChapters(data.id, data.chapters);
    toast.success(`「${data.title}」已覆盖更新`);
  } catch (error) {
    toast.error(`导入失败：${error instanceof Error ? error.message : "未知错误"}`);
  }
}
</script>
