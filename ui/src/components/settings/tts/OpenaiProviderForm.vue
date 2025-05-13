<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      OpenAI TTS 配置
    </h3>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      配置 OpenAI 语音服务。您需要一个 OpenAI API 密钥。
    </p>

    <form @submit.prevent="saveForm" class="space-y-4">
      <div>
        <label
          for="apiKey"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          API 密钥<span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <input
            :type="showPassword ? 'text' : 'password'"
            id="apiKey"
            v-model="form.apiKey"
            class="input w-full pr-10"
            placeholder="输入您的 OpenAI API 密钥"
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
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          您的 OpenAI API 密钥，以 sk- 开头。
        </p>
      </div>

      <div>
        <label
          for="endpoint"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          自定义端点（可选）
        </label>
        <input
          type="text"
          id="endpoint"
          v-model="form.endpoint"
          class="input w-full"
          placeholder="例如：https://api.openai.com/v1"
        />
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          如果您使用自定义端点或代理，可以在此指定。
        </p>
      </div>

      <div class="flex justify-end space-x-2 mt-6">
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
import { ref, reactive, watchEffect } from "vue";
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
const showPassword = ref(false);

// 表单数据
const form = reactive({
  apiKey: "",
  endpoint: "https://api.openai.com/v1",
});

// 监听属性变化，更新表单数据
watchEffect(() => {
  if (props.provider) {
    form.apiKey = props.provider.apiKey || "";
    form.endpoint = props.provider.endpoint || "https://api.openai.com/v1";
  }
});

// 保存表单
async function saveForm() {
  if (!form.apiKey) {
    toast.error("请提供您的 OpenAI API 密钥");
    return;
  }

  isSaving.value = true;

  try {
    const data = {
      apiKey: form.apiKey,
      endpoint: form.endpoint,
    };

    // 通知父组件更新
    emit("save", data);
  } catch (error) {
    console.error("保存 OpenAI 配置失败:", error);
    toast.error(
      "保存失败: " + (error instanceof Error ? error.message : String(error))
    );
  } finally {
    isSaving.value = false;
  }
}

// 测试配置
async function testConnection() {
  if (!form.apiKey) {
    toast.error("请先填写 API 密钥");
    return;
  }

  isTesting.value = true;

  try {
    // 先发送测试开始的消息
    toast.info("正在测试连接，请稍候...");

    // 通知父组件执行测试，带上当前配置
    emit("test", {
      apiKey: form.apiKey,
      endpoint: form.endpoint,
    });
  } catch (error) {
    toast.error(
      `测试失败: ${error instanceof Error ? error.message : "连接测试出错"}`
    );
  } finally {
    isTesting.value = false;
  }
}
</script>
