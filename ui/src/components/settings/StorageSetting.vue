<template>
  <div class="storage-setting card p-2 m-2">
    <div class="mb-6">
      <label
        for="exportPath"
        class="block text-md font-semibold text-gray-700 dark:text-gray-300 mb-2"
        >存储路径</label
      >
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
          <button @click="selectExportPath" class="btn btn-primary ml-2">
            选择路径
          </button>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          选择一个路径，用于保存生成的音频文件
        </p>
      </div>
    </div>

    <div class="mb-6">
      <h3 class="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
        音频文件格式
      </h3>
      <div class="px-4">
        <div class="flex space-x-4">
          <label class="inline-flex items-center">
            <input
              type="radio"
              class="form-radio"
              name="fileFormat"
              value="mp3"
              v-model="audioFormat"
            />
            <span class="ml-2 text-gray-700 dark:text-gray-300">MP3</span>
          </label>
          <label class="inline-flex items-center">
            <input
              type="radio"
              class="form-radio"
              name="fileFormat"
              value="wav"
              v-model="audioFormat"
            />
            <span class="ml-2 text-gray-700 dark:text-gray-300">WAV</span>
          </label>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          选择生成的音频文件格式
        </p>
      </div>
    </div>

    <div class="mb-6">
      <h3 class="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
        命名规则
      </h3>
      <div class="px-4">
        <select v-model="fileNamingRule" class="input max-w-md">
          <option value="chapter_title">章节标题</option>
          <option value="chapter_id">章节ID</option>
          <option value="project_chapter">项目名-章节名</option>
          <option value="custom">自定义格式</option>
        </select>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          选择音频文件的命名规则
        </p>

        <div v-if="fileNamingRule === 'custom'" class="mt-3">
          <input
            type="text"
            v-model="customNamingFormat"
            class="input max-w-md"
            placeholder="例如: {project}-{chapter}-{date}"
          />
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            可用的变量: {project} - 项目名, {chapter} - 章节名, {date} - 日期,
            {id} - 章节ID
          </p>
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <button
        @click="saveSettings"
        class="btn btn-primary"
        :disabled="isSaving"
      >
        {{ isSaving ? "保存中..." : "保存设置" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { useSettingsStore } from "@/stores/settings";

const toast = useToast();
const settingsStore = useSettingsStore();
const isSaving = ref(false);

// 存储设置
const defaultExportPath = ref("");
const audioFormat = ref<"mp3" | "wav">("mp3");
const fileNamingRule = ref("chapter_title");
const customNamingFormat = ref("{project}-{chapter}");

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

      // 设置音频格式
      audioFormat.value = settings.outputFormat || "mp3";

      // 设置文件命名规则
      fileNamingRule.value = settings.fileNamingRule || "chapter_title";

      // 设置自定义命名格式
      customNamingFormat.value =
        settings.customNamingFormat || "{project}-{chapter}";
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

async function saveSettings() {
  isSaving.value = true;

  try {
    // 准备更新的设置数据
    const settingsData = {
      defaultExportPath: defaultExportPath.value,
      outputFormat: audioFormat.value,
      fileNamingRule: fileNamingRule.value,
      customNamingFormat: customNamingFormat.value,
    };

    // 使用设置存储更新设置
    const updatedSettings = await settingsStore.updateSettings(settingsData);

    if (updatedSettings) {
      toast.success("存储设置已保存");
    } else {
      throw new Error("更新设置失败");
    }
  } catch (err) {
    toast.error(
      `保存设置失败: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    isSaving.value = false;
  }
}
</script>
