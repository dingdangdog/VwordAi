<script setup lang="ts">
import { ref } from "vue";
import type { SerivceProvider, SystemConfig } from "@/utils/model";
import local from "@/utils/local";
import MySelect from "@/components/MySelect.vue";
import { alertSuccess, selectFloder } from "@/utils/common";
import { ServiceProviderItems } from "@/utils/global.store";

const showConfig = ref("basic");
const selectedProvider = ref<SerivceProvider>();

const changeServiceProvider = (provider: SerivceProvider) => {
  selectedProvider.value = provider;
};

// @ts-ignore
const systemConfig = ref<SystemConfig>({});

local("getConfigApi", "").then((res) => {
  // console.log(res);
  systemConfig.value = res;
});

const saveConfig = () => {
  local("saveConfig", systemConfig.value).then((res) => {
    // console.log(res);
    alertSuccess("保存成功");
  });
};

const selectDataFloder = () => {
  selectFloder().then((path) => {
    if (path) {
      systemConfig.value.dataPath = path;
      local("changeDataDir", path).then((res) => {
        alertSuccess("数据迁移成功");
        systemConfig.value = res;
      });
    }
  });
};

const openFolder = () => {
  // console.log("openFloder");
  // @ts-ignore
  window.electron.openFolder(systemConfig.value.dataPath);
};
</script>

<template>
  <div class="h-full flex justify-between">
    <div class="w-40 h-full bg-black/20 flex flex-col">
      <a
        class="p-2 hover:bg-gray-700 cursor-pointer duration-300"
        :class="showConfig == 'basic' ? 'bg-gray-800' : ''"
        @click="showConfig = 'basic'"
      >
        基本设置
      </a>
      <a
        class="p-2 hover:bg-gray-700 cursor-pointer duration-300"
        :class="showConfig == 'provider' ? 'bg-gray-800' : ''"
        @click="showConfig = 'provider'"
      >
        服务商设置
      </a>
    </div>
    <div class="flex-1 h-full overflow-y-auto">
      <div class="m-2 p-2 bg-gray-800 rounded-md" v-if="showConfig == 'basic'">
        <div class="flex justify-between">
          <div class="flex items-center">
            <h3>数据存储路径</h3>
            <input
              class="w-96 bg-transparent border-b ml-2 focus:outline-none"
              v-model="systemConfig.dataPath"
              @click="selectDataFloder()"
            />
            <button
              class="ml-2 px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600"
              @click="openFolder()"
            >
              打开文件夹
            </button>
          </div>
          <!-- <button
            class="px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600"
            @click="saveConfig()"
          >
            保存
          </button> -->
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
                :items="ServiceProviderItems"
                :select="changeServiceProvider"
                :selected="selectedProvider"
              />
            </div>
          </div>

          <button
            class="px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600"
            @click="saveConfig()"
          >
            保存
          </button>
        </div>

        <div class="py-1" v-if="selectedProvider?.code == 'azure'">
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
        <div class="py-1" v-if="selectedProvider?.code == 'aliyun'">
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
        <div class="py-1" v-if="selectedProvider?.code == 'openai'">OpenAI</div>
        <div class="py-1" v-if="selectedProvider?.code == 'sovits'">SoVits</div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
