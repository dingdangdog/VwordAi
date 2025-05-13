<template>
  <div class="about-setting h-full card p-2 m-2">
    <div class="flex flex-col items-center justify-center py-4">
      <div
        class="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4"
      >
        <img class="h-full w-auto" src="@/assets/logo.svg" alt="Logo" />
      </div>

      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ appConfig.name }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mb-12">
        {{ appConfig.nameEn }} {{ appConfig.version }}
      </p>

      <div
        class="max-w-md w-full bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-12"
      >
        <h3
          class="font-medium text-gray-900 dark:text-white mb-2 border-b text-center border-gray-200 dark:border-gray-600"
        >
          软件信息
        </h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">版本</span>
            <span class="text-gray-900 dark:text-white">{{
              appConfig.version
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">平台</span>
            <span class="text-gray-900 dark:text-white">{{ platform }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">更新日期</span>
            <span class="text-gray-900 dark:text-white">{{
              appConfig.releaseDate
            }}</span>
          </div>
        </div>
      </div>

      <div class="max-w-md w-full mb-12">
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
            <span
              class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
            ></span>
            检查中...
          </span>
        </button>
        <button class="btn btn-secondary" @click="openWebsite">访问官网</button>
        <button class="btn flex space-x-1 dark:text-white" @click="openGithub">
          <GithubIcon class="w-7 h-7" />
        </button>
        <button class="btn text-black dark:text-white" @click="openDebugPanel">
          系统信息
        </button>
      </div>
    </div>

    <div class="mt-12 text-center">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ appConfig.copyright }}
      </p>
    </div>

    <!-- 更新对话框 -->
    <UpdateDialog
      :show="showUpdateDialog"
      :update-info="updateInfo"
      :current-version="appConfig.version"
      :download-progress="downloadProgress"
      :download-state="downloadState"
      @close="showUpdateDialog = false"
      @download="handleDownloadUpdate"
      @install="handleInstallUpdate"
    />

    <!-- 调试对话框 -->
    <div
      v-if="showDebugPanel"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-11/12 max-w-4xl max-h-[80vh] overflow-auto"
      >
        <div
          class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
        >
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            应用调试面板
          </h3>
          <button
            @click="showDebugPanel = false"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        <div class="p-4 max-h-[65vh] overflow-auto">
          <div class="mb-4">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
              应用信息
            </h4>
            <div
              class="bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-700 dark:text-gray-200"
            >
              <pre class="whitespace-pre-wrap text-sm">{{ appDebugInfo }}</pre>
            </div>
          </div>
          <div class="mb-4">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
              存储路径
            </h4>
            <div
              class="bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-700 dark:text-gray-200"
            >
              <pre class="whitespace-pre-wrap text-sm">{{ storagePaths }}</pre>
            </div>
          </div>
          <div class="mb-4">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
              系统环境
            </h4>
            <div
              class="bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-700 dark:text-gray-200"
            >
              <pre class="whitespace-pre-wrap text-sm">{{ systemInfo }}</pre>
            </div>
          </div>
        </div>
        <div class="flex justify-center space-x-2 mt-4 px-2 pb-4">
          <button class="btn btn-secondary" @click="copyDebugInfo">
            复制系统信息
          </button>
          <button class="btn btn-primary" @click="refreshDebugInfo">
            刷新
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useToast } from "vue-toastification";
import GithubIcon from "@/components/icon/github.vue";
import { appConfig } from "@/stores/appConfig";
import {
  VersionCompareResult,
  saveLastUpdateCheck,
  shouldCheckForUpdates,
  type UpdateInfo,
} from "@/services/updateService";
import UpdateDialog from "@/components/layout/UpdateDialog.vue";

const toast = useToast();

// 检测平台
const platform = ref(getPlatformName());
const isCheckingUpdate = ref(false);
const showUpdateDialog = ref(false);
const updateInfo = ref<UpdateInfo>({
  version: "",
  releaseDate: "",
  downloadUrl: "",
  releaseNotes: "",
});

// 添加下载进度状态
const downloadProgress = ref(0);
const downloadState = ref<"idle" | "downloading" | "downloaded" | "error">(
  "idle"
);

// 调试面板相关
const showDebugPanel = ref(false);
const appDebugInfo = ref("");
const storagePaths = ref("");
const systemInfo = ref("");

// 组件挂载时检查是否需要自动更新
onMounted(() => {
  if (shouldCheckForUpdates()) {
    checkForUpdates(false);
  }

  // 注册更新消息监听
  if (window.electron) {
    window.electron.onUpdateMessage(handleUpdateMessage);
  }
});

// 组件卸载时移除监听器
onUnmounted(() => {
  if (window.electron) {
    window.electron.removeUpdateListener();
  }
});

// Error: Cannot parse releases feed: Error: Unable to find latest version on GitHub (https://github.com/dingdangdog/vwordai/releases/latest), please ensure a production release exists: Error: net::ERR_CONNECTION_TIMED_OUT
// at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/browser_init:2:123459)
//     at SimpleURLLoaderWrapper.emit (node:events:518:28)
//     at newError (D:\Program Files\VwordAi\resources\app.asar\node_modules\builder-util-runtime\out\error.js:5:19)
//     at GitHubProvider.getLatestTagName (D:\Program Files\VwordAi\resources\app.asar\node_modules\electron-updater\out\providers\GitHubProvider.js:161:55)
//     at async GitHubProvider.getLatestVersion (D:\Program Files\VwordAi\resources\app.asar\node_modules\electron-updater\out\providers\GitHubProvider.js:85:23)
//     at async
// 处理来自主进程的更新消息
function handleUpdateMessage(data: { message: string; data: any }) {
  switch (data.message) {
    case "update-available":
      // 有可用更新
      updateInfo.value = {
        version: data.data.version,
        releaseDate: new Date().toLocaleDateString(),
        downloadUrl: "", // 不需要下载链接，因为electron-updater会自动处理
        releaseNotes: data.data.releaseNotes || "无详细更新说明",
      };
      showUpdateDialog.value = true;
      isCheckingUpdate.value = false;
      break;

    case "update-not-available":
      // 无更新可用
      if (isCheckingUpdate.value) {
        toast.success("当前已是最新版本");
        isCheckingUpdate.value = false;
      }
      break;

    case "download-progress":
      // 更新下载进度
      downloadProgress.value = data.data.percent || 0;
      downloadState.value = "downloading";
      break;

    case "update-downloaded":
      // 更新已下载完成
      downloadState.value = "downloaded";
      toast.success("更新已下载完成，可以安装");
      break;

    case "error":
      // 更新过程出错
      console.error("更新错误:", data.data);
      isCheckingUpdate.value = false;
      downloadState.value = "error";

      // 简化错误信息显示
      let errorMessage = String(data.data || "");

      // 提取网络错误代码
      if (errorMessage.includes("net::")) {
        const netErrorMatch = errorMessage.match(/net::(ERR_\w+)/);
        if (netErrorMatch) {
          errorMessage = netErrorMatch[1];
        }
      }
      // 如果是其他错误，只保留第一行或限制长度
      else if (errorMessage.length > 50) {
        errorMessage = errorMessage.split("\n")[0].substring(0, 50) + "...";
      }

      toast.error(`更新错误: ${errorMessage}`);
      break;
  }
}

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
    // 保存检查时间
    saveLastUpdateCheck();

    // 使用 electron-updater 检查更新
    await window.electron.checkForUpdates();
  } catch (error) {
    if (showMessage) {
      toast.error(
        `检查更新错误: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
    console.error("检查更新失败:", error);
    isCheckingUpdate.value = false;
  }
}

// 处理传统方式的更新检查结果
function handleLegacyUpdateCheck(result: any) {
  switch (result.status) {
    case VersionCompareResult.NewerAvailable:
      if (result.updateInfo) {
        updateInfo.value = result.updateInfo;
        showUpdateDialog.value = true;
      }
      break;

    case VersionCompareResult.UpToDate:
      toast.success("当前已是最新版本");
      break;

    case VersionCompareResult.Error:
      toast.error(`检查更新失败: ${result.error || "网络错误"}`);
      break;
  }

  isCheckingUpdate.value = false;
}

function openWebsite() {
  window.open(appConfig.website, "_blank");
}

function openGithub() {
  window.open(appConfig.github, "_blank");
}

async function handleDownloadUpdate() {
  if (!window.electron) {
    // 降级到基础方式打开下载页面
    window.open(updateInfo.value.downloadUrl, "_blank");
    toast.info("已打开下载页面");
    return;
  }

  try {
    // 重置下载状态，允许重试下载
    downloadState.value = "downloading";
    downloadProgress.value = 0;
    await window.electron.downloadUpdate();
    toast.info("更新下载已开始，请稍候...");
  } catch (error) {
    downloadState.value = "error";
    toast.error(
      `下载出错: ${error instanceof Error ? error.message : "未知错误"}`
    );
    console.error("下载更新出错:", error);
  }
}

async function handleInstallUpdate() {
  if (!window.electron) {
    return;
  }

  try {
    await window.electron.installUpdate();
  } catch (error) {
    toast.error(
      `安装更新失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
    console.error("安装更新失败:", error);
  }
}

// 打开调试面板
async function openDebugPanel() {
  showDebugPanel.value = true;
  await refreshDebugInfo();
}

// 刷新系统信息
async function refreshDebugInfo() {
  try {
    if (window.electron) {
      // 获取应用系统信息
      const appInfo = await window.electron.getAppInfo();
      appDebugInfo.value = JSON.stringify(appInfo, null, 2);

      // 获取存储路径信息
      const paths = await window.electron.getStoragePaths();
      storagePaths.value = JSON.stringify(paths, null, 2);

      // 获取系统信息
      const sysInfo = await window.electron.getSystemInfo();
      systemInfo.value = JSON.stringify(sysInfo, null, 2);
    } else {
      appDebugInfo.value = JSON.stringify(
        {
          version: appConfig.version,
          environment: "Web环境",
          buildDate: appConfig.releaseDate,
        },
        null,
        2
      );

      storagePaths.value = "Web环境无法获取存储路径";

      systemInfo.value = JSON.stringify(
        {
          platform: platform.value,
          userAgent: navigator.userAgent,
          language: navigator.language,
        },
        null,
        2
      );
    }
  } catch (error) {
    console.error("获取系统信息失败:", error);
    toast.error("获取系统信息失败");
  }
}

// 复制系统信息
function copyDebugInfo() {
  const allInfo = `
应用信息:
${appDebugInfo.value}

存储路径:
${storagePaths.value}

系统环境:
${systemInfo.value}
`;

  navigator.clipboard
    .writeText(allInfo)
    .then(() => {
      toast.success("系统信息已复制到剪贴板");
    })
    .catch((err) => {
      console.error("复制失败:", err);
      toast.error("复制失败");
    });
}
</script>
