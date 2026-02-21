<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- 仅作遮罩，不响应点击关闭（避免误触、提升编辑体验） -->
      <div class="fixed inset-0 bg-ink/60 opacity-75" aria-hidden="true"></div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div
        class="relative z-10 inline-block align-bottom bg-surface-elevated rounded-lg text-left overflow-hidden shadow-xl sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
        role="dialog" aria-modal="true" :aria-labelledby="isEdit ? 'edit-character-title' : 'add-character-title'"
        @click.stop>
        <!-- 标题栏 -->
        <div class="px-4 pt-5 pb-2 sm:px-6">
          <h3 :id="isEdit ? 'edit-character-title' : 'add-character-title'" class="text-lg font-medium text-ink">
            {{ isEdit ? "编辑角色" : "添加角色" }}
          </h3>
        </div>

        <!-- 表单 -->
        <div class="px-4 pb-4 sm:px-6 sm:pb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput id="name" v-model="form.name" label="角色名称" placeholder="请输入角色名称">
              <template #label>角色名称 <span class="text-red-500">*</span></template>
            </FormInput>

            <FormSelect id="type" v-model="form.type" label="角色类型" :options="typeOptions">
              <template #label>角色类型 <span class="text-red-500">*</span></template>
            </FormSelect>

            <FormSelect id="gender" v-model="form.gender" label="性别" :options="genderOptions">
              <template #label>性别 <span class="text-red-500">*</span></template>
            </FormSelect>

            <FormSelect id="age" v-model="form.age" label="年龄段" :options="ageOptions">
              <template #label>年龄段 <span class="text-red-500">*</span></template>
            </FormSelect>

            <div class="md:col-span-2">
              <FormTextarea id="description" v-model="form.description" label="角色描述" placeholder="选填" :rows="1" />
            </div>

            <div class="md:col-span-2">
              <h5 class="text-sm font-medium text-ink mb-2">角色声音配置</h5>
              <p class="text-xs text-ink-muted mb-2">仅绑定角色默认语音，情感、语速等请在具体对话段落中单独设置。</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-surface-hover rounded-lg">
                <FormSelect id="tts-provider" v-model="form.ttsConfig.provider" label="TTS服务商"
                  :options="ttsProviderOptions" @change="onTtsProviderChange" />
                <div class="flex flex-col gap-1">
                  <FormSelect id="tts-model" v-model="form.ttsConfig.model" label="语音模型" :options="ttsModelOptions"
                    :disabled="!form.ttsConfig.provider" />
                  <button
                    type="button"
                    :disabled="!form.ttsConfig.provider || !form.ttsConfig.model || isTestingVoice"
                    class="self-start px-3 py-1 text-xs font-medium text-primary bg-primary-muted rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="playTestVoice"
                  >
                    {{ isTestingVoice ? "试听中..." : "试听" }}
                  </button>
                </div>
                <p v-if="form.ttsConfig.provider && availableVoiceModels.length === 0"
                  class="text-sm text-ink-muted col-span-2">
                  请先在 设置 → 语音服务 → 语音模型 中同步该服务商的模型
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="bg-surface-hover px-4 py-3 sm:px-6 flex justify-end gap-2">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            取消
          </button>
          <button type="button" class="btn btn-primary" :disabled="!isFormValid || isSaving" @click="submit">
            {{ isSaving ? "保存中..." : isEdit ? "保存" : "添加" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import FormInput from "@/components/common/FormInput.vue";
import FormTextarea from "@/components/common/FormTextarea.vue";
import FormSelect from "@/components/common/FormSelect.vue";
import type { Character } from "@/types/ReadNovels";
import type { TTSProviderType } from "@/types";
import { useToast } from "vue-toastification";
import { useSettingsStore } from "@/stores/settings";
import { ttsApi } from "@/api/ttsApi";
import type { VoiceModelsCache } from "@/api/ttsApi";

const props = defineProps<{
  novelId?: string;
  /** 传入则为编辑该角色，不传则为添加角色 */
  character?: Character | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", data: Omit<Character, "id">): void;
  (e: "update", id: string, data: Partial<Character>): void;
}>();

const isSaving = ref(false);
const isTestingVoice = ref(false);
const toast = useToast();
const settingsStore = useSettingsStore();
const cachedVoiceModels = ref<VoiceModelsCache>({});

const isEdit = computed(() => !!props.character);

const form = reactive({
  name: "",
  type: "main" as Character["type"],
  gender: "male" as Character["gender"],
  age: "youth" as Character["age"],
  description: "",
  ttsConfig: {
    provider: "" as TTSProviderType | "",
    model: "",
  },
});

const typeOptions = [
  { value: "main", label: "主要角色" },
  { value: "secondary", label: "次要角色" },
  { value: "minor", label: "路人角色" },
];
const genderOptions = [
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
/** 与设置页一致：模型列表来自 tts:get-voice-models，即设置里「同步模型」写入的 voiceModelsCache（按服务商 key 如 azure） */
const availableVoiceModels = computed(() => {
  if (!form.ttsConfig.provider) return [];
  const list = cachedVoiceModels.value[form.ttsConfig.provider as keyof VoiceModelsCache];
  if (!Array.isArray(list)) return [];
  return list.map((m) => ({
    code: m.code,
    name: m.name,
    gender: m.gender || "0",
    language: m.lang,
    emotions: m.emotions,
    styles: m.styles,
  }));
});
const ttsModelOptions = computed(() =>
  availableVoiceModels.value.map((m) => ({
    value: m.code,
    label: `${m.name} (${m.gender === "0" ? "女" : "男"})`,
  }))
);

const isFormValid = computed(() => !!form.name.trim() && !!props.novelId);

function fillForm(c: Character) {
  form.name = c.name;
  form.type = c.type;
  form.gender = c.gender;
  form.age = c.age;
  form.description = c.description || "";
  if (c.ttsConfig) {
    form.ttsConfig.provider = (c.ttsConfig.provider as TTSProviderType) || "";
    form.ttsConfig.model = c.ttsConfig.model || "";
  } else {
    form.ttsConfig.provider = (settingsStore.activeTTSProviderType as TTSProviderType) || "";
    form.ttsConfig.model = "";
  }
}

function resetForm() {
  form.name = "";
  form.description = "";
  form.type = "main";
  form.gender = "male";
  form.age = "youth";
  form.ttsConfig.model = "";
  form.ttsConfig.provider = (settingsStore.activeTTSProviderType as TTSProviderType) || "";
}

watch(
  () => props.character,
  (c) => {
    if (c) fillForm(c);
    else resetForm();
  },
  { immediate: true }
);

function onTtsProviderChange() {
  form.ttsConfig.model = "";
}

async function playTestVoice() {
  const provider = form.ttsConfig.provider as TTSProviderType;
  const modelCode = form.ttsConfig.model;
  if (!provider || !modelCode) return;
  isTestingVoice.value = true;
  try {
    const modelName =
      availableVoiceModels.value.find((m) => m.code === modelCode)?.name ?? "当前语音";
    const testText = `你好，我是${modelName}。`;
    const result = await settingsStore.testTTSProviderConnection(provider, {
      text: testText,
      model: modelCode,
    });
    if (result.success && result.data?.audioData) {
      const audioBlob = new Blob(
        [new Uint8Array(result.data.audioData).buffer],
        { type: "audio/wav" }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.play();
      toast.success("试听成功");
    } else {
      toast.error(`试听失败: ${result?.message || "未能获取音频数据"}`);
    }
  } catch (error) {
    console.error("CharacterModal playTestVoice error:", error);
    toast.error(`试听失败: ${error instanceof Error ? error.message : "未知错误"}`);
  } finally {
    isTestingVoice.value = false;
  }
}

function submit() {
  if (!isFormValid.value) return;
  isSaving.value = true;
  try {
    if (props.character) {
      emit("update", props.character.id, {
        name: form.name.trim(),
        type: form.type,
        gender: form.gender,
        age: form.age,
        description: form.description.trim() || undefined,
        ttsConfig: form.ttsConfig.provider
          ? {
            provider: form.ttsConfig.provider as TTSProviderType,
            model: form.ttsConfig.model,
          }
          : undefined,
        updatedAt: new Date().toISOString(),
      });
    } else {
      emit("save", {
        name: form.name.trim(),
        type: form.type,
        gender: form.gender,
        age: form.age,
        description: form.description.trim() || undefined,
        ttsConfig: form.ttsConfig.provider
          ? {
            provider: form.ttsConfig.provider as TTSProviderType,
            model: form.ttsConfig.model,
          }
          : undefined,
        createdAt: new Date().toISOString(),
      });
    }
    emit("close");
  } finally {
    isSaving.value = false;
  }
}

onMounted(async () => {
  await settingsStore.loadTTSSettings();
  if (!props.character && !form.ttsConfig.provider) {
    form.ttsConfig.provider = (settingsStore.activeTTSProviderType as TTSProviderType) || "";
  }
  try {
    const res = await ttsApi.getVoiceModels();
    if (res.success && res.data) cachedVoiceModels.value = res.data;
  } catch (e) {
    console.error("Failed to load voice models cache:", e);
  }
});
</script>
