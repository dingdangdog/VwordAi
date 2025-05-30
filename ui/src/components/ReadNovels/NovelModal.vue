<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- 背景遮罩 -->
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div class="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
      </div>

      <!-- 模态框居中技巧 -->
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

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
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-headline">
                {{ novel ? '编辑小说' : '新建小说' }}
              </h3>
              
              <div class="mt-4 space-y-4">
                <!-- 表单 -->
                <div class="space-y-3">
                  <div>
                    <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      小说标题 <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="title"
                      v-model="form.title"
                      class="input w-full"
                      placeholder="请输入小说标题"
                      required
                    />
                  </div>
                  
                  <div>
                    <label for="author" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      作者 <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="author"
                      v-model="form.author"
                      class="input w-full"
                      placeholder="请输入作者姓名"
                      required
                    />
                  </div>
                  
                  <div>
                    <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      简介
                    </label>
                    <textarea 
                      id="description"
                      v-model="form.description"
                      rows="3"
                      class="input w-full"
                      placeholder="请输入小说简介（选填）"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label for="cover" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      封面图片URL
                    </label>
                    <input 
                      type="text" 
                      id="cover"
                      v-model="form.cover"
                      class="input w-full"
                      placeholder="请输入封面图片URL（选填）"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button 
            type="button" 
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            @click="save"
            :disabled="!isValid || isSaving"
          >
            {{ isSaving ? '保存中...' : '保存' }}
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
import { ref, reactive, computed, watch } from 'vue';
import type { Novel } from '@/types/ReadNovels';

const props = defineProps<{
  novel?: Novel | null
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', data: Partial<Novel>): void;
}>();

const isSaving = ref(false);

// 表单数据
const form = reactive({
  title: '',
  author: '',
  description: '',
  cover: ''
});

// 表单有效性验证
const isValid = computed(() => {
  return form.title.trim() !== '' && form.author.trim() !== '';
});

// 如果是编辑模式，初始化表单数据
watch(() => props.novel, (novel) => {
  if (novel) {
    form.title = novel.title || '';
    form.author = novel.author || '';
    form.description = novel.description || '';
    form.cover = novel.cover || '';
  } else {
    // 如果是新建模式，重置表单
    form.title = '';
    form.author = '';
    form.description = '';
    form.cover = '';
  }
}, { immediate: true });

// 保存小说
async function save() {
  if (!isValid.value) return;
  
  isSaving.value = true;
  
  try {
    const novelData = {
      title: form.title.trim(),
      author: form.author.trim(),
      description: form.description.trim() || undefined,
      cover: form.cover.trim() || undefined
    };
    
    emit('save', novelData);
  } finally {
    isSaving.value = false;
  }
}
</script> 