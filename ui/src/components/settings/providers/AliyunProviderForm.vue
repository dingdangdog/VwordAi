<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      阿里云语音服务配置
    </h3>
    
    <form @submit.prevent="saveForm">
      <div class="space-y-4">
        
        <div>
          <label for="accessKeyId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Access Key ID <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="accessKeyId"
            v-model="form.accessKeyId"
            class="input w-full"
            placeholder="输入 Access Key ID"
            required
          />
        </div>
        
        <div>
          <label for="accessKeySecret" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Access Key Secret <span class="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="accessKeySecret"
            v-model="form.accessKeySecret"
            class="input w-full"
            placeholder="输入 Access Key Secret"
            required
          />
        </div>
        
        <div>
          <label for="regionId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            区域 <span class="text-red-500">*</span>
          </label>
          <select id="regionId" v-model="form.regionId" class="input w-full" required>
            <option value="">请选择区域</option>
            <option value="cn-hangzhou">华东1（杭州）</option>
            <option value="cn-shanghai">华东2（上海）</option>
            <option value="cn-qingdao">华北1（青岛）</option>
            <option value="cn-beijing">华北2（北京）</option>
            <option value="cn-zhangjiakou">华北3（张家口）</option>
            <option value="cn-huhehaote">华北5（呼和浩特）</option>
            <option value="cn-wulanchabu">华北6（乌兰察布）</option>
            <option value="cn-shenzhen">华南1（深圳）</option>
            <option value="cn-heyuan">华南2（河源）</option>
            <option value="cn-guangzhou">华南3（广州）</option>
            <option value="cn-chengdu">西南1（成都）</option>
            <option value="cn-hongkong">中国（香港）</option>
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
          {{ isSaving ? '保存中...' : '保存配置' }}
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
import { ref, reactive, onMounted, watch } from 'vue';
import type { AliyunServiceProviderConfig } from '@/types';
import { useToast } from 'vue-toastification';

const props = defineProps<{
  provider: AliyunServiceProviderConfig
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

// 创建表单数据的副本，避免直接修改props
const form = ref<AliyunServiceProviderConfig>({
  id: props.provider.id,
  name: props.provider.name,
  apiKey: props.provider.apiKey,
  secretKey: props.provider.secretKey,
  accessKeyId: props.provider.accessKeyId,
  accessKeySecret: props.provider.accessKeySecret,
  regionId: props.provider.regionId,
  appKey: props.provider.appKey,
  createdAt: props.provider.createdAt,
  updatedAt: props.provider.updatedAt
});

// 监听prop变化，更新表单
watch(
  () => props.provider,
  (newProvider) => {
    form.value = { ...newProvider };
  }
);

// 保存表单
async function saveForm() {
  if (!form.value.accessKeyId || !form.value.accessKeySecret || !form.value.regionId) {
    toast.error('请填写必填字段');
    return;
  }
  
  isSaving.value = true;
  
  try {
    // 确保apiKey和secretKey与阿里云特定字段保持同步
    const updatedProvider: AliyunServiceProviderConfig = {
      ...form.value,
      apiKey: form.value.accessKeyId, // 映射到统一的apiKey字段
      secretKey: form.value.accessKeySecret, // 映射到统一的secretKey字段
      updatedAt: new Date()
    };
    
    emit('save', updatedProvider);
    toast.success('服务商配置已保存');
  } catch (error) {
    console.error('保存服务商配置失败:', error);
    toast.error('保存失败: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    isSaving.value = false;
  }
}

// 测试连接
async function testConnection() {
  if (!form.value.accessKeyId || !form.value.accessKeySecret || !form.value.regionId) {
    toast.error('请先填写必填字段');
    return;
  }
  
  isTesting.value = true;
  testResult.value = null;
  
  try {
    // 这里应该实际调用阿里云API测试连接
    // 模拟一个测试结果
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = Math.random() > 0.3; // 随机测试结果，实际应该是真实的API调用
    testResult.value = {
      success,
      message: success ? '连接测试成功' : '连接测试失败，请检查配置信息'
    };
    
    emit('test', testResult.value);
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '连接测试出错'
    };
    emit('test', testResult.value);
  } finally {
    isTesting.value = false;
  }
}
</script> 