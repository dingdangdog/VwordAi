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
                  activeProvider?.type === provider.type
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                "
                @click="selectProvider(provider.type)"
              >
                <CloudIcon
                  class="h-5 w-5 mr-2"
                  :class="
                    activeProvider?.type === provider.type
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
        <!-- Azure 配置 -->
        <div class="card p-6">
          <AzureProviderForm
            v-if="activeProvider?.type === 'azure'"
            :provider="providerConfigs.azure"
            @save="updateProvider"
            @test="testConnection"
          />
          <AliyunProviderForm
            v-else-if="activeProvider?.type === 'aliyun'"
            :provider="providerConfigs.aliyun"
            @save="updateProvider"
            @test="testConnection"
          ></AliyunProviderForm>

          <AliyunProviderForm
            v-else-if="activeProvider?.type === 'tencent'"
            :provider="providerConfigs.tencent"
            @save="updateProvider"
            @test="testConnection"
          />

          <AzureProviderForm
            v-else-if="activeProvider?.type === 'baidu'"
            :provider="providerConfigs.baidu"
            @save="updateProvider"
            @test="testConnection"
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
import { ref, reactive, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { SUPPORTED_PROVIDERS } from "@/stores/settings";
import { ServerIcon, CloudIcon } from "@heroicons/vue/24/outline";
import AzureProviderForm from "./providers/AzureProviderForm.vue";
import AliyunProviderForm from "./providers/AliyunProviderForm.vue";
import type {
  ServiceProviderConfig,
  ServiceProviderType,
  AzureServiceProviderConfig,
  AliyunServiceProviderConfig,
} from "@/types";

const toast = useToast();
const testResult = ref<{ success: boolean; message: string } | null>(null);

// 当前选中的服务商类型
const selectedProviderType = ref<ServiceProviderType | null>(null);

// 当前激活的服务商
const activeProvider = computed(() => {
  if (!selectedProviderType.value) return null;
  return (
    SUPPORTED_PROVIDERS.find((p) => p.type === selectedProviderType.value) ||
    null
  );
});

// 不同服务商的配置
const providerConfigs = reactive<{
  azure: AzureServiceProviderConfig;
  aliyun: AliyunServiceProviderConfig;
  tencent: AliyunServiceProviderConfig;
  baidu: AzureServiceProviderConfig;
}>({
  azure: createDefaultAzureConfig(),
  aliyun: createDefaultAliyunConfig(),
  tencent: createDefaultAliyunConfig(), // 使用阿里云配置作为模板
  baidu: createDefaultAzureConfig(), // 使用Azure配置作为模板
});

// 创建默认的Azure配置
function createDefaultAzureConfig(): AzureServiceProviderConfig {
  return {
    id: crypto.randomUUID(),
    name: "微软 Azure TTS",
    apiKey: "",
    region: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// 创建默认的阿里云配置
function createDefaultAliyunConfig(): AliyunServiceProviderConfig {
  return {
    id: crypto.randomUUID(),
    name: "阿里云语音服务",
    apiKey: "",
    secretKey: "",
    accessKeyId: "",
    accessKeySecret: "",
    regionId: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// 选择服务商
function selectProvider(type: ServiceProviderType) {
  selectedProviderType.value = type;
  testResult.value = null;
}

// 更新服务商配置
function updateProvider(config: ServiceProviderConfig) {
  if (!selectedProviderType.value) return;

  try {
    const type = selectedProviderType.value;

    // 更新配置
    if (type === "azure" && "region" in config) {
      providerConfigs.azure = config as AzureServiceProviderConfig;
    } else if (
      (type === "aliyun" || type === "tencent") &&
      "regionId" in config
    ) {
      if (type === "aliyun") {
        providerConfigs.aliyun = config as AliyunServiceProviderConfig;
      } else {
        providerConfigs.tencent = config as AliyunServiceProviderConfig;
      }
    } else if (type === "baidu") {
      providerConfigs.baidu = config as AzureServiceProviderConfig;
    }

    toast.success("配置已保存");
  } catch (error) {
    toast.error(
      `保存配置失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 测试连接
function testConnection(result: { success: boolean; message: string }) {
  testResult.value = result;
}

// 初始化 - 默认选中第一个服务商
onMounted(() => {
  if (SUPPORTED_PROVIDERS.length > 0) {
    selectedProviderType.value = SUPPORTED_PROVIDERS[0].type;
  }

  // 在这里可以加载已保存的服务商配置
  // TODO: 从存储中加载配置
});
</script>
