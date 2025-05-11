<template>
  <div class="llm-setting m-2">
    <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
      <!-- 左侧服务商列表 -->
      <div class="w-full md:w-64 flex-shrink-0">
        <div class="card p-4">
          <ul class="space-y-2">
            <li v-for="provider in providers" :key="provider.id">
              <button
                class="w-full flex items-center px-3 py-2 rounded-md transition-colors text-left"
                :class="
                  selectedProviderType === provider.type
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                "
                @click="selectProvider(provider.type)"
              >
                <CloudIcon
                  class="h-5 w-5 mr-2"
                  :class="
                    selectedProviderType === provider.type
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  "
                />
                <span>{{ provider.name }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- 右侧配置编辑 -->
      <div class="flex-1">
        <div class="card p-6">
          <!-- 各服务商配置表单 -->
          <VolcengineProviderForm
            v-if="selectedProviderType === 'volcengine'"
            :provider="providerData"
            @update="updateProviderField"
            @save="saveCurrentProvider"
          />
          <AliyunLLMProviderForm
            v-else-if="selectedProviderType === 'aliyun'"
            :provider="providerData"
            @update="updateProviderField"
            @save="saveCurrentProvider"
          />
          <AzureLLMProviderForm
            v-else-if="selectedProviderType === 'azure'"
            :provider="providerData"
            @update="updateProviderField"
            @save="saveCurrentProvider"
          />
          <OpenaiLLMProviderForm
            v-else-if="selectedProviderType === 'openai'"
            :provider="providerData"
            @update="updateProviderField"
            @save="saveCurrentProvider"
          />

          <!-- 初始状态 -->
          <div
            v-else
            class="card p-6 flex flex-col items-center justify-center text-center py-12"
          >
            <ServerIcon class="h-16 w-16 text-gray-400 mb-4" />
            <p class="text-lg text-gray-700 dark:text-gray-300">
              请从左侧选择一个LLM服务商进行配置
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "vue-toastification";
import { SUPPORTED_LLM_PROVIDERS, useSettingsStore } from "@/stores/settings";
import { ServerIcon, CloudIcon } from "@heroicons/vue/24/outline";
import type { ServiceProviderType } from "@/types";
// 注意：需要创建这些组件
import VolcengineProviderForm from "./providers/VolcengineProviderForm.vue";
import AliyunLLMProviderForm from "./providers/AliyunLLMProviderForm.vue";
import AzureLLMProviderForm from "./providers/AzureLLMProviderForm.vue";
import OpenaiLLMProviderForm from "./providers/OpenaiLLMProviderForm.vue";

// 当前选中的服务商类型
const selectedProviderType = ref<ServiceProviderType | null>(null);
const providerData = ref<any>({});
const toast = useToast();
const settingsStore = useSettingsStore();
const isLoading = ref(false);
const llmSettings = ref<any>(null);

// 服务商列表
const providers = computed(() => {
  return SUPPORTED_LLM_PROVIDERS;
});

// 初始化
onMounted(async () => {
  // 加载LLM设置
  llmSettings.value = await settingsStore.loadLLMSettings();
  
  // 默认选择第一个服务商
  if (SUPPORTED_LLM_PROVIDERS.length > 0) {
    selectProvider(SUPPORTED_LLM_PROVIDERS[0].type);
  }
});

// 选择服务商
function selectProvider(type: ServiceProviderType) {
  selectedProviderType.value = type;

  // 从设置中获取服务商配置
  if (llmSettings.value && llmSettings.value[type]) {
    // 使用已保存的配置
    providerData.value = { ...llmSettings.value[type] };
  } else {
    // 创建新的配置对象
    providerData.value = {};
  }
}

// 更新表单字段
function updateProviderField(field: string, value: any) {
  providerData.value[field] = value;
}

// 保存当前服务商配置
async function saveCurrentProvider(data?: Record<string, any>) {
  if (!selectedProviderType.value) {
    toast.warning("请先选择一个服务商");
    return;
  }

  isLoading.value = true;
  try {
    const type = selectedProviderType.value;
    console.log(
      `Saving LLM provider ${type} config:`,
      JSON.stringify(data || providerData.value, null, 2)
    );

    // 使用传入的数据或当前数据
    const providerConfig = data || { ...providerData.value };

    // 通过设置存储保存服务商配置
    const success = await settingsStore.updateLLMProvider(
      type,
      providerConfig
    );

    if (success) {
      // 重新加载设置以获取最新状态
      llmSettings.value = await settingsStore.loadLLMSettings();

      // 更新本地状态以反映保存的配置
      if (llmSettings.value && llmSettings.value[type]) {
        providerData.value = { ...llmSettings.value[type] };
      }

      toast.success("LLM服务商配置保存成功");
    } else {
      console.error(`Failed to save LLM provider ${type} config`);
      toast.error("保存失败: 未知错误");
    }
  } catch (error) {
    console.error("Save LLM provider config error:", error);
    toast.error(
      `保存失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  } finally {
    isLoading.value = false;
  }
}
</script> 