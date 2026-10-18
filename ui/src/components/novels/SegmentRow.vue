<template>
  <div
    role="option"
    :aria-selected="selected"
    :data-index="index"
    class="group relative flex gap-3 rounded-md border py-2.5 pl-4 pr-2 transition-colors duration-fast"
    :class="selected ? 'border-accent/50 bg-accent/5' : 'border-transparent hover:bg-soft'"
    @click="emit('select', $event)"
  >
    <span class="absolute bottom-2.5 left-1 top-2.5 w-[3px] rounded-full" :class="tone.dot" aria-hidden="true" />

    <div class="w-20 shrink-0 pt-0.5">
      <p class="num text-2xs text-ink-subtle">#{{ index + 1 }}</p>
      <p class="truncate text-xs font-medium" :class="tone.text" :title="speaker">{{ speaker }}</p>
    </div>

    <div class="min-w-0 flex-1">
      <textarea
        :value="segment.text"
        rows="1"
        class="block w-full resize-none bg-transparent text-sm leading-6 text-ink outline-none [field-sizing:content] focus-visible:outline-none"
        :aria-label="`第 ${index + 1} 段文本`"
        @input="emit('update-text', ($event.target as HTMLTextAreaElement).value)"
      />
      <div v-if="tags.length" class="mt-1 flex flex-wrap gap-1">
        <span v-for="tag in tags" :key="tag" class="badge h-[18px] px-1.5 text-2xs">{{ tag }}</span>
      </div>
    </div>

    <div class="flex shrink-0 items-start gap-0.5" @click.stop>
      <span v-if="processing" class="flex h-7 w-7 items-center justify-center" title="合成中">
        <span class="flex h-3 items-end gap-[2px]" aria-hidden="true">
          <span v-for="i in 3" :key="i" class="w-[2px] origin-bottom animate-wave rounded-full bg-accent" :style="{ height: '12px', animationDelay: `${i * 120}ms` }" />
        </span>
        <span class="sr-only">合成中</span>
      </span>
      <VIconButton
        v-else-if="hasAudio"
        :icon="playing ? PauseIcon : PlayIcon"
        :label="playing ? '暂停' : '播放此段'"
        size="sm"
        class="text-accent"
        @click="emit('play')"
      />
      <VIconButton
        :icon="hasAudio ? ArrowPathIcon : SparklesIcon"
        :label="hasAudio ? '重新合成此段' : '合成此段'"
        size="sm"
        :disabled="processing || busy"
        class="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        :class="selected && 'opacity-100'"
        @click="emit('synthesize')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ArrowPathIcon, PauseIcon, PlayIcon, SparklesIcon } from "@heroicons/vue/20/solid";
import VIconButton from "@/components/ui/VIconButton.vue";
import { roleTone } from "@/utils/roleColor";
import { isNarratorName, type SegmentWithTts } from "@/composables/useChapterWorkstation";

const props = defineProps<{
  segment: SegmentWithTts;
  index: number;
  selected: boolean;
  processing: boolean;
  hasAudio: boolean;
  playing: boolean;
  busy?: boolean;
  emotionLabel?: string;
}>();

const emit = defineEmits<{
  select: [event: MouseEvent];
  play: [];
  synthesize: [];
  "update-text": [value: string];
}>();

const speaker = computed(() => (isNarratorName(props.segment.character) ? "旁白" : props.segment.character));
const tone = computed(() => roleTone(speaker.value));

const tags = computed(() => {
  const c = props.segment.ttsConfig;
  const list: string[] = [];
  if (props.emotionLabel) list.push(props.emotionLabel);
  if (c?.speed) list.push(`语速 ${c.speed > 0 ? "+" : ""}${c.speed}`);
  if (c?.pitch) list.push(`音调 ${c.pitch > 0 ? "+" : ""}${c.pitch}`);
  if (c?.volume !== undefined && c.volume !== 100) list.push(`音量 ${c.volume}`);
  return list;
});
</script>
