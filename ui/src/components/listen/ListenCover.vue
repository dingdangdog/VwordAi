<template>
  <span class="relative block overflow-hidden rounded-md bg-soft">
    <img v-if="src" :src="src" alt="" class="absolute inset-0 h-full w-full object-cover" />
    <span v-else-if="letter" class="absolute inset-0 flex items-center justify-center font-semibold" :class="[tone, letterClass]">{{ letter }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{ src?: string | null; title?: string; size?: "sm" | "md" | "lg" }>(), { size: "md" });

const tones = ["text-role-1", "text-role-2", "text-role-3", "text-role-4", "text-role-5", "text-role-6", "text-role-7", "text-role-8"];
const letter = computed(() => (props.title || "").trim().slice(0, 1));
const tone = computed(() => {
  const seed = props.title || "";
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return tones[hash % tones.length];
});
const letterClass = computed(() => ({ sm: "text-base", md: "text-lg", lg: "text-3xl" })[props.size]);
</script>
