<template>
  <div class="space-y-6">
    <section class="panel">
      <div class="panel-header">外观</div>
      <div class="flex items-center justify-between gap-4 p-5">
        <div>
          <p class="text-sm font-medium text-ink">主题</p>
          <p class="text-xs text-ink-subtle">跟随系统时会随操作系统的深浅色自动切换。</p>
        </div>
        <VSegmented
          :model-value="settingsStore.theme"
          :options="themeOptions"
          label="主题"
          @update:model-value="settingsStore.setTheme"
        />
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">存储</div>
      <div class="space-y-3 p-5">
        <label class="field-label" for="export-path">音频导出目录</label>
        <div class="flex gap-2">
          <input id="export-path" v-model="defaultExportPath" class="field font-mono" readonly placeholder="请选择目录" />
          <VButton :icon="FolderIcon" @click="selectExportPath">选择</VButton>
          <VButton
            variant="ghost"
            :icon="FolderOpenIcon"
            :disabled="!defaultExportPath"
            title="打开目录"
            @click="defaultExportPath && openFolder(defaultExportPath)"
          >
            打开
          </VButton>
        </div>
        <p class="field-hint">合成的音频文件会按读文章保存在此目录下。</p>
        <div class="flex justify-end">
          <VButton variant="primary" :loading="isSavingPath" :disabled="defaultExportPath === savedPath" @click="saveStorageSettings">
            保存
          </VButton>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">数据备份</div>
      <div class="grid gap-4 p-5 sm:grid-cols-2">
        <div class="rounded-md border border-line p-4">
          <p class="text-sm font-medium text-ink">导出</p>
          <p class="mt-1 text-xs text-ink-subtle">把读文章、章节、服务设置与系统配置导出为单个 JSON 文件。</p>
          <VButton class="mt-4" :icon="ArrowUpTrayIcon" :loading="isExporting" @click="exportSystemData">导出全部数据</VButton>
        </div>
        <div class="rounded-md border border-line p-4">
          <p class="text-sm font-medium text-ink">导入</p>
          <p class="mt-1 text-xs text-ink-subtle">从备份文件恢复，会替换当前全部读文章与设置。</p>
          <VButton class="mt-4" :icon="ArrowDownTrayIcon" :loading="isImporting" @click="fileInput?.click()">选择备份文件</VButton>
          <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileImport" />
        </div>
      </div>
    </section>

    <VConfirmDialog
      :open="!!pendingImport"
      title="导入备份数据"
      message="导入将替换当前系统中的全部读文章、章节与设置，且无法撤销。确定继续吗？"
      confirm-text="导入并替换"
      :loading="isImporting"
      @close="pendingImport = null"
      @confirm="confirmImport"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, type Component } from "vue";
import { useToast } from "vue-toastification";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ComputerDesktopIcon,
  FolderIcon,
  FolderOpenIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/vue/24/outline";
import VButton from "@/components/ui/VButton.vue";
import VConfirmDialog from "@/components/ui/VConfirmDialog.vue";
import VSegmented from "@/components/ui/VSegmented.vue";
import { useProjectsStore } from "@/stores/projects";
import { useSettingsStore, type ThemeMode } from "@/stores/settings";
import { chapterApi, projectApi, settingsApi } from "@/api";

const toast = useToast();
const projectsStore = useProjectsStore();
const settingsStore = useSettingsStore();

const themeOptions: { label: string; value: ThemeMode; icon: Component }[] = [
  { label: "跟随系统", value: "system", icon: ComputerDesktopIcon },
  { label: "浅色", value: "light", icon: SunIcon },
  { label: "深色", value: "dark", icon: MoonIcon },
];

const fileInput = ref<HTMLInputElement | null>(null);
const isExporting = ref(false);
const isImporting = ref(false);
const isSavingPath = ref(false);
const defaultExportPath = ref("");
const savedPath = ref("");
const pendingImport = ref<any>(null);

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

onMounted(async () => {
  try {
    const settings = settingsStore.settings || (await settingsStore.loadSettings());
    defaultExportPath.value = settings?.defaultExportPath || "";
    savedPath.value = defaultExportPath.value;
  } catch (error) {
    toast.error(`加载设置失败：${errorText(error)}`);
  }
});

async function selectExportPath() {
  try {
    const path = await window.electron.selectFolder();
    if (path) defaultExportPath.value = path;
  } catch (error) {
    toast.error(`选择文件夹失败：${errorText(error)}`);
  }
}

function openFolder(path: string) {
  window.electron.openFolder(path);
}

async function saveStorageSettings() {
  isSavingPath.value = true;
  try {
    const updated = await settingsStore.updateSettings({ defaultExportPath: defaultExportPath.value });
    if (!updated) throw new Error("更新设置失败");
    savedPath.value = defaultExportPath.value;
    toast.success("导出目录已保存");
  } catch (error) {
    toast.error(`保存失败：${errorText(error)}`);
  } finally {
    isSavingPath.value = false;
  }
}

async function getAllProjects() {
  const response = await projectApi.getAll();
  return response.success && response.data ? response.data : [];
}

async function getAllChapters() {
  const chapters: any[] = [];
  for (const project of await getAllProjects()) {
    const response = await chapterApi.getByProjectId(project.id);
    if (response.success && response.data) chapters.push(...response.data);
  }
  return chapters;
}

async function exportSystemData() {
  isExporting.value = true;
  try {
    const data = {
      settings: await settingsStore.getSettings(),
      ttsSettings: await settingsStore.loadTTSSettings(),
      llmSettings: await settingsStore.loadLLMSettings(),
      bliveSettings: await settingsStore.loadBliveSettings(),
      projects: await getAllProjects(),
      chapters: await getAllChapters(),
      exportDate: new Date().toISOString(),
      version: "1.0",
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `vwordai_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("数据已导出");
  } catch (error) {
    toast.error(`导出失败：${errorText(error)}`);
  } finally {
    isExporting.value = false;
  }
}

async function handleFileImport(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data.version || !Array.isArray(data.projects)) throw new Error("无效的备份文件格式");
    pendingImport.value = data;
  } catch (error) {
    toast.error(`导入失败：${errorText(error)}`);
  }
}

async function confirmImport() {
  const data = pendingImport.value;
  if (!data) return;
  isImporting.value = true;
  try {
    if (data.settings) {
      await settingsApi.update(data.settings);
      await settingsStore.loadSettings();
    }
    if (data.ttsSettings) {
      await settingsApi.updateTTSSettings(data.ttsSettings);
      await settingsStore.loadTTSSettings();
    }
    if (data.llmSettings) {
      await settingsApi.updateLLMSettings(data.llmSettings);
      await settingsStore.loadLLMSettings();
    }
    if (data.bliveSettings) {
      await settingsApi.updateBliveSettings(data.bliveSettings);
      await settingsStore.loadBliveSettings();
    }
    for (const project of await getAllProjects()) await projectApi.delete(project.id);
    for (const project of data.projects) await projectApi.create(project);
    for (const chapter of data.chapters || []) await chapterApi.create(chapter);
    await projectsStore.loadProjects();
    toast.success("数据已导入");
  } catch (error) {
    toast.error(`导入失败：${errorText(error)}`);
  } finally {
    isImporting.value = false;
    pendingImport.value = null;
  }
}
</script>
