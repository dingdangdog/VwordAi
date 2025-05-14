<template>
  <div class="novel-detail bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <div class="flex justify-between items-start">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ novel.title }}
      </h2>
      <div class="flex space-x-2">
        <button
          @click="$emit('manage-characters')"
          class="btn btn-sm flex items-center"
          title="管理角色"
        >
          <UsersIcon class="h-4 w-4 mr-1" />
          管理角色
        </button>
        <button
          @click="$emit('edit-novel', novel)"
          class="btn btn-sm flex items-center"
          title="编辑小说信息"
        >
          <PencilSquareIcon class="h-4 w-4 mr-1" />
          编辑
        </button>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- <div class="md:col-span-1">
        <div
          class="bg-gray-200 dark:bg-gray-700 rounded-md aspect-[2/3] flex items-center justify-center"
        >
          <div v-if="!novel.cover" class="text-gray-400 dark:text-gray-500">
            <BookOpenIcon class="h-16 w-16 mx-auto" />
            <p class="text-center text-sm mt-2">暂无封面</p>
          </div>
          <img
            v-else
            :src="novel.cover"
            :alt="novel.title"
            class="w-full h-full object-cover rounded-md"
          />
        </div>
      </div> -->

      <div class="md:col-span-3">
        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">
              作者
            </h3>
            <p class="text-base text-gray-900 dark:text-white">
              {{ novel.author }}
            </p>
          </div>

          <div v-if="novel.description">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">
              简介
            </h3>
            <p
              class="text-base text-gray-900 dark:text-white whitespace-pre-wrap"
            >
              {{ novel.description }}
            </p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">
              角色
            </h3>
            <p
              v-if="novel.characters?.length"
              class="text-base text-gray-900 dark:text-white whitespace-pre-wrap"
            >
              {{
                novel.characters?.map((character) => character.name).join(", ")
              }}
            </p>
            <p v-else class="text-gray-500 dark:text-gray-400">暂无角色</p>
          </div>

          <div class="flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div>
              <span>创建于: {{ formatDate(novel.createdAt) }}</span>
            </div>
            <div>
              <span>更新于: {{ formatDate(novel.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BookOpenIcon,
  PencilSquareIcon,
  UsersIcon,
} from "@heroicons/vue/24/outline";
import type { Novel } from "@/types/ReadNovels";

defineProps<{
  novel: Novel;
}>();

defineEmits<{
  (e: "edit-novel", novel: Novel): void;
  (e: "manage-characters"): void;
}>();

// 格式化日期
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
</script>
