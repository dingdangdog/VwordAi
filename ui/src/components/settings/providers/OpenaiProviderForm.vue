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
        <input
          type="password"
          id="apiKey"
          v-model="form.apiKey"
          class="input w-full"
          placeholder="输入您的 OpenAI API 密钥"
          required
        />
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
        <!-- <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('cancel')"
        >
          取消
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="testConnection"
          :disabled="isTesting"
        >
          {{ isTesting ? "测试中..." : "测试连接" }}
        </button> -->
        <button type="submit" class="btn btn-primary" :disabled="isSaving">
          {{ isSaving ? "保存中..." : "保存配置" }}
        </button>
      </div>
    </form>

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
const testResult = ref<{ success: boolean; message: string } | null>(null);

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

// 测试连接
async function testConnection() {
  if (!form.apiKey) {
    toast.error("请提供您的 OpenAI API 密钥");
    return;
  }

  isTesting.value = true;
  testResult.value = null;

  try {
    // 通知父组件执行测试
    emit("test");
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : "连接测试出错",
    };
  } finally {
    isTesting.value = false;
  }
}
</script>
