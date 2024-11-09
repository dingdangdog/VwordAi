<script setup lang="ts">
import { ref } from "vue";
import type { VoiceModel, SerivceProvider, SystemConfig } from "@/utils/model";
import local from "@/utils/local";
import ModelCard from "@/components/ModelCard.vue";
import MySelect from "@/components/MySelect.vue";

const showConfig = ref("basic");
const serviceProviderCode = ref("");

const changeServiceProvider = (provider: SerivceProvider) => {
  serviceProviderCode.value = provider.code;
};

// @ts-ignore
const systemConfig = ref<SystemConfig>({});

local("getConfigApi", "").then((res) => {
  console.log(res);
  systemConfig.value = res;
});

const models = ref<VoiceModel[]>();
const modelProviderCode = ref("");
const filterModelParam = ref("");
const getModels = (provider: SerivceProvider) => {
  modelProviderCode.value = provider.code;
  local("getModels", provider.code).then((res) => {
    models.value = res;
  });
};

const selectFloder = () => {
  // console.log("selectFloder");
  // @ts-ignore
  window.electron.selectFolder().then((path: string) => {
    if (path) {
      systemConfig.value.dataPath = path;
    }
  });
};

const openFolder = () => {
  console.log("openFloder");
  // @ts-ignore
  window.electron.openFolder(systemConfig.value.dataPath);
};
</script>

<template>
  <div class="h-full flex justify-between">
    <div class="w-32 h-full bg-gray-800 flex flex-col">
      <a
        class="p-2 hover:bg-gray-600 cursor-pointer"
        :class="showConfig == 'basic' ? 'bg-gray-700' : ''"
        @click="showConfig = 'basic'"
      >
        基本设置
      </a>
      <a
        class="p-2 hover:bg-gray-600 cursor-pointer"
        @click="showConfig = 'provider'"
      >
        服务商设置
      </a>
      <a
        class="p-2 hover:bg-gray-600 cursor-pointer"
        @click="showConfig = 'model'"
      >
        模型设置
      </a>
    </div>
    <div class="flex-1 h-full overflow-y-auto">
      <div class="m-2 p-2 bg-gray-800 rounded-md" v-if="showConfig == 'basic'">
        <div class="flex justify-between">
          <div class="flex items-center">
            <h3>音频存储文件夹</h3>
            <input
              class="w-96 bg-transparent border-b ml-2 focus:outline-none"
              v-model="systemConfig.dataPath"
              @click="selectFloder()"
            />
            <button
              class="ml-2 px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600"
              @click="openFolder()"
            >
              打开文件夹
            </button>
          </div>
          <button class="px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600">
            保存
          </button>
        </div>
      </div>
      <div
        class="m-2 p-2 bg-gray-800 rounded-md"
        v-if="showConfig == 'provider'"
      >
        <div class="flex justify-between">
          <div class="flex items-center">
            <h3>服务商</h3>
            <div class="w-36 ml-2">
              <MySelect
                :items="systemConfig.serviceProviders"
                :select="changeServiceProvider"
              />
            </div>
          </div>

          <button class="px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600">
            保存
          </button>
        </div>

        <div class="py-1" v-if="serviceProviderCode == 'azure'">
          <div class="flex items-center px-2 py-1">
            <label class="min-w-24">Key</label>
            <input
              class="w-full bg-transparent border-b py-1 focus:outline-none"
              v-model="systemConfig.serviceConfig.azure.key"
            />
          </div>
          <div class="flex items-center px-2 py-1">
            <label class="min-w-24">Region</label>
            <input
              class="w-full bg-transparent border-b py-1 focus:outline-none"
              v-model="systemConfig.serviceConfig.azure.region"
            />
          </div>
          <div class="flex items-center px-2 py-1">
            <label class="min-w-24">Endpoint</label>
            <input
              class="w-full bg-transparent border-b py-1 focus:outline-none"
              v-model="systemConfig.serviceConfig.azure.endpoint"
            />
          </div>
        </div>
        <div class="py-1" v-if="serviceProviderCode == 'aliyun'">
          <div class="flex items-center px-2 py-1">
            <label class="min-w-24">App Key</label>
            <input
              class="w-full bg-transparent border-b py-1 focus:outline-none"
            />
          </div>
          <div class="flex items-center px-2 py-1">
            <label class="min-w-24">App Token</label>
            <input
              class="w-full bg-transparent border-b py-1 focus:outline-none"
            />
          </div>
          <div class="flex items-center px-2 py-1">
            <label class="min-w-24">Endpoint</label>
            <input
              class="w-full bg-transparent border-b py-1 focus:outline-none"
            />
          </div>
        </div>
        <div class="py-1" v-if="serviceProviderCode == 'openai'">OpenAI</div>
        <div class="py-1" v-if="serviceProviderCode == 'sovits'">SoVits</div>
      </div>
      <div class="m-2 p-2 bg-gray-800 rounded-md" v-if="showConfig == 'model'">
        <div class="flex justify-between">
          <div class="flex items-center">
            <h3>服务商</h3>
            <div class="w-36 ml-2">
              <MySelect
                :items="systemConfig.serviceProviders"
                :select="getModels"
              />
            </div>
            <input
              class="w-52 h-8 bg-transparent border border-gray-400 p-2 ml-2 rounded-md focus:outline-none"
              placeholder="筛选"
              v-model="filterModelParam"
              @change=""
            />
          </div>

          <button class="px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600">
            保存
          </button>
        </div>

        <div class="flex items-center py-1 w-full" v-show="modelProviderCode">
          <!-- <label class="min-w-32">Models</label> -->
          <div class="flex flex-wrap w-full">
            <ModelCard v-for="m in models" :key="m.code" :model="m" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
