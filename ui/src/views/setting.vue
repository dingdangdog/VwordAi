<script setup lang="ts">
import { ref } from "vue";

const systemConfig = ref();

const ServiceProviders = ref([
  { name: "Azure", code: "azure" },
  { name: "Aliyun", code: "aliyun" },
  { name: "OpenAI", code: "openai" },
  { name: "SoVits", code: "sovits" },
]);

const serviceProviderCode = ref("");
</script>

<template>
  <div class="p-2">
    <!-- <h2 class="text-lg">系统设置</h2> -->
    <div class="m-2 p-2 bg-gray-800 rounded-md">
      <div class="flex items-center">
        <h3>音频存储文件夹:</h3>
        <input class="w-96 bg-transparent border-b mx-2" />
        <button class="px-2 py-1 bg-gray-800 rounded-md hover:bg-gray-700">
          打开文件夹
        </button>
      </div>
    </div>
    <div class="m-2 p-2 bg-gray-800 rounded-md">
      <div class="flex items-center">
        <h3>我的服务商</h3>
        <div class="w-48 pl-4">
          <select
            v-model="serviceProviderCode"
            class="bg-transparent border-2 px-2 py-1 rounded-md"
          >
            <option
              class="bg-gray-800"
              v-for="sp in ServiceProviders"
              :key="sp.code"
              :value="sp.code"
            >
              <div class="px-2 py-1">
                {{ sp.name }}
              </div>
            </option>
          </select>
        </div>
      </div>

      <div class="p-2" v-show="serviceProviderCode == 'azure'">
        <div class="flex items-center p-2">
          <label class="min-w-32">Azure Key</label>
          <input class="w-full bg-transparent border-b px-2 py-1" />
        </div>
        <div class="flex items-center p-2">
          <label class="min-w-32">Azure Region</label>
          <input class="w-full bg-transparent border-b px-2 py-1" />
        </div>
        <div class="flex items-center p-2">
          <label class="min-w-32">Azure Endpoint</label>
          <input class="w-full bg-transparent border-b px-2 py-1" />
        </div>
        <div class="flex items-center p-2">
          <label class="min-w-32">Azure Models</label>
          <input class="w-full bg-transparent border-b px-2 py-1" />
        </div>
      </div>
      <div class="p-2" v-show="serviceProviderCode == 'aliyun'">
        <div class="flex items-center p-2">
          <label class="min-w-40">Aliyun App Key</label>
          <input class="w-full bg-transparent border-b px-2 py-1" />
        </div>
        <div class="flex items-center p-2">
          <label class="min-w-40">Aliyun App Token</label>
          <input class="w-full bg-transparent border-b px-2 py-1" />
        </div>
        <div class="flex items-center p-2">
          <label class="min-w-40">Aliyun Endpoint</label>
          <input class="w-full bg-transparent border-b px-2 py-1" />
        </div>
        <div class="flex items-center p-2">
          <label class="min-w-40">Aliyun Models</label>
          <input class="w-full bg-transparent border-b px-2 py-1" />
        </div>
      </div>
      <div class="p-2" v-show="serviceProviderCode == 'openai'">OpenAI</div>
      <div class="p-2" v-show="serviceProviderCode == 'sovits'">SoVits</div>
      <div class="text-center bg-gray-800 rounded-md">
        <button class="px-2 py-1 bg-gray-800 rounded-md hover:bg-gray-700">
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
