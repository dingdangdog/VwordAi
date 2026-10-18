<template>
  <div class="mx-auto flex max-w-5xl gap-8 px-6 py-6">
    <nav class="w-48 shrink-0" aria-label="设置分类">
      <h1 class="mb-4 px-2.5 text-lg font-semibold text-ink">设置</h1>
      <div class="space-y-0.5 pl-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="nav-item w-full"
          :class="activeTab === tab.id && 'nav-item-active'"
          :aria-current="activeTab === tab.id ? 'page' : undefined"
          @click="setActiveTab(tab.id)"
        >
          <component :is="tab.icon" aria-hidden="true" />
          {{ tab.name }}
        </button>
      </div>
    </nav>

    <div class="min-w-0 flex-1">
      <header class="mb-5">
        <h2 class="text-base font-semibold text-ink">{{ current.name }}</h2>
        <p class="text-sm text-ink-muted">{{ current.description }}</p>
      </header>
      <AccountSettings v-if="activeTab === 'account'" />
      <SystemSettings v-else-if="activeTab === 'system'" />
      <AboutSettings v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { InformationCircleIcon, ServerIcon, UserCircleIcon } from "@heroicons/vue/24/outline";
import AccountSettings from "@/components/settings/AccountSettings.vue";
import SystemSettings from "@/components/settings/SystemSettings.vue";
import AboutSettings from "@/components/settings/AboutSettings.vue";
import { useSettingsStore, type SettingsTab } from "@/stores/settings";

const settingsStore = useSettingsStore();
const route = useRoute();
const router = useRouter();

const tabs = [
  { id: "account" as SettingsTab, name: "账号与服务", description: "官网账号、额度、同步与云端服务选择。", icon: UserCircleIcon },
  { id: "system" as SettingsTab, name: "外观与系统", description: "主题、导出目录与数据备份。", icon: ServerIcon },
  { id: "about" as SettingsTab, name: "关于", description: "版本信息、更新与诊断。", icon: InformationCircleIcon },
];

const activeTab = computed(() => settingsStore.activeTab);
const current = computed(() => tabs.find((t) => t.id === activeTab.value) || tabs[0]);

/** 兼容旧链接：tts / voice / llm 已合并到账号与服务 */
function normalizeTab(tab: string): SettingsTab | null {
  if (tab === "tts" || tab === "voice" || tab === "llm") return "account";
  return tabs.some((t) => t.id === tab) ? (tab as SettingsTab) : null;
}

watch(
  () => route.query.tab,
  (tab) => {
    const next = typeof tab === "string" ? normalizeTab(tab) : null;
    if (next) settingsStore.setActiveTab(next);
  },
  { immediate: true }
);

function setActiveTab(tab: SettingsTab) {
  settingsStore.setActiveTab(tab);
  router.replace({ query: { tab } });
}
</script>
