<template>
  <div class="flex flex-col space-y-4">
    <div class="card hover:shadow-lg transition-shadow">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">语音合成</h3>
      
      <div v-if="!chapter.settings.serviceProvider || !chapter.settings.voiceRole" class="text-center py-6">
        <p class="text-gray-600 dark:text-gray-400">缺少语音配置</p>
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
              <span class="text-sm text-gray-500 dark:text-gray-400">服务商:</span>
              <span class="ml-2 text-gray-900 dark:text-white">{{ getProviderName(chapter.settings.serviceProvider) }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">声音角色:</span>
              <span class="ml-2 text-gray-900 dark:text-white">{{ getVoiceRoleName(chapter.settings.voiceRole) || chapter.settings.voiceRole }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">语速:</span>
              <span class="ml-2 text-gray-900 dark:text-white">{{ chapter.settings.speed || 1 }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">音调:</span>
              <span class="ml-2 text-gray-900 dark:text-white">{{ chapter.settings.pitch || 0 }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">音量:</span>
              <span class="ml-2 text-gray-900 dark:text-white">{{ chapter.settings.volume || 100 }}</span>
            </div>
            <div v-if="chapter.settings.emotion">
              <span class="text-sm text-gray-500 dark:text-gray-400">情感:</span>
              <span class="ml-2 text-gray-900 dark:text-white">{{ chapter.settings.emotion }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="synthesisStatus === 'idle'" class="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
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
          <div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p class="text-gray-600 dark:text-gray-400">正在合成...</p>
        </div>
        
        <div v-if="synthesisStatus === 'error'" class="bg-red-50 dark:bg-red-900/30 p-4 rounded-md mt-4">
          <div class="flex">
            <ExclamationCircleIcon class="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
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
              <CheckCircleIcon class="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
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
                <source :src="audioUrl" type="audio/mp3">
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
                <button 
                  @click="synthesize" 
                  class="btn btn-primary"
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  SpeakerWaveIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon, 
  ArrowDownTrayIcon,
  ArrowPathIcon 
} from '@heroicons/vue/24/outline';
import { ttsService, SUPPORTED_PROVIDERS } from '@/services/tts';
import type { Chapter } from '@/types';
import { useToast } from 'vue-toastification';

const props = defineProps<{
  chapter: Chapter;
}>();

const emit = defineEmits(['edit-settings']);
const toast = useToast();

const synthesisStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const errorMessage = ref('');
const audioUrl = ref('');
const audioFilePath = ref('');
const isPlaying = ref(false);

const canSynthesize = computed(() => {
  return (
    props.chapter.text && 
    props.chapter.settings.serviceProvider && 
    props.chapter.settings.voiceRole
  );
});

function getProviderName(providerId: string | undefined): string {
  if (!providerId) return '';
  
  const provider = SUPPORTED_PROVIDERS.find(p => p.id === providerId);
  return provider ? provider.name : providerId;
}

function getVoiceRoleName(roleId: string | undefined): string {
  // This would ideally come from a cache or state that stores voice roles
  // For now, just return the ID
  return roleId || '';
}

async function synthesize() {
  if (!canSynthesize.value) {
    toast.error('无法合成: 请确保章节文本和语音设置已完成');
    return;
  }
  
  synthesisStatus.value = 'loading';
  errorMessage.value = '';
  
  try {
    const result = await ttsService.synthesize({
      text: props.chapter.text,
      settings: props.chapter.settings
    });
    
    if (result.success && result.data) {
      audioUrl.value = result.data.audioUrl || '';
      audioFilePath.value = result.data.audioFilePath || '';
      synthesisStatus.value = 'success';
    } else {
      synthesisStatus.value = 'error';
      errorMessage.value = result.error || '合成失败，请稍后重试';
    }
  } catch (error) {
    synthesisStatus.value = 'error';
    errorMessage.value = error instanceof Error ? error.message : '合成过程中发生错误';
  }
}

function downloadAudio() {
  if (!audioUrl.value) return;
  
  // Create a temporary anchor element to trigger download
  const a = document.createElement('a');
  a.href = audioUrl.value;
  a.download = `${props.chapter.name || 'chapter'}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  toast.success('音频下载已开始');
}

function onPlay() {
  isPlaying.value = true;
}

function onPause() {
  isPlaying.value = false;
}
</script> 