<template>
  <VDialog :open="open" :title="title" description="项目默认音色会应用到未单独设置音色的章节。" @close="emit('close')">
    <form id="project-form" class="space-y-4" @submit.prevent="submitForm">
      <VInput
        v-model="form.title"
        label="项目名称"
        placeholder="例如：有声书第一季"
        required
        :error="errors.title"
        autofocus
      />
      <VTextarea v-model="form.description" label="描述" :rows="3" placeholder="可选，用于在列表中区分项目" />

      <div class="rounded-md border border-line bg-surface p-3">
        <p class="section-title mb-3">默认声音</p>
        <div class="space-y-4">
          <VoiceSelect v-model="form.voiceId" label="音色" placeholder="未设置" />
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
import { reactive, ref, watch } from "vue";
import VDialog from "@/components/ui/VDialog.vue";
import VInput from "@/components/ui/VInput.vue";
import VTextarea from "@/components/ui/VTextarea.vue";
import VSlider from "@/components/ui/VSlider.vue";
import VButton from "@/components/ui/VButton.vue";
import VoiceSelect from "@/components/projects/VoiceSelect.vue";

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

const form = reactive({ title: "", description: "", voiceId: "", speed: 1 });
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
    errors.title = "";
  },
  { immediate: true }
);

function submitForm() {
  errors.title = form.title.trim() ? "" : "请输入项目名称";
  if (errors.title) return;
  emit("submit", {
    title: form.title.trim(),
    description: form.description.trim(),
    defaultVoiceSettings: { ...baseSettings.value, voiceId: form.voiceId, speed: form.speed },
  });
}
</script>
