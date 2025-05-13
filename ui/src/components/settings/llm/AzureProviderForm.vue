<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Azure TTS 配置
    </h3>
    <p class="text-gray-600 dark:text-gray-300 mb-2">
      配置你的 Azure 语音服务相关信息。
    </p>

    <!-- 状态显示 -->
    <div v-if="providerStatus" class="mb-4 text-center">
      <div
        v-if="providerStatus === 'untested'"
        class="p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 rounded-md"
      >
        <span class="text-sm">已配置但未测试，请测试配置确保能正常工作</span>
      </div>
      <div
        v-else-if="providerStatus === 'success'"
        class="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-md"
      >
        <span class="text-sm">配置测试成功</span>
      </div>
      <div
        v-else-if="providerStatus === 'failure'"
        class="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md"
      >
        <span class="text-sm">配置测试失败，请检查您的配置</span>
      </div>
    </div>

    <form @submit.prevent="saveForm" class="space-y-4">
      <div class="flex items-center space-x-2">
        <label
          for="key"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-20"
        >
          key<span class="text-red-500">*</span>
        </label>
        <div class="relative w-full">
          <input
            :type="showPassword ? 'text' : 'password'"
            id="key"
            v-model="form.key"
            class="input w-full pr-10"
            placeholder="输入您的 Azure 订阅密钥"
            required
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
            @click="showPassword = !showPassword"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-gray-500"
              :class="{ 'text-blue-500': showPassword }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                v-if="showPassword"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                v-if="!showPassword"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
        </div>
        <!-- <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          您的 Azure 认知服务订阅密钥。
        </p> -->
      </div>

      <div class="flex items-center space-x-2">
        <label
          for="region"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-20"
        >
          region <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="region"
          v-model="form.region"
          class="input w-full"
          placeholder="例如：eastus"
          required
        />
        <!-- <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          您的服务部署的 Azure 区域（例如：eastus，westeurope）。
        </p> -->
      </div>

      <!-- <div class="flex items-center space-x-2">
        <label
          for="endpoint"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-20"
        >
          endpoint(optional)
        </label>
        <input
          type="text"
          id="endpoint"
          v-model="form.endpoint"
          class="input w-full"
          placeholder="例如：https://your-resource.cognitiveservices.azure.com/"
        />
      </div> -->

      <div class="flex justify-center space-x-2 mt-6">
        <button
          type="button"
          class="btn bg-green-500 text-white hover:bg-green-600"
          @click="testConnection"
          :disabled="isTesting"
        >
          {{ isTesting ? "测试中..." : "测试配置" }}
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSaving">
          {{ isSaving ? "保存中..." : "保存配置" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect, onMounted, computed } from "vue";
import { useToast } from "vue-toastification";
import { useSettingsStore } from "@/stores/settings";
import type { ServiceProviderStatus } from "@/types";

const props = defineProps({
  provider: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["update", "save", "test", "cancel"]);

const toast = useToast();
const settingsStore = useSettingsStore();
const isSaving = ref(false);
const isTesting = ref(false);
const showPassword = ref(false);

// 表单数据
const form = reactive({
  key: "",
  region: "",
  endpoint: "",
});

// 计算当前配置状态
const providerStatus = computed<ServiceProviderStatus>(() => {
  return props.provider?.status || "unconfigured";
});

// 监听属性变化，更新表单数据
watchEffect(() => {
  if (props.provider) {
    form.key = props.provider.key || "";
    form.region = props.provider.region || "";
    form.endpoint = props.provider.endpoint || "";
  }
});

// 组件挂载时记录当前配置
onMounted(() => {
  console.log("AzureProviderForm mounted with provider:", props.provider);
});

// 保存表单
async function saveForm() {
  if (!form.key) {
    toast.error("请提供您的 Azure 订阅密钥");
    return;
  }

  if (!form.region) {
    toast.error("请提供您的 Azure 区域");
    return;
  }

  // 检查配置是否有变化
  if (
    props.provider &&
    props.provider.key === form.key &&
    props.provider.region === form.region &&
    props.provider.endpoint === form.endpoint
  ) {
    toast.info("配置未发生变化，无需保存");
    return;
  }

  isSaving.value = true;

  try {
    const data = {
      key: form.key,
      region: form.region,
      endpoint: form.endpoint,
    };

    // 通知父组件更新
    await emit("save", data);

    // 提示用户测试配置
    if (settingsStore.isLLMProviderConfiguredButUntested("azure")) {
      toast.info("配置已保存。建议您测试配置以确保它可以正常工作。");
    }

    // 检查并输出表单状态日志，帮助调试
    setTimeout(() => {
      console.log("Form state after save:", JSON.stringify(form, null, 2));
      console.log("Props after save:", JSON.stringify(props.provider, null, 2));
    }, 1000);
  } catch (error) {
    console.error("保存 Azure 配置失败:", error);
    toast.error(
      "保存失败: " + (error instanceof Error ? error.message : String(error))
    );
  } finally {
    isSaving.value = false;
  }
}

// 测试配置
async function testConnection() {
  if (!form.key) {
    toast.error("请提供您的 Azure 订阅密钥");
    return;
  }

  if (!form.region) {
    toast.error("请提供您的 Azure 区域");
    return;
  }

  isTesting.value = true;

  try {
    // 保存当前配置再测试
    // await saveForm();

    // 通知父组件执行测试
    const result = await emit("test", {
      key: form.key,
      region: form.region,
      endpoint: form.endpoint,
    });

    // 测试开始的消息
    toast.info("正在测试连接，请稍候...");
  } catch (error) {
    toast.error(
      `测试失败: ${error instanceof Error ? error.message : "连接测试出错"}`
    );
  } finally {
    isTesting.value = false;
  }
}
</script>
