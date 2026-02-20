<template>
  <div class="min-h-screen flex flex-col bg-surface dark:bg-surface duration-100 transition-colors">
    <Navbar />
    <main class="p-2 flex-1 overflow-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Navbar from '@/components/layout/Navbar.vue';
import { useSettingsStore } from '@/stores/settings';

const settingsStore = useSettingsStore();

onMounted(async () => {
  // First load settings to get the saved theme from backend
  await settingsStore.loadSettings();
  
  // Only initialize theme if not already set from settings
  if (!settingsStore.settings?.theme) {
    settingsStore.initTheme();
  } else {
    // Apply theme from settings
    if (settingsStore.theme !== settingsStore.settings.theme) {
      settingsStore.theme = settingsStore.settings.theme;
      settingsStore.applyTheme();
    }
  }
});
</script> 