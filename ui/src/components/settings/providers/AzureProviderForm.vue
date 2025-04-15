<template>
  <div class="azure-provider-form">
    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
      微软 Azure TTS 配置
    </h3>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      配置微软 Azure 语音服务以使用 Azure
      TTS。请确保您已在Azure门户创建语音服务。
    </p>

    <form @submit.prevent="saveProvider" class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">配置名称</label>
        <input
          type="text"
          id="name"
          v-model="formData.name"
          class="input"
          placeholder="例如: 微软语音服务"
          required
        />
      </div>

      <div>
        <label for="apiKey" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API 密钥</label>
        <input
          type="text"
          id="apiKey"
          v-model="formData.apiKey"
          class="input"
          placeholder="输入您的 Azure 语音服务 API 密钥"
          required
        />
      </div>

      <div>
        <label for="region" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">区域</label>
        <select id="region" v-model="formData.region" class="input" required>
          <option value="">请选择区域</option>
          <option v-for="region in azureRegions" :key="region.value" :value="region.value">
            {{ region.label }}
          </option>
        </select>
      </div>

      <div>
        <label for="endpoint" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          自定义终结点 (可选)
        </label>
        <input
          type="text"
          id="endpoint"
          v-model="formData.endpoint"
          class="input"
          placeholder="例如: https://eastus.tts.speech.microsoft.com/"
        />
      </div>

      <div class="flex space-x-2 justify-end pt-4">
        <button
          type="button"
          @click="testConnection"
          class="btn btn-secondary"
          :disabled="isLoading"
        >
          测试连接
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="isLoading || !isValid"
        >
          保存配置
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watchEffect } from 'vue';
import { useToast } from 'vue-toastification';
import { useSettingsStore } from '@/stores/settings';
import { serviceProviderApi } from '@/utils/api';

const props = defineProps({
  provider: {
    type: Object,
    default: () => ({
      id: '',
      name: '',
      apiKey: '',
      region: '',
      endpoint: ''
    })
  }
});

const emit = defineEmits(['save', 'test']);
const toast = useToast();
const settingsStore = useSettingsStore();
const isLoading = ref(false);

// 表单数据
const formData = reactive({
  id: props.provider.id || '',
  name: props.provider.name || '',
  apiKey: props.provider.apiKey || '',
  region: props.provider.region || '',
  endpoint: props.provider.endpoint || '',
  type: 'azure'
});

// Azure 区域列表
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
  { value: 'germanywestcentral', label: '德国中西部' },
  { value: 'italynorth', label: '意大利北部' },
  { value: 'switzerlandnorth', label: '瑞士北部' },
  { value: 'uaenorth', label: '阿联酋北部' },
  { value: 'brazilsouth', label: '巴西南部' },
  { value: 'centraluseuap', label: '美国中部 (EUAP)' },
  { value: 'eastus2euap', label: '美国东部 2 (EUAP)' }
];

// 监听属性变化，更新表单数据
watchEffect(() => {
  formData.id = props.provider.id || '';
  formData.name = props.provider.name || '';
  formData.apiKey = props.provider.apiKey || '';
  formData.region = props.provider.region || '';
  formData.endpoint = props.provider.endpoint || '';
});

// 表单验证
const isValid = computed(() => {
  return !!formData.name && !!formData.apiKey && !!formData.region;
});

// 保存配置
async function saveProvider() {
  if (!isValid.value) return;
  
  isLoading.value = true;
  
  try {
    // 准备提交的数据
    const data = {
      id: formData.id,
      name: formData.name,
      type: 'azure',
      apiKey: formData.apiKey,
      apiSecret: '',  // Azure不需要secret
      region: formData.region,
      endpoint: formData.endpoint,
      enabled: true,
      config: {}
    };
    
    let response;
    
    // 创建或更新
    if (formData.id) {
      // 更新
      response = await serviceProviderApi.update(formData.id, data);
    } else {
      // 创建
      response = await serviceProviderApi.create(data);
    }
    
    if (response.success) {
      await settingsStore.loadServiceProviders();
      toast.success(`服务商配置已${formData.id ? '更新' : '创建'}`);
      emit('save', response.data);
    } else {
      toast.error(`保存失败: ${response.error}`);
    }
  } catch (error) {
    toast.error(`保存失败: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    isLoading.value = false;
  }
}

// 测试连接
async function testConnection() {
  if (!isValid.value) {
    toast.error('请先填写必填字段');
    return;
  }
  
  isLoading.value = true;
  
  try {
    // 如果配置尚未保存，先临时保存
    let testId = formData.id;
    
    if (!testId) {
      // 创建临时配置
      const tempData = {
        name: formData.name,
        type: 'azure',
        apiKey: formData.apiKey,
        apiSecret: '',
        region: formData.region,
        endpoint: formData.endpoint,
        enabled: true,
        config: {}
      };
      
      const createResponse = await serviceProviderApi.create(tempData);
      if (!createResponse.success) {
        throw new Error(`创建临时配置失败: ${createResponse.error}`);
      }
      
      testId = createResponse.data.id;
    }
    
    // 测试连接
    const response = await serviceProviderApi.testConnection(testId);
    
    // 删除临时配置
    if (!formData.id && testId) {
      await serviceProviderApi.delete(testId);
    }
    
    if (response.success) {
      toast.success('连接测试成功');
      emit('test', { success: true, message: '连接测试成功' });
    } else {
      toast.error(`连接测试失败: ${response.error}`);
      emit('test', { success: false, message: `连接测试失败: ${response.error}` });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    toast.error(`连接测试失败: ${errorMessage}`);
    emit('test', { success: false, message: `连接测试失败: ${errorMessage}` });
  } finally {
    isLoading.value = false;
  }
}
</script>
