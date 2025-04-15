<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      微软 Azure TTS 配置
    </h3>
    
    <form @submit.prevent="saveProvider">
      <div class="space-y-4">
        <div>
          <label for="apiKey" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            API Key <span class="text-red-500">*</span>
          </label>
          <input
            id="apiKey"
            v-model="form.apiKey"
            type="password"
            class="input w-full"
            placeholder="请输入 Azure Speech API Key"
            required
          />
        </div>
        
        <div>
          <label for="region" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            区域 <span class="text-red-500">*</span>
          </label>
          <select
            id="region"
            v-model="form.region"
            class="input w-full"
            required
          >
            <option value="" disabled>请选择区域</option>
            <option v-for="region in azureRegions" :key="region.value" :value="region.value">
              {{ region.label }}
            </option>
          </select>
        </div>
        
        <div>
          <label for="endpoint" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            终端节点 (可选)
          </label>
          <input
            id="endpoint"
            v-model="form.endpoint"
            type="text"
            class="input w-full"
            placeholder="例如: https://yourresource.api.cognitive.microsoft.com/sts/v1.0/issuetoken"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            如果不填写，将使用默认终端节点
          </p>
        </div>
      </div>
      
      <div class="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('cancel')"
        >
          取消
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="testConnection"
          :disabled="isTesting"
        >
          {{ isTesting ? '测试中...' : '测试连接' }}
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="isSaving"
        >
          {{ isSaving ? '保存中...' : '保存' }}
        </button>
      </div>
    </form>
    
    <div v-if="testResult" class="mt-4 p-3 rounded-md" :class="testResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
      <p :class="testResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
        {{ testResult.message }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import type { AzureServiceProviderConfig } from '@/types';
import { useToast } from 'vue-toastification';

const props = defineProps<{
  provider?: AzureServiceProviderConfig
}>();

const emit = defineEmits<{
  (e: 'save', provider: AzureServiceProviderConfig): void
  (e: 'cancel'): void
  (e: 'test', result: { success: boolean; message: string }): void
}>();

const toast = useToast();
const isSaving = ref(false);
const isTesting = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

const azureRegions = [
  { value: 'eastus', label: '美国东部' },
  { value: 'eastus2', label: '美国东部 2' },
  { value: 'southcentralus', label: '美国中南部' },
  { value: 'westus2', label: '美国西部 2' },
  { value: 'westus3', label: '美国西部 3' },
  { value: 'australiaeast', label: '澳大利亚东部' },
  { value: 'southeastasia', label: '东南亚' },
  { value: 'northeurope', label: '北欧' },
  { value: 'uksouth', label: '英国南部' },
  { value: 'westeurope', label: '西欧' },
  { value: 'centralus', label: '美国中部' },
  { value: 'northcentralus', label: '美国中北部' },
  { value: 'westus', label: '美国西部' },
  { value: 'southafricanorth', label: '南非北部' },
  { value: 'centralindia', label: '印度中部' },
  { value: 'eastasia', label: '东亚' },
  { value: 'japaneast', label: '日本东部' },
  { value: 'japanwest', label: '日本西部' },
  { value: 'koreacentral', label: '韩国中部' },
  { value: 'canadacentral', label: '加拿大中部' },
  { value: 'francecentral', label: '法国中部' },
  { value: 'germanywestcentral', label: '德国西中部' },
  { value: 'italynorth', label: '意大利北部' },
  { value: 'uaenorth', label: '阿联酋北部' },
  { value: 'switzerlandnorth', label: '瑞士北部' },
  { value: 'brazilsouth', label: '巴西南部' },
];

const form = reactive<{
  apiKey: string;
  region: string;
  endpoint?: string;
}>({
  apiKey: '',
  region: '',
  endpoint: '',
});

// 初始化表单
onMounted(() => {
  if (props.provider) {
    form.apiKey = props.provider.apiKey || '';
    form.region = props.provider.region || '';
    form.endpoint = props.provider.endpoint || '';
  }
});

// 保存配置
async function saveProvider() {
  if (!form.apiKey || !form.region) {
    toast.error('请填写必填字段');
    return;
  }
  
  isSaving.value = true;
  
  try {
    const providerData: AzureServiceProviderConfig = {
      id: props.provider?.id || crypto.randomUUID(),
      name: '微软 Azure TTS',
      apiKey: form.apiKey,
      region: form.region,
      createdAt: props.provider?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    if (form.endpoint) {
      providerData.endpoint = form.endpoint;
    }
    
    emit('save', providerData);
  } catch (error) {
    console.error('保存服务商配置失败:', error);
    toast.error('保存服务商配置失败');
  } finally {
    isSaving.value = false;
  }
}

// 测试连接
async function testConnection() {
  if (!form.apiKey || !form.region) {
    toast.error('请先填写 API Key 和区域');
    return;
  }
  
  isTesting.value = true;
  testResult.value = null;
  
  try {
    // 这里应该调用实际的测试接口
    // 由于是演示，我们模拟一个测试结果
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = true; // 模拟测试成功
    testResult.value = {
      success,
      message: success ? '连接测试成功！' : '连接测试失败，请检查配置'
    };
    
    emit('test', testResult.value);
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '连接测试失败'
    };
    emit('test', testResult.value);
  } finally {
    isTesting.value = false;
  }
}
</script> 