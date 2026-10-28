import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface PoolQuota {
  used: number;
  limit: number;
  borrowedOut?: number;
}

export interface CloudQuota {
  used: number;
  limit: number;
  periodStart?: string;
  periodEnd?: string;
  allowBorrow?: boolean;
  llm?: PoolQuota;
  tts?: PoolQuota;
}

export interface CloudAccount {
  id?: string;
  username?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  allowQuotaBorrow?: boolean;
  quota?: CloudQuota | null;
}

export interface CloudVoice {
  id: string;
  name: string;
  providerName?: string;
  emotions?: Array<{ code: string; name: string }>;
  roles?: Array<{ code: string; name: string }>;
  previewUrl?: string;
}

export const useAccountStore = defineStore("account", () => {
  const apiBase = ref("https://vwordai.com");
  const signedIn = ref(false);
  const account = ref<CloudAccount | null>(null);
  const loaded = ref(false);
  const loading = ref(false);
  const syncing = ref(false);
  const lastSyncedAt = ref<number | null>(null);
  const voices = ref<CloudVoice[]>([]);
  const voicesLoaded = ref(false);
  const vpointBalance = ref<number | null>(null);

  const displayName = computed(
    () => account.value?.displayName || account.value?.username || (signedIn.value ? "已登录" : "未登录")
  );
  const initials = computed(() => displayName.value.trim().slice(0, 1).toUpperCase() || "?");

  async function refresh() {
    loading.value = true;
    try {
      const config = await window.electron.invoke("cloud:get-config");
      apiBase.value = config?.data?.apiBase || apiBase.value;
      signedIn.value = Boolean(config?.data?.signedIn);
      if (signedIn.value) {
        const [result, wallet] = await Promise.all([
          window.electron.invoke("cloud:account"),
          window.electron.invoke("cloud:vpoints"),
        ]);
        account.value = result?.success ? result.data : null;
        if (wallet?.success && typeof wallet.data?.balance === "number") vpointBalance.value = wallet.data.balance;
      } else {
        account.value = null;
        vpointBalance.value = null;
      }
    } catch (error) {
      console.error("读取账户失败:", error);
    } finally {
      loaded.value = true;
      loading.value = false;
    }
  }

  async function loadVoices(force = false) {
    if (voicesLoaded.value && !force) return voices.value;
    try {
      const result = await window.electron.invoke("cloud:voices");
      voices.value = result?.success && Array.isArray(result.data) ? result.data : [];
      voicesLoaded.value = true;
    } catch (error) {
      console.error("读取音色失败:", error);
    }
    return voices.value;
  }

  const quotas = computed(() => {
    const quota = account.value?.quota;
    if (!quota) return null;
    const tts = quota.tts ?? { limit: quota.limit, used: quota.used, borrowedOut: 0 };
    const llm = quota.llm ?? { limit: 0, used: 0, borrowedOut: 0 };
    if (tts.limit <= 0 && llm.limit <= 0) return null;
    return { periodEnd: quota.periodEnd, llm, tts };
  });

  async function setQuotaBorrow(allow: boolean) {
    const result = await window.electron.invoke("cloud:set-quota-borrow", allow);
    if (result?.success && account.value) {
      account.value = {
        ...account.value,
        allowQuotaBorrow: allow,
        quota: account.value.quota ? { ...account.value.quota, allowBorrow: allow } : account.value.quota,
      };
    }
    return { success: Boolean(result?.success), error: result?.error as string | undefined };
  }

  function voiceName(id?: string | null) {
    if (!id) return "";
    return voices.value.find((voice) => voice.id === id)?.name || id;
  }

  async function setApiBase(value: string) {
    await window.electron.invoke("cloud:set-base", value);
    apiBase.value = value.replace(/\/$/, "");
  }

  async function login(): Promise<{ success: boolean; error?: string }> {
    const result = await window.electron.invoke("cloud:login");
    if (result?.success) await refresh();
    return { success: Boolean(result?.success), error: result?.error };
  }

  function setVpointBalance(value: number | null) {
    vpointBalance.value = value;
  }

  async function logout() {
    await window.electron.invoke("cloud:logout");
    signedIn.value = false;
    account.value = null;
    vpointBalance.value = null;
  }

  async function sync(): Promise<{ success: boolean; error?: string }> {
    syncing.value = true;
    try {
      const result = await window.electron.invoke("cloud:sync");
      if (result?.success) {
        lastSyncedAt.value = Date.now();
        refresh();
      }
      return { success: Boolean(result?.success), error: result?.error };
    } finally {
      syncing.value = false;
    }
  }

  return {
    apiBase,
    signedIn,
    account,
    loaded,
    loading,
    syncing,
    lastSyncedAt,
    voices,
    voicesLoaded,
    vpointBalance,
    displayName,
    initials,
    quotas,
    refresh,
    loadVoices,
    voiceName,
    setApiBase,
    setQuotaBorrow,
    setVpointBalance,
    login,
    logout,
    sync,
  };
});
