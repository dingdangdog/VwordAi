<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      OpenAI LLM 配置
    </h3>
    <p class="text-gray-600 dark:text-gray-300 mb-2">
      配置你的OpenAI大语言模型服务相关信息。
    </p>

    <form @submit.prevent="saveForm" class="space-y-4">
      <div class="flex items-center space-x-2">
        <label
          for="key"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-20"
        >
          API Key<span class="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="key"
          v-model="form.key"
          class="input w-full"
          placeholder="输入您的 OpenAI API Key"
          required
        />
      </div>

      <div class="flex items-center space-x-2">
        <label
          for="endpoint"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-20"
        >
          endpoint
        </label>
        <input
          type="text"
          id="endpoint"
          v-model="form.endpoint"
          class="input w-full"
          placeholder="例如：https://api.openai.com"
        />
      </div>

      <div class="flex items-center space-x-2">
        <label
          for="model"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-20"
        >
          模型
        </label>
        <select id="model" v-model="form.model" class="input w-full">
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
        </select>
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

// 表单数据
const form = reactive({
  key: "",
  endpoint: "",
  model: "gpt-3.5-turbo",
});

// 监听属性变化，更新表单数据
watchEffect(() => {
  if (props.provider) {
    form.key = props.provider.key || "";
    form.endpoint = props.provider.endpoint || "";
    form.model = props.provider.model || "gpt-3.5-turbo";
  }
});

// 组件挂载时记录当前配置
onMounted(() => {
  console.log("OpenaiLLMProviderForm mounted with provider:", props.provider);
});

// 保存表单
async function saveForm() {
  if (!form.key) {
    toast.error("请提供您的 OpenAI API Key");
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
      endpoint: form.endpoint || "https://api.openai.com",
      model: form.model || "gpt-3.5-turbo",
    };

    // 通知父组件更新
    await emit("save", data);

    // 检查并输出表单状态日志，帮助调试
    setTimeout(() => {
      console.log("Form state after save:", JSON.stringify(form, null, 2));
      console.log("Props after save:", JSON.stringify(props.provider, null, 2));
    }, 1000);
  } catch (error) {
    console.error("保存 OpenAI 配置失败:", error);
    toast.error(
      "保存失败: " + (error instanceof Error ? error.message : String(error))
    );
  } finally {
    isSaving.value = false;
  }
}
</script>
