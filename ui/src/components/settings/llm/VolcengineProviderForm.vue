<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      火山引擎 LLM 配置
    </h3>
    <p class="text-gray-600 dark:text-gray-300 mb-2">
      配置你的火山引擎大语言模型服务相关信息。
    </p>

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
            placeholder="输入您的火山引擎API密钥"
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
      </div>

      <div class="flex items-center space-x-2">
        <label
          for="endpoint"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-20"
        >
          endpoint <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="endpoint"
          v-model="form.endpoint"
          class="input w-full"
          placeholder="例如：https://ark.cn-beijing.volces.com/api/v3/"
          required
        />
      </div>

      <div class="flex items-center space-x-2">
        <label
          for="model"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-20"
        >
          model
        </label>
        <input
          type="text"
          id="model"
          v-model="form.model"
          class="input w-full"
          placeholder="例如：doubao-1.5-lite-32k-250115"
        />
      </div>

      <div class="flex justify-center space-x-2 mt-6">
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

const emit = defineEmits(["update", "save", "cancel"]);

const toast = useToast();
const isSaving = ref(false);
const showPassword = ref(false);

// 表单数据
const form = reactive({
  key: "",
  endpoint: "",
  model: "",
});

// 监听属性变化，更新表单数据
watchEffect(() => {
  if (props.provider) {
    form.key = props.provider.key || "";
    form.endpoint = props.provider.endpoint || "";
    form.model = props.provider.model || "";
  }
});

// 组件挂载时记录当前配置
onMounted(() => {
  console.log("VolcengineProviderForm mounted with provider:", props.provider);
});

// 保存表单
async function saveForm() {
  if (!form.key) {
    toast.error("请提供您的火山引擎API密钥");
    return;
  }

  if (!form.endpoint) {
    toast.error("请提供您的火山引擎API端点");
    return;
  }

  // 检查配置是否有变化
  if (
    props.provider &&
    props.provider.key === form.key &&
    props.provider.endpoint === form.endpoint &&
    props.provider.model === form.model
  ) {
    toast.info("配置未发生变化，无需保存");
    return;
  }

  isSaving.value = true;

  try {
    const data = {
      key: form.key,
      endpoint: form.endpoint,
      model: form.model,
    };

    // 通知父组件更新
    await emit("save", data);

    // 检查并输出表单状态日志，帮助调试
    setTimeout(() => {
      console.log("Form state after save:", JSON.stringify(form, null, 2));
      console.log("Props after save:", JSON.stringify(props.provider, null, 2));
    }, 1000);
  } catch (error) {
    console.error("保存火山引擎配置失败:", error);
    toast.error(
      "保存失败: " + (error instanceof Error ? error.message : String(error))
    );
  } finally {
    isSaving.value = false;
  }
}
</script>
