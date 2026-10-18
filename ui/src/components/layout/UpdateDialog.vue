<template>
  <VDialog :open="show" title="发现新版本" size="md" @close="emit('close')">
    <div class="space-y-4">
      <div class="flex items-center gap-3 rounded-md border border-line bg-surface p-3">
        <ArrowUpCircleIcon class="h-8 w-8 shrink-0 text-accent" aria-hidden="true" />
        <div class="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span class="text-ink-muted">当前版本</span>
          <span class="num text-ink">{{ currentVersion }}</span>
          <span class="text-ink-muted">最新版本</span>
          <span class="num font-medium text-success">{{ updateInfo.version }}</span>
          <template v-if="updateInfo.releaseDate">
            <span class="text-ink-muted">发布日期</span>
            <span class="text-ink">{{ updateInfo.releaseDate }}</span>
          </template>
        </div>
      </div>

      <div v-if="updateInfo.releaseNotes">
        <p class="field-label">更新内容</p>
        <div
          class="max-h-48 overflow-y-auto rounded-md bg-soft p-3 text-sm leading-6 text-ink"
          v-html="formattedReleaseNotes"
        />
      </div>

      <div v-if="downloadState === 'downloading'" class="space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="text-accent">正在下载更新 <span class="num">{{ Math.round(downloadProgress || 0) }}%</span></span>
          <button type="button" class="text-danger hover:underline" @click="emit('cancel')">取消</button>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-soft">
          <div class="h-full rounded-full bg-accent transition-[width] duration-base" :style="{ width: `${downloadProgress || 0}%` }" />
        </div>
      </div>

      <div v-if="downloadState === 'error'" class="rounded-md border-l-2 border-danger bg-danger/10 p-3 text-sm" role="alert">
        <p class="font-medium text-danger">下载失败</p>
        <p class="text-ink-muted">更新下载过程中出现错误，请检查网络连接后重试。</p>
      </div>
    </div>

    <template #footer>
      <VButton variant="ghost" @click="emit('close')">{{ downloadState === "downloaded" ? "稍后安装" : "关闭" }}</VButton>
      <VButton
        v-if="downloadState === 'idle' || downloadState === 'error'"
        variant="primary"
        :icon="ArrowDownTrayIcon"
        @click="emit('download')"
      >
        {{ downloadState === "error" ? "重试下载" : "下载更新" }}
      </VButton>
      <VButton v-if="downloadState === 'downloaded'" variant="primary" :icon="ArrowPathIcon" @click="emit('install')">
        立即安装并重启
      </VButton>
    </template>
  </VDialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowUpCircleIcon } from "@heroicons/vue/24/outline";
import VButton from "@/components/ui/VButton.vue";
import VDialog from "@/components/ui/VDialog.vue";
import type { UpdateInfo } from "@/services/updateService";

const props = defineProps<{
  show: boolean;
  updateInfo: UpdateInfo;
  currentVersion: string;
  downloadProgress?: number;
  downloadState?: "idle" | "downloading" | "downloaded" | "error";
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "download"): void;
  (e: "install"): void;
  (e: "cancel"): void;
}>();

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const formattedReleaseNotes = computed(() => {
  if (!props.updateInfo.releaseNotes) return "";
  const plain = props.updateInfo.releaseNotes
    .replace(/<(br|\/p|\/li|\/h\d)\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return escapeHtml(plain)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n- /g, "<br>• ")
    .replace(/\n/g, "<br>");
});
</script>
