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

// 测试配置
async function testConnection() {
  if (!form.appkey || !form.token || !form.endpoint) {
    toast.error("请先填写必填字段");
    return;
  }

  isTesting.value = true;

  try {
    // 通知父组件执行测试
    emit("test", {
      appkey: form.appkey,
      token: form.token,
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
