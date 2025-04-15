<template>
  <div class="provider-setting">
    <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
      <!-- 左侧导航 -->
      <div class="w-full md:w-64 flex-shrink-0">
        <div class="card p-4">
          <ProviderMenu
            :providers="serviceProviders"
            :active-provider-id="activeProviderId"
            @select-provider="setActiveProvider"
            @add-provider="showAddForm = true"
            @edit-provider="openEditForm"
            @delete-provider="confirmDelete"
          />
        </div>
      </div>
      
      <!-- 右侧内容区 -->
      <div class="flex-1">
        <div v-if="activeProvider" class="card p-6">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ activeProvider.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                添加于 {{ formatDate(activeProvider.createdAt) }}
              </p>
            </div>
            <div class="flex space-x-2">
              <button
                @click="openEditForm(activeProvider.id)"
                class="btn btn-sm btn-secondary flex items-center"
                title="编辑"
              >
                <PencilSquareIcon class="h-4 w-4 mr-1" />
                编辑
              </button>
              <button
                @click="testConnection(activeProvider.id)"
                class="btn btn-sm btn-secondary flex items-center"
                :disabled="isTestingId === activeProvider.id"
              >
                <span v-if="isTestingId === activeProvider.id">测试中...</span>
                <span v-else>
                  <BeakerIcon class="h-4 w-4 mr-1" />
                  测试连接
                </span>
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div v-for="(value, key) in displayedProviderDetails" :key="key" class="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <div class="text-sm text-gray-500 dark:text-gray-400">{{ getFieldLabel(key) }}</div>
              <div class="text-gray-900 dark:text-white mt-1">
                {{ isSensitiveField(key) ? '••••••••••••' : value }}
              </div>
            </div>
          </div>
          
          <div v-if="testResults[activeProvider.id]" class="mt-4 p-4 rounded-md" 
            :class="testResults[activeProvider.id].success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
            <p :class="testResults[activeProvider.id].success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
              {{ testResults[activeProvider.id].message }}
            </p>
          </div>
        </div>
        
        <div v-else class="card p-6 flex flex-col items-center justify-center text-center">
          <div class="text-gray-500 dark:text-gray-400 mb-4">
            <ServerIcon class="h-16 w-16 mx-auto mb-2" />
            <p class="text-lg">暂无选中的服务商</p>
            <p class="text-sm">请从左侧列表选择一个服务商或添加新的服务商</p>
          </div>
          <button @click="showAddForm = true" class="btn btn-primary">
            添加服务商
          </button>
        </div>
      </div>
    </div>
    
    <!-- 添加/编辑服务商弹窗 -->
    <transition name="fade">
      <div
        v-if="showAddForm || showEditForm"
        class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 min-w-[30rem] max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ showEditForm ? '编辑服务商' : '添加服务商' }}
          </h3>
          
          <ProviderFormSelector
            :provider="currentProvider"
            @save="saveProvider"
            @cancel="closeForm"
            @test="updateTestResult"
          />
        </div>
      </div>
    </transition>
    
    <!-- 删除确认弹窗 -->
    <transition name="fade">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        >
          <h3
            class="text-lg font-semibold text-gray-900 dark:text-white mb-4"
          >
            确认删除
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            确定要删除服务商 "{{ providerToDelete?.name }}"
            的配置吗？此操作无法撤销。
          </p>
          <div class="flex justify-end space-x-2">
            <button
              @click="showDeleteConfirm = false"
              class="btn btn-secondary"
            >
              取消
            </button>
            <button @click="deleteProvider" class="btn btn-danger">
              删除
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { useSettingsStore } from "@/stores/settings";
import {
  PencilSquareIcon,
  TrashIcon,
  ServerIcon,
  BeakerIcon
} from "@heroicons/vue/24/outline";
import ProviderMenu from "./ProviderMenu.vue";
import ProviderFormSelector from "./ProviderFormSelector.vue";
import type { ServiceProviderConfig } from "@/types";

const toast = useToast();
const settingsStore = useSettingsStore();

// 服务商列表
const serviceProviders = computed(() => settingsStore.serviceProviders);
const activeProviderId = computed(() => settingsStore.activeProviderId);
const activeProvider = computed(() => settingsStore.activeProvider);

