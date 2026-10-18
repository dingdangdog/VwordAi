<template>
  <div class="space-y-6">
    <!-- 账号 -->
    <section class="panel p-5">
      <div class="flex items-center gap-4">
        <span
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold"
          :class="accountStore.signedIn ? 'bg-accent/15 text-accent' : 'bg-soft text-ink-subtle'"
        >
          <UserIcon v-if="!accountStore.signedIn" class="h-6 w-6" aria-hidden="true" />
          <template v-else>{{ accountStore.initials }}</template>
        </span>
        <div class="min-w-0 flex-1">
          <p class="flex items-center gap-2 text-sm font-semibold text-ink">
            {{ accountStore.displayName }}
            <VBadge v-if="accountStore.signedIn" tone="success" dot>已连接</VBadge>
          </p>
          <p class="truncate text-xs text-ink-subtle">
            {{ accountStore.account?.email || (accountStore.signedIn ? accountStore.apiBase : "登录后可使用云端音色、AI 分角色与多端同步") }}
          </p>
        </div>
        <template v-if="accountStore.signedIn">
          <VButton :icon="ArrowPathIcon" :loading="accountStore.syncing" @click="sync">同步</VButton>
          <VButton variant="ghost" :icon="ArrowRightOnRectangleIcon" @click="logout">退出</VButton>
        </template>
        <VButton v-else variant="primary" :loading="loggingIn" @click="login">登录官网账号</VButton>
      </div>

      <div v-if="accountStore.signedIn" class="mt-5 border-t border-line pt-4">
        <VMeter v-if="quota" :value="quota.used" :max="quota.limit" label="本月已用字数" />
        <p v-else class="text-xs text-ink-subtle">当前账号暂无订阅额度，可在官网订阅套餐。</p>
        <p v-if="accountStore.lastSyncedAt" class="mt-2 text-2xs text-ink-subtle">上次同步：{{ formatRelative(accountStore.lastSyncedAt) }}</p>
      </div>
      <p v-if="loggingIn" class="mt-4 rounded-md bg-info/10 px-3 py-2 text-xs text-info">
        已在浏览器打开授权页面，请在官网确认登录；确认后此处会自动刷新。
      </p>
    </section>

    <!-- 服务选择 -->
    <section class="panel">
      <div class="panel-header">云端服务</div>
      <div v-if="!accountStore.signedIn" class="p-5 text-sm text-ink-muted">登录后可选择管理员已启用的服务商和模型。</div>
      <div v-else class="divide-y divide-line">
        <div v-for="kind in kinds" :key="kind.id" class="grid gap-3 p-5 sm:grid-cols-[160px_1fr_1fr_auto] sm:items-end">
          <div class="pb-1.5">
            <p class="text-sm font-medium text-ink">{{ kind.label }}</p>
            <p class="text-xs text-ink-subtle">{{ kind.hint }}</p>
          </div>
          <VSelect
            v-model="choices[kind.id].providerId"
            label="服务商"
            placeholder="未选择"
            :options="providers[kind.id].map((p) => ({ label: p.name, value: p.id }))"
            @update:model-value="choices[kind.id].modelId = ''"
          />
          <VSelect
            v-model="choices[kind.id].modelId"
            label="模型"
            placeholder="未选择"
            :options="modelsOf(kind.id).map((m) => ({ label: m.name, value: m.id }))"
            :disabled="!choices[kind.id].providerId"
          />
          <VButton :loading="savingKind === kind.id" :disabled="!choices[kind.id].modelId" @click="saveChoice(kind.id)">保存</VButton>
        </div>
      </div>
    </section>

    <!-- 官网地址 -->
    <section class="panel p-5">
      <div class="flex flex-wrap items-end gap-3">
        <VInput
          v-model="apiBase"
          label="官网地址"
          hint="私有部署时改为自己的服务地址。"
          mono
          wrapper-class="min-w-[280px] flex-1"
        />
        <VButton class="mb-5" :disabled="apiBase.replace(/\/$/, '') === accountStore.apiBase" @click="saveBase">保存地址</VButton>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useToast } from "vue-toastification";
