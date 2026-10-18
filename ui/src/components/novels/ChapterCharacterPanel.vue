<template>
  <div class="p-2">
    <p class="px-2 pb-2 pt-2 text-xs text-ink-subtle">
      段落沿用角色绑定的音色。修改角色音色后，本章相关段落会自动同步，需重新合成。
    </p>
    <VEmptyState v-if="!rows.length" compact :icon="UserGroupIcon" title="暂无角色" description="解析章节后会自动提取出场角色。" />
    <ul v-else class="space-y-0.5">
      <li v-for="row in rows" :key="row.key">
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors duration-fast hover:bg-soft disabled:cursor-default disabled:hover:bg-transparent"
          :disabled="!row.character"
          :title="row.character ? '编辑角色' : undefined"
          @click="row.character && emit('edit', row.character)"
        >
          <span class="status-dot" :class="row.tone.dot" aria-hidden="true" />
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-1.5">
              <span class="truncate text-sm font-medium" :class="row.tone.text">{{ row.name }}</span>
              <span v-if="row.typeLabel" class="badge h-4 px-1 text-2xs">{{ row.typeLabel }}</span>
            </span>
            <span class="block truncate text-2xs text-ink-subtle">{{ row.voice || "未绑定音色" }}</span>
          </span>
          <span class="num shrink-0 text-2xs text-ink-subtle" :title="`本章 ${row.count} 段`">{{ row.count }}</span>
          <PencilSquareIcon v-if="row.character" class="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { PencilSquareIcon, UserGroupIcon } from "@heroicons/vue/24/outline";
import VEmptyState from "@/components/ui/VEmptyState.vue";
import { roleTone } from "@/utils/roleColor";
import type { TTSProviderType } from "@/types";
import type { Character } from "@/types/ReadNovels";
import { isNarratorName, type SegmentWithTts } from "@/composables/useChapterWorkstation";

const props = defineProps<{
  characters: Character[];
  segments: SegmentWithTts[];
  characterFor: (segment: SegmentWithTts) => Character | null;
  modelName: (provider: TTSProviderType | undefined, code: string) => string;
}>();

const emit = defineEmits<{ edit: [character: Character] }>();

const TYPE_LABELS: Record<string, string> = { main: "主角", secondary: "配角", minor: "路人" };

const rows = computed(() => {
  const counts = new Map<string, number>();
  let narrator = 0;
  for (const segment of props.segments) {
    if (isNarratorName(segment.character)) {
      narrator += 1;
      continue;
    }
    const id = props.characterFor(segment)?.id || `name:${segment.character}`;
    counts.set(id, (counts.get(id) || 0) + 1);
  }

  const list = props.characters
    .map((character) => ({
      key: character.id,
      name: character.name,
      character,
      tone: roleTone(character.name),
      typeLabel: TYPE_LABELS[character.type] || "",
      voice: character.ttsConfig?.model
        ? props.modelName(character.ttsConfig.provider, character.ttsConfig.model)
        : character.voiceModel || "",
      count: counts.get(character.id) || 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));

  const unknown = [...counts.entries()]
    .filter(([key]) => key.startsWith("name:"))
    .map(([key, count]) => ({
      key,
      name: key.slice(5),
      character: null as Character | null,
      tone: roleTone(key.slice(5)),
      typeLabel: "",
      voice: "",
      count,
    }));

  const narratorRow = narrator
    ? [{ key: "narrator", name: "旁白", character: null as Character | null, tone: roleTone("旁白"), typeLabel: "", voice: "默认旁白音色", count: narrator }]
    : [];

  return [...narratorRow, ...list, ...unknown];
});
</script>
