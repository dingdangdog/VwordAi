<template>
  <div class="flex min-w-0 flex-1 items-center gap-3">
    <span class="num w-10 shrink-0 text-right text-2xs text-ink-muted">{{ formatTime(current) }}</span>
    <div
      ref="trackEl"
      class="group relative h-6 min-w-0 flex-1 cursor-pointer"
      :class="!enabled && 'pointer-events-none opacity-50'"
      role="slider"
      tabindex="0"
      :aria-label="label"
      :aria-valuemin="0"
      :aria-valuemax="Math.round(duration)"
      :aria-valuenow="Math.round(current)"
      @pointerdown="onSeekStart"
      @keydown.left.prevent="emit('nudge', -5)"
      @keydown.right.prevent="emit('nudge', 5)"
    >
      <div class="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-soft">
        <div class="h-full rounded-full bg-accent" :style="{ width: `${progress}%` }" />
      </div>
      <div
        class="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-raised opacity-0 transition-opacity group-hover:opacity-100"
        :style="{ left: `${progress}%` }"
      />
    </div>
    <span class="num w-10 shrink-0 text-2xs text-ink-muted">{{ formatTime(duration) }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  current: number;
  duration: number;
  enabled?: boolean;
  label: string;
}>();

const emit = defineEmits<{ seek: [sec: number]; nudge: [delta: number] }>();
const trackEl = ref<HTMLElement | null>(null);
const progress = computed(() => (props.duration > 0 ? (props.current / props.duration) * 100 : 0));

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function seekFromEvent(event: PointerEvent) {
  const rect = trackEl.value?.getBoundingClientRect();
  if (!rect || !rect.width) return;
  emit("seek", ((event.clientX - rect.left) / rect.width) * props.duration);
}

function onSeekStart(event: PointerEvent) {
  seekFromEvent(event);
  const move = (e: PointerEvent) => seekFromEvent(e);
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}
</script>
