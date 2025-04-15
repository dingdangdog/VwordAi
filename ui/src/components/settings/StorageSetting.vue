<template>
  <div class="storage-setting card p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      存储设置
    </h2>
    
    <div class="mb-6">
      <label
        for="exportPath"
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >默认存储路径</label
      >
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
    
    <div class="mb-6">
      <h3 class="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">音频文件格式</h3>
      <div class="flex space-x-4">
        <label class="inline-flex items-center">
          <input type="radio" class="form-radio" name="fileFormat" value="mp3" v-model="audioFormat">
          <span class="ml-2">MP3</span>
        </label>
        <label class="inline-flex items-center">
          <input type="radio" class="form-radio" name="fileFormat" value="wav" v-model="audioFormat">
          <span class="ml-2">WAV</span>
        </label>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        选择生成的音频文件格式
      </p>
    </div>
    
    <div class="mb-6">
      <h3 class="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">命名规则</h3>
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
          可用的变量: {project} - 项目名, {chapter} - 章节名, {date} - 日期, {id} - 章节ID
        </p>
      </div>
    </div>
    
    <div class="flex justify-end">
      <button @click="saveSettings" class="btn btn-primary" :disabled="isSaving">
        {{ isSaving ? '保存中...' : '保存设置' }}
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
const defaultExportPath = ref(settingsStore.defaultExportPath);
const audioFormat = ref('mp3');
const fileNamingRule = ref('chapter_title');
const customNamingFormat = ref('{project}-{chapter}');

// 初始化
onMounted(() => {
  settingsStore.loadDefaultExportPath();
  defaultExportPath.value = settingsStore.defaultExportPath;
  
  // 这里可以加载其他存储设置
  // 由于演示，这里只有示例代码
});

async function selectExportPath() {
  try {
    // 使用electron API选择文件夹
    const path = await window.electron.selectFolder();
    if (path) {
      // 设置导出路径
      const success = await window.electron.setDefaultExportPath(path);
      if (success) {
        defaultExportPath.value = path;
        settingsStore.setDefaultExportPath(path);
        toast.success("导出路径已更新");
      } else {
        toast.error("设置导出路径失败");
      }
    }
  } catch (err) {
    toast.error(`选择文件夹失败: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function saveSettings() {
  isSaving.value = true;
  
  try {
    // 保存设置
    // 由于演示，这里只更新存储路径
    if (defaultExportPath.value) {
      await window.electron.setDefaultExportPath(defaultExportPath.value);
      settingsStore.setDefaultExportPath(defaultExportPath.value);
    }
    
    // 这里可以保存其他存储设置
    // ...
    
    toast.success("存储设置已保存");
  } catch (err) {
    toast.error(`保存设置失败: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    isSaving.value = false;
  }
}
</script> 