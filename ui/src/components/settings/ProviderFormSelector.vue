<template>
  <div>
    <div v-if="!selectedProviderType">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        选择服务商类型
      </h3>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          v-for="provider in SUPPORTED_PROVIDERS"
          :key="provider.id"
          class="flex items-center p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
          @click="selectProviderType(provider.type)"
        >
          <CloudIcon class="h-6 w-6 text-blue-500 mr-3" />
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">{{ provider.name }}</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">配置{{ provider.name }}语音服务</p>
          </div>
        </button>
      </div>
      
      <div class="mt-6 flex justify-end">
        <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('cancel')"
        >
          取消
        </button>
      </div>
    </div>
    
    <AzureProviderForm 
      v-if="selectedProviderType === 'azure'"
      :provider="provider as AzureServiceProviderConfig"
      @save="saveProvider"
      @cancel="$emit('cancel')"
      @test="handleTestResult"
    />
    
    <AliyunProviderForm 
      v-else-if="selectedProviderType === 'aliyun'"
      :provider="provider as AliyunServiceProviderConfig"
      @save="saveProvider"
      @cancel="$emit('cancel')"
      @test="handleTestResult"
    />
    
    <!-- 为简化示例，这里使用现有组件代替 -->
    <AliyunProviderForm 
      v-else-if="selectedProviderType === 'tencent'"
      :provider="provider as AliyunServiceProviderConfig"
      @save="saveProvider"
      @cancel="$emit('cancel')"
      @test="handleTestResult"
    />
    
    <AzureProviderForm 
      v-else-if="selectedProviderType === 'baidu'"
      :provider="provider as AzureServiceProviderConfig"
      @save="saveProvider"
      @cancel="$emit('cancel')"
      @test="handleTestResult"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue';
import { CloudIcon } from '@heroicons/vue/24/outline';
import { SUPPORTED_PROVIDERS } from '@/stores/settings';
import type { 
  ServiceProviderType, 
  ServiceProviderConfig,
  AzureServiceProviderConfig,
  AliyunServiceProviderConfig,
} from '@/types';
import AzureProviderForm from './providers/AzureProviderForm.vue';
import AliyunProviderForm from './providers/AliyunProviderForm.vue';

const props = defineProps<{
  providerId?: string
  provider?: ServiceProviderConfig
}>();

const emit = defineEmits<{
  (e: 'save', provider: ServiceProviderConfig): void
  (e: 'cancel'): void
  (e: 'test', result: { success: boolean; message: string }): void
}>();

const selectedProviderType = ref<ServiceProviderType | null>(null);

// 当有现有服务商数据时，自动选择对应的表单类型
if (props.provider) {
  // 根据服务商名称判断类型
  const name = props.provider.name.toLowerCase();
  if (name.includes('azure') || name.includes('微软')) {
    selectedProviderType.value = 'azure';
  } else if (name.includes('aliyun') || name.includes('阿里')) {
    selectedProviderType.value = 'aliyun';
  } else if (name.includes('tencent') || name.includes('腾讯')) {
    selectedProviderType.value = 'tencent';
  } else if (name.includes('baidu') || name.includes('百度')) {
    selectedProviderType.value = 'baidu';
  }
}

// 选择服务商类型
function selectProviderType(type: ServiceProviderType) {
  selectedProviderType.value = type;
}

// 保存服务商配置
function saveProvider(provider: ServiceProviderConfig) {
  emit('save', provider);
}

// 处理测试结果
function handleTestResult(result: { success: boolean; message: string }) {
  emit('test', result);
}
</script> 