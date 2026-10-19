<template>
  <VDialog :open="open" :title="novel ? '编辑有声小说' : '新建有声小说'" @close="emit('close')">
    <form id="novel-form" class="space-y-4" @submit.prevent="save">
      <div class="grid grid-cols-2 gap-4">
        <VInput v-model="form.title" label="书名" placeholder="例如：红楼梦" required autofocus />
        <VInput v-model="form.author" label="作者" placeholder="例如：曹雪芹" required />
      </div>
      <VTextarea v-model="form.description" label="简介" placeholder="选填" :rows="3" />
      <VInput v-model="form.cover" label="封面图片地址" placeholder="选填，https://…" />
    </form>
    <template #footer>
      <VButton variant="ghost" @click="emit('close')">取消</VButton>
      <VButton variant="primary" type="submit" form="novel-form" :disabled="!isValid">保存</VButton>
    </template>
  </VDialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import VButton from "@/components/ui/VButton.vue";
import VDialog from "@/components/ui/VDialog.vue";
import VInput from "@/components/ui/VInput.vue";
import VTextarea from "@/components/ui/VTextarea.vue";
import type { Novel } from "@/types/ReadNovels";

const props = withDefaults(defineProps<{ open?: boolean; novel?: Novel | null }>(), { open: true, novel: null });

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", data: Partial<Novel>): void;
}>();

const form = reactive({ title: "", author: "", description: "", cover: "" });
const isValid = computed(() => form.title.trim() !== "" && form.author.trim() !== "");

watch(
  () => [props.open, props.novel] as const,
  ([open, novel]) => {
    if (!open) return;
    form.title = novel?.title || "";
    form.author = novel?.author || "";
    form.description = novel?.description || "";
    form.cover = novel?.cover || "";
  },
  { immediate: true }
);

function save() {
  if (!isValid.value) return;
  emit("save", {
    title: form.title.trim(),
    author: form.author.trim(),
    description: form.description.trim() || undefined,
    cover: form.cover.trim() || undefined,
  });
}
</script>
