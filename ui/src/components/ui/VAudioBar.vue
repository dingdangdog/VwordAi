<template>
  <div class="flex h-14 items-center gap-3 border-t border-line bg-surface px-4">
    <button
      type="button"
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition-colors duration-fast hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-soft disabled:text-ink-subtle"
      :disabled="!src"
      :aria-label="playing ? '暂停' : '播放'"
      :title="playing ? '暂停 (Space)' : '播放 (Space)'"
      @click="toggle"
    >
      <PauseIcon v-if="playing" class="h-4 w-4" aria-hidden="true" />
      <PlayIcon v-else class="h-4 w-4 translate-x-px" aria-hidden="true" />
    </button>

    <div class="min-w-0 w-48 shrink-0">
      <p class="truncate text-sm font-medium text-ink">{{ title || "未选择音频" }}</p>
      <p class="truncate text-2xs text-ink-subtle">{{ subtitle || (src ? "就绪" : "生成后可在此试听") }}</p>
    </div>

    <div class="flex min-w-0 flex-1 items-center gap-3">
      <span class="num w-10 shrink-0 text-right text-2xs text-ink-muted">{{ formatTime(current) }}</span>
      <div
        ref="trackEl"
        class="group relative h-6 flex-1 cursor-pointer"
        :class="!src && 'pointer-events-none opacity-50'"
        role="slider"
        tabindex="0"
        aria-label="播放进度"
        :aria-valuemin="0"
        :aria-valuemax="Math.round(duration)"
        :aria-valuenow="Math.round(current)"
        @pointerdown="onSeekStart"
        @keydown.left.prevent="seekBy(-5)"
        @keydown.right.prevent="seekBy(5)"
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

    <button
      type="button"
      class="btn btn-ghost btn-sm num w-12 shrink-0"
      :disabled="!src"
      title="播放速度"
      @click="cycleRate"
    >
      {{ rate }}×
    </button>

    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1 border-l border-line pl-3">
      <slot name="actions" />
    </div>

    <audio
      ref="audioEl"
      :src="src || undefined"
      preload="metadata"
      class="hidden"
      @play="playing = true"
      @pause="playing = false"
      @ended="onEnded"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onMeta"
      @durationchange="onMeta"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { PlayIcon, PauseIcon } from "@heroicons/vue/24/solid";

const props = defineProps<{ src?: string | null; title?: string; subtitle?: string; autoplay?: boolean }>();
const emit = defineEmits<{ ended: [] }>();

const audioEl = ref<HTMLAudioElement | null>(null);
const trackEl = ref<HTMLElement | null>(null);
const playing = ref(false);
const current = ref(0);
const duration = ref(0);
const rate = ref(1);
const RATES = [1, 1.25, 1.5, 2, 0.75];

const progress = computed(() => (duration.value > 0 ? (current.value / duration.value) * 100 : 0));

watch(
  () => props.src,
  () => {
    current.value = 0;
    duration.value = 0;
    playing.value = false;
    if (props.autoplay && props.src) {
      requestAnimationFrame(() => audioEl.value?.play().catch(() => {}));
    }
  }
);

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function onTimeUpdate() {
  if (audioEl.value) current.value = audioEl.value.currentTime;
}

function onMeta() {
  if (!audioEl.value) return;
  audioEl.value.playbackRate = rate.value;
  if (Number.isFinite(audioEl.value.duration)) duration.value = audioEl.value.duration;
}

function onEnded() {
  playing.value = false;
  emit("ended");
}

function play() {
  audioEl.value?.play().catch(() => {});
}

function pause() {
  audioEl.value?.pause();
}

function toggle() {
  if (!props.src || !audioEl.value) return;
  if (audioEl.value.paused) play();
  else pause();
}

function seekTo(sec: number) {
  if (!audioEl.value || !duration.value) return;
  audioEl.value.currentTime = Math.min(duration.value, Math.max(0, sec));
  current.value = audioEl.value.currentTime;
}

function seekBy(delta: number) {
  seekTo(current.value + delta);
}

function seekFromEvent(event: PointerEvent) {
  const rect = trackEl.value?.getBoundingClientRect();
  if (!rect || !rect.width) return;
  seekTo(((event.clientX - rect.left) / rect.width) * duration.value);
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

function cycleRate() {
  rate.value = RATES[(RATES.indexOf(rate.value) + 1) % RATES.length];
  if (audioEl.value) audioEl.value.playbackRate = rate.value;
}

defineExpose({ play, pause, toggle, playing });
</script>
