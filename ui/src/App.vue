<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <Navbar />
    <main class="p-4">
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