<template>
  <div>
    <div class="mb-1 flex items-center justify-between">
      <label :for="selectId" class="field-label mb-0">{{ label }}</label>
      <button
        type="button"
        class="text-2xs text-ink-subtle hover:text-ink"
        :disabled="loading"
        title="重新读取官网音色列表"
        @click="reload(true)"
      >
        {{ loading ? "读取中…" : "刷新" }}
      </button>
    </div>
    <select
      :id="selectId"
      class="field"
      :class="size === 'sm' && 'field-sm'"
      :value="modelValue || ''"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ placeholder }}</option>
      <optgroup v-for="group in groups" :key="group.name" :label="group.name">
        <option v-for="voice in group.voices" :key="voice.id" :value="voice.id">{{ voice.name }}</option>
      </optgroup>
      <option v-if="modelValue && !known" :value="modelValue">{{ modelValue }}{{ accountStore.voicesLoaded ? "（已下线）" : "" }}</option>
    </select>
    <p v-if="!loading && !accountStore.voices.length" class="field-hint">
      未读取到音色，请检查网络或在设置中确认官网地址。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useId } from "vue";
import { useAccountStore, type CloudVoice } from "@/stores/account";

const props = withDefaults(
  defineProps<{ modelValue?: string | null; label?: string; placeholder?: string; size?: "sm" | "md" }>(),
  { label: "音色", placeholder: "请选择音色", size: "md" }
);
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const accountStore = useAccountStore();
const loading = ref(false);
const selectId = `voice-${useId()}`;

const groups = computed(() => {
  const map = new Map<string, CloudVoice[]>();
  for (const voice of accountStore.voices) {
    const key = voice.providerName || "官方音色";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(voice);
  }
  return [...map.entries()].map(([name, voices]) => ({ name, voices }));
});

const known = computed(() => accountStore.voices.some((voice) => voice.id === props.modelValue));

async function reload(force = true) {
  loading.value = true;
  await accountStore.loadVoices(force);
  loading.value = false;
}

onMounted(() => reload(false));
</script>
