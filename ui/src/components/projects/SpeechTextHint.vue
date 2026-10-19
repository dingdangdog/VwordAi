<template>
  <span v-if="marked" class="flex min-w-0 items-center gap-1.5 text-2xs text-ink-subtle">
    <span class="truncate">已识别格式符号，朗读时会自动忽略</span>
    <button type="button" class="shrink-0 underline underline-offset-2 hover:text-ink" @click="open = true">查看朗读文本</button>
    <VDialog :open="open" title="朗读文本" description="原文保持不变，合成时实际朗读的是下面的纯文本。" size="lg" @close="open = false">
      <p class="whitespace-pre-wrap break-words text-sm leading-7 text-ink">{{ speechText || "没有可朗读的文字" }}</p>
    </VDialog>
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import VDialog from "@/components/ui/VDialog.vue";
import { hasSpeechMarkup, toSpeechText } from "@/utils/speechText";

const props = defineProps<{ text: string }>();

const open = ref(false);
const marked = computed(() => hasSpeechMarkup(props.text));
const speechText = computed(() => (open.value ? toSpeechText(props.text) : ""));
</script>
