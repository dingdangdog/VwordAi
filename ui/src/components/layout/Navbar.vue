<template>
  <nav
    class="bg-surface-elevated shadow sticky top-0 left-0 w-full z-50 drag-area"
  >
    <div class="px-4">
      <div class="flex justify-between h-12">
        <div class="flex items-center">
          <div class="flex-shrink-0 flex items-center">
            <img class="h-8 w-auto" src="@/assets/logo.svg" alt="Logo" />
            <span class="ml-2 text-xl font-bold text-ink">VwordAi</span>
          </div>
          <div class="ml-10 flex items-baseline space-x-4 no-drag">
            <a
              href="#/"
              class="px-3 py-2 text-sm font-semibold rounded-md transition-colors"
              :class="[
                $route.path === '/'
                  ? 'bg-primary text-white'
                  : 'text-ink hover:bg-surface-hover',
              ]"
              @click.prevent="navigateTo('/')"
            >
              首页
            </a>
            <!-- <a
              href="#/projects"
              class="px-3 py-2 text-sm font-semibold"
              :class="[
                $route.path.startsWith('/projects')
                  ? 'bg-gradient-to-b from-blue-100/10 via-blue-500 to-blue-100/10 text-white'
                  : 'text-ink hover:bg-surface-hover',
              ]"
              @click.prevent="navigateTo('/projects')"
            >
              项目管理
            </a> -->
            <a
              href="#/settings"
              class="px-3 py-2 text-sm font-semibold rounded-md transition-colors"
              :class="[
                $route.path === '/settings'
                  ? 'bg-primary text-white'
                  : 'text-ink hover:bg-surface-hover',
              ]"
              @click.prevent="navigateTo('/settings')"
            >
              设置
            </a>
            <!-- <a
              href="#/bililive"
              class="px-3 py-2 text-sm font-semibold"
              :class="[
                $route.path === '/bililive'
                  ? 'bg-gradient-to-b from-blue-100/10 via-blue-500 to-blue-100/10 text-white'
                  : 'text-ink hover:bg-surface-hover',
              ]"
              @click.prevent="navigateTo('/bililive')"
            >
              Bili 直播
            </a> -->
          </div>
        </div>
        <div class="flex items-center no-drag">
          <!-- Theme Toggle Button -->
          <button
            @click="toggleTheme"
            class="p-2 rounded-full text-ink-muted hover:text-ink mr-4 transition-colors"
            title="切换主题"
          >
            <SunIcon v-if="isDarkMode" class="h-6 w-6" />
            <MoonIcon v-else class="h-6 w-6" />
          </button>

          <!-- Window Control Buttons -->
          <button
            class="h-6 w-6 rounded-sm text-ink hover:bg-surface-hover flex items-center justify-center cursor-pointer mr-2 transition-colors"
            @click="minimizeWindow"
            title="最小化"
          >
            <MinusIcon />
          </button>
          <button
            class="h-6 w-6 rounded-sm text-ink hover:bg-surface-hover flex items-center justify-center cursor-pointer mr-2 transition-colors"
            @click="maximizeWindow"
            title="最大化"
            v-show="!isMax"
          >
            <WindowIcon />
          </button>
          <button
            class="h-6 w-6 rounded-sm text-ink hover:bg-surface-hover flex items-center justify-center cursor-pointer mr-2 transition-colors"
            @click="maximizeWindow"
            title="还原"
            v-show="isMax"
          >
            <ComputerDesktopIcon />
          </button>
          <button
            class="h-6 w-6 rounded-sm text-ink hover:bg-surface-hover flex items-center justify-center cursor-pointer transition-colors"
            @click="closeWindow"
            title="关闭"
          >
            <XMarkIcon />
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useSettingsStore } from "@/stores/settings";
import { useRouter } from "vue-router";
import {
  SunIcon,
  MoonIcon,
  XMarkIcon,
  MinusIcon,
  WindowIcon,
  ComputerDesktopIcon,
} from "@heroicons/vue/24/outline";

const settingsStore = useSettingsStore();
const router = useRouter();
const isDarkMode = computed(() => settingsStore.theme === "dark");
const isMax = ref(false);

function toggleTheme() {
  const newTheme = settingsStore.theme === "light" ? "dark" : "light";
  settingsStore.toggleTheme();

  // Save theme to settings for persistence across sessions
  settingsStore.updateSettings({ theme: newTheme }).catch((error) => {
    console.error("Failed to save theme to settings:", error);
  });
}

function navigateTo(path: string) {
  router.push(path);
}

// 最小化窗口
const minimizeWindow = () => {
  // @ts-ignore
  window.electron?.minimize();
};

// 最大化窗口
const maximizeWindow = () => {
  // @ts-ignore
  window.electron?.maximize();
  checkIsMaximized();
};

// 关闭窗口
const closeWindow = () => {
  // @ts-ignore
  if (window.electron) {
    try {
      // @ts-ignore
      window.electron.close();
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  }
};

// 检查窗口是否最大化
const checkIsMaximized = async () => {
  try {
    // @ts-ignore
    if (window.electron?.isMaximized) {
      // @ts-ignore
      const flag = await window.electron.isMaximized();
      isMax.value = !!flag;
    }
  } catch (error) {
    console.error("Failed to check maximized state:", error);
  }
};

onMounted(() => {
  checkIsMaximized();
});
</script>

<style scoped>
i {
  font-size: 1.2rem;
}
</style>
