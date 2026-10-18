<template>
  <VDialog
    :open="open"
    title="新建章节"
    description="保存后进入章节工作台，可用 AI 拆分旁白与角色对白。"
    size="xl"
    persistent
    @close="emit('close')"
  >
    <form id="chapter-form" class="space-y-4" @submit.prevent="save">
      <VInput v-model="form.title" label="章节标题" placeholder="例如：第一回 甄士隐梦幻识通灵" required autofocus />
      <VTextarea v-model="form.content" label="章节内容" placeholder="粘贴章节正文…" :rows="14" counter required />
    </form>
    <template #footer>
      <VButton variant="ghost" @click="emit('close')">取消</VButton>
      <VButton variant="primary" type="submit" form="chapter-form" :disabled="!isValid">保存并打开</VButton>
    </template>
  </VDialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import VButton from "@/components/ui/VButton.vue";
import VDialog from "@/components/ui/VDialog.vue";
import VInput from "@/components/ui/VInput.vue";
import VTextarea from "@/components/ui/VTextarea.vue";

const props = withDefaults(defineProps<{ open?: boolean; novelId?: string }>(), { open: true });

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", chapter: { title: string; content: string; novelId: string }): void;
}>();

const form = reactive({ title: "", content: "" });
const isValid = computed(() => form.title.trim() !== "" && form.content.trim() !== "" && !!props.novelId);

watch(
  () => props.open,
  (open) => {
    if (open) {
      form.title = "";
      form.content = "";
    }
  },
  { immediate: true }
);

function save() {
  if (!isValid.value) return;
  emit("save", { title: form.title.trim(), content: form.content.trim(), novelId: props.novelId! });
}
</script>
