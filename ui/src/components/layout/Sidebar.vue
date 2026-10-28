<template>
  <aside
    class="flex shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-base ease-standard"
    :class="collapsed ? 'w-14' : 'w-[232px]'"
    aria-label="主导航"
  >
    <div class="flex h-12 items-center px-2" :class="collapsed ? 'justify-center' : 'justify-between pl-4'">
      <span v-if="!collapsed" class="section-title">导航</span>
      <button
        type="button"
        class="btn btn-ghost btn-icon btn-sm"
        :aria-label="collapsed ? '展开侧栏' : '收起侧栏'"
        :title="collapsed ? '展开侧栏' : '收起侧栏'"
        @click="emit('toggle')"
      >
        <ChevronDoubleRightIcon v-if="collapsed" aria-hidden="true" />
        <ChevronDoubleLeftIcon v-else aria-hidden="true" />
      </button>
    </div>

    <nav class="flex-1 space-y-0.5 overflow-y-auto px-2">
      <RouterLink
        v-for="item in mainNav"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="[isActive(item) && 'nav-item-active', collapsed && 'justify-center px-0']"
        :title="collapsed ? item.label : undefined"
        :aria-current="isActive(item) ? 'page' : undefined"
      >
        <component :is="item.icon" aria-hidden="true" />
        <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="space-y-2 border-t border-line p-2">
      <RouterLink
        to="/settings"
        class="nav-item"
        :class="[isActive(settingsNav) && 'nav-item-active', collapsed && 'justify-center px-0']"
        :title="collapsed ? settingsNav.label : undefined"
      >
        <Cog6ToothIcon aria-hidden="true" />
        <span v-if="!collapsed">{{ settingsNav.label }}</span>
      </RouterLink>

      <RouterLink
        to="/settings?tab=account"
        class="flex items-center gap-2.5 rounded-md p-1.5 transition-colors duration-fast hover:bg-soft"
        :class="collapsed && 'justify-center'"
        :title="collapsed ? accountStore.displayName : '账号与服务'"
      >
        <span
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          :class="accountStore.signedIn ? 'bg-accent/15 text-accent' : 'bg-soft text-ink-subtle'"
        >
          <UserIcon v-if="!accountStore.signedIn" class="h-4 w-4" aria-hidden="true" />
          <template v-else>{{ accountStore.initials }}</template>
        </span>
        <div v-if="!collapsed" class="min-w-0 flex-1">
          <p class="truncate text-xs font-medium text-ink">{{ accountStore.displayName }}</p>
          <p v-if="accountStore.vpointBalance !== null" class="num truncate text-2xs text-ink-subtle">
            {{ accountStore.vpointBalance.toLocaleString() }} V豆
          </p>
          <div v-if="accountStore.quotas" class="mt-1 space-y-1.5">
            <VMeter :value="accountStore.quotas.llm.used" :max="accountStore.quotas.llm.limit" label="模型额度" />
            <VMeter :value="accountStore.quotas.tts.used" :max="accountStore.quotas.tts.limit" label="合成额度" />
          </div>
          <p v-else class="truncate text-2xs text-ink-subtle">
            {{ accountStore.signedIn ? "暂无订阅额度" : "登录后使用云端服务" }}
          </p>
        </div>
      </RouterLink>

      <VSegmented
        v-if="!collapsed"
        :model-value="settingsStore.theme"
        :options="themeOptions"
        label="主题"
        size="sm"
        icon-only
        block
        @update:model-value="settingsStore.setTheme"
      />
      <button
        v-else
        type="button"
        class="btn btn-ghost btn-icon btn-sm mx-auto flex"
        :title="`主题：${currentTheme.label}（点击切换）`"
        :aria-label="`主题：${currentTheme.label}`"
        @click="cycleTheme"
      >
        <component :is="currentTheme.icon" aria-hidden="true" />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, type Component } from "vue";
import { useRoute } from "vue-router";
import {
  BookOpenIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  Cog6ToothIcon,
  ComputerDesktopIcon,
  CreditCardIcon,
  FolderIcon,
  MoonIcon,
  SignalIcon,
  Squares2X2Icon,
  SunIcon,
  UserIcon,
} from "@heroicons/vue/24/outline";
import VMeter from "@/components/ui/VMeter.vue";
import VSegmented from "@/components/ui/VSegmented.vue";
import { useAccountStore } from "@/stores/account";
import { useSettingsStore, type ThemeMode } from "@/stores/settings";

defineProps<{ collapsed: boolean }>();
const emit = defineEmits<{ toggle: [] }>();

interface NavItem {
  to: string;
  label: string;
  icon: Component;
  match: (path: string) => boolean;
}

const route = useRoute();
const accountStore = useAccountStore();
const settingsStore = useSettingsStore();

const mainNav: NavItem[] = [
  { to: "/", label: "工作台", icon: Squares2X2Icon, match: (p) => p === "/" },
  { to: "/projects", label: "读文章", icon: FolderIcon, match: (p) => p.startsWith("/projects") },
  {
    to: "/read-novels",
    label: "有声小说",
    icon: BookOpenIcon,
    match: (p) => p.startsWith("/read-novels") || p.startsWith("/chapters"),
  },
  { to: "/billing", label: "订阅", icon: CreditCardIcon, match: (p) => p.startsWith("/billing") },
  { to: "/bililive", label: "直播", icon: SignalIcon, match: (p) => p.startsWith("/bililive") },
];

const settingsNav: NavItem = {
  to: "/settings",
  label: "设置",
  icon: Cog6ToothIcon,
  match: (p) => p.startsWith("/settings") || p.startsWith("/about"),
};

const themeOptions: { label: string; value: ThemeMode; icon: Component }[] = [
  { label: "跟随系统", value: "system", icon: ComputerDesktopIcon },
  { label: "浅色", value: "light", icon: SunIcon },
  { label: "深色", value: "dark", icon: MoonIcon },
];

const currentTheme = computed(
  () => themeOptions.find((option) => option.value === settingsStore.theme) || themeOptions[0]
);

function isActive(item: NavItem) {
  return item.match(route.path);
}

function cycleTheme() {
  const index = themeOptions.findIndex((option) => option.value === settingsStore.theme);
  settingsStore.setTheme(themeOptions[(index + 1) % themeOptions.length].value);
}

onMounted(() => {
  if (!accountStore.loaded) accountStore.refresh();
});
</script>
