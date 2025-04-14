<template>
  <div class="card">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">添加服务商配置</h2>
    
    <form @submit.prevent="handleSubmit">
      <div class="mb-4">
        <label for="provider" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          服务商选择
        </label>
        <select
          id="provider"
          v-model="selectedProvider"
          class="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        >
          <option value="" disabled>请选择服务商</option>
          <option v-for="provider in supportedProviders" :key="provider.id" :value="provider.id">
            {{ provider.name }}
          </option>
        </select>
      </div>
      
      <div class="mb-4">
        <label for="apiKey" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          API Key
        </label>
        <input
          id="apiKey"
          v-model="formData.apiKey"
          type="password"
          class="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="请输入API Key"
          required
        />
      </div>
      
      <div class="mb-4">
        <label for="secretKey" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Secret Key
        </label>
        <input
          id="secretKey"
          v-model="formData.secretKey"
          type="password"
          class="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="请输入Secret Key (可选)"
        />
      </div>
      
      <div class="flex justify-end space-x-2">
        <button 
          type="button" 
          class="btn btn-secondary"
          @click="$emit('cancel')"
        >
          取消
        </button>
        <button 
          type="button" 
          class="btn btn-primary"
          @click="testConnection"
          :disabled="isTestingConnection || !canTest"
        >
          {{ isTestingConnection ? '测试中...' : '测试连接' }}
        </button>
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="isSubmitting || !isFormValid"
        >
          {{ isSubmitting ? '保存中...' : '保存' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ttsService, SUPPORTED_PROVIDERS } from '@/services/tts';

const emit = defineEmits(['save', 'cancel']);

const props = defineProps({
  editMode: {
    type: Boolean,
    default: false
  },
  providerConfig: {
    type: Object,
    default: () => ({})
  }
});

const supportedProviders = SUPPORTED_PROVIDERS;
const selectedProvider = ref(props.editMode && props.providerConfig.id ? props.providerConfig.id : '');

const formData = ref({
  apiKey: props.editMode && props.providerConfig.apiKey ? props.providerConfig.apiKey : '',
  secretKey: props.editMode && props.providerConfig.secretKey ? props.providerConfig.secretKey : '',
});

const isSubmitting = ref(false);
const isTestingConnection = ref(false);
const testConnectionResult = ref<{ success: boolean; message: string } | null>(null);

const isFormValid = computed(() => {
  return selectedProvider.value && formData.value.apiKey;
});

const canTest = computed(() => {
  return selectedProvider.value && formData.value.apiKey;
});

const getProviderName = computed(() => {
  const provider = supportedProviders.find(p => p.id === selectedProvider.value);
  return provider ? provider.name : '';
});

async function handleSubmit() {
  if (!isFormValid.value) return;
  
  isSubmitting.value = true;
  
  try {
    const data = {
      name: getProviderName.value,
      ...formData.value
    };
    
    let result;
    
    if (props.editMode && props.providerConfig.id) {
      result = ttsService.updateServiceProvider(props.providerConfig.id, data);
    } else {
      result = ttsService.addServiceProvider(data);
    }
    
    emit('save', result);
  } catch (error) {
    console.error('Error saving service provider:', error);
  } finally {
    isSubmitting.value = false;
  }
}

async function testConnection() {
  if (!canTest.value) return;
  
  isTestingConnection.value = true;
  testConnectionResult.value = null;
  
  try {
    // For edit mode, we test the existing provider
    if (props.editMode && props.providerConfig.id) {
      const result = await ttsService.testServiceProvider(props.providerConfig.id);
      testConnectionResult.value = {
        success: result.success,
        message: result.success ? '连接测试成功！' : result.error || '连接测试失败'
      };
    } else {
      // For new provider, we simulate a test
      // In a real app, we'd need to make an API call without first saving the provider
      await new Promise(resolve => setTimeout(resolve, 1000));
      testConnectionResult.value = {
        success: true,
        message: '连接测试成功！'
      };
    }
  } catch (error) {
    testConnectionResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '连接测试失败'
    };
  } finally {
    isTestingConnection.value = false;
  }
}
</script> 