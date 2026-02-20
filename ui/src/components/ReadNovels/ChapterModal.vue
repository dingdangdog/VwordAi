<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- 背景遮罩 -->
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div
          class="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"
        ></div>
      </div>

      <!-- 模态框居中技巧 -->
      <span
        class="hidden sm:inline-block sm:align-middle sm:h-screen"
        aria-hidden="true"
        >&#8203;</span
      >

      <!-- 模态框内容 -->
      <div
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3
                class="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                id="modal-headline"
              >
                新建章节
              </h3>

              <div class="mt-4 space-y-4">
                <div class="space-y-3">
                  <FormInput
                    id="title"
                    v-model="form.title"
                    label="章节标题"
                    placeholder="请输入章节标题"
                    required
                  >
                    <template #label>章节标题 <span class="text-red-500">*</span></template>
                  </FormInput>

                  <FormTextarea
                    id="content"
                    v-model="form.content"
                    label="章节内容"
                    placeholder="请输入章节内容"
                    :rows="10"
                    hint="输入章节文本后，将使用LLM自动解析对话和角色，便于后续生成TTS。"
                  >
                    <template #label>章节内容 <span class="text-red-500">*</span></template>
                  </FormTextarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
        >
          <button
            type="button"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            @click="save"
            :disabled="!isValid || isSaving"
          >
            {{ isSaving ? "保存中..." : "保存" }}
          </button>
          <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            @click="$emit('close')"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import FormInput from "@/components/common/FormInput.vue";
import FormTextarea from "@/components/common/FormTextarea.vue";

const props = defineProps<{
  novelId?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "save",
    chapter: { title: string; content: string; novelId: string }
  ): void;
}>();

const isSaving = ref(false);

// 表单数据
const form = reactive({
  title: "",
  content: "",
});

// 表单验证
const isValid = computed(() => {
  return (
    form.title.trim() !== "" &&
    form.content.trim() !== "" &&
    props.novelId !== undefined
  );
});

// 保存章节
async function save() {
  if (!isValid.value) return;

  isSaving.value = true;

  try {
    const chapterData = {
      title: form.title.trim(),
      content: form.content.trim(),
      novelId: props.novelId!,
    };

    emit("save", chapterData);
  } finally {
    isSaving.value = false;
  }
}
</script>
