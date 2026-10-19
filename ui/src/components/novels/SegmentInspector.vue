<template>
  <div v-if="!segments.length" class="p-4">
    <VEmptyState
      compact
      :icon="CursorArrowRaysIcon"
      title="未选择段落"
      description="点击段落进行编辑；按住 Ctrl 多选、Shift 连选，可批量调整参数。"
    />
    <div class="mt-2 space-y-1.5 rounded-md border border-line p-3 text-2xs text-ink-muted">
      <p class="section-title mb-2">快捷键</p>
      <p class="flex justify-between"><span>上一段 / 下一段</span><span><span class="kbd">K</span> <span class="kbd">J</span></span></p>
      <p class="flex justify-between"><span>播放 / 暂停</span><span class="kbd">Space</span></p>
      <p class="flex justify-between"><span>合成所选段落</span><span class="kbd">Ctrl Enter</span></p>
      <p class="flex justify-between"><span>保存</span><span class="kbd">Ctrl S</span></p>
    </div>
  </div>

  <div v-else class="space-y-5 p-4">
    <div v-if="single" class="space-y-1">
      <p class="section-title">第 {{ indexes[0] + 1 }} 段</p>
      <div class="flex items-center gap-2">
        <span class="status-dot" :class="tone.dot" aria-hidden="true" />
        <span class="text-sm font-medium" :class="tone.text">{{ speaker }}</span>
      </div>
      <p class="text-xs text-ink-subtle">
        音色：<span class="text-ink-muted">{{ voiceLabel }}</span>
        <template v-if="!isNarrator"> · 在「角色」页修改</template>
      </p>
    </div>
    <div v-else class="rounded-md border border-accent/40 bg-accent/5 p-3">
      <p class="text-sm font-medium text-ink">已选 {{ segments.length }} 段</p>
      <p class="mt-0.5 text-xs text-ink-muted">下方任一修改会同时应用到所有选中段落。</p>
    </div>

    <div class="space-y-4">
      <VSelect
        :model-value="current.emotion || 'dft'"
        label="情感"
        :options="emotions.map((e) => ({ label: e.name, value: e.code }))"
        @update:model-value="patch({ emotion: String($event) })"
      />
      <VSelect
        :model-value="current.mimic || 'dft'"
        label="伪音"
        :options="roles.map((e) => ({ label: e.name, value: e.code }))"
        @update:model-value="patch({ mimic: String($event) })"
      />
      <VSlider
        :model-value="current.speed"
        label="语速"
        :min="-50"
        :max="50"
        :default-value="0"
        :format="signed"
        @update:model-value="patch({ speed: $event })"
      />
      <VSlider
        :model-value="current.pitch"
        label="音调"
        :min="-50"
        :max="50"
        :default-value="0"
        :format="signed"
        @update:model-value="patch({ pitch: $event })"
      />
      <VSlider
        :model-value="current.volume"
        label="音量"
        :min="0"
        :max="100"
        :default-value="100"
        @update:model-value="patch({ volume: $event })"
      />
      <p class="text-2xs text-ink-subtle">点击数值或双击滑块可恢复默认值。</p>
    </div>

    <div class="space-y-2 border-t border-line pt-4">
      <VButton variant="primary" block :icon="SparklesIcon" :loading="busy" @click="emit('synthesize')">
        {{ single ? (hasAudio ? "重新合成此段" : "合成此段") : `合成选中的 ${segments.length} 段` }}
      </VButton>
      <VButton v-if="single && hasAudio" block :icon="PlayIcon" @click="emit('play')">试听此段</VButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CursorArrowRaysIcon, PlayIcon, SparklesIcon } from "@heroicons/vue/24/outline";
import VButton from "@/components/ui/VButton.vue";
import VEmptyState from "@/components/ui/VEmptyState.vue";
import VSelect from "@/components/ui/VSelect.vue";
import VSlider from "@/components/ui/VSlider.vue";
import { roleTone } from "@/utils/roleColor";
import { isNarratorName, type SegmentTtsConfig, type SegmentWithTts } from "@/composables/useChapterWorkstation";
import { speakingStyle } from "@/utils/emotions";

const props = defineProps<{
  segments: SegmentWithTts[];
  indexes: number[];
  emotions: { code: string; name: string }[];
  roles: { code: string; name: string }[];
  voiceLabel: string;
  hasAudio: boolean;
  busy: boolean;
}>();

const emit = defineEmits<{
  apply: [patch: Partial<SegmentTtsConfig>];
  synthesize: [];
  play: [];
}>();

const single = computed(() => props.segments.length === 1);
const first = computed(() => props.segments[0]);
const isNarrator = computed(() => isNarratorName(first.value?.character));
const speaker = computed(() => (isNarrator.value ? "旁白" : first.value?.character || ""));
const tone = computed(() => roleTone(speaker.value));

const current = computed(() => {
  const c = first.value?.ttsConfig;
  const chosen = c?.emotion || "";
  const emotion =
    chosen === "dft"
      ? "dft"
      : speakingStyle(chosen) || speakingStyle(first.value?.emotion || first.value?.tone) || "dft";
  const mimic = c?.mimic || first.value?.mimicry || "dft";
  return {
    emotion,
    mimic: mimic === "default" ? "dft" : mimic,
    speed: Number(c?.speed ?? 0) || 0,
    pitch: Number(c?.pitch ?? 0) || 0,
    volume: c?.volume === undefined || c.volume === null ? 100 : Number(c.volume),
  };
});

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function patch(value: Partial<SegmentTtsConfig>) {
  emit("apply", value);
}
</script>
