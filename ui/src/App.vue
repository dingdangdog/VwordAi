<template>
  <AppShell>
    <router-view />
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import AppShell from "@/components/layout/AppShell.vue";
import { useSettingsStore } from "@/stores/settings";

const settingsStore = useSettingsStore();

settingsStore.initTheme();

onMounted(() => {
  settingsStore.loadSettings();
});
</script>
