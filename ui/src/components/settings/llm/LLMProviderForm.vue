<template>
  <div class="provider-form">
    <h3 class="text-lg font-semibold text-ink mb-4">
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
        hint="保存后按所选协议调用"
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
            <button type="button" class="p-2 rounded hover:bg-surface-hover" @click="showKey = !showKey" tabindex="-1">
              <EyeIcon class="h-5 w-5 text-ink-muted" />
            </button>
          </template>
        </FormInput>
        <FormInput
          v-model="form.endpoint"
          label="Endpoint"
          placeholder="https://api.openai.com/v1"
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
            <button type="button" class="p-2 rounded hover:bg-surface-hover" @click="showKey = !showKey" tabindex="-1">
              <EyeIcon class="h-5 w-5 text-ink-muted" />
            </button>
          </template>
        </FormInput>
        <FormInput
          v-model="form.endpoint"
          label="Endpoint"
          placeholder="https://ark.cn-beijing.volces.com/api/v3/"
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
            <button type="button" class="p-2 rounded hover:bg-surface-hover" @click="showKey = !showKey" tabindex="-1">
              <EyeIcon class="h-5 w-5 text-ink-muted" />
            </button>
          </template>
        </FormInput>
        <FormInput
          v-model="form.endpoint"
          label="Endpoint"
          placeholder="阿里云 API 地址"
        />
      </template>

      <div class="space-y-1">
        <div class="flex items-end gap-2">
          <div class="min-w-0 flex-1">
            <FormSelect
              v-if="showModelSelect"
              v-model="form.model"
              label="模型"
              placeholder="选择模型"
              :options="modelSelectOptions"
            />
            <FormInput
              v-else
              v-model="form.model"
              label="模型"
              :placeholder="modelPlaceholder"
            />
          </div>
          <button
            type="button"
            class="btn btn-secondary inline-flex h-[38px] shrink-0 items-center border border-border px-3 text-sm"
            :disabled="isFetchingModels"
            @click="fetchModels(false)"
          >
            {{ fetchButtonLabel }}
          </button>
        </div>
        <div class="flex items-start justify-between gap-3">
          <p class="text-sm text-ink-muted">{{ modelHint }}</p>
          <button
            v-if="modelOptions.length"
            type="button"
            class="shrink-0 text-sm text-primary hover:underline"
            @click="useManualModel = !useManualModel"
          >
            {{ useManualModel ? "从列表选择" : "手动输入" }}
          </button>
        </div>
      </div>

      <!-- 通用参数 -->
      <div class="border-t border-border pt-4 mt-4 space-y-4">
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
import { ref, reactive, watchEffect, watch, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { EyeIcon } from "@heroicons/vue/24/outline";
import FormInput from "@/components/common/FormInput.vue";
import FormSelect from "@/components/common/FormSelect.vue";
import { useSettingsStore } from "@/stores/settings";
import type { LLMModelOption, LLMProtocol, LLMProviderConfig } from "@/types";

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
const settingsStore = useSettingsStore();
const showKey = ref(false);
const isSaving = ref(false);
const isTesting = ref(false);
const isFetchingModels = ref(false);
const useManualModel = ref(true);
const modelOptions = ref<LLMModelOption[]>([]);
const modelHint = ref("填写密钥后可获取模型列表；不支持获取时请直接输入");
let fetchSeq = 0;

const isNew = computed(() => props.isNew === true);

const showModelSelect = computed(
  () => modelOptions.value.length > 0 && !useManualModel.value
);

const modelSelectOptions = computed(() => {
  const options = modelOptions.value.map((model) => ({
    value: model.id,
    label: model.name && model.name !== model.id ? `${model.name}（${model.id}）` : model.id,
  }));
  const current = form.model?.trim();
  if (current && !options.some((option) => option.value === current)) {
    options.unshift({ value: current, label: current });
  }
  return options;
});

const modelPlaceholder = computed(() => {
  switch (form.protocol) {
    case "volcengine":
      return "doubao-1.5-pro-32k-250115";
    case "aliyun":
      return "qwen-max";
    case "gemini":
      return "gemini-2.0-flash";
    case "claude":
      return "claude-3-5-sonnet-latest";
    default:
      return "gpt-4o";
  }
});

const fetchButtonLabel = computed(() => {
  if (isFetchingModels.value) return "获取中...";
  return modelOptions.value.length ? "重新获取" : "获取模型";
});

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

watch(
  () => form.protocol,
  (next, prev) => {
    if (!prev || next === prev) return;
    fetchSeq += 1;
    modelOptions.value = [];
    useManualModel.value = true;
    modelHint.value = "协议已更改，可重新获取模型列表，或直接输入模型名称";
  }
);

watch(
  () => [form.endpoint, form.key, form.token, form.appkey].join("\u0001"),
  (next, prev) => {
    if (!prev || next === prev || !modelOptions.value.length) return;
    fetchSeq += 1;
    modelOptions.value = [];
    useManualModel.value = true;
    modelHint.value = "连接信息已更改，请重新获取模型列表，或直接输入模型名称";
  }
);

onMounted(() => {
  if (!isNew.value && canFetchModels() === "") {
    fetchModels(true);
  }
});

function canFetchModels(): string {
  const protocol = form.protocol;
  if (["openai", "azure", "gemini", "claude", "volcengine"].includes(protocol)) {
    if (!form.key?.trim()) return "请先填写 API Key";
    if (protocol === "azure" && !form.endpoint?.trim()) return "请先填写 Endpoint";
    return "";
  }
  if (protocol === "aliyun" && !form.token?.trim() && !form.appkey?.trim()) {
    return "请先填写 Token";
  }
  return "";
}

async function fetchModels(silent: boolean) {
  const reason = canFetchModels();
  if (reason) {
    modelHint.value = reason;
    if (!silent) toast.warning(reason);
    return;
  }

  const seq = ++fetchSeq;
  isFetchingModels.value = true;
  modelHint.value = "正在获取模型列表...";
  try {
    const result = await settingsStore.listLLMModels({
      protocol: form.protocol,
      key: form.key,
      endpoint: form.endpoint,
      appkey: form.appkey,
      token: form.token,
    });
    if (seq !== fetchSeq) return;
    if (!result.success || !result.data) {
      modelOptions.value = [];
      useManualModel.value = true;
      modelHint.value = result.message || "获取失败，请手动输入模型名称";
      if (!silent) toast.error(modelHint.value);
      return;
    }

    const data = result.data;
    if (seq !== fetchSeq) return;
    modelOptions.value = data.models || [];
    if (!data.supported || modelOptions.value.length === 0) {
      useManualModel.value = true;
      modelHint.value = data.message || "该服务商不支持获取模型列表，请手动输入";
      if (!silent) toast.warning(modelHint.value);
      return;
    }

    useManualModel.value = false;
    modelHint.value = data.message || `已获取 ${modelOptions.value.length} 个模型`;
  } catch (error) {
    if (seq !== fetchSeq) return;
    modelOptions.value = [];
    useManualModel.value = true;
    modelHint.value = error instanceof Error ? error.message : "获取失败，请手动输入模型名称";
    if (!silent) toast.error(modelHint.value);
  } finally {
    if (seq === fetchSeq) isFetchingModels.value = false;
  }
}

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
    const result = await settingsStore.testLLMProviderConnection(form.id!, { text: "连接测试" });
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
