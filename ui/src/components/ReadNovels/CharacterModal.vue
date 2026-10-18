<template>
  <VDialog
    :open="open"
    :title="isEdit ? '编辑角色' : '添加角色'"
    description="角色只绑定默认音色；情感、语速等在具体段落中调整。"
    size="lg"
    persistent
    @close="emit('close')"
  >
    <form id="character-form" class="grid grid-cols-2 gap-4" @submit.prevent="submit">
      <VInput v-model="form.name" label="角色名称" placeholder="例如：林黛玉" required wrapper-class="col-span-2 sm:col-span-1" />
      <VSelect v-model="form.type" label="角色类型" :options="typeOptions" wrapper-class="col-span-2 sm:col-span-1" />
      <div class="col-span-2 space-y-1 sm:col-span-1">
        <span class="field-label">性别</span>
        <VSegmented v-model="form.gender" :options="genderOptions" block label="性别" />
      </div>
      <VSelect v-model="form.age" label="年龄段" :options="ageOptions" wrapper-class="col-span-2 sm:col-span-1" />
      <VTextarea v-model="form.description" label="角色描述" placeholder="选填，例如性格、口音" :rows="2" wrapper-class="col-span-2" />

      <div class="col-span-2 space-y-3 rounded-md border border-line bg-surface p-3">
        <p class="section-title">角色音色</p>
        <div class="grid grid-cols-2 gap-3">
          <VSelect
            v-model="form.provider"
            label="语音服务"
            placeholder="未选择"
            :options="ttsProviderOptions"
            @update:model-value="form.model = ''"
          />
          <VSelect
            v-model="form.model"
            label="语音模型"
            placeholder="未选择"
            :options="ttsModelOptions"
            :disabled="!form.provider"
          />
        </div>
        <div class="flex items-center justify-between gap-3">
          <p v-if="form.provider && !availableVoiceModels.length" class="text-xs text-warning">
            该服务暂无可用模型，请先在设置中同步模型列表。
          </p>
          <span v-else />
          <VButton
            size="sm"
            :icon="SpeakerWaveIcon"
            :loading="isTestingVoice"
            :disabled="!form.provider || !form.model"
            @click="playTestVoice"
          >
            试听
          </VButton>
        </div>
      </div>
    </form>

    <template #footer>
      <VButton variant="ghost" @click="emit('close')">取消</VButton>
      <VButton variant="primary" type="submit" form="character-form" :disabled="!isFormValid">
        {{ isEdit ? "保存" : "添加" }}
      </VButton>
    </template>
  </VDialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useToast } from "vue-toastification";
import { SpeakerWaveIcon } from "@heroicons/vue/24/outline";
import VButton from "@/components/ui/VButton.vue";
import VDialog from "@/components/ui/VDialog.vue";
import VInput from "@/components/ui/VInput.vue";
import VSegmented from "@/components/ui/VSegmented.vue";
import VSelect from "@/components/ui/VSelect.vue";
import VTextarea from "@/components/ui/VTextarea.vue";
import type { Character } from "@/types/ReadNovels";
import type { TTSProviderType } from "@/types";
import { useSettingsStore } from "@/stores/settings";
import { ttsApi, type VoiceModelsCache } from "@/api/ttsApi";

const props = withDefaults(
  defineProps<{
    open?: boolean;
    novelId?: string;
    /** 传入则为编辑该角色，不传则为添加角色 */
    character?: Character | null;
  }>(),
  { open: true, character: null }
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", data: Omit<Character, "id">): void;
  (e: "update", id: string, data: Partial<Character>): void;
}>();

const toast = useToast();
const settingsStore = useSettingsStore();
const isTestingVoice = ref(false);
const cachedVoiceModels = ref<VoiceModelsCache>({});

const isEdit = computed(() => !!props.character);

const form = reactive({
  name: "",
  type: "main" as Character["type"],
  gender: "male" as Character["gender"],
  age: "youth" as Character["age"],
  description: "",
  provider: "" as TTSProviderType | "",
  model: "",
});

const typeOptions = [
  { value: "main", label: "主要角色" },
  { value: "secondary", label: "次要角色" },
  { value: "minor", label: "路人角色" },
];
const genderOptions: { value: Character["gender"]; label: string }[] = [
  { value: "male", label: "男" },
  { value: "female", label: "女" },
  { value: "unknown", label: "未知" },
];
const ageOptions = [
  { value: "child", label: "儿童" },
  { value: "youth", label: "青年" },
  { value: "middle", label: "中年" },
  { value: "elder", label: "老年" },
  { value: "unknown", label: "未知" },
];

const ttsProviderOptions = computed(() =>
  settingsStore.getTTSProviders().map((p) => ({ value: p.type, label: p.name }))
);
/** 模型列表来自 tts:get-voice-models 的 voiceModelsCache（按服务商 key） */
const availableVoiceModels = computed(() => {
  if (!form.provider) return [];
  const list = cachedVoiceModels.value[form.provider as keyof VoiceModelsCache];
  return Array.isArray(list) ? list : [];
});
const ttsModelOptions = computed(() =>
  availableVoiceModels.value.map((m) => ({
    value: m.code,
    label: `${m.name}（${(m.gender || "0") === "0" ? "女" : "男"}）`,
  }))
);

const isFormValid = computed(() => !!form.name.trim() && !!props.novelId);

function fill(c: Character | null) {
  form.name = c?.name || "";
  form.type = c?.type || "main";
  form.gender = c?.gender || "male";
  form.age = c?.age || "youth";
  form.description = c?.description || "";
  form.provider = (c?.ttsConfig?.provider as TTSProviderType) || (settingsStore.activeTTSProviderType as TTSProviderType) || "";
  form.model = c?.ttsConfig?.model || "";
}

watch(
  () => [props.open, props.character] as const,
  ([open]) => {
    if (open) fill(props.character);
  },
  { immediate: true }
);

async function playTestVoice() {
  const provider = form.provider as TTSProviderType;
  if (!provider || !form.model) return;
  isTestingVoice.value = true;
  try {
    const name = availableVoiceModels.value.find((m) => m.code === form.model)?.name ?? "当前语音";
    const result = await settingsStore.testTTSProviderConnection(provider, { text: `你好，我是${name}。`, model: form.model });
    if (!result.success || !result.data?.audioData) throw new Error(result?.message || "未能获取音频数据");
    const url = URL.createObjectURL(new Blob([new Uint8Array(result.data.audioData).buffer], { type: "audio/wav" }));
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play();
  } catch (error) {
    toast.error(`试听失败：${error instanceof Error ? error.message : "未知错误"}`);
  } finally {
    isTestingVoice.value = false;
  }
}

function submit() {
  if (!isFormValid.value) return;
  const base = {
    name: form.name.trim(),
    type: form.type,
    gender: form.gender,
    age: form.age,
    description: form.description.trim() || undefined,
    ttsConfig: form.provider ? { provider: form.provider as TTSProviderType, model: form.model } : undefined,
  };
  if (props.character) {
    emit("update", props.character.id, { ...base, updatedAt: new Date().toISOString() });
  } else {
    emit("save", { ...base, novelId: props.novelId, createdAt: new Date().toISOString() } as Omit<Character, "id">);
  }
  emit("close");
}

onMounted(async () => {
  await settingsStore.loadTTSSettings();
  if (!props.character && !form.provider) form.provider = (settingsStore.activeTTSProviderType as TTSProviderType) || "";
  try {
    const res = await ttsApi.getVoiceModels();
    if (res.success && res.data) cachedVoiceModels.value = res.data;
  } catch (error) {
    console.error("Failed to load voice models cache:", error);
  }
});
</script>
