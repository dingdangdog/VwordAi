<template>
  <VDialog :open="open" :title="title" @close="emit('close')">
    <form id="project-form" class="space-y-4" @submit.prevent="submitForm">
      <VInput
        v-model="form.title"
        label="名称"
        placeholder="例如：产品发布稿"
        required
        :error="errors.title"
        autofocus
      />
      <VTextarea v-model="form.description" label="描述" :rows="3" placeholder="可选，用于在列表中区分" />

      <div class="rounded-md border border-line bg-surface p-3">
        <p class="section-title mb-3">默认声音</p>
        <div class="space-y-4">
          <VoiceSelect v-model="form.voiceId" label="音色" placeholder="未设置" />
          <VSelect v-model="form.emotion" label="默认情感" :options="emotionOptions" />
          <VSelect v-model="form.mimic" label="默认伪音" :options="mimicOptions" />
          <VSlider
            v-model="form.speed"
            label="语速"
            :min="0.5"
            :max="2"
            :step="0.05"
            :default-value="1"
            :format="(v) => `${v.toFixed(2)}×`"
          />
        </div>
      </div>
    </form>

    <template #footer>
      <VButton variant="ghost" @click="emit('close')">取消</VButton>
      <VButton variant="primary" type="submit" form="project-form" :loading="submitting">{{ submitText }}</VButton>
    </template>
  </VDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import VDialog from "@/components/ui/VDialog.vue";
import VInput from "@/components/ui/VInput.vue";
import VTextarea from "@/components/ui/VTextarea.vue";
import VSlider from "@/components/ui/VSlider.vue";
import VButton from "@/components/ui/VButton.vue";
import VSelect from "@/components/ui/VSelect.vue";
import VoiceSelect from "@/components/projects/VoiceSelect.vue";
import { traitChoices } from "@/utils/emotions";
import { useAccountStore } from "@/stores/account";

export interface ProjectFormData {
  title: string;
  description: string;
  defaultVoiceSettings: Record<string, any>;
}

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    submitText?: string;
    submitting?: boolean;
    initialData?: Partial<ProjectFormData> | null;
  }>(),
  { submitText: "保存", submitting: false, initialData: null }
);

const emit = defineEmits<{ close: []; submit: [data: ProjectFormData] }>();

const accountStore = useAccountStore();
const form = reactive({ title: "", description: "", voiceId: "", speed: 1, emotion: "dft", mimic: "dft" });
const selectedVoice = computed(() => accountStore.voices.find((voice) => voice.id === form.voiceId));
const emotionOptions = computed(() => traitChoices(selectedVoice.value?.emotions, form.emotion));
const mimicOptions = computed(() => traitChoices(selectedVoice.value?.roles, form.mimic));
const errors = reactive({ title: "" });
const baseSettings = ref<Record<string, any>>({});

watch(
  () => [props.open, props.initialData] as const,
  ([open]) => {
    if (!open) return;
    const data = props.initialData || {};
    baseSettings.value = { ...(data.defaultVoiceSettings || {}) };
    form.title = data.title || "";
    form.description = data.description || "";
    form.voiceId = baseSettings.value.voiceId || "";
    form.speed = Number(baseSettings.value.speed ?? 1) || 1;
    form.emotion = baseSettings.value.emotion || "dft";
    form.mimic = baseSettings.value.mimic || "dft";
    errors.title = "";
  },
  { immediate: true }
);

function submitForm() {
  errors.title = form.title.trim() ? "" : "请输入名称";
  if (errors.title) return;
  emit("submit", {
    title: form.title.trim(),
    description: form.description.trim(),
    defaultVoiceSettings: { ...baseSettings.value, voiceId: form.voiceId, speed: form.speed, emotion: form.emotion || "dft", mimic: form.mimic || "dft" },
  });
}
</script>
