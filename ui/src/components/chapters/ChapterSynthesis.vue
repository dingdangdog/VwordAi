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
      <div class="mb-4">
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400"
              >服务商:</span
            >
            <span class="ml-2 text-gray-900 dark:text-white">{{
              getProviderName(chapter.settings.serviceProvider)
            }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400"
              >声音角色:</span
            >
            <span class="ml-2 text-gray-900 dark:text-white">{{
              getVoiceRoleName(chapter.settings.voice) || chapter.settings.voice
            }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">语速:</span>
            <span class="ml-2 text-gray-900 dark:text-white">{{
              chapter.settings.speed || 1
            }}</span>
          </div>
          <!-- <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">音调:</span>
              <span class="ml-2 text-gray-900 dark:text-white">{{ chapter.settings.pitch || 0 }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">音量:</span>
              <span class="ml-2 text-gray-900 dark:text-white">{{ chapter.settings.volume || 100 }}</span>
            </div> -->
          <div v-if="chapter.settings.emotion">
            <span class="text-sm text-gray-500 dark:text-gray-400">情感:</span>
            <span class="ml-2 text-gray-900 dark:text-white">{{
              getEmotionName(chapter.settings.emotion)
            }}</span>
          </div>
        </div>
      </div>

      <div v-if="synthesisStatus === 'idle'" class="flex justify-end">
        <button
          @click="synthesize"
          class="btn btn-primary flex justify-center items-center space-x-2"
          :disabled="!canSynthesize"
        >
          <SpeakerWaveIcon class="h-5 w-5 mr-1" />
          合成语音
        </button>
      </div>

      <div v-if="synthesisStatus === 'loading'" class="text-center py-4">
        <div
          class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"
        ></div>
        <p class="text-gray-600 dark:text-gray-400">正在合成...</p>
      </div>

      <div
        v-if="synthesisStatus === 'error'"
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

      <div v-if="synthesisStatus === 'success'" class="mt-4">
        <div class="bg-green-50 dark:bg-green-900/30 p-4 rounded-md mb-4">
          <div class="flex">
            <CheckCircleIcon
              class="h-5 w-5 text-green-500 dark:text-green-400 mr-2"
            />
            <p class="text-green-700 dark:text-green-400">合成成功！</p>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
          <div class="flex flex-col space-y-2">
            <div v-if="audioUrl" class="audio-player-container">
              <audio
                ref="audioPlayer"
                :src="audioUrl"
                class="w-full"
                @play="onPlay"
                @pause="onPause"
                @ended="onEnded"
                @error="onAudioError"
                controls
              >
                您的浏览器不支持音频播放。
              </audio>

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

              <div class="flex justify-between items-center mt-3">
                <div class="flex items-center">
                  <button
                    v-if="isPlaying"
                    @click="stopAudio"
                    class="btn btn-danger flex justify-center items-center"
                    title="停止播放"
                  >
                    <StopIcon class="h-5 w-5 mr-1" />
                    停止
                  </button>
                </div>

                <div class="flex justify-end space-x-2">
                  <button
                    @click="downloadAudio"
                    class="btn btn-secondary flex justify-center items-center space-x-2"
                    :disabled="!audioUrl"
                  >
                    <ArrowDownTrayIcon class="h-5 w-5 mr-1" />
                    下载
                  </button>
                  <button
                    @click="synthesize"
                    class="btn btn-primary flex justify-center items-center space-x-2"
                  >
                    <ArrowPathIcon class="h-5 w-5 mr-1" />
                    重新合成
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from "vue";
import {
  SpeakerWaveIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  StopIcon,
} from "@heroicons/vue/24/outline";
import { SUPPORTED_PROVIDERS } from "@/stores/settings";
import { ttsApi } from "@/utils/api";
import type { Chapter } from "@/types";
import { useToast } from "vue-toastification";
import { useProjectsStore } from "@/stores/projects";

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

const canSynthesize = computed(() => {
  return (
    props.chapter.text &&
    props.chapter.settings.serviceProvider &&
    props.chapter.settings.voice
  );
});

// 获取服务商名称
function getProviderName(providerId: string | null): string {
  if (!providerId) return "";

  const provider = SUPPORTED_PROVIDERS.find((p) => p.id === providerId);
  return provider ? provider.name : providerId;
}

// 获取语音角色名称
function getVoiceRoleName(roleId: string | null): string {
  if (!roleId) return "";

  // 使用projectsStore获取语音模型
  const model = projectsStore.getVoiceModelByCode(roleId);
  return model ? model.name : roleId;
}

// 获取情感名称
function getEmotionName(emotionId: string | null): string {
  if (!emotionId) return "";

  // 查找匹配的情感
  for (const model of projectsStore.voiceModels) {
    if (model.emotions) {
      const emotion = model.emotions.find((e) => e.code === emotionId);
      if (emotion) {
        return emotion.name;
      }
    }
  }
  return emotionId;
}

// 设置音频URL，确保正确处理本地文件路径
async function setupAudio(filePath: string) {
  audioFilePath.value = filePath;

  if (!filePath) {
    audioUrl.value = "";
    return;
  }

  try {
    // 直接通过主进程获取正确的媒体URL
    if (window.electron) {
      const mediaUrl = await window.electron.invoke("get-media-url", filePath);
      if (mediaUrl) {
        audioUrl.value = mediaUrl;
        return;
      }
    }
    // 回退到默认处理
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
    // 使用章节ID直接调用合成API
    const response = await ttsApi.synthesize(props.chapter.id);

    if (response.success && response.data) {
      // 设置音频URL
      await setupAudio(response.data.outputPath || "");

      synthesisStatus.value = "success";

      // Update chapter audio path in store if needed
      if (props.chapter.audioPath !== response.data.outputPath) {
        // This would typically be done by the server already
        // But we can update local state for consistency
        try {
          console.log(
            "Audio path updated on server:",
            response.data.outputPath
          );
          // We don't manually update the store as it should be handled by the server
          // The next time chapters are loaded, it will have the correct path
        } catch (e) {
          console.warn("Issue with audio path update:", e);
        }
      }
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

// 下载音频
function downloadAudio() {
  if (!audioUrl.value) return;

  try {
    // 创建一个临时的 a 元素来触发下载
    const a = document.createElement("a");
    a.href = audioUrl.value;
    a.download = `${props.chapter.name || "chapter"}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success("音频下载已开始");
  } catch (error) {
    console.error("Download error:", error);
    toast.error("下载失败，请重试");
  }
}

// 音频播放开始
function onPlay() {
  isPlaying.value = true;
  audioError.value = null;
}

// 音频播放暂停
function onPause() {
  isPlaying.value = false;
}

// 音频播放结束
function onEnded() {
  isPlaying.value = false;
}

// 音频加载错误
function onAudioError(event: Event) {
  const target = event.target as HTMLAudioElement;
  console.error("Audio error:", target.error);

  // 提供更具体的错误信息
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

  // 尝试重新加载音频文件
  try {
    // 尝试使用不同的协议重新加载
    if (audioFilePath.value && audioUrl.value.startsWith("file://")) {
      console.log("重试加载，使用原始文件路径");
      // 尝试通过主进程访问文件
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
            // 如果失败，回退到常规加载
            audioPlayer.value?.load();
          });
      } else {
        // 直接重新加载当前URL
        audioPlayer.value.load();
      }
    } else {
      // 简单重新加载
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

// 初始化 - 如果章节已有音频路径，则自动设置成功状态
if (props.chapter.audioPath) {
  synthesisStatus.value = "success";
  // 设置音频URL
  setupAudio(props.chapter.audioPath);
}

// 组件销毁时停止播放
onUnmounted(() => {
  if (isPlaying.value && audioPlayer.value) {
    audioPlayer.value.pause();
  }
});

// 确保模型数据已加载
if (projectsStore.voiceModels.length === 0) {
  projectsStore.loadVoiceModels();
}

// 处理本地文件路径，确保在Electron中正确加载
function formatPathForElectron(filePath: string): string {
  if (!filePath) return "";

  // 确保路径中特殊字符被正确编码
  const encodedPath = filePath
    .replace(/\\/g, "/")
    .replace(/#/g, "%23")
    .replace(/\?/g, "%3F")
    .replace(/\s/g, "%20");

  // 在Electron中，优先使用media:// 协议 (如果可用)，否则使用file://
  return `file://${encodedPath}`;
}
</script>

<style scoped>
.audio-player-container {
  width: 100%;
}
</style>
