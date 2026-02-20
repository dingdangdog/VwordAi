<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-ink mb-4">
      OpenAI TTS 配置
    </h3>
    <p class="text-ink mb-6">
      配置 OpenAI 语音服务。您需要一个 OpenAI API 密钥。
    </p>

    <form @submit.prevent="saveForm" class="space-y-4">
      <FormInput
        id="apiKey"
        v-model="form.apiKey"
        :type="showPassword ? 'text' : 'password'"
        label="API 密钥"
        placeholder="输入您的 OpenAI API 密钥"
        required
        hint="您的 OpenAI API 密钥，以 sk- 开头。"
      >
        <template #label>API 密钥<span class="text-red-500">*</span></template>
        <template #suffix>
          <button type="button" class="p-2 rounded hover:bg-surface-hover" @click="showPassword = !showPassword" tabindex="-1">
            <EyeIcon class="h-5 w-5 text-ink-muted" :class="{ 'text-primary': showPassword }" />
          </button>
        </template>
      </FormInput>

      <FormInput
        id="endpoint"
        v-model="form.endpoint"
        label="自定义端点（可选）"
        placeholder="例如：https://api.openai.com/v1"
        hint="如果您使用自定义端点或代理，可以在此指定。"
      />

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
import { EyeIcon } from "@heroicons/vue/24/outline";
import FormInput from "@/components/common/FormInput.vue";

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
