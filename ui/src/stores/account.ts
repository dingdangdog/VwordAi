import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface CloudQuota {
  used: number;
  limit: number;
  periodStart?: string;
  periodEnd?: string;
}

export interface CloudAccount {
  id?: string;
  username?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  quota?: CloudQuota | null;
}

export interface CloudVoice {
  id: string;
  name: string;
  providerName?: string;
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
        const result = await window.electron.invoke("cloud:account");
        account.value = result?.success ? result.data : null;
      } else {
        account.value = null;
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

  async function logout() {
    await window.electron.invoke("cloud:logout");
    signedIn.value = false;
    account.value = null;
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
    displayName,
    initials,
    refresh,
    loadVoices,
    voiceName,
    setApiBase,
    login,
    logout,
    sync,
  };
});
