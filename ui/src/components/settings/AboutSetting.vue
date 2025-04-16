<template>
  <div class="about-setting card p-2 m-2">
    <div class="flex flex-col items-center justify-center py-4">
      <div
        class="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4"
      >
        <img class="h-full w-auto" src="@/assets/logo.svg" alt="Logo" />
      </div>

      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ appConfig.name }}</h1>
      <p class="text-gray-500 dark:text-gray-400 mb-6">{{ appConfig.nameEn }} v{{ appConfig.version }}</p>

      <div
        class="max-w-md w-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6"
      >
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">软件信息</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">版本</span>
            <span class="text-gray-900 dark:text-white">{{ appConfig.version }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">平台</span>
            <span class="text-gray-900 dark:text-white">{{ platform }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">更新日期</span>
            <span class="text-gray-900 dark:text-white">{{ appConfig.releaseDate }}</span>
          </div>
        </div>
      </div>

      <div class="max-w-md w-full mb-6">
        <p class="text-center text-gray-600 dark:text-gray-300">
          {{ appConfig.description }}
        </p>
      </div>

      <div class="flex space-x-4">
        <button 
          class="btn btn-primary flex items-center" 
          @click="() => checkForUpdates()"
          :disabled="isCheckingUpdate"
        >
          <span v-if="!isCheckingUpdate">检查更新</span>
          <span v-else class="flex items-center">
            <span class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
            检查中...
          </span>
        </button>
        <button class="btn btn-secondary" @click="openWebsite">访问官网</button>
        <button class="btn flex space-x-1 dark:text-white" @click="openGithub">
          <GithubIcon class="w-7 h-7" />
        </button>
      </div>
    </div>

    <div class="mt-6 text-center">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ appConfig.copyright }}
      </p>
    </div>

    <!-- 更新对话框 -->
    <UpdateDialog
      :show="showUpdateDialog"
      :update-info="updateInfo"
      :current-version="appConfig.version"
      @close="showUpdateDialog = false"
      @download="handleDownloadUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "vue-toastification";
import GithubIcon from "@/components/icon/github.vue";
import { appConfig } from "@/config/appConfig";
import { 
  UpdateService, 
  VersionCompareResult, 
  saveLastUpdateCheck, 
  shouldCheckForUpdates,
  type UpdateInfo 
} from "@/services/updateService";
import UpdateDialog from "./UpdateDialog.vue";

const toast = useToast();

// 检测平台
const platform = ref(getPlatformName());
const isCheckingUpdate = ref(false);
const showUpdateDialog = ref(false);
const updateInfo = ref<UpdateInfo>({
  version: "",
  releaseDate: "",
  downloadUrl: "",
  releaseNotes: ""
});

// 组件挂载时检查是否需要自动更新
onMounted(() => {
  if (shouldCheckForUpdates()) {
    checkForUpdates(false);
  }
});

function getPlatformName(): string {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("win")) return "Windows";
  if (userAgent.includes("mac")) return "macOS";
  if (userAgent.includes("linux")) return "Linux";

  return "未知";
}

async function checkForUpdates(showMessage = true) {
  if (isCheckingUpdate.value) return;
  
  isCheckingUpdate.value = true;
  
  if (showMessage) {
    toast.info("正在检查更新...");
  }

  try {
    const result = await UpdateService.checkForUpdates();
    
    // 保存检查时间
    saveLastUpdateCheck();
    
    // 处理检查结果
    switch (result.status) {
      case VersionCompareResult.NewerAvailable:
        if (result.updateInfo) {
          // 显示更新对话框
          updateInfo.value = result.updateInfo;
          showUpdateDialog.value = true;
        }
        break;
        
      case VersionCompareResult.UpToDate:
        if (showMessage) {
          toast.success("当前已是最新版本");
        }
        break;
        
      case VersionCompareResult.Error:
        if (showMessage) {
          toast.error(`检查更新失败: ${result.error || '网络错误'}`);
        }
        break;
    }
  } catch (error) {
    if (showMessage) {
      toast.error(`检查更新错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
    console.error('检查更新失败:', error);
  } finally {
    isCheckingUpdate.value = false;
  }
}

function openWebsite() {
  window.open(appConfig.website, "_blank");
}

function openGithub() {
  window.open(appConfig.github, "_blank");
}

async function handleDownloadUpdate() {
  toast.success(`正在下载新版本 ${updateInfo.value.version}`);
  
  try {
    const result = await UpdateService.downloadUpdate(updateInfo.value);
    if (result) {
      toast.info("下载已启动，请按照提示完成安装");
    } else {
      toast.error("下载失败，请稍后再试或访问官网手动下载");
    }
  } catch (error) {
    toast.error(`下载出错: ${error instanceof Error ? error.message : '未知错误'}`);
    console.error('下载更新出错:', error);
  }
}
</script>
