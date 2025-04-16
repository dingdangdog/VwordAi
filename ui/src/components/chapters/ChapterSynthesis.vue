<template>
  <div class="p-2 flex flex-col space-y-4">
    <h3 class="text-base font-semibold text-gray-900 dark:text-white">
      语音合成
    </h3>

    <div
      v-if="!chapter.settings.serviceProvider || !chapter.settings.voice"
      class="text-center"
    >
      <!-- <p class="text-gray-600 dark:text-gray-400">缺少语音配置</p> -->
      <p class="text-sm text-gray-500 dark:text-gray-500 mt-2 mb-4">
        请先配置服务商和声音角色
      </p>
      <button @click="$emit('edit-settings')" class="btn btn-primary">
        配置章节语音设置
      </button>
    </div>

    <div v-else>
      <!-- Voice settings summary - simplified -->
      <div v-if="showVoiceSettings" class="mb-3 text-sm">
        <div class="flex flex-wrap gap-3">
          <span>
            <span class="text-gray-500 dark:text-gray-400">服务商:</span>
            <span class="ml-1 text-gray-900 dark:text-white">{{
              getProviderName(chapter.settings.serviceProvider)
            }}</span>
          </span>
          <span>
            <span class="text-gray-500 dark:text-gray-400">声音角色:</span>
            <span class="ml-1 text-gray-900 dark:text-white">{{
              getVoiceRoleName(chapter.settings.voice) || chapter.settings.voice
            }}</span>
          </span>
          <span>
            <span class="text-gray-500 dark:text-gray-400">语速:</span>
            <span class="ml-1 text-gray-900 dark:text-white">{{
              chapter.settings.speed || 1
            }}</span>
          </span>
          <!-- <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">音调:</span>
              <span class="ml-2 text-gray-900 dark:text-white">{{ chapter.settings.pitch || 0 }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">音量:</span>
              <span class="ml-2 text-gray-900 dark:text-white">{{ chapter.settings.volume || 100 }}</span>
            </div> -->
          <span v-if="chapter.settings.emotion">
            <span class="text-gray-500 dark:text-gray-400">情感:</span>
            <span class="ml-1 text-gray-900 dark:text-white">{{
              getEmotionName(chapter.settings.emotion)
            }}</span>
          </span>
        </div>
      </div>

      <!-- Audio Player - Show when audio exists or synthesis was successful -->
      <div
        v-if="synthesisStatus === 'success' || chapter.audioPath"
        class="bg-gray-50 dark:bg-gray-700 rounded-md"
      >
        <div class="flex flex-col space-y-2">
          <div v-if="audioUrl" class="audio-player-container">
            <audio
              ref="audioPlayer"
              controls
              class="w-full"
              @play="onPlay"
              @pause="onPause"
              @ended="onEnded"
              @error="onAudioError"
              :src="audioUrl"
            ></audio>

            <div
              v-if="audioError"
              class="text-red-500 dark:text-red-400 text-sm mt-2"
            >
              <p>{{ audioError }}</p>
              <button
                @click="retryAudioLoad"
                class="text-blue-500 hover:underline mt-1"
              >
                重试加载
              </button>
            </div>

            <div class="flex justify-center items-center space-x-2 mt-3">
              <button
                @click="openAudioFolder"
                class="btn btn-secondary btn-sm flex justify-center items-center"
                :disabled="!audioUrl"
              >
                <FolderOpenIcon class="h-4 w-4 mr-1" />
                打开文件夹
              </button>
              <button
                @click="synthesize"
                class="btn btn-primary btn-sm flex justify-center items-center"
              >
                <ArrowPathIcon class="h-4 w-4 mr-1" />
                重新合成
              </button>
              <button
                v-if="isPlaying"
                @click="stopAudio"
                class="btn btn-danger btn-sm flex justify-center items-center"
                title="停止播放"
              >
                <StopIcon class="h-4 w-4 mr-1" />
                停止
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Synthesis Button - show only if no audio and idle state -->
      <div v-else-if="synthesisStatus === 'idle'" class="flex justify-end">
        <button
          @click="synthesize"
          class="btn btn-primary flex justify-center items-center"
          :disabled="!canSynthesize"
        >
          <SpeakerWaveIcon class="h-5 w-5 mr-1" />
          合成语音
        </button>
      </div>

      <!-- Loading state -->
      <div v-else-if="synthesisStatus === 'loading'" class="text-center py-4">
        <div
          class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"
        ></div>
        <p class="text-gray-600 dark:text-gray-400">正在合成...</p>
      </div>

      <!-- Error state -->
      <div
        v-else-if="synthesisStatus === 'error'"
        class="bg-red-50 dark:bg-red-900/30 p-4 rounded-md mt-4"
      >
        <div class="flex">
          <ExclamationCircleIcon
            class="h-5 w-5 text-red-500 dark:text-red-400 mr-2"
          />
          <p class="text-red-700 dark:text-red-400">{{ errorMessage }}</p>
        </div>
        <button
          @click="synthesisStatus = 'idle'"
          class="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          重试
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch, onMounted } from "vue";
import {
  SpeakerWaveIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  StopIcon,
  FolderOpenIcon,
} from "@heroicons/vue/24/outline";
import { ttsApi } from "@/utils/api";
import type { Chapter } from "@/types";
import { useToast } from "vue-toastification";
import { useProjectsStore } from "@/stores/projects";
import {
  getProviderName as getProviderDisplayName,
  getVoiceRoleName as getVoiceDisplayName,
  getEmotionName as getEmotionDisplayName,
} from "@/utils/voice-utils";

const props = defineProps<{
  chapter: Chapter;
}>();

const emit = defineEmits(["edit-settings"]);
const toast = useToast();
const projectsStore = useProjectsStore();

