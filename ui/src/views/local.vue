<script setup lang="ts"></script>

<template>
  <div class="p-2">
    <!-- <h2 class="text-lg">系统设置</h2> -->
    <div class="m-2 p-2 bg-gray-800 rounded-md">
      <div class="flex items-center">
        <h3>本地端口:</h3>
        <input class="w-16 bg-transparent border-b mx-2" />
        <button class="px-2 py-1 bg-gray-800 rounded-md hover:bg-gray-700">
          开启本地服务
        </button>
        <button class="px-2 py-1 bg-red-500 rounded-md hover:bg-red-400">
          停止
        </button>
      </div>
    </div>

    <div class="m-2 p-2 bg-gray-800 rounded-md">
      <h3>调用日志</h3>
      <div class="w-full h-[80vh] bg-black overflow-y-auto">
        <p>xxxx</p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
