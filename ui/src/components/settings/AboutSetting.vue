<template>
  <div class="about-setting card p-2 m-2">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      关于
    </h2>
    
    <div class="flex flex-col items-center justify-center py-4">
      <div class="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
        <SpeakerWaveIcon class="h-12 w-12 text-blue-600 dark:text-blue-400" />
      </div>
      
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">VwordAI</h1>
      <p class="text-gray-500 dark:text-gray-400 mb-6">文本转语音软件 v1.0.0</p>
      
      <div class="max-w-md w-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">软件信息</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">版本</span>
            <span class="text-gray-900 dark:text-white">1.0.0</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">平台</span>
            <span class="text-gray-900 dark:text-white">{{ platform }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">更新日期</span>
            <span class="text-gray-900 dark:text-white">2024年7月1日</span>
          </div>
        </div>
      </div>
      
      <div class="max-w-md w-full mb-6">
        <p class="text-center text-gray-600 dark:text-gray-300">
          VwordAI 是一款智能文本转语音工具，支持多种语音服务提供商，让您轻松将文本转为自然流畅的语音。
        </p>
      </div>
      
      <div class="flex space-x-4">
        <button class="btn btn-primary" @click="checkForUpdates">
          检查更新
        </button>
        <button class="btn btn-secondary" @click="openWebsite">
          访问官网
        </button>
      </div>
    </div>
    
    <div class="mt-6 text-center">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        © 2025 VwordAI. 保留所有权利。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { SpeakerWaveIcon } from '@heroicons/vue/24/outline';

const toast = useToast();

// 检测平台
const platform = ref(getPlatformName());

function getPlatformName(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('win')) return 'Windows';
  if (userAgent.includes('mac')) return 'macOS';
  if (userAgent.includes('linux')) return 'Linux';
  
  return '未知';
}

async function checkForUpdates() {
  // 模拟检查更新
  toast.info('正在检查更新...');
  
  // 延迟以模拟网络请求
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 模拟结果
  toast.success('当前已是最新版本');
}

function openWebsite() {
  // 打开官网 URL
  // 在实际应用中，应使用安全的方式打开外部链接
  window.open('https://example.com/vwordai', '_blank');
}
</script> 