<template>
  <div class="space-y-6">
    <section class="panel flex items-center gap-4 p-5">
      <img src="@/assets/logo.svg" alt="" class="h-14 w-14" />
      <div class="min-w-0 flex-1">
        <h2 class="text-base font-semibold text-ink">{{ appConfig.name }} <span class="text-ink-muted">{{ appConfig.nameEn }}</span></h2>
        <p class="num text-xs text-ink-muted">v{{ appConfig.version }} · {{ platform }} · {{ appConfig.releaseDate }}</p>
        <p class="mt-1.5 text-sm text-ink-muted">{{ appConfig.description }}</p>
      </div>
    </section>

    <section class="panel divide-y divide-line">
      <div class="flex items-center justify-between gap-4 p-4">
        <div>
          <p class="text-sm font-medium text-ink">软件更新</p>
          <p class="text-xs text-ink-subtle">每 7 天自动检查一次，也可以手动检查。</p>
        </div>
        <VButton variant="primary" :icon="ArrowPathIcon" :loading="isCheckingUpdate" @click="checkForUpdates()">
          检查更新
        </VButton>
      </div>
      <div class="flex items-center justify-between gap-4 p-4">
        <div>
          <p class="text-sm font-medium text-ink">诊断信息</p>
          <p class="text-xs text-ink-subtle">反馈问题时可附上应用、存储路径与系统环境信息。</p>
        </div>
        <VButton :icon="CommandLineIcon" @click="openDebugPanel">查看</VButton>
      </div>
      <div class="flex items-center gap-2 p-4">
        <VButton variant="ghost" :icon="GlobeAltIcon" @click="openExternal(appConfig.website)">官网</VButton>
        <VButton variant="ghost" @click="openExternal(appConfig.github)">
          <GithubIcon class="h-4 w-4" />
          GitHub
        </VButton>
        <span class="ml-auto text-2xs text-ink-subtle">{{ appConfig.copyright }}</span>
      </div>
    </section>

    <UpdateDialog
      :show="showUpdateDialog"
      :update-info="updateInfo"
      :current-version="appConfig.version"
      :download-progress="downloadProgress"
      :download-state="downloadState"
      @close="showUpdateDialog = false"
      @download="handleDownloadUpdate"
      @install="handleInstallUpdate"
      @cancel="handleCancelUpdate"
    />

    <VDialog :open="showDebugPanel" title="诊断信息" size="xl" @close="showDebugPanel = false">
      <div class="space-y-4">
        <div v-for="block in debugBlocks" :key="block.title">
          <p class="field-label">{{ block.title }}</p>
          <pre class="max-h-56 overflow-auto rounded-md bg-soft p-3 font-mono text-xs leading-5 text-ink">{{ block.value || "读取中…" }}</pre>
        </div>
      </div>
      <template #footer>
        <VButton variant="ghost" :icon="ArrowPathIcon" @click="refreshDebugInfo">刷新</VButton>
        <VButton variant="primary" :icon="ClipboardDocumentIcon" @click="copyDebugInfo">复制全部</VButton>
      </template>
    </VDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useToast } from "vue-toastification";
import { ArrowPathIcon, ClipboardDocumentIcon, CommandLineIcon, GlobeAltIcon } from "@heroicons/vue/24/outline";
import GithubIcon from "@/components/icon/github.vue";
import UpdateDialog from "@/components/layout/UpdateDialog.vue";
import VButton from "@/components/ui/VButton.vue";
import VDialog from "@/components/ui/VDialog.vue";
import { appConfig } from "@/stores/appConfig";
import { saveLastUpdateCheck, shouldCheckForUpdates, type UpdateInfo } from "@/services/updateService";

const toast = useToast();

const platform = getPlatformName();
const isCheckingUpdate = ref(false);
const showUpdateDialog = ref(false);
const updateInfo = ref<UpdateInfo>({ version: "", releaseDate: "", downloadUrl: "", releaseNotes: "" });
const downloadProgress = ref(0);
const downloadState = ref<"idle" | "downloading" | "downloaded" | "error">("idle");

const showDebugPanel = ref(false);
const appDebugInfo = ref("");
const storagePaths = ref("");
const systemInfo = ref("");
const debugBlocks = computed(() => [
  { title: "应用信息", value: appDebugInfo.value },
  { title: "存储路径", value: storagePaths.value },
  { title: "系统环境", value: systemInfo.value },
]);

function getPlatformName() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "Windows";
  if (ua.includes("mac")) return "macOS";
  if (ua.includes("linux")) return "Linux";
  return "未知平台";
}

function handleUpdateMessage(data: { message: string; data: any }) {
  switch (data.message) {
    case "update-available":
      updateInfo.value = {
        version: data.data.version,
        releaseDate: new Date().toLocaleDateString(),
        downloadUrl: "",
        releaseNotes: data.data.releaseNotes || "无详细更新说明",
      };
      showUpdateDialog.value = true;
      isCheckingUpdate.value = false;
      break;
    case "update-not-available":
      if (isCheckingUpdate.value) toast.success("当前已是最新版本");
      isCheckingUpdate.value = false;
      break;
    case "download-progress":
      downloadProgress.value = data.data.percent || 0;
      downloadState.value = "downloading";
      break;
    case "update-downloaded":
      downloadState.value = "downloaded";
      toast.success("更新已下载完成，可以安装");
      break;
    case "error": {
      console.error("更新错误:", data.data);
      isCheckingUpdate.value = false;
      downloadState.value = "error";
      let message = String(data.data || "");
      const netError = message.match(/net::(ERR_\w+)/);
      if (netError) message = netError[1];
      else if (message.length > 50) message = `${message.split("\n")[0].slice(0, 50)}…`;
      toast.error(`更新错误：${message}`);
      break;
    }
  }
}

async function checkForUpdates(showMessage = true) {
  if (isCheckingUpdate.value) return;
  isCheckingUpdate.value = true;
  try {
    saveLastUpdateCheck();
    await window.electron.checkForUpdates();
  } catch (error) {
    if (showMessage) toast.error(`检查更新失败：${error instanceof Error ? error.message : "未知错误"}`);
    isCheckingUpdate.value = false;
  }
}

async function handleDownloadUpdate() {
  try {
    downloadState.value = "downloading";
    downloadProgress.value = 0;
    await window.electron.downloadUpdate();
  } catch (error) {
    downloadState.value = "error";
    toast.error(`下载出错：${error instanceof Error ? error.message : "未知错误"}`);
  }
}

async function handleInstallUpdate() {
  try {
    await window.electron.installUpdate();
  } catch (error) {
    toast.error(`安装更新失败：${error instanceof Error ? error.message : "未知错误"}`);
  }
}

async function handleCancelUpdate() {
  try {
    await window.electron.cancelUpdate();
    downloadState.value = "idle";
    downloadProgress.value = 0;
    toast.info("已取消下载");
  } catch (error) {
    toast.error(`取消下载失败：${error instanceof Error ? error.message : "未知错误"}`);
  }
}

function openExternal(url: string) {
  window.open(url, "_blank");
}

async function openDebugPanel() {
  showDebugPanel.value = true;
  await refreshDebugInfo();
}

async function refreshDebugInfo() {
  try {
    appDebugInfo.value = JSON.stringify(await window.electron.getAppInfo(), null, 2);
    storagePaths.value = JSON.stringify(await window.electron.getStoragePaths(), null, 2);
    systemInfo.value = JSON.stringify(await window.electron.getSystemInfo(), null, 2);
  } catch (error) {
    console.error("获取系统信息失败:", error);
    toast.error("获取系统信息失败");
  }
}

function copyDebugInfo() {
  const text = debugBlocks.value.map((b) => `${b.title}:\n${b.value}`).join("\n\n");
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success("已复制到剪贴板"))
    .catch(() => toast.error("复制失败"));
}

onMounted(() => {
  downloadState.value = "idle";
  downloadProgress.value = 0;
  window.electron?.onUpdateMessage(handleUpdateMessage);
  if (shouldCheckForUpdates()) checkForUpdates(false);
});

onUnmounted(() => window.electron?.removeUpdateListener());
</script>
