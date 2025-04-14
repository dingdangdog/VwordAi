<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">服务商配置</h2>
      <button @click="showAddForm = true" class="btn btn-primary flex items-center">
        <PlusIcon class="h-5 w-5 mr-1" />
        添加服务商
      </button>
    </div>

    <div v-if="providers.length === 0" class="text-center py-8">
      <div class="text-gray-500 dark:text-gray-400 mb-4">
        <ServerIcon class="h-12 w-12 mx-auto mb-2" />
        <p>暂无配置的服务商</p>
      </div>
      <button @click="showAddForm = true" class="btn btn-primary">
        添加服务商
      </button>
    </div>

    <div v-else class="space-y-4">
      <div v-for="provider in providers" :key="provider.id" class="card hover:shadow-lg transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {{ provider.name }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              添加于 {{ formatDate(provider.createdAt) }}
            </p>
          </div>
          <div class="flex space-x-2">
            <button 
              @click="editProvider(provider)" 
              class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              title="编辑"
            >
              <PencilSquareIcon class="h-5 w-5" />
            </button>
            <button 
              @click="confirmDelete(provider)" 
              class="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              title="删除"
            >
              <TrashIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div class="mt-4 grid grid-cols-2 gap-2">
          <div class="text-sm">
            <span class="text-gray-500 dark:text-gray-400">API Key:</span>
            <span class="ml-2 text-gray-900 dark:text-white">••••••••••••</span>
          </div>
          <div class="text-sm" v-if="provider.secretKey">
            <span class="text-gray-500 dark:text-gray-400">Secret Key:</span>
            <span class="ml-2 text-gray-900 dark:text-white">••••••••••••</span>
          </div>
        </div>
        
        <div class="mt-4">
          <button 
            @click="testConnection(provider.id)" 
            class="text-sm px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            :disabled="isTestingId === provider.id"
          >
            {{ isTestingId === provider.id ? '测试中...' : '测试连接' }}
          </button>
          <span 
            v-if="testResults[provider.id]" 
            class="ml-2 text-sm"
            :class="testResults[provider.id].success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            {{ testResults[provider.id].message }}
          </span>
        </div>
      </div>
    </div>

    <!-- Add/Edit Provider Modal -->
    <transition name="fade">
      <div v-if="showAddForm || showEditForm" class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="p-6">
            <ServiceProviderForm 
              :edit-mode="showEditForm"
              :provider-config="currentProvider"
              @save="saveProvider"
              @cancel="closeForm"
            />
          </div>
        </div>
      </div>
    </transition>
    
    <!-- Delete Confirmation Modal -->
    <transition name="fade">
      <div v-if="showDeleteConfirm" class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">确认删除</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6">
              确定要删除服务商 "{{ providerToDelete?.name }}" 的配置吗？此操作无法撤销。
            </p>
            <div class="flex justify-end space-x-2">
              <button 
                @click="showDeleteConfirm = false" 
                class="btn btn-secondary"
              >
                取消
              </button>
              <button 
                @click="deleteProvider" 
                class="btn btn-danger"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ttsService } from '@/services/tts';
import { PlusIcon, ServerIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline';
import ServiceProviderForm from './ServiceProviderForm.vue';
import type { ServiceProviderConfig } from '@/types';

const providers = ref<ServiceProviderConfig[]>([]);
const showAddForm = ref(false);
const showEditForm = ref(false);
const showDeleteConfirm = ref(false);
const currentProvider = ref<ServiceProviderConfig | null>(null);
const providerToDelete = ref<ServiceProviderConfig | null>(null);
const isTestingId = ref<string | null>(null);
const testResults = ref<Record<string, { success: boolean; message: string }>>({});

onMounted(() => {
  loadProviders();
});

function loadProviders() {
  providers.value = ttsService.getServiceProviders();
}

function closeForm() {
  showAddForm.value = false;
  showEditForm.value = false;
  currentProvider.value = null;
}

function editProvider(provider: ServiceProviderConfig) {
  currentProvider.value = provider;
  showEditForm.value = true;
}

function saveProvider(provider: ServiceProviderConfig) {
  loadProviders(); // Refresh the list
  closeForm();
}

function confirmDelete(provider: ServiceProviderConfig) {
  providerToDelete.value = provider;
  showDeleteConfirm.value = true;
}

function deleteProvider() {
  if (providerToDelete.value) {
    ttsService.deleteServiceProvider(providerToDelete.value.id);
    loadProviders();
    showDeleteConfirm.value = false;
    providerToDelete.value = null;
  }
}

async function testConnection(providerId: string) {
  isTestingId.value = providerId;
  
  try {
    const result = await ttsService.testServiceProvider(providerId);
    testResults.value[providerId] = {
      success: result.success,
      message: result.success ? '连接测试成功！' : result.error || '连接测试失败'
    };
  } catch (error) {
    testResults.value[providerId] = {
      success: false,
      message: error instanceof Error ? error.message : '连接测试失败'
    };
  } finally {
    isTestingId.value = null;
  }
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString();
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style> 