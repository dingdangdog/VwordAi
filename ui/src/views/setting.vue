<script setup lang="ts">
import { ref } from "vue";
import type { VoiceModel, SerivceProvider, SystemConfig } from "@/utils/model";
import local from "@/utils/local";
import ModelCard from "@/components/ModelCard.vue";

const serviceProviderCode = ref("");

// @ts-ignore
const systemConfig = ref<SystemConfig>({});

local("getConfigApi", "").then((res) => {
  console.log(res);
  systemConfig.value = res;
});

const models = ref<VoiceModel[]>();
const getModels = () => {
  local("getModels", serviceProviderCode.value).then((res) => {
    models.value = res;
  });
};

const selectFloder = () => {
  // console.log("selectFloder");
  // @ts-ignore
  window.electron.selectFolder().then((path: string) => {
    systemConfig.value.dataPath = path;
  });
};

const openFolder = () => {
  console.log("openFloder");
  // @ts-ignore
  window.electron.openFolder(systemConfig.value.dataPath);
};
</script>

<template>
  <div class="p-2">
    <!-- <h2 class="text-lg">系统设置</h2> -->
    <div class="m-2 p-2 bg-gray-800 rounded-md">
      <div class="flex items-center">
        <h3>音频存储文件夹:</h3>
        <input
          class="w-96 bg-transparent border-b mx-2 focus:outline-none"
          v-model="systemConfig.dataPath"
          @click="selectFloder()"
        />
        <button
          class="px-2 py-1 bg-gray-800 rounded-md hover:bg-gray-700"
          @click="openFolder()"
        >
          打开文件夹
        </button>
      </div>
    </div>
    <div class="m-2 p-2 bg-gray-800 rounded-md">
      <div class="flex justify-between">
        <div class="flex items-center">
          <h3>我的服务商</h3>
          <div class="w-36 pl-4">
            <select
              v-model="serviceProviderCode"
              class="bg-transparent w-full border-2 px-2 p-1 rounded-md focus:outline-none"
              @change="getModels()"
            >
              <option
                class="bg-gray-800"
                v-for="sp in systemConfig.serviceProviders"
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

        <button class="px-2 py-1 bg-gray-800 rounded-md hover:bg-gray-700">
          保存
        </button>
      </div>

      <div class="p-2" v-show="serviceProviderCode == 'azure'">
        <div class="flex items-center p-2">
          <label class="min-w-32">Azure Key</label>
          <input
            class="w-full bg-transparent border-b py-1 focus:outline-none"
            v-model="systemConfig.serviceConfig.azure.key"
          />
        </div>
        <div class="flex items-center p-2">
          <label class="min-w-32">Azure Region</label>
          <input
            class="w-full bg-transparent border-b py-1 focus:outline-none"
            v-model="systemConfig.serviceConfig.azure.region"
          />
        </div>
        <div class="flex items-center p-2">
          <label class="min-w-32">Azure Endpoint</label>
          <input
            class="w-full bg-transparent border-b py-1 focus:outline-none"
            v-model="systemConfig.serviceConfig.azure.endpoint"
          />
        </div>
      </div>
      <div class="p-2" v-show="serviceProviderCode == 'aliyun'">
        <div class="flex items-center p-2">
          <label class="min-w-40">Aliyun App Key</label>
          <input
            class="w-full bg-transparent border-b py-1 focus:outline-none"
          />
        </div>
        <div class="flex items-center p-2">
          <label class="min-w-40">Aliyun App Token</label>
          <input
            class="w-full bg-transparent border-b py-1 focus:outline-none"
          />
        </div>
        <div class="flex items-center p-2">
          <label class="min-w-40">Aliyun Endpoint</label>
          <input
            class="w-full bg-transparent border-b py-1 focus:outline-none"
          />
        </div>
      </div>
      <div class="p-2" v-show="serviceProviderCode == 'openai'">OpenAI</div>
      <div class="p-2" v-show="serviceProviderCode == 'sovits'">SoVits</div>

      <div class="flex items-center p-2 w-full">
        <label class="min-w-32">Models</label>
        <div class="flex flex-wrap w-full">
          <ModelCard v-for="m in models" :key="m.code" :model="m" />
        </div>
      </div>
      <!-- <div class="text-center bg-gray-800 rounded-md">
      </div> -->
    </div>
  </div>
</template>

<style scoped></style>
