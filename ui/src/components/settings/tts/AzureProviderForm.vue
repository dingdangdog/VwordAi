<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-ink mb-4">
      Azure TTS 配置
    </h3>
    <p class="text-ink mb-2">
      配置你的 Azure 语音服务相关信息。
    </p>

    <!-- 状态显示 -->
    <div v-if="providerStatus" class="mb-4 text-center">
      <div
        v-if="providerStatus === 'untested'"
        class="p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 rounded-md"
      >
        <span class="text-sm">未配置或未测试</span>
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
      <FormInput
        id="key"
        v-model="form.key"
        :type="showPassword ? 'text' : 'password'"
        label="key"
        placeholder="输入您的 Azure 订阅密钥"
        required
      >
        <template #label>key<span class="text-red-500">*</span></template>
        <template #suffix>
          <button type="button" class="p-2 rounded hover:bg-surface-hover" @click="showPassword = !showPassword" tabindex="-1">
            <EyeIcon class="h-5 w-5 text-ink-muted" :class="{ 'text-primary': showPassword }" />
          </button>
        </template>
      </FormInput>

      <FormInput
        id="region"
        v-model="form.region"
        label="region"
        placeholder="例如：eastus"
        required
      >
        <template #label>region <span class="text-red-500">*</span></template>
      </FormInput>

      <!-- <div class="flex items-center space-x-2">
        <label
          for="endpoint"
          class="block text-sm font-medium text-ink w-20"
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
import { EyeIcon } from "@heroicons/vue/24/outline";
import FormInput from "@/components/common/FormInput.vue";
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
    // if (settingsStore.isTTSProviderConfiguredButUntested("azure")) {
    //   toast.info("配置已保存。建议您测试配置以确保它可以正常工作。");
    // }

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