// 弹窗控制
const showAddForm = ref(false);
const showEditForm = ref(false);
const showDeleteConfirm = ref(false);
const currentProvider = ref<ServiceProviderConfig | undefined>(undefined);
const providerToDelete = ref<ServiceProviderConfig | null>(null);

// 测试相关
const isTestingId = ref<string | null>(null);
const testResults = ref<Record<string, { success: boolean; message: string }>>(
  {}
);

// 初始化
onMounted(() => {
  settingsStore.loadServiceProviders();
});

// 根据字段名获取字段标签
function getFieldLabel(key: string): string {
  const labelMap: Record<string, string> = {
    id: '服务商 ID',
    name: '服务商名称',
    apiKey: 'API Key',
    secretKey: 'Secret Key',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    region: '区域',
    endpoint: '终端节点',
    regionId: '地域 ID',
    accessKeyId: 'Access Key ID',
    accessKeySecret: 'Access Key Secret',
    appKey: '应用 ID',
    appId: '应用 ID',
    secretId: 'Secret ID'
  };
  
  return labelMap[key] || key;
}

// 判断是否为敏感字段
function isSensitiveField(key: string): boolean {
  return ['apiKey', 'secretKey', 'accessKeyId', 'accessKeySecret', 'secretId'].includes(key);
}

// 根据服务商获取显示的字段
const displayedProviderDetails = computed(() => {
  if (!activeProvider.value) return {};
  
  // 过滤掉不需要显示的字段
  const provider = { ...activeProvider.value };
  const excludedFields = ['id', 'updatedAt'];
  
  const result: Record<string, any> = {};
  Object.keys(provider).forEach(key => {
    if (!excludedFields.includes(key)) {
      result[key] = provider[key];
    }
  });
  
  // 格式化日期类型
  if (result.createdAt) {
    result.createdAt = formatDate(result.createdAt);
  }
  
  return result;
});

// 设置当前选中的服务商
function setActiveProvider(id: string) {
  settingsStore.setActiveProvider(id);
}

// 打开编辑表单
function openEditForm(id: string) {
  const provider = settingsStore.getProviderById(id);
  if (provider) {
    currentProvider.value = provider;
    showEditForm.value = true;
  }
}

// 关闭表单
function closeForm() {
  showAddForm.value = false;
  showEditForm.value = false;
  currentProvider.value = undefined;
}

// 确认删除
function confirmDelete(id: string) {
  const provider = settingsStore.getProviderById(id);
  if (provider) {
    providerToDelete.value = provider;
    showDeleteConfirm.value = true;
  }
}

// 保存服务商
function saveProvider(provider: ServiceProviderConfig) {
  try {
    if (showEditForm.value) {
      // 更新
      settingsStore.updateServiceProvider(provider.id, provider);
      toast.success("服务商更新成功");
    } else {
      // 新增
      settingsStore.addServiceProvider(provider);
      toast.success("服务商添加成功");
    }
    closeForm();
  } catch (error) {
    toast.error(`操作失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 删除服务商
function deleteProvider() {
  if (providerToDelete.value) {
    const success = settingsStore.deleteServiceProvider(providerToDelete.value.id);
    if (success) {
      toast.success("服务商已删除");
    } else {
      toast.error("删除失败");
    }
    showDeleteConfirm.value = false;
    providerToDelete.value = null;
  }
}

// 测试连接
async function testConnection(providerId: string) {
  isTestingId.value = providerId;

  try {
    // 这里应该调用实际的测试接口
    // 由于是演示，我们模拟一个测试结果
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = true; // 模拟测试成功
    testResults.value[providerId] = {
      success,
      message: success ? "连接测试成功！" : "连接测试失败，请检查配置"
    };
  } catch (error) {
    testResults.value[providerId] = {
      success: false,
      message: error instanceof Error ? error.message : "连接测试失败"
    };
  } finally {
    isTestingId.value = null;
  }
}

// 更新测试结果
function updateTestResult(result: { success: boolean; message: string }) {
  if (currentProvider.value) {
    testResults.value[currentProvider.value.id] = result;
  }
}

// 格式化日期
function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 