<template>
  <div :class="dock ? 'border-t border-line bg-surface' : 'flex h-16 items-center gap-3 border-t border-line bg-surface px-4'">
    <template v-if="dock">
      <div class="flex items-center gap-3 px-3 py-2 sm:px-4">
        <ListenCover class="h-12 w-12 shrink-0" :src="cover" :title="title" size="sm" />
        <div class="min-w-0 flex-1 sm:w-44 sm:flex-none">
          <p class="truncate text-sm font-medium text-ink">{{ title || "未选择音频" }}</p>
          <p class="truncate text-2xs text-ink-subtle">{{ subtitle || (src ? "就绪" : "合成后可在此试听") }}</p>
        </div>

        <div class="flex shrink-0 items-center gap-1 sm:flex-1 sm:justify-center">
          <button type="button" class="btn btn-ghost btn-icon hidden sm:inline-flex" :disabled="!canPrev" aria-label="上一段" @click="emit('previous')">
            <BackwardIcon class="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" class="btn btn-ghost btn-icon" :disabled="!src" aria-label="后退 15 秒" @click="seekBy(-15)">
            <span class="num text-2xs">−15</span>
          </button>
          <button
            type="button"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition-colors duration-fast hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-soft disabled:text-ink-subtle"
            :disabled="!src"
            :aria-label="playing ? '暂停' : '播放'"
            :title="playing ? '暂停 (Space)' : '播放 (Space)'"
            @click="toggle"
          >
            <PauseIcon v-if="playing" class="h-4 w-4" aria-hidden="true" />
            <PlayIcon v-else class="h-4 w-4 translate-x-px" aria-hidden="true" />
          </button>
          <button type="button" class="btn btn-ghost btn-icon" :disabled="!src" aria-label="前进 30 秒" @click="seekBy(30)">
            <span class="num text-2xs">+30</span>
          </button>
          <button type="button" class="btn btn-ghost btn-icon hidden sm:inline-flex" :disabled="!canNext" aria-label="下一段" @click="emit('next')">
            <ForwardIcon class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div class="hidden shrink-0 items-center gap-2 lg:flex">
          <VAudioRateSelect :model-value="rate" label="播放速度" @update:model-value="setRate" />
          <label class="flex items-center gap-2 text-ink-muted">
            <SpeakerWaveIcon class="h-4 w-4" aria-hidden="true" />
            <input
              class="h-1 w-24 cursor-pointer accent-accent disabled:cursor-not-allowed disabled:opacity-40"
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="volume"
              :disabled="!src"
              aria-label="音量"
              @input="onVolume"
            />
          </label>
        </div>

        <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1 border-l border-line pl-3">
          <slot name="actions" />
        </div>
      </div>
      <div class="flex items-center gap-3 px-3 pb-2 sm:px-4">
        <VAudioSeek :current="current" :duration="duration" :enabled="!!src" label="播放进度" @seek="seekTo" @nudge="seekBy" />
        <VAudioRateSelect class="lg:hidden" :model-value="rate" label="播放速度" @update:model-value="setRate" />
      </div>
    </template>

    <template v-else>
      <button
        type="button"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition-colors duration-fast hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-soft disabled:text-ink-subtle"
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
        <p class="truncate text-2xs text-ink-subtle">{{ subtitle || (src ? "就绪" : "合成后可在此试听") }}</p>
      </div>

      <VAudioSeek :current="current" :duration="duration" :enabled="!!src" label="播放进度" @seek="seekTo" @nudge="seekBy" />
      <VAudioRateSelect :model-value="rate" label="播放速度" @update:model-value="setRate" />

      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1 border-l border-line pl-3">
        <slot name="actions" />
      </div>
    </template>

    <audio
      ref="audioEl"
      :src="src || undefined"
      preload="metadata"
      class="hidden"
      @play="onPlayState(true)"
      @pause="onPlayState(false)"
      @ended="onEnded"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onMeta"
      @durationchange="onMeta"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { BackwardIcon, ForwardIcon, PauseIcon, PlayIcon, SpeakerWaveIcon } from "@heroicons/vue/24/solid";
import ListenCover from "@/components/listen/ListenCover.vue";
import VAudioRateSelect from "@/components/ui/VAudioRateSelect.vue";
import VAudioSeek from "@/components/ui/VAudioSeek.vue";

const props = defineProps<{
  src?: string | null;
  title?: string;
  subtitle?: string;
  cover?: string | null;
  autoplay?: boolean;
  startAt?: number;
  dock?: boolean;
  canNext?: boolean;
  canPrev?: boolean;
}>();
const emit = defineEmits<{ ended: []; tick: [payload: { current: number; duration: number }]; playing: [value: boolean]; next: []; previous: [] }>();

const audioEl = ref<HTMLAudioElement | null>(null);
const playing = ref(false);
const current = ref(0);
const duration = ref(0);
const rate = ref(1);
const volume = ref(1);
const appliedStart = ref("");

watch(
  () => props.src,
  () => {
    current.value = 0;
    duration.value = 0;
    playing.value = false;
    appliedStart.value = "";
    if (props.autoplay && props.src) {
      requestAnimationFrame(() => audioEl.value?.play().catch(() => {}));
    }
  }
);

function onPlayState(value: boolean) {
  playing.value = value;
  emit("playing", value);
}

function onTimeUpdate() {
  if (!audioEl.value) return;
  current.value = audioEl.value.currentTime;
  emit("tick", { current: current.value, duration: duration.value });
}

function onMeta() {
  if (!audioEl.value) return;
  audioEl.value.playbackRate = rate.value;
  audioEl.value.volume = volume.value;
  if (Number.isFinite(audioEl.value.duration)) duration.value = audioEl.value.duration;
  if (props.startAt && props.startAt > 0 && appliedStart.value !== props.src) {
    appliedStart.value = props.src || "";
    seekTo(props.startAt);
  }
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

function setRate(next: number) {
  rate.value = next;
  if (audioEl.value) audioEl.value.playbackRate = next;
}

function onVolume(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  volume.value = value;
  if (audioEl.value) audioEl.value.volume = value;
}

defineExpose({ play, pause, toggle, playing });
</script>
