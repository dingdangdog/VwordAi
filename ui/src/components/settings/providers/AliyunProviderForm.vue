<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      阿里云语音服务配置
    </h3>

    <form @submit.prevent="saveForm">
      <div class="space-y-4">
        <div>
          <label
            for="appkey"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            App Key<span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="appkey"
            v-model="form.appkey"
            class="input w-full"
            placeholder="输入 Access Key ID"
            required
          />
        </div>

        <div>
          <label
            for="token"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Token<span class="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="token"
            v-model="form.token"
            class="input w-full"
            placeholder="输入 Access Key Secret"
            required
          />
        </div>

        <div>
          <label
            for="endpoint"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Endpoint<span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="endpoint"
            v-model="form.endpoint"
            class="input w-full"
            placeholder="输入 Endpoint"
            required
          />
        </div>
      </div>

      <div class="flex justify-end space-x-2 mt-6">
        <button
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
        </button>
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
  appkey: "",
  token: "",
  endpoint: "",
});

// 监听prop变化，更新表单
watchEffect(() => {
  if (props.provider) {
    form.appkey = props.provider.appkey || "";
    form.token = props.provider.token || "";
    form.endpoint = props.provider.endpoint || "";
  }
});

// 保存表单
async function saveForm() {
  if (!form.appkey || !form.token || !form.endpoint) {
    toast.error("请填写必填字段");
    return;
  }

  isSaving.value = true;

  try {
    // 准备提交的数据
    const data = {
      appkey: form.appkey,
      token: form.token,
      endpoint: form.endpoint,
    };

    // 通知父组件更新
    emit("save", data);
  } catch (error) {
    console.error("保存服务商配置失败:", error);
    toast.error(
      "保存失败: " + (error instanceof Error ? error.message : String(error))
    );
  } finally {
    isSaving.value = false;
  }
}

// 测试连接
async function testConnection() {
  if (!form.appkey || !form.token || !form.endpoint) {
    toast.error("请先填写必填字段");
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
