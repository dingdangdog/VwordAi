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
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
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
                角色管理
              </h3>

              <div class="mt-4 space-y-4">
                <!-- 添加新角色表单 -->
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4
                    class="text-md font-medium text-gray-900 dark:text-white mb-3"
                  >
                    添加新角色
                  </h4>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        for="name"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        角色名称 <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        v-model="form.name"
                        class="input"
                        placeholder="请输入角色名称"
                      />
                    </div>

                    <div>
                      <label
                        for="type"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        角色类型 <span class="text-red-500">*</span>
                      </label>
                      <select id="type" v-model="form.type" class="input">
                        <option value="main">主要角色</option>
                        <option value="secondary">次要角色</option>
                        <option value="extra">路人角色</option>
                      </select>
                    </div>

                    <div>
                      <label
                        for="gender"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        性别 <span class="text-red-500">*</span>
                      </label>
                      <select id="gender" v-model="form.gender" class="input">
                        <option value="male">男</option>
                        <option value="female">女</option>
                      </select>
                    </div>

                    <div>
                      <label
                        for="age"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        年龄段 <span class="text-red-500">*</span>
                      </label>
                      <select id="age" v-model="form.age" class="input">
                        <option value="child">儿童</option>
                        <option value="youth">青年</option>
                        <option value="middle">中年</option>
                        <option value="elder">老年</option>
                      </select>
                    </div>

                    <div class="md:col-span-2">
                      <label
                        for="description"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        角色描述
                      </label>
                      <textarea
                        id="description"
                        v-model="form.description"
                        rows="2"
                        class="input"
                        placeholder="请输入角色描述（选填）"
                      ></textarea>
                    </div>
                  </div>

                  <div class="mt-4 flex justify-end">
                    <button
                      @click="saveCharacter"
                      class="btn btn-primary"
                      :disabled="!isFormValid || isSaving"
                    >
                      {{ isSaving ? "保存中..." : "添加角色" }}
                    </button>
                  </div>
                </div>

                <!-- 现有角色列表 -->
                <div>
                  <h4
                    class="text-md font-medium text-gray-900 dark:text-white mb-3"
                  >
                    现有角色
                  </h4>

                  <div v-if="characters.length === 0" class="text-center py-4">
                    <p class="text-gray-500 dark:text-gray-400">
                      暂无角色，请使用上方表单添加
                    </p>
                  </div>

                  <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      v-for="character in characters"
                      :key="character.id"
                      class="p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                    >
                      <div class="flex justify-between">
                        <div>
                          <h5
                            class="text-sm font-medium text-gray-900 dark:text-white"
                          >
                            {{ character.name }}
                          </h5>
                          <div class="mt-1 flex items-center space-x-2">
                            <span
                              class="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200"
                            >
                              {{ characterTypeLabel(character.type) }}
                            </span>
                            <span
                              class="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-200"
                            >
                              {{ genderAgeLabel(character) }}
                            </span>
                          </div>
                          <p
                            v-if="character.description"
                            class="mt-1 text-xs text-gray-500 dark:text-gray-400"
                          >
                            {{ character.description }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
            @click="$emit('close')"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import type { Character } from "@/types/ReadNovels";

const props = defineProps<{
  novelId?: string;
  characters: Character[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", character: Omit<Character, "id">): void;
}>();

const isSaving = ref(false);

// 表单数据
const form = reactive({
  name: "",
  type: "main" as "main" | "secondary" | "extra",
  gender: "male" as "male" | "female",
  age: "youth" as "child" | "youth" | "middle" | "elder",
  description: "",
});

// 表单验证
const isFormValid = computed(() => {
  return form.name.trim() !== "" && props.novelId;
});

// 保存角色
function saveCharacter() {
  if (!isFormValid.value) return;

  isSaving.value = true;

  try {
    const characterData: Omit<Character, "id"> = {
      novelId: props.novelId!,
      name: form.name.trim(),
      type: form.type,
      gender: form.gender,
      age: form.age,
      description: form.description.trim() || undefined,
    };

    emit("save", characterData);

    // 重置表单
    resetForm();
  } finally {
    isSaving.value = false;
  }
}

// 重置表单
function resetForm() {
  form.name = "";
  form.description = "";
  // 保留其他选择，以便于连续添加相似角色
}

// 获取角色类型标签
function characterTypeLabel(type: string): string {
  switch (type) {
    case "main":
      return "主要角色";
    case "secondary":
      return "次要角色";
    case "extra":
      return "路人角色";
    default:
      return type;
  }
}

// 获取性别年龄标签
function genderAgeLabel(character: Character): string {
  const gender = character.gender === "male" ? "男" : "女";
  let age = "";

  switch (character.age) {
    case "child":
      age = "儿童";
      break;
    case "youth":
      age = "青年";
      break;
    case "middle":
      age = "中年";
      break;
    case "elder":
      age = "老年";
      break;
  }

  return `${gender}${age}`;
}
</script>
