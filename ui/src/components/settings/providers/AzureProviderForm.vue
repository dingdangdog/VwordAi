<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Azure TTS 配置
    </h3>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      配置你的 Azure 语音服务相关信息。
    </p>

    <form @submit.prevent="saveForm" class="space-y-4">
      <div class="flex items-center space-x-2">
        <label
          for="key"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-20"
        >
          key<span class="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="key"
          v-model="form.key"
          class="input w-full"
          placeholder="输入您的 Azure 订阅密钥"
          required
        />
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
          class="btn btn-secondary"
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
import { ref, reactive, watchEffect, onMounted } from "vue";
import { useToast } from "vue-toastification";

const props = defineProps({
  provider: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["update", "save", "test", "cancel"]);

const toast = useToast();
const isSaving = ref(false);
const isTesting = ref(false);

// 表单数据
const form = reactive({
  key: "",
  region: "",
  endpoint: "",
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

  isSaving.value = true;

  try {
    const data = {
      key: form.key,
      region: form.region,
      endpoint: form.endpoint,
    };

    console.log("Saving Azure provider data:", JSON.stringify(data, null, 2));

    // 通知父组件更新
    emit("save", data);

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
    // 通知父组件执行测试，不再等待返回值
    emit("test", {
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
