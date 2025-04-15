<template>
  <div class="provider-menu">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        服务商列表
      </h3>
      <button
        @click="$emit('add-provider')"
        class="btn btn-sm btn-primary flex items-center"
        title="添加服务商"
      >
        <PlusIcon class="h-4 w-4" />
      </button>
    </div>
    
    <div v-if="providers.length === 0" class="text-center py-8">
      <div class="text-gray-500 dark:text-gray-400 mb-4">
        <ServerIcon class="h-12 w-12 mx-auto mb-2" />
        <p>暂无配置的服务商</p>
      </div>
      <button @click="$emit('add-provider')" class="btn btn-primary">
        添加服务商
      </button>
    </div>
    
    <ul v-else class="space-y-1 mt-2">
      <li v-for="provider in providers" :key="provider.id">
        <button
          class="w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-left"
          :class="activeProviderId === provider.id ? 
            'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
            'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'"
          @click="$emit('select-provider', provider.id)"
        >
          <div class="flex items-center">
            <component 
              :is="getProviderIcon(provider.name)" 
              class="h-5 w-5 mr-2" 
              :class="activeProviderId === provider.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'"
            />
            <span class="truncate">{{ provider.name }}</span>
          </div>
          
          <div class="flex space-x-1">
            <button
              @click.stop="$emit('edit-provider', provider.id)"
              class="p-1 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 rounded"
              title="编辑"
            >
              <PencilSquareIcon class="h-4 w-4" />
            </button>
            <button
              @click.stop="$emit('delete-provider', provider.id)"
              class="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded"
              title="删除"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { 
  PlusIcon, 
  ServerIcon, 
  PencilSquareIcon,
  TrashIcon,
  CloudIcon,
  BeakerIcon
} from '@heroicons/vue/24/outline';
import type { ServiceProviderConfig } from '@/types';

const props = defineProps<{
  providers: ServiceProviderConfig[]
  activeProviderId: string | null
}>();

const emit = defineEmits<{
  (e: 'select-provider', id: string): void
  (e: 'add-provider'): void
  (e: 'edit-provider', id: string): void
  (e: 'delete-provider', id: string): void
}>();

// 根据服务商名称返回对应的图标组件
function getProviderIcon(name: string) {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('azure') || lowerName.includes('微软')) {
    return CloudIcon;
  } else if (lowerName.includes('ali') || lowerName.includes('阿里')) {
    return CloudIcon;
  } else if (lowerName.includes('tencent') || lowerName.includes('腾讯')) {
    return CloudIcon;
  } else if (lowerName.includes('baidu') || lowerName.includes('百度')) {
    return CloudIcon;
  }
  
  return BeakerIcon;
}
</script>

<style scoped>
/* 确保按钮点击不会改变布局 */
button {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
</style> 