<template>
  <div class="provider-setting m-2">
    <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
      <!-- 左侧服务商列表 -->
      <div class="w-full md:w-64 flex-shrink-0">
        <div class="card p-4">
          <ul class="space-y-2">
            <li v-for="provider in SUPPORTED_PROVIDERS" :key="provider.id">
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
          <AzureProviderForm
            v-if="selectedProviderType === 'azure'"
            :provider="providerData"
            @update="updateProviderField"
            @save="saveCurrentProvider"
            @test="testCurrentProvider"
          />
          <AliyunProviderForm
            v-else-if="selectedProviderType === 'aliyun'"
            :provider="providerData"
            @update="updateProviderField"
            @save="saveCurrentProvider"
            @test="testCurrentProvider"
          />
          <BaiduProviderForm
            v-else-if="selectedProviderType === 'baidu'"
            :provider="providerData"
            @update="updateProviderField"
            @save="saveCurrentProvider"
            @test="testCurrentProvider"
          />
          <TencentProviderForm
            v-else-if="selectedProviderType === 'tencent'"
            :provider="providerData"
            @update="updateProviderField"
            @save="saveCurrentProvider"
            @test="testCurrentProvider"
          />
          <OpenaiProviderForm
            v-else-if="selectedProviderType === 'openai'"
            :provider="providerData"
            @update="updateProviderField"
            @save="saveCurrentProvider"
            @test="testCurrentProvider"
          />

          <!-- 初始状态 -->
          <div
            v-else
            class="card p-6 flex flex-col items-center justify-center text-center py-12"
          >
            <ServerIcon class="h-16 w-16 text-gray-400 mb-4" />
            <p class="text-lg text-gray-700 dark:text-gray-300">
              请从左侧选择一个服务商进行配置
            </p>
          </div>

          <!-- 测试结果显示 -->
          <div
            v-if="testResult"
            class="mt-4 p-3 rounded-md"
            :class="
              testResult.success
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            "
          >
            <p
              :class="
                testResult.success
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              "
            >
              {{ testResult.message }}
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
import { SUPPORTED_PROVIDERS, useSettingsStore } from "@/stores/settings";
import { ServerIcon, CloudIcon } from "@heroicons/vue/24/outline";
import type { ServiceProviderType } from "@/types";
import AzureProviderForm from "./providers/AzureProviderForm.vue";
import AliyunProviderForm from "./providers/AliyunProviderForm.vue";
import BaiduProviderForm from "./providers/BaiduProviderForm.vue";
import TencentProviderForm from "./providers/TencentProviderForm.vue";
import OpenaiProviderForm from "./providers/OpenaiProviderForm.vue";

// 当前选中的服务商类型
const selectedProviderType = ref<ServiceProviderType | null>(null);
const providerData = ref<any>({});
const testResult = ref<{ success: boolean; message: string } | null>(null);
const toast = useToast();
const settingsStore = useSettingsStore();
const isLoading = ref(false);

// 获取所有设置
const allSettings = computed(() => settingsStore.settings);

// 初始化
onMounted(async () => {
  // 加载设置
  if (!settingsStore.settings) {
    await settingsStore.loadSettings();
  }

  // 默认选择第一个服务商
  if (SUPPORTED_PROVIDERS.length > 0) {
    selectProvider(SUPPORTED_PROVIDERS[0].type);
  }
});

// 选择服务商
function selectProvider(type: ServiceProviderType) {
  selectedProviderType.value = type;
  testResult.value = null;

  // 从设置中获取服务商配置
  const config = settingsStore.getServiceProviderConfig(type);

  if (config) {
    // 使用已保存的配置
    providerData.value = { ...config };
  } else {
    // 创建新的配置对象
    providerData.value = {
      // 不同服务商可能有不同的默认字段
      // 这里提供通用空配置
    };
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
      `Saving provider ${type} config:`,
      JSON.stringify(data || providerData.value, null, 2)
    );

    // 使用传入的数据或当前数据
    const providerConfig = data || { ...providerData.value };

    // 通过设置存储保存服务商配置
    const success = await settingsStore.updateServiceProvider(
      type,
      providerConfig
    );

    if (success) {
      // 更新本地状态以反映保存的配置
      providerData.value = { ...providerConfig };
      toast.success("服务商配置保存成功");

      console.log(`Provider ${type} config saved successfully`);
      console.log(
        `Current provider data:`,
        JSON.stringify(providerData.value, null, 2)
      );

      // 为了确保数据被正确保存，重新加载一次设置
      setTimeout(async () => {
        await settingsStore.loadSettings();
        // 检查是否正确保存
        const savedConfig = settingsStore.getServiceProviderConfig(type);
        console.log(
          `Reloaded provider ${type} config:`,
          JSON.stringify(savedConfig, null, 2)
        );
      }, 1000);
    } else {
      console.error(`Failed to save provider ${type} config`);
      toast.error("保存失败: 未知错误");
    }
  } catch (error) {
    console.error("Save provider config error:", error);
    toast.error(
      `保存失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  } finally {
    isLoading.value = false;
  }
}

// 测试当前服务商连接
async function testCurrentProvider() {
  if (!selectedProviderType.value) {
    toast.warning("请先选择一个服务商");
    return;
  }

  // 先保存配置
  await saveCurrentProvider();

  isLoading.value = true;
  try {
    // 测试连接
    const result = await settingsStore.testServiceProviderConnection(
      selectedProviderType.value
    );

    testResult.value = result;
  } catch (error) {
    testResult.value = {
      success: false,
      message: `测试失败: ${error instanceof Error ? error.message : "未知错误"}`,
    };
  } finally {
    isLoading.value = false;
  }
}
</script>
