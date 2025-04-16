<template>
  <div class="card p-2 m-2">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      本地存储
    </h2>

    <div class="px-4">
      <div class="flex">
        <input
          type="text"
          id="exportPath"
          v-model="defaultExportPath"
          class="input max-w-md"
          readonly
          placeholder="请选择默认的音频文件导出路径"
        />
        <button
          @click="selectExportPath"
          class="btn text-black dark:text-white bg-green-100 hover:bg-green-200 dark:bg-green-700 dark:hover:bg-green-600 ml-2"
        >
          选择路径
        </button>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        选择一个路径，用于保存生成的音频文件 (WAV格式)
      </p>

      <div class="flex justify-center mt-2">
        <button
          @click="saveStorageSettings"
          class="btn btn-primary"
          :disabled="isSavingPath"
        >
          {{ isSavingPath ? "保存中..." : "保存设置" }}
        </button>
      </div>
    </div>
  </div>

  <div class="card p-2 m-2">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      数据备份
    </h2>

    <div class="px-4">
      <p class="text-gray-600 dark:text-gray-300 mb-2">
        您可以导出所有系统数据，包括项目、章节、服务商设置和系统配置，以便备份或迁移到其他设备。
      </p>

      <div class="grid sm:grid-cols-2 gap-6">
        <div
          class="shadow-lg bg-gray-100 dark:bg-gray-700 rounded-sm p-2 text-center"
        >
          <h3
            class="text-base font-semibold text-gray-900 dark:text-white mb-3"
          >
            导入系统数据
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            从之前导出的JSON文件中恢复所有系统数据。将替换当前的所有设置和数据。
          </p>

          <input
            type="file"
            ref="fileInput"
            accept=".json"
            class="hidden"
            @change="handleFileImport"
          />

          <button
            @click="triggerFileInput"
            :disabled="isImporting"
            class="btn btn-primary mt-2 flex mx-auto"
          >
            <ArrowDownTrayIcon v-if="!isImporting" class="h-5 w-5 mr-2" />
            <div
              v-else
              class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"
            ></div>
            {{ isImporting ? "导入中..." : "导入系统数据" }}
          </button>
        </div>

        <div
          class="shadow-lg bg-gray-100 dark:bg-gray-700 rounded-sm p-2 text-center"
        >
          <h3
            class="text-base font-semibold text-gray-900 dark:text-white mb-2"
          >
            导出系统数据
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            导出全部系统数据为单个JSON文件，包含所有配置和内容。
          </p>

          <button
            @click="exportSystemData"
            :disabled="isExporting"
            class="btn btn-primary mt-2 flex mx-auto"
          >
            <ArrowUpTrayIcon v-if="!isExporting" class="h-5 w-5 mr-2" />
            <div
              v-else
              class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"
            ></div>
            {{ isExporting ? "导出中..." : "导出全部系统数据" }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- <div class="card p-2 m-2">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      重置系统数据
    </h2>
    <div class="px-4">
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        危险操作：重置将清除所有项目、章节、设置和配置。这个操作无法撤销。
      </p>

      <button @click="confirmReset" class="btn btn-danger flex">
        <ExclamationTriangleIcon class="h-5 w-5 mr-2" />
        重置所有数据
      </button>
    </div>
  </div> -->
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { useProjectsStore } from "@/stores/projects";
import { useSettingsStore } from "@/stores/settings";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import {
  settingsApi,
  projectApi,
  chapterApi,
  serviceProviderApi,
} from "@/utils/api";

const toast = useToast();
const projectsStore = useProjectsStore();
const settingsStore = useSettingsStore();

const fileInput = ref<HTMLInputElement | null>(null);
const isExporting = ref(false);
const isImporting = ref(false);
const isSavingPath = ref(false);

// 存储路径设置
const defaultExportPath = ref("");

// 初始化
onMounted(async () => {
  await loadSettings();
});

// 加载设置
async function loadSettings() {
  try {
    // 确保设置已加载
    const settings =
      settingsStore.settings || (await settingsStore.loadSettings());

    if (settings) {
      // 设置导出路径
      defaultExportPath.value = settings.defaultExportPath || "";
    }
  } catch (error) {
    toast.error(
      `加载设置失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function selectExportPath() {
  try {
    // 使用electron API选择文件夹
    const path = await window.electron.selectFolder();
    if (path) {
      defaultExportPath.value = path;
    }
  } catch (err) {
    toast.error(
      `选择文件夹失败: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

async function saveStorageSettings() {
  isSavingPath.value = true;

  try {
    // 准备更新的设置数据
    const settingsData = {
      defaultExportPath: defaultExportPath.value,
    };

    // 使用设置存储更新设置
    const updatedSettings = await settingsStore.updateSettings(settingsData);

    if (updatedSettings) {
      toast.success("存储路径设置已保存");
    } else {
      throw new Error("更新设置失败");
    }
  } catch (err) {
    toast.error(
      `保存设置失败: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    isSavingPath.value = false;
  }
}

async function exportSystemData() {
  isExporting.value = true;

  try {
    // 收集所有系统数据
    const systemData = {
      settings: await settingsStore.getAllSettings(),
      projects: await getAllProjects(),
      chapters: await getAllChapters(),
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    // 转换为JSON字符串
    const jsonData = JSON.stringify(systemData, null, 2);

    // 创建Blob并下载
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();

    // 清理
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success("系统数据导出成功");
  } catch (error) {
    console.error("导出系统数据失败:", error);
    toast.error(
      `导出失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  } finally {
    isExporting.value = false;
  }
}

async function getAllProjects() {
  const response = await projectApi.getAll();
  return response.success && response.data ? response.data : [];
}

async function getAllChapters() {
  const projects = await getAllProjects();
  let allChapters: any[] = [];

  for (const project of projects) {
    const response = await chapterApi.getByProjectId(project.id);
    if (response.success && response.data) {
      allChapters = [...allChapters, ...response.data];
    }
  }

  return allChapters;
}

function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

async function handleFileImport(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  isImporting.value = true;

  try {
    // 读取文件
    const content = await readFile(file);
    const systemData = JSON.parse(content);

    // 验证数据结构
    if (!systemData.version || !Array.isArray(systemData.projects)) {
      throw new Error("无效的系统数据文件格式");
    }

    // 确认导入
    if (
      !confirm(
        "导入将替换当前系统中的所有数据。这个操作无法撤销。确定要继续吗？"
      )
    ) {
      input.value = "";
      isImporting.value = false;
      return;
    }

    // 导入数据
    await importSystemData(systemData);

    toast.success("系统数据导入成功");

    await projectsStore.loadProjects();

    // 重置文件输入
    input.value = "";
  } catch (error) {
    console.error("导入系统数据失败:", error);
    toast.error(
      `导入失败: ${error instanceof Error ? error.message : "无效的文件格式"}`
    );
  } finally {
    isImporting.value = false;
  }
}

// 读取文件内容
function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error("读取文件失败"));
      }
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsText(file);
  });
}

// 导入系统数据
async function importSystemData(systemData: any) {
  // 导入设置
  if (systemData.settings) {
    await settingsApi.update(systemData.settings);
    // 重新加载设置到 store
    await settingsStore.loadSettings();
  }

  // 导入项目和章节
  if (Array.isArray(systemData.projects)) {
    // 先删除现有项目
    const currentProjects = await getAllProjects();
    for (const project of currentProjects) {
      await projectApi.delete(project.id);
    }

    // 导入新项目
    for (const project of systemData.projects) {
      await projectApi.create(project);
    }

    // 导入章节
    if (Array.isArray(systemData.chapters)) {
      for (const chapter of systemData.chapters) {
        await chapterApi.create(chapter);
      }
    }
  }
}

// 确认重置系统数据
function confirmReset() {
  if (
    confirm(
      "警告：这将删除所有系统数据，包括项目、章节、设置和服务商配置。这个操作无法撤销。确定要继续吗？"
    )
  ) {
    resetSystemData();
  }
}

// 重置系统数据
async function resetSystemData() {
  try {
    await settingsApi.reset();
    toast.success("系统数据已重置");

    await projectsStore.loadProjects();
  } catch (error) {
    console.error("重置系统数据失败:", error);
    toast.error(
      `重置失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}
</script>
