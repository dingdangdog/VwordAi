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
          />
          <AliyunProviderForm
            v-else-if="selectedProviderType === 'aliyun'"
            :provider="providerData"
            @update="updateProviderField"
          />
          <BaiduProviderForm
            v-else-if="selectedProviderType === 'baidu'"
            :provider="providerData"
            @update="updateProviderField"
          />
          <TencentProviderForm
            v-else-if="selectedProviderType === 'tencent'"
            :provider="providerData"
            @update="updateProviderField"
          />
          <AWSProviderForm
            v-else-if="selectedProviderType === 'aws'"
            :provider="providerData"
            @update="updateProviderField"
          />
          <GoogleProviderForm
            v-else-if="selectedProviderType === 'google'"
            :provider="providerData"
            @update="updateProviderField"
          />
          <!-- <OpenaiProviderForm
            v-else-if="selectedProviderType === 'tencent'"
            :provider="providerData"
            @update="updateProviderField"
          /> -->

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
import { ref, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { SUPPORTED_PROVIDERS } from "@/stores/settings";
import { ServerIcon, CloudIcon } from "@heroicons/vue/24/outline";
import { serviceProviderApi } from "@/utils/api";
import AzureProviderForm from "./providers/AzureProviderForm.vue";
import AliyunProviderForm from "./providers/AliyunProviderForm.vue";
import BaiduProviderForm from "./providers/BaiduProviderForm.vue";
import TencentProviderForm from "./providers/TencentProviderForm.vue";
import GoogleProviderForm from "./providers/GoogleProviderForm.vue";
import AWSProviderForm from "./providers/AWSProviderForm.vue";

// 当前选中的服务商类型
const selectedProviderType = ref("");
const providerData = ref<any>({});
const testResult = ref<{ success: boolean; message: string } | null>(null);
const toast = useToast();
const savedProviders = ref<any[]>([]);
const isLoading = ref(false);

// 加载已有的配置
async function loadProviders() {
  isLoading.value = true;
  try {
    const response = await serviceProviderApi.getAll();
    if (response.success && response.data) {
      savedProviders.value = response.data;
    }
  } catch (err) {
    console.error("加载服务商配置失败", err);
  } finally {
    isLoading.value = false;
  }
}

// 初始化
onMounted(async () => {
  // 加载已保存的服务商配置
  await loadProviders();

  // 默认选择第一个服务商
  if (SUPPORTED_PROVIDERS.length > 0) {
    selectProvider(SUPPORTED_PROVIDERS[0].type);
  }
});

// 选择服务商
function selectProvider(type: string) {
  selectedProviderType.value = type;
  testResult.value = null;

  // 查找已保存的对应类型的服务商配置
  const savedProvider = savedProviders.value.find((p) => p.type === type);

  if (savedProvider) {
    // 使用已保存的配置
    providerData.value = { ...savedProvider };
  } else {
    // 创建新的配置对象
    providerData.value = {
      id: crypto.randomUUID(),
      name: SUPPORTED_PROVIDERS.find((p) => p.type === type)?.name || "",
      type: type,
      apiKey: "",
      apiSecret: "",
      region: "",
      enabled: true,
      createAt: new Date().toISOString(),
      updateAt: new Date().toISOString(),
      config: {},
    };

    // 根据不同的服务商类型添加特定字段
    if (type === "aliyun" || type === "tencent") {
      providerData.value.accessKeyId = "";
      providerData.value.accessKeySecret = "";
      providerData.value.regionId = "";
    }
  }
}

// 更新表单字段
function updateProviderField(field: string, value: any) {
  providerData.value[field] = value;
}

// 保存当前服务商配置
async function saveCurrentProvider() {
  if (!selectedProviderType.value) {
    toast.warning("请先选择一个服务商");
    return;
  }

  isLoading.value = true;
  try {
    let response;
    const data = { ...providerData.value };

    // 确保必填字段有值
    if (!data.name) {
      data.name =
        SUPPORTED_PROVIDERS.find((p) => p.type === selectedProviderType.value)
          ?.name || "";
    }

    // 检查是否已存在此类型的服务商配置
    const existingProvider = savedProviders.value.find(
      (p) => p.type === selectedProviderType.value
    );

    if (existingProvider) {
      // 更新已存在的配置
      response = await serviceProviderApi.update(existingProvider.id, {
        ...data,
        type: selectedProviderType.value,
        updateAt: new Date().toISOString(),
      });
    } else {
      // 创建新配置
      response = await serviceProviderApi.create({
        ...data,
        type: selectedProviderType.value,
        createAt: new Date().toISOString(),
        updateAt: new Date().toISOString(),
      });
    }

    if (response.success) {
      toast.success("服务商配置保存成功");
      // 刷新服务商列表
      await loadProviders();
      // 更新当前编辑的服务商数据
      if (response.data) {
        providerData.value = response.data;
      }
    } else {
      toast.error(`保存失败: ${response.error || "未知错误"}`);
    }
  } catch (error) {
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

  // 如果配置保存失败，则不继续测试
  if (!providerData.value.id) {
    return;
  }

  isLoading.value = true;
  try {
    // 测试连接
    const response = await serviceProviderApi.testConnection(
      providerData.value.id
    );

    testResult.value = {
      success: response.success,
      message: response.success
        ? response.data?.message || "连接测试成功"
        : response.error || "连接测试失败",
    };
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
