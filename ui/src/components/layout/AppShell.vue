<template>
  <div class="flex h-screen flex-col overflow-hidden bg-canvas text-ink">
    <TitleBar :title="title" />
    <div class="flex min-h-0 flex-1">
      <Sidebar :collapsed="collapsed" @toggle="toggleSidebar" />
      <main class="relative min-w-0 flex-1" :class="fullBleed ? 'overflow-hidden' : 'overflow-y-auto'">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import TitleBar from "./TitleBar.vue";
import Sidebar from "./Sidebar.vue";

const STORAGE_KEY = "vw-sidebar-collapsed";

const route = useRoute();
const collapsed = ref(localStorage.getItem(STORAGE_KEY) === "1");

const title = computed(() => (route.meta.title as string | undefined) || "");
const fullBleed = computed(() => Boolean(route.meta.fullBleed));

function toggleSidebar() {
  collapsed.value = !collapsed.value;
  localStorage.setItem(STORAGE_KEY, collapsed.value ? "1" : "0");
}
</script>
