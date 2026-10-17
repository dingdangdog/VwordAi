<template>
  <section class="max-w-xl space-y-4 p-4">
    <h2 class="text-lg font-semibold">官网账号</h2>
    <label class="block text-sm">
      官网地址
      <input v-model="apiBase" class="mt-1 w-full rounded border border-border px-2 py-2" />
    </label>
    <div class="flex flex-wrap gap-2">
      <button class="rounded bg-primary px-3 py-2 text-sm text-white" type="button" @click="saveBase">保存地址</button>
      <button class="rounded border border-border px-3 py-2 text-sm" type="button" @click="login">登录</button>
      <button class="rounded border border-border px-3 py-2 text-sm" type="button" @click="sync">同步</button>
      <button class="rounded border border-border px-3 py-2 text-sm" type="button" @click="logout">退出</button>
    </div>
    <p class="text-sm text-ink-muted">{{ status }}</p>
    <p v-if="account" class="text-sm">
      {{ account.displayName || account.username }}
      <span v-if="account.quota"> · 已用 {{ account.quota.used }} / {{ account.quota.limit }}</span>
    </p>
    <fieldset class="space-y-2 border-t border-border pt-3">
      <legend class="text-sm font-medium">语言模型</legend>
      <p v-if="!llmProviders.length" class="text-sm text-ink-muted">登录后可选择管理员已启用的服务商和模型。</p>
      <div v-else class="grid gap-2 sm:grid-cols-2">
        <label class="block text-sm">
          服务商
          <select v-model="llmProviderId" class="mt-1 w-full rounded border border-border px-2 py-2" @change="llmModelId = ''">
            <option value="">未选择</option>
            <option v-for="item in llmProviders" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </label>
        <label class="block text-sm">
          模型
          <select v-model="llmModelId" class="mt-1 w-full rounded border border-border px-2 py-2">
            <option value="">未选择</option>
            <option v-for="item in llmModels" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </label>
      </div>
      <button class="rounded border border-border px-3 py-2 text-sm" type="button" @click="saveLlm">保存语言模型</button>
    </fieldset>
    <fieldset class="space-y-2">
      <legend class="text-sm font-medium">语音服务</legend>
      <div v-if="ttsProviders.length" class="grid gap-2 sm:grid-cols-2">
        <label class="block text-sm">
          服务商
          <select v-model="ttsProviderId" class="mt-1 w-full rounded border border-border px-2 py-2" @change="ttsModelId = ''">
            <option value="">未选择</option>
            <option v-for="item in ttsProviders" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </label>
        <label class="block text-sm">
          模型
          <select v-model="ttsModelId" class="mt-1 w-full rounded border border-border px-2 py-2">
            <option value="">未选择</option>
            <option v-for="item in ttsModels" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </label>
      </div>
      <button class="rounded border border-border px-3 py-2 text-sm" type="button" @click="saveTts">保存语音服务</button>
    </fieldset>
    <label class="block text-sm">
      默认导出目录
      <input :value="exportPath" class="mt-1 w-full rounded border border-border px-2 py-2" readonly />
    </label>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

interface CloudModel { id: string; name: string }
interface CloudProvider { id: string; name: string; models: CloudModel[] }

const apiBase = ref("https://vwordai.com");
const status = ref("");
const account = ref<{ displayName?: string; username?: string; quota?: { used: number; limit: number } } | null>(null);
const exportPath = ref("");
const llmProviders = ref<CloudProvider[]>([]);
const ttsProviders = ref<CloudProvider[]>([]);
const llmProviderId = ref("");
const llmModelId = ref("");
const ttsProviderId = ref("");
const ttsModelId = ref("");
const llmModels = computed(() => llmProviders.value.find((item) => item.id === llmProviderId.value)?.models || []);
const ttsModels = computed(() => ttsProviders.value.find((item) => item.id === ttsProviderId.value)?.models || []);

async function load() {
  const config = await window.electron.invoke("cloud:get-config");
  apiBase.value = config.data?.apiBase || apiBase.value;
  const settings = await window.electron.invoke("get-settings");
  exportPath.value = settings?.data?.defaultExportPath || settings?.defaultExportPath || "";
  if (config.data?.signedIn) {
    const result = await window.electron.invoke("cloud:account");
    if (result.success) account.value = result.data;
    const [llm, tts, choices] = await Promise.all([
      window.electron.invoke("cloud:services", "llm"),
      window.electron.invoke("cloud:services", "tts"),
      window.electron.invoke("cloud:service-choices"),
    ]);
    llmProviders.value = llm?.success ? llm.data || [] : [];
    ttsProviders.value = tts?.success ? tts.data || [] : [];
    llmProviderId.value = choices?.data?.llm?.providerId || "";
    llmModelId.value = choices?.data?.llm?.modelId || "";
    ttsProviderId.value = choices?.data?.tts?.providerId || "";
    ttsModelId.value = choices?.data?.tts?.modelId || "";
  }
}

async function saveChoice(kind: "llm" | "tts", providerId: string, modelId: string) {
  const result = await window.electron.invoke("cloud:save-service-choice", { kind, providerId, modelId });
  status.value = result?.success ? "已保存" : result?.error || "保存失败";
}

async function saveLlm() {
  await saveChoice("llm", llmProviderId.value, llmModelId.value);
}

async function saveTts() {
  await saveChoice("tts", ttsProviderId.value, ttsModelId.value);
}

async function saveBase() {
  await window.electron.invoke("cloud:set-base", apiBase.value);
  status.value = "官网地址已保存";
}

async function login() {
  status.value = "请在浏览器中确认登录";
  await saveBase();
  const result = await window.electron.invoke("cloud:login");
  status.value = result.success ? "已登录" : result.error || "登录失败";
  if (result.success) await load();
}

async function sync() {
  const result = await window.electron.invoke("cloud:sync");
  status.value = result.success ? "已同步" : result.error || "同步失败";
}

async function logout() {
  await window.electron.invoke("cloud:logout");
  account.value = null;
  llmProviders.value = [];
  ttsProviders.value = [];
  llmProviderId.value = "";
  llmModelId.value = "";
  ttsProviderId.value = "";
  ttsModelId.value = "";
  status.value = "已退出";
}

onMounted(load);
</script>
