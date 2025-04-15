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

      <div
        v-if="synthesisStatus === 'idle'"
        class="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2"
      >
        <button
          @click="synthesize"
          class="btn btn-primary"
          :disabled="!canSynthesize"
        >
          <SpeakerWaveIcon class="h-5 w-5 mr-2" />
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
            <audio
              v-if="audioUrl"
              controls
              class="w-full"
              @play="onPlay"
              @pause="onPause"
            >
              <source :src="audioUrl" type="audio/mp3" />
              您的浏览器不支持音频播放。
            </audio>

            <div class="flex justify-end space-x-2">
              <button
                @click="downloadAudio"
                class="btn btn-secondary"
                :disabled="!audioUrl"
              >
                <ArrowDownTrayIcon class="h-5 w-5 mr-1" />
                下载
              </button>
              <button @click="synthesize" class="btn btn-primary">
                <ArrowPathIcon class="h-5 w-5 mr-1" />
                重新合成
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  SpeakerWaveIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
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
      const emotion = model.emotions.find(e => e.code === emotionId);
      if (emotion) {
        return emotion.name;
      }
    }
  }
  return emotionId;
}

// 合成语音
async function synthesize() {
  if (!canSynthesize.value) {
    toast.error("无法合成: 请确保章节文本和语音设置已完成");
    return;
  }

  synthesisStatus.value = "loading";
  errorMessage.value = "";

  try {
    // 使用章节ID直接调用合成API
    const response = await ttsApi.synthesize(props.chapter.id);

    if (response.success && response.data) {
      audioUrl.value = response.data.audioUrl || "";
      audioFilePath.value = response.data.outputPath || "";
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

// 下载音频
function downloadAudio() {
  if (!audioUrl.value) return;

  // 创建一个临时的 a 元素来触发下载
  const a = document.createElement("a");
  a.href = audioUrl.value;
  a.download = `${props.chapter.name || "chapter"}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  toast.success("音频下载已开始");
}

// 音频播放开始
function onPlay() {
  isPlaying.value = true;
}

// 音频播放暂停
function onPause() {
  isPlaying.value = false;
}

// 确保模型数据已加载
if (projectsStore.voiceModels.length === 0) {
  projectsStore.loadVoiceModels();
}
</script>
