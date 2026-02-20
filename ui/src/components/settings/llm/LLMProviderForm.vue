<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      {{ isNew ? "添加 LLM 服务商" : "编辑 LLM 配置" }}
    </h3>

    <form @submit.prevent="saveForm" class="space-y-4">
      <div class="flex items-center space-x-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">名称</label>
        <input
          v-model="form.name"
          type="text"
          class="input w-full"
          placeholder="例如：我的 OpenAI"
          required
        />
      </div>

      <div class="flex items-center space-x-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">协议</label>
        <select v-model="form.protocol" class="input w-full" :disabled="!isNew">
          <option v-for="p in protocolOptions" :key="p.value" :value="p.value">
            {{ p.label }}
          </option>
        </select>
      </div>

      <!-- OpenAI / Azure / Gemini / Claude -->
      <template v-if="['openai', 'azure', 'gemini', 'claude'].includes(form.protocol)">
        <div class="flex items-center space-x-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">
            API Key<span class="text-red-500">*</span>
          </label>
          <div class="relative w-full">
            <input
              :type="showKey ? 'text' : 'password'"
              v-model="form.key"
              class="input w-full pr-10"
              placeholder="输入 API Key"
            />
            <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center" @click="showKey = !showKey">
              <EyeIcon class="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Endpoint</label>
          <input v-model="form.endpoint" type="text" class="input w-full" placeholder="https://api.openai.com/v1" />
        </div>
        <div class="flex items-center space-x-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">模型</label>
          <input v-model="form.model" type="text" class="input w-full" placeholder="gpt-4o" />
        </div>
      </template>

      <!-- 火山引擎 -->
      <template v-else-if="form.protocol === 'volcengine'">
        <div class="flex items-center space-x-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Key<span class="text-red-500">*</span></label>
          <div class="relative w-full">
            <input
              :type="showKey ? 'text' : 'password'"
              v-model="form.key"
              class="input w-full pr-10"
              placeholder="火山引擎 API Key"
            />
            <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center" @click="showKey = !showKey">
              <EyeIcon class="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Endpoint</label>
          <input v-model="form.endpoint" type="text" class="input w-full" placeholder="https://ark.cn-beijing.volces.com/api/v3/" />
        </div>
        <div class="flex items-center space-x-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">模型</label>
          <input v-model="form.model" type="text" class="input w-full" placeholder="doubao-1.5-pro-32k-250115" />
        </div>
      </template>

      <!-- 阿里云 -->
      <template v-else-if="form.protocol === 'aliyun'">
        <div class="flex items-center space-x-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">AppKey<span class="text-red-500">*</span></label>
          <input v-model="form.appkey" type="text" class="input w-full" placeholder="阿里云 AppKey" />
        </div>
        <div class="flex items-center space-x-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Token<span class="text-red-500">*</span></label>
          <div class="relative w-full">
            <input
              :type="showKey ? 'text' : 'password'"
              v-model="form.token"
              class="input w-full pr-10"
              placeholder="阿里云 Token"
            />
            <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center" @click="showKey = !showKey">
              <EyeIcon class="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Endpoint</label>
          <input v-model="form.endpoint" type="text" class="input w-full" placeholder="阿里云 API 地址" />
        </div>
        <div class="flex items-center space-x-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">模型</label>
          <input v-model="form.model" type="text" class="input w-full" placeholder="qwen-max" />
        </div>
      </template>

      <!-- 通用参数 -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-4">
        <div class="flex items-center space-x-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">温度</label>
          <input v-model.number="form.temperature" type="number" min="0" max="2" step="0.1" class="input w-24" />
          <span class="text-sm text-gray-500">0–2，越低越稳定</span>
        </div>
        <div class="flex items-center space-x-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Max Tokens</label>
          <input v-model.number="form.maxTokens" type="number" min="256" max="128000" step="256" class="input w-24" />
        </div>
        <div v-if="form.protocol === 'volcengine'" class="flex items-center space-x-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Top P</label>
          <input v-model.number="form.topP" type="number" min="0" max="1" step="0.05" class="input w-24" />
        </div>
      </div>

      <div class="flex justify-between pt-4">
        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            {{ isSaving ? "保存中..." : "保存配置" }}
          </button>
          <button type="button" class="btn btn-secondary" :disabled="isTesting" @click="testConnection">
            {{ isTesting ? "测试中..." : "测试连接" }}
          </button>
        </div>
        <button
          v-if="!isNew && form.id"
          type="button"
          class="btn border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          @click="confirmDelete"
        >
          删除
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect, computed } from "vue";
import { useToast } from "vue-toastification";
import { EyeIcon } from "@heroicons/vue/24/outline";
import type { LLMProtocol, LLMProviderConfig } from "@/types";

const props = defineProps<{
  provider: LLMProviderConfig | null;
  isNew?: boolean;
  protocolOptions: { value: LLMProtocol; label: string }[];
}>();

const emit = defineEmits<{
  (e: "save", data: Partial<LLMProviderConfig>): void;
  (e: "delete", id: string): void;
}>();

const toast = useToast();
const showKey = ref(false);
const isSaving = ref(false);
const isTesting = ref(false);

const isNew = computed(() => props.isNew === true);

const form = reactive<Partial<LLMProviderConfig> & { protocol: LLMProtocol }>({
  id: "",
  name: "",
  protocol: "openai",
  key: "",
  endpoint: "",
  model: "",
  temperature: 0.3,
  maxTokens: 4096,
  topP: 0.95,
  appkey: "",
  token: "",
});

watchEffect(() => {
  const p = props.provider;
  if (p) {
    form.id = p.id;
    form.name = p.name;
    form.protocol = p.protocol;
    form.key = p.key ?? "";
    form.endpoint = p.endpoint ?? "";
    form.model = p.model ?? "";
    form.temperature = p.temperature ?? 0.3;
    form.maxTokens = p.maxTokens ?? 4096;
    form.topP = p.topP ?? 0.95;
    form.appkey = p.appkey ?? "";
    form.token = p.token ?? "";
  } else if (props.isNew) {
    form.id = "";
    form.name = "";
    form.protocol = "openai";
    form.key = "";
    form.endpoint = "";
    form.model = "";
    form.temperature = 0.3;
    form.maxTokens = 4096;
    form.topP = 0.95;
    form.appkey = "";
    form.token = "";
  }
});

async function saveForm() {
  if (!form.name?.trim()) {
    toast.error("请填写名称");
    return;
  }
  const protocol = form.protocol;
  if (["openai", "azure", "gemini", "claude", "volcengine"].includes(protocol) && !form.key?.trim()) {
    toast.error("请填写 API Key / Key");
    return;
  }
  if (protocol === "aliyun" && (!form.appkey?.trim() || !form.token?.trim())) {
    toast.error("请填写 AppKey 和 Token");
    return;
  }

  isSaving.value = true;
  try {
    const payload: Partial<LLMProviderConfig> = {
      id: form.id,
      name: form.name.trim(),
      protocol: form.protocol,
      key: form.key || undefined,
      endpoint: form.endpoint || undefined,
      model: form.model || undefined,
      temperature: form.temperature,
      maxTokens: form.maxTokens,
      topP: form.topP,
      appkey: form.appkey || undefined,
      token: form.token || undefined,
    };
    emit("save", payload);
  } finally {
    isSaving.value = false;
  }
}

async function testConnection() {
  if (isNew.value || !form.id) {
    toast.warning("请先保存配置后再测试");
    return;
  }
  isTesting.value = true;
  try {
    const { useSettingsStore } = await import("@/stores/settings");
    const store = useSettingsStore();
    const result = await store.testLLMProviderConnection(form.id!, { text: "连接测试" });
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  } catch (e) {
    toast.error(String(e));
  } finally {
    isTesting.value = false;
  }
}

function confirmDelete() {
  if (!form.id) return;
  if (window.confirm(`确定删除服务商「${form.name}」？`)) {
    emit("delete", form.id);
  }
}
</script>
