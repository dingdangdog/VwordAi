<template>
  <div class="space-y-3">
    <div class="flex justify-between items-center gap-2">
      <h2 class="text-base font-semibold text-ink shrink-0">
        角色
      </h2>
      <button type="button" class="btn btn-sm btn-primary flex items-center shrink-0" @click="$emit('add')">
        <PlusIcon class="h-4 w-4 mr-1" />
        添加角色
      </button>
    </div>

    <div v-if="characters.length === 0" class="text-sm text-ink-muted py-2">
      暂无角色，点击「添加角色」创建
    </div>
    <div v-else class="flex flex-wrap gap-2">
      <div v-for="c in characters" :key="c.id"
        class="flex items-start justify-between gap-2 p-2.5 rounded-lg border border-border bg-surface-hover/50 hover:border-primary/50 transition-colors w-[min(100%,16rem)] min-w-[12rem]">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span class="font-medium text-ink">{{ c.name }}</span>
            <span
              class="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 text-xs text-blue-700 dark:text-blue-300">
              {{ typeLabel(c.type) }}
            </span>
            <span
              class="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/50 px-1.5 py-0.5 text-xs text-green-700 dark:text-green-300">
              {{ genderAgeLabel(c) }}
            </span>
          </div>
          <p v-if="c.description" class="text-xs text-ink-muted truncate max-w-full">
            {{ c.description }}
          </p>
          <p v-if="c.ttsConfig?.provider" class="text-xs text-primary mt-0.5">
            TTS: {{ ttsProviderName(c.ttsConfig.provider) }}{{ c.ttsConfig.model ? ` · ${c.ttsConfig.model}` : "" }}
          </p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" class="p-1.5 rounded text-ink-muted hover:text-primary hover:bg-primary/10" title="编辑"
            @click="$emit('edit', c)">
            <PencilSquareIcon class="h-4 w-4" />
          </button>
          <button type="button" class="p-1.5 rounded text-ink-muted hover:text-red-500 hover:bg-red-500/10" title="删除"
            @click="confirmDelete(c)">
            <TrashIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/vue/24/outline";
import type { Character } from "@/types/ReadNovels";
import type { TTSProviderType } from "@/types";

defineProps<{
  characters: Character[];
}>();

const emit = defineEmits<{
  (e: "add"): void;
  (e: "edit", character: Character): void;
  (e: "delete", id: string): void;
}>();

function confirmDelete(c: Character) {
  if (confirm(`确定删除角色「${c.name}」吗？此操作不可撤销。`)) {
    emit("delete", c.id);
  }
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    main: "主要",
    secondary: "次要",
    minor: "路人",
  };
  return map[type] || type;
}

function genderAgeLabel(c: Character): string {
  const g = { male: "男", female: "女", unknown: "未知" }[c.gender];
  const a = { child: "儿童", youth: "青年", middle: "中年", elder: "老年", unknown: "" }[c.age];
  return a ? `${g}${a}` : g;
}

function ttsProviderName(p: TTSProviderType): string {
  const map: Record<string, string> = {
    azure: "Azure",
    aliyun: "阿里云",
    tencent: "腾讯云",
    baidu: "百度",
    openai: "OpenAI",
    blive: "B站直播",
  };
  return map[p] || p;
}
</script>