import { ArrowPathIcon, ArrowRightOnRectangleIcon, UserIcon } from "@heroicons/vue/24/outline";
import VBadge from "@/components/ui/VBadge.vue";
import VButton from "@/components/ui/VButton.vue";
import VInput from "@/components/ui/VInput.vue";
import VMeter from "@/components/ui/VMeter.vue";
import VSelect from "@/components/ui/VSelect.vue";
import { useAccountStore } from "@/stores/account";
import { formatRelative } from "@/utils/format";

type Kind = "llm" | "tts";
interface CloudModel {
  id: string;
  name: string;
}
interface CloudProvider {
  id: string;
  name: string;
  models: CloudModel[];
}

const toast = useToast();
const accountStore = useAccountStore();

const kinds: { id: Kind; label: string; hint: string }[] = [
  { id: "llm", label: "语言模型", hint: "用于 AI 分角色与文本处理" },
  { id: "tts", label: "语音服务", hint: "用于云端语音合成" },
];

const apiBase = ref(accountStore.apiBase);
const loggingIn = ref(false);
const savingKind = ref<Kind | null>(null);
const providers = reactive<Record<Kind, CloudProvider[]>>({ llm: [], tts: [] });
const choices = reactive<Record<Kind, { providerId: string; modelId: string }>>({
  llm: { providerId: "", modelId: "" },
  tts: { providerId: "", modelId: "" },
});

const quota = computed(() => {
  const q = accountStore.account?.quota;
  return q && q.limit > 0 ? q : null;
});

watch(
  () => accountStore.apiBase,
  (value) => (apiBase.value = value)
);

function modelsOf(kind: Kind) {
  return providers[kind].find((p) => p.id === choices[kind].providerId)?.models || [];
}

async function loadServices() {
  if (!accountStore.signedIn) return;
  const [llm, tts, saved] = await Promise.all([
    window.electron.invoke("cloud:services", "llm"),
    window.electron.invoke("cloud:services", "tts"),
    window.electron.invoke("cloud:service-choices"),
  ]);
  providers.llm = llm?.success ? llm.data || [] : [];
  providers.tts = tts?.success ? tts.data || [] : [];
  for (const kind of ["llm", "tts"] as Kind[]) {
    choices[kind].providerId = saved?.data?.[kind]?.providerId || "";
    choices[kind].modelId = saved?.data?.[kind]?.modelId || "";
  }
}

async function saveChoice(kind: Kind) {
  savingKind.value = kind;
  const result = await window.electron.invoke("cloud:save-service-choice", { kind, ...choices[kind] });
  savingKind.value = null;
  if (result?.success) toast.success("已保存");
  else toast.error(result?.error || "保存失败");
}

async function saveBase() {
  await accountStore.setApiBase(apiBase.value);
  toast.success("官网地址已保存");
}

async function login() {
  loggingIn.value = true;
  if (apiBase.value.replace(/\/$/, "") !== accountStore.apiBase) await accountStore.setApiBase(apiBase.value);
  const result = await accountStore.login();
  loggingIn.value = false;
  if (result.success) {
    toast.success("登录成功");
    await loadServices();
  } else {
    toast.error(result.error || "登录失败");
  }
}

async function sync() {
  const result = await accountStore.sync();
  if (result.success) toast.success("同步完成");
  else toast.error(result.error || "同步失败");
}

async function logout() {
  await accountStore.logout();
  providers.llm = [];
  providers.tts = [];
  for (const kind of ["llm", "tts"] as Kind[]) choices[kind] = { providerId: "", modelId: "" };
  toast.info("已退出登录");
}

onMounted(async () => {
  await accountStore.refresh();
  await loadServices();
});
</script>
