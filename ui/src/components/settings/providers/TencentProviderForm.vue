<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      腾讯云 TTS 配置
    </h3>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      配置腾讯云语音服务以使用腾讯云 TTS。请确保您已在腾讯云开通语音合成服务。
    </p>

    <form @submit.prevent="saveForm" class="space-y-4">
      <div>
        <label for="secretId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          SecretId<span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="secretId"
          v-model="form.secretId"
          class="input w-full"
          placeholder="输入您的腾讯云 SecretId"
          required
        />
      </div>

      <div>
        <label for="secretKey" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          SecretKey<span class="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="secretKey"
          v-model="form.secretKey"
          class="input w-full"
          placeholder="输入您的腾讯云 SecretKey"
          required
        />
      </div>

      <div>
        <label for="endpoint" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          自定义终结点 (可选)
        </label>
        <input
          type="text"
          id="endpoint"
          v-model="form.endpoint"
          class="input w-full"
          placeholder="例如: tts.tencentcloudapi.com"
        />
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
import { serviceProviderApi } from "@/utils/api";
import { useSettingsStore } from "@/stores/settings";

const props = defineProps({
  provider: {
    type: Object,
    default: () => ({
      secretId: "",
      secretKey: "",
      endpoint: "",
    }),
  },
});

const emit = defineEmits(["save", "cancel", "test"]);

const toast = useToast();
const settingsStore = useSettingsStore();
const isSaving = ref(false);
const isTesting = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

// 表单数据
const form = reactive({
  secretId: "",
  secretKey: "",
  endpoint: "",
});

// 监听属性变化，更新表单数据
watchEffect(() => {
  if (props.provider) {
    const config = props.provider.config || {};
    form.secretId = config.secretId || "";
    form.secretKey = config.secretKey || "";
    form.endpoint = config.endpoint || "";
  }
});

// 保存表单
async function saveForm() {
  if (!form.secretId) {
    toast.error("请提供您的腾讯云 SecretId");
    return;
  }

  if (!form.secretKey) {
    toast.error("请提供您的腾讯云 SecretKey");
    return;
  }

  isSaving.value = true;

  try {
    const data = {
      secretId: form.secretId,
      secretKey: form.secretKey,
      endpoint: form.endpoint,
    };

    const response = await serviceProviderApi.update("tencent", data);

    if (response.success) {
      
      toast.success("腾讯云配置已保存");
      emit("save", response.data);
    } else {
      toast.error("保存失败: " + response.error);
    }
  } catch (error) {
    console.error("保存腾讯云配置失败:", error);
    toast.error(
      "保存失败: " + (error instanceof Error ? error.message : String(error))
    );
  } finally {
    isSaving.value = false;
  }
}

// 测试连接
async function testConnection() {
  if (!form.secretId || !form.secretKey) {
    toast.error("请先填写必填字段");
    return;
  }

  isTesting.value = true;
  testResult.value = null;

  try {
    const response = await serviceProviderApi.testConnection("tencent");

    if (response.success) {
      testResult.value = {
        success: true,
        message: "连接测试成功",
      };
    } else {
      testResult.value = {
        success: false,
        message: response.error || "连接测试失败，请检查配置信息",
      };
    }

    emit("test", testResult.value);
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : "连接测试出错",
    };
    emit("test", testResult.value);
  } finally {
    isTesting.value = false;
  }
}
</script> 