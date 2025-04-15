<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      阿里云语音服务配置
    </h3>

    <form @submit.prevent="saveForm">
      <div class="space-y-4">
        <div>
          <label
            for="appKey"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            App Key<span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="appKey"
            v-model="form.appKey"
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
            for="region"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            区域 <span class="text-red-500">*</span>
          </label>
          <select
            id="region"
            v-model="form.region"
            class="input w-full"
            required
          >
            <option value="">请选择区域</option>
            <option value="cn-hangzhou">华东1（杭州）</option>
            <option value="cn-shanghai">华东2（上海）</option>
            <option value="cn-qingdao">华北1（青岛）</option>
            <option value="cn-beijing">华北2（北京）</option>
            <option value="cn-zhangjiakou">华北3（张家口）</option>
            <option value="cn-huhehaote">华北5（呼和浩特）</option>
            <option value="cn-wulanchabu">华北6（乌兰察布）</option>
            <option value="cn-shenzhen">华南1（深圳）</option>
            <option value="cn-heyuan">华南2（河源）</option>
            <option value="cn-guangzhou">华南3（广州）</option>
            <option value="cn-chengdu">西南1（成都）</option>
            <option value="cn-hongkong">中国（香港）</option>
          </select>
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
import { serviceProviderApi } from "@/utils/api";
import { useSettingsStore } from "@/stores/settings";

const props = defineProps({
  provider: {
    type: Object,
    default: () => ({
      endpoint: "",
      appKey: "",
      token: "",
      region: "",
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
  appKey: "",
  token: "",
  region: "",
  endpoint: "",
});

// 监听prop变化，更新表单
watchEffect(() => {
  if (props.provider) {
    // 从provider和config中获取数据
    const config = props.provider.config || {};

    form.appKey = props.provider.apiKey || config.appkey || "";
    form.token = props.provider.secretKey || config.token || "";
    form.appKey = config.appKey || "";
    form.endpoint = props.provider.endpoint || config.endpoint || "";
  }
});

// 保存表单
async function saveForm() {
  if (!form.appKey || !form.token || !form.region) {
    toast.error("请填写必填字段");
    return;
  }

  isSaving.value = true;

  try {
    // 准备提交的数据 - 使用固定的ID "aliyun"
    const data = {
      appkey: form.appKey,
      token: form.token,
      endpoint: form.endpoint,
    };

    // 调用API更新服务商配置
    const response = await serviceProviderApi.update("aliyun", data);

    if (response.success) {
      await settingsStore.loadServiceProviders();
      toast.success("阿里云配置已保存");
      emit("save", response.data);
    } else {
      toast.error("保存失败: " + response.error);
    }
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
  if (!form.appKey || !form.token || !form.region) {
    toast.error("请先填写必填字段");
    return;
  }

  isTesting.value = true;
  testResult.value = null;

  try {
    // 使用固定的ID "aliyun"来测试连接
    const response = await serviceProviderApi.testConnection("aliyun");

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
