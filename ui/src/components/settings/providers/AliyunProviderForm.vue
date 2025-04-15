<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      阿里云语音服务配置
    </h3>
    
    <form @submit.prevent="saveProvider">
      <div class="space-y-4">
        <div>
          <label for="accessKeyId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Access Key ID <span class="text-red-500">*</span>
          </label>
          <input
            id="accessKeyId"
            v-model="form.accessKeyId"
            type="password"
            class="input w-full"
            placeholder="请输入 Access Key ID"
            required
          />
        </div>
        
        <div>
          <label for="accessKeySecret" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Access Key Secret <span class="text-red-500">*</span>
          </label>
          <input
            id="accessKeySecret"
            v-model="form.accessKeySecret"
            type="password"
            class="input w-full"
            placeholder="请输入 Access Key Secret"
            required
          />
        </div>
        
        <div>
          <label for="regionId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            地域 ID <span class="text-red-500">*</span>
          </label>
          <select
            id="regionId"
            v-model="form.regionId"
            class="input w-full"
            required
          >
            <option value="" disabled>请选择地域</option>
            <option v-for="region in aliyunRegions" :key="region.value" :value="region.value">
              {{ region.label }}
            </option>
          </select>
        </div>
        
        <div>
          <label for="appKey" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            应用 ID (AppKey) (可选)
          </label>
          <input
            id="appKey"
            v-model="form.appKey"
            type="text"
            class="input w-full"
            placeholder="语音服务应用 ID，某些服务需要"
          />
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
import type { AliyunServiceProviderConfig } from '@/types';
import { useToast } from 'vue-toastification';

const props = defineProps<{
  provider?: AliyunServiceProviderConfig
}>();

const emit = defineEmits<{
  (e: 'save', provider: AliyunServiceProviderConfig): void
  (e: 'cancel'): void
  (e: 'test', result: { success: boolean; message: string }): void
}>();

const toast = useToast();
const isSaving = ref(false);
const isTesting = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

const aliyunRegions = [
  { value: 'cn-hangzhou', label: '华东 1 (杭州)' },
  { value: 'cn-shanghai', label: '华东 2 (上海)' },
  { value: 'cn-qingdao', label: '华北 1 (青岛)' },
  { value: 'cn-beijing', label: '华北 2 (北京)' },
  { value: 'cn-zhangjiakou', label: '华北 3 (张家口)' },
  { value: 'cn-huhehaote', label: '华北 5 (呼和浩特)' },
  { value: 'cn-wulanchabu', label: '华北 6 (乌兰察布)' },
  { value: 'cn-shenzhen', label: '华南 1 (深圳)' },
  { value: 'cn-heyuan', label: '华南 2 (河源)' },
  { value: 'cn-guangzhou', label: '华南 3 (广州)' },
  { value: 'cn-chengdu', label: '西南 1 (成都)' },
  { value: 'cn-hongkong', label: '中国香港' },
];

const form = reactive<{
  accessKeyId: string;
  accessKeySecret: string;
  regionId: string;
  appKey?: string;
}>({
  accessKeyId: '',
  accessKeySecret: '',
  regionId: '',
  appKey: '',
});

// 初始化表单
onMounted(() => {
  if (props.provider) {
    form.accessKeyId = props.provider.accessKeyId || '';
    form.accessKeySecret = props.provider.accessKeySecret || '';
    form.regionId = props.provider.regionId || '';
    form.appKey = props.provider.appKey || '';
  }
});

// 保存配置
async function saveProvider() {
  if (!form.accessKeyId || !form.accessKeySecret || !form.regionId) {
    toast.error('请填写必填字段');
    return;
  }
  
  isSaving.value = true;
  
  try {
    const providerData: AliyunServiceProviderConfig = {
      id: props.provider?.id || crypto.randomUUID(),
      name: '阿里云语音服务',
      apiKey: form.accessKeyId, // 映射到统一的 apiKey 字段
      secretKey: form.accessKeySecret, // 映射到统一的 secretKey 字段
      accessKeyId: form.accessKeyId,
      accessKeySecret: form.accessKeySecret,
      regionId: form.regionId,
      createdAt: props.provider?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    if (form.appKey) {
      providerData.appKey = form.appKey;
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
  if (!form.accessKeyId || !form.accessKeySecret || !form.regionId) {
    toast.error('请先填写必填字段');
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