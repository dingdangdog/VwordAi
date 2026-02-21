<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- 仅作遮罩，不响应点击关闭（避免误触、提升编辑体验） -->
      <div class="fixed inset-0 bg-ink/60 opacity-75" aria-hidden="true" />
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
              <h5 class="text-sm font-medium text-ink mb-2">TTS 语音配置</h5>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-surface-hover rounded-lg">
                <FormSelect id="tts-provider" v-model="form.ttsConfig.provider" label="TTS服务商"
                  :options="ttsProviderOptions" @change="onTtsProviderChange" />
                <FormSelect id="tts-model" v-model="form.ttsConfig.model" label="语音模型" :options="ttsModelOptions"
                  :disabled="!form.ttsConfig.provider" @change="onTtsModelChange" />
                <p v-if="form.ttsConfig.provider && availableVoiceModels.length === 0"
                  class="text-sm text-ink-muted col-span-2">
                  请先在 设置 → 语音服务 → 语音模型 中同步该服务商的模型
                </p>
                <!-- 情感/风格：仅当当前模型支持时展示，选项完全来自该模型的可选项 -->
                <div v-if="hasEmotionOrStyle" class="md:col-span-2">
                  <FormSelect id="tts-emotion" v-model="form.ttsConfig.emotion" label="情感 / 风格"
                    :options="emotionStyleOptions" placeholder="默认" />
                </div>
                <div>
                  <label for="tts-speed" class="block text-sm font-medium text-ink">语速 ({{ form.ttsConfig.speed
                  }})</label>
                  <input id="tts-speed" v-model.number="form.ttsConfig.speed" type="range" min="-50" max="50" step="5"
                    class="w-full h-2 bg-border rounded-lg" />
                </div>
                <div>
                  <label for="tts-pitch" class="block text-sm font-medium text-ink">音调 ({{ form.ttsConfig.pitch
                  }})</label>
                  <input id="tts-pitch" v-model.number="form.ttsConfig.pitch" type="range" min="-50" max="50" step="5"
                    class="w-full h-2 bg-border rounded-lg" />
                </div>
                <div>
                  <label for="tts-volume" class="block text-sm font-medium text-ink">音量 ({{ form.ttsConfig.volume
                  }})</label>
                  <input id="tts-volume" v-model.number="form.ttsConfig.volume" type="range" min="0" max="100" step="5"
                    class="w-full h-2 bg-border rounded-lg" />
                </div>
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
import { useSettingsStore } from "@/stores/settings";
import { getEmotionDisplayName } from "@/utils/voice-utils";
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
    speed: 0,
    pitch: 0,
    volume: 100,
    emotion: "",
    style: "",
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
/** 仅使用同步缓存（config/tts.json 的 voiceModelsCache），不做任何静态兜底 */
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
/** 当前选中的语音模型（情感/风格选项完全由此模型决定） */
const selectedVoiceModel = computed(() =>
  availableVoiceModels.value.find((m) => m.code === form.ttsConfig.model)
);
/** 当前模型是否支持情感或风格（仅此时展示情感选择，避免无效输入） */
const hasEmotionOrStyle = computed(() => {
  const m = selectedVoiceModel.value;
  const list = m?.emotions ?? m?.styles;
  return Array.isArray(list) && list.length > 0;
});
/** 情感/风格下拉选项：仅来自当前模型的可选项，展示名本地化 */
const emotionStyleOptions = computed(() => {
  const m = selectedVoiceModel.value;
  const list = m?.emotions ?? m?.styles;
  if (!Array.isArray(list) || list.length === 0) return [];
  const opts = list.map((e) => ({
    value: e.code,
    label: getEmotionDisplayName(e),
  }));
  return [{ value: "", label: "默认" }, ...opts];
});

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
    form.ttsConfig.speed = c.ttsConfig.speed ?? 0;
    form.ttsConfig.pitch = c.ttsConfig.pitch ?? 0;
    form.ttsConfig.volume = c.ttsConfig.volume ?? 100;
    form.ttsConfig.emotion = c.ttsConfig.emotion || "";
    form.ttsConfig.style = c.ttsConfig.style || "";
  } else {
    form.ttsConfig.provider = (settingsStore.activeTTSProviderType as TTSProviderType) || "";
    form.ttsConfig.model = "";
    form.ttsConfig.speed = 0;
    form.ttsConfig.pitch = 0;
    form.ttsConfig.volume = 100;
    form.ttsConfig.emotion = "";
    form.ttsConfig.style = "";
  }
}

function resetForm() {
  form.name = "";
  form.description = "";
  form.type = "main";
  form.gender = "male";
  form.age = "youth";
  form.ttsConfig.model = "";
  form.ttsConfig.emotion = "";
  form.ttsConfig.style = "";
  form.ttsConfig.speed = 0;
  form.ttsConfig.pitch = 0;
  form.ttsConfig.volume = 100;
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

/** 编辑时或模型列表加载后：若当前情感不在该模型支持列表中则清空 */
watch(
  [() => form.ttsConfig.model, () => selectedVoiceModel.value, () => form.ttsConfig.emotion],
  () => {
    const m = selectedVoiceModel.value;
    const list = m?.emotions ?? m?.styles;
    if (!form.ttsConfig.emotion || !Array.isArray(list) || list.length === 0) return;
    const valid = list.some((e) => e.code === form.ttsConfig.emotion);
    if (!valid) form.ttsConfig.emotion = "";
  }
);

function onTtsProviderChange() {
  form.ttsConfig.model = "";
  form.ttsConfig.emotion = "";
}

/** 切换语音模型后：若当前情感不在新模型支持列表中则清空，保证选项与数据一致 */
function onTtsModelChange() {
  const m = availableVoiceModels.value.find((x) => x.code === form.ttsConfig.model);
  const list = m?.emotions ?? m?.styles;
  if (!Array.isArray(list) || list.length === 0) {
    form.ttsConfig.emotion = "";
    return;
  }
  const valid = list.some((e) => e.code === form.ttsConfig.emotion);
  if (!valid) form.ttsConfig.emotion = "";
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
            speed: form.ttsConfig.speed,
            pitch: form.ttsConfig.pitch,
            volume: form.ttsConfig.volume,
            emotion: form.ttsConfig.emotion,
            style: form.ttsConfig.style,
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
            speed: form.ttsConfig.speed,
            pitch: form.ttsConfig.pitch,
            volume: form.ttsConfig.volume,
            emotion: form.ttsConfig.emotion,
            style: form.ttsConfig.style,
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
