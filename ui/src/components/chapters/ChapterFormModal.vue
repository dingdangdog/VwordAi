<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="close"></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
              {{ title }}
            </h3>
            <button @click="close" class="text-gray-400 hover:text-gray-500 focus:outline-none">
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>
          
          <form @submit.prevent="submitForm">
            <div class="mb-4">
              <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">章节名称</label>
              <input
                type="text"
                id="name"
                v-model="form.name"
                class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="请输入章节名称"
                required
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-600 dark:text-red-500">{{ errors.name }}</p>
            </div>
            
            <div class="mb-4">
              <label for="text" class="block text-sm font-medium text-gray-700 dark:text-gray-300">章节文本内容</label>
              <textarea
                id="text"
                v-model="form.text"
                rows="8"
                class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="请输入需要转换为语音的文本内容"
              ></textarea>
            </div>
            
            <div class="mb-4">
              <div class="flex justify-between items-center mb-2">
                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">章节语音设置</h4>
                <button
                  type="button"
                  class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  @click="showVoiceSettings = !showVoiceSettings"
                >
                  {{ showVoiceSettings ? '收起' : '展开' }}
                </button>
              </div>
              
              <div v-if="showVoiceSettings" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <div class="grid md:grid-cols-2 gap-4">
                  <div>
                    <label for="serviceProvider" class="block text-sm font-medium text-gray-700 dark:text-gray-300">服务商</label>
                    <select
                      id="serviceProvider"
                      v-model="form.settings.serviceProvider"
                      class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">未选择</option>
                      <option v-for="provider in serviceProviders" :key="provider.id" :value="provider.id">
                        {{ provider.name }}
                      </option>
                    </select>
                  </div>
                  
                  <div>
                    <label for="voiceRole" class="block text-sm font-medium text-gray-700 dark:text-gray-300">声音角色</label>
                    <select
                      id="voiceRole"
                      v-model="form.settings.voiceRole"
                      class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      :disabled="!form.settings.serviceProvider"
                    >
                      <option value="">未选择</option>
                      <option v-for="role in voiceRoles" :key="role.id" :value="role.id">
                        {{ role.name }}
                      </option>
                    </select>
                  </div>
                  
                  <div>
                    <label for="speed" class="block text-sm font-medium text-gray-700 dark:text-gray-300">语速 ({{ form.settings.speed || 1 }})</label>
                    <input
                      type="range"
                      id="speed"
                      v-model.number="form.settings.speed"
                      min="0.5"
                      max="2"
                      step="0.1"
                      class="w-full mt-1"
                    />
                  </div>
                  
                  <div>
                    <label for="pitch" class="block text-sm font-medium text-gray-700 dark:text-gray-300">音调 ({{ form.settings.pitch || 0 }})</label>
                    <input
                      type="range"
                      id="pitch"
                      v-model.number="form.settings.pitch"
                      min="-10"
                      max="10"
                      step="1"
                      class="w-full mt-1"
                    />
                  </div>
                  
                  <div>
                    <label for="volume" class="block text-sm font-medium text-gray-700 dark:text-gray-300">音量 ({{ form.settings.volume || 100 }})</label>
                    <input
                      type="range"
                      id="volume"
                      v-model.number="form.settings.volume"
                      min="0"
                      max="100"
                      step="1"
                      class="w-full mt-1"
                    />
                  </div>
                  
                  <div>
                    <label for="emotion" class="block text-sm font-medium text-gray-700 dark:text-gray-300">情感</label>
                    <select
                      id="emotion"
                      v-model="form.settings.emotion"
                      class="mt-1 input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      :disabled="!form.settings.serviceProvider"
                    >
                      <option value="">未选择</option>
                      <option v-for="emotion in emotions" :key="emotion.id" :value="emotion.id">
                        {{ emotion.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                class="btn btn-primary w-full sm:w-auto sm:ml-3"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" class="mr-2">处理中...</span>
                {{ submitText }}
              </button>
              <button
                type="button"
                class="btn btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
                @click="close"
                :disabled="isSubmitting"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { TTSSettings } from '@/types';

// Mock service providers for now (will be replaced with actual data from API)
const serviceProviders = ref([
  { id: 'aliyun', name: '阿里云' },
  { id: 'tencent', name: '腾讯云' },
  { id: 'baidu', name: '百度智能云' },
  { id: 'azure', name: 'Azure Speech Service' }
]);

// Mock voice roles and emotions (will be dynamically loaded based on selected provider)
const voiceRoles = ref([
  { id: 'role1', name: '声音角色 1' },
  { id: 'role2', name: '声音角色 2' },
  { id: 'role3', name: '声音角色 3' }
]);

const emotions = ref([
  { id: 'neutral', name: '平静' },
  { id: 'happy', name: '快乐' },
  { id: 'sad', name: '伤感' }
]);

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  submitText: {
    type: String,
    default: '提交'
  },
  initialData: {
    type: Object,
    default: () => ({
      name: '',
      text: '',
      settings: {
        speed: 1,
        pitch: 0,
        volume: 100
      }
    })
  }
});

const emit = defineEmits(['close', 'submit']);

const isSubmitting = ref(false);
const showVoiceSettings = ref(false);
const errors = reactive({
  name: ''
});

// Initialize form with props or default values
const form = reactive({
  name: '',
  text: '',
  settings: {
    serviceProvider: '',
    voiceRole: '',
    speed: 1,
    pitch: 0,
    volume: 100,
    emotion: ''
  } as TTSSettings
});

// Watch for changes in initialData and update form
watchEffect(() => {
  if (props.initialData) {
    form.name = props.initialData.name || '';
    form.text = props.initialData.text || '';
    form.settings = {
      serviceProvider: props.initialData.settings?.serviceProvider || '',
      voiceRole: props.initialData.settings?.voiceRole || '',
      speed: props.initialData.settings?.speed !== undefined ? props.initialData.settings.speed : 1,
      pitch: props.initialData.settings?.pitch !== undefined ? props.initialData.settings.pitch : 0,
      volume: props.initialData.settings?.volume !== undefined ? props.initialData.settings.volume : 100,
      emotion: props.initialData.settings?.emotion || ''
    };

    // Show voice settings panel if there are settings
    if (
      props.initialData.settings?.serviceProvider ||
      props.initialData.settings?.voiceRole ||
      props.initialData.settings?.emotion
    ) {
      showVoiceSettings.value = true;
    }
  }
});

function close() {
  emit('close');
}

function validateForm() {
  let isValid = true;
  errors.name = '';

  if (!form.name.trim()) {
    errors.name = '章节名称不能为空';
    isValid = false;
  }

  return isValid;
}

function submitForm() {
  if (!validateForm()) return;

  isSubmitting.value = true;

  try {
    // Prepare data for submission
    const chapterData = {
      name: form.name.trim(),
      text: form.text.trim(),
      settings: { ...form.settings }
    };

    // Emit submit event with form data
    emit('submit', chapterData);
  } catch (error) {
    console.error('Form submission error:', error);
  } finally {
    isSubmitting.value = false;
  }
}
</script> 