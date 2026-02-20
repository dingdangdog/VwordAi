<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      {{ isNew ? "添加 LLM 服务商" : "编辑 LLM 配置" }}
    </h3>

    <form @submit.prevent="saveForm" class="space-y-4">
      <FormInput
        v-model="form.name"
        label="名称"
        placeholder="例如：我的 OpenAI"
        required
      />

      <FormSelect
        v-model="form.protocol"
        label="协议"
        :options="protocolOptions"
        :disabled="!isNew"
      />

      <!-- OpenAI / Azure / Gemini / Claude -->
      <template v-if="['openai', 'azure', 'gemini', 'claude'].includes(form.protocol)">
        <FormInput
          v-model="form.key"
          :type="showKey ? 'text' : 'password'"
          label="API Key"
          placeholder="输入 API Key"
        >
          <template #label>API Key<span class="text-red-500">*</span></template>
          <template #suffix>
            <button type="button" class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" @click="showKey = !showKey" tabindex="-1">
              <EyeIcon class="h-5 w-5 text-gray-500" />
            </button>
          </template>
        </FormInput>
        <FormInput
          v-model="form.endpoint"
          label="Endpoint"
          placeholder="https://api.openai.com/v1"
        />
        <FormInput
          v-model="form.model"
          label="模型"
          placeholder="gpt-4o"
        />
      </template>

      <!-- 火山引擎 -->
      <template v-else-if="form.protocol === 'volcengine'">
        <FormInput
          v-model="form.key"
          :type="showKey ? 'text' : 'password'"
          label="Key"
          placeholder="火山引擎 API Key"
        >
          <template #label>Key<span class="text-red-500">*</span></template>
          <template #suffix>
            <button type="button" class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" @click="showKey = !showKey" tabindex="-1">
              <EyeIcon class="h-5 w-5 text-gray-500" />
            </button>
          </template>
        </FormInput>
        <FormInput
          v-model="form.endpoint"
          label="Endpoint"
          placeholder="https://ark.cn-beijing.volces.com/api/v3/"
        />
        <FormInput
          v-model="form.model"
          label="模型"
          placeholder="doubao-1.5-pro-32k-250115"
        />
      </template>

      <!-- 阿里云 -->
      <template v-else-if="form.protocol === 'aliyun'">
        <FormInput
          v-model="form.appkey"
          label="AppKey"
          placeholder="阿里云 AppKey"
        >
          <template #label>AppKey<span class="text-red-500">*</span></template>
        </FormInput>
        <FormInput
          v-model="form.token"
          :type="showKey ? 'text' : 'password'"
          label="Token"
          placeholder="阿里云 Token"
        >
          <template #label>Token<span class="text-red-500">*</span></template>
          <template #suffix>
            <button type="button" class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" @click="showKey = !showKey" tabindex="-1">
              <EyeIcon class="h-5 w-5 text-gray-500" />
            </button>
          </template>
        </FormInput>
        <FormInput
          v-model="form.endpoint"
          label="Endpoint"
          placeholder="阿里云 API 地址"
        />
        <FormInput
          v-model="form.model"
          label="模型"
          placeholder="qwen-max"
        />
      </template>

      <!-- 通用参数 -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-4">
        <FormInput
          v-model.number="form.temperature"
          type="number"
          label="温度"
          :min="0"
          :max="2"
          :step="0.1"
        >
          <template #hint>0–2，越低越稳定</template>
        </FormInput>
        <FormInput
          v-model.number="form.maxTokens"
          type="number"
          label="Max Tokens"
          :min="256"
          :max="128000"
          :step="256"
        />
        <FormInput
          v-if="form.protocol === 'volcengine'"
          v-model.number="form.topP"
          type="number"
          label="Top P"
          :min="0"
          :max="1"
          :step="0.05"
        />
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
import FormInput from "@/components/common/FormInput.vue";
import FormSelect from "@/components/common/FormSelect.vue";
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