const synthesisStatus = ref<"idle" | "loading" | "success" | "error">("idle");
const errorMessage = ref("");
const audioUrl = ref("");
const audioFilePath = ref("");
const isPlaying = ref(false);
const audioPlayer = ref<HTMLAudioElement | null>(null);
const audioError = ref<string | null>(null);
const showVoiceSettings = ref(true);

const canSynthesize = computed(() => {
  return (
    props.chapter.text &&
    props.chapter.settings.serviceProvider &&
    props.chapter.settings.voice
  );
});

// Initialize component
onMounted(() => {
  // If chapter already has audio, set up the audio player
  if (props.chapter.audioPath) {
    synthesisStatus.value = "success";
    setupAudio(props.chapter.audioPath);
  }
});

// 获取服务商名称
function getProviderName(providerId: string | null): string {
  if (!providerId) return "";
  return getProviderDisplayName(providerId);
}

// 获取语音角色名称
function getVoiceRoleName(roleId: string | null): string {
  if (!roleId) return "";
  return getVoiceDisplayName(roleId);
}

// 获取情感名称
function getEmotionName(emotionId: string | null): string {
  if (!emotionId) return "";
  return getEmotionDisplayName(emotionId);
}

// 设置音频URL，确保正确处理本地文件路径
async function setupAudio(filePath: string) {
  if (!filePath) {
    audioUrl.value = "";
    return;
  }

  audioFilePath.value = filePath;
  try {
    if (window.electron) {
      const mediaUrl = await window.electron.invoke("get-media-url", filePath);
      if (mediaUrl) {
        audioUrl.value = mediaUrl;
        return;
      }
    }
    audioUrl.value = formatPathForElectron(filePath);
  } catch (err) {
    console.error("设置音频URL失败:", err);
    audioUrl.value = formatPathForElectron(filePath);
  }
}

// 合成语音
async function synthesize() {
  if (!canSynthesize.value) {
    toast.error("无法合成: 请确保章节文本和语音设置已完成");
    return;
  }

  synthesisStatus.value = "loading";
  errorMessage.value = "";
  audioError.value = null;

  try {
    const response = await ttsApi.synthesize(props.chapter.id);

    if (response.success && response.data) {
      await setupAudio(response.data.outputPath || "");
      synthesisStatus.value = "success";
    } else {
      synthesisStatus.value = "error";
      errorMessage.value = response.error || "合成失败，请稍后重试";
    }
  } catch (error) {
    synthesisStatus.value = "error";
    errorMessage.value =
      error instanceof Error ? error.message : "合成过程中发生错误";
  }
}

// 打开音频文件所在文件夹
async function openAudioFolder() {
  if (!audioFilePath.value) {
    toast.error("找不到音频文件路径");
    return;
  }

  try {
    // 使用Electron API打开文件夹
    if (window.electron) {
      // 获取文件所在目录路径
      const folderPath = audioFilePath.value.substring(
        0,
        audioFilePath.value.lastIndexOf("/")
      );
      const result = await window.electron.openFolder(folderPath);

      if (result && result.success) {
        toast.success("已打开文件夹");
      } else if (result && result.error) {
        toast.error(`无法打开文件夹: ${result.error}`);
      }
    } else {
      toast.error("此功能仅在桌面应用中可用");
    }
  } catch (error) {
    console.error("打开文件夹错误:", error);
    toast.error("打开文件夹失败，请重试");
  }
}

// 音频播放控制函数
function onPlay() {
  isPlaying.value = true;
  audioError.value = null;
}

function onPause() {
  isPlaying.value = false;
}

function onEnded() {
  isPlaying.value = false;
}

// 音频加载错误
function onAudioError(event: Event) {
  const target = event.target as HTMLAudioElement;
  console.error("Audio error:", target.error);

  if (audioUrl.value.startsWith("file://")) {
    audioError.value = "加载本地文件失败，可能是路径不正确或权限问题";
    console.log("Attempted to load audio from:", audioUrl.value);
  } else {
    audioError.value = "音频加载失败，可能是文件路径无法访问或格式不支持";
  }
  isPlaying.value = false;
}

// 重试加载音频
function retryAudioLoad() {
  if (!audioPlayer.value) return;

  audioError.value = null;
  try {
    if (audioFilePath.value && audioUrl.value.startsWith("file://")) {
      if (window.electron) {
        window.electron
          .invoke("get-media-url", audioFilePath.value)
          .then((mediaUrl: string) => {
            if (mediaUrl) {
              audioUrl.value = mediaUrl;
              audioPlayer.value?.load();
            }
          })
          .catch((err: any) => {
            console.error("获取媒体URL失败", err);
            audioPlayer.value?.load();
          });
      } else {
        audioPlayer.value.load();
      }
    } else {
      audioPlayer.value.load();
    }
    toast.info("正在重新加载音频...");
  } catch (error) {
    console.error("Audio reload error:", error);
    audioError.value = "重新加载音频失败";
  }
}

// 停止音频播放
function stopAudio() {
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.currentTime = 0;
    isPlaying.value = false;
  }
}

// 监听 audioUrl 变化，重置错误状态
watch(audioUrl, () => {
  audioError.value = null;
});

// 确保模型数据已加载
if (projectsStore.voiceModels.length === 0) {
  projectsStore.loadVoiceModels();
}

// 处理本地文件路径，确保在Electron中正确加载
function formatPathForElectron(filePath: string): string {
  if (!filePath) return "";

  const encodedPath = filePath
    .replace(/\\/g, "/")
    .replace(/#/g, "%23")
    .replace(/\?/g, "%3F")
    .replace(/\s/g, "%20");

  return `file://${encodedPath}`;
}
</script>

<style scoped>
.audio-player-container {
  width: 100%;
}
.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}
</style>
