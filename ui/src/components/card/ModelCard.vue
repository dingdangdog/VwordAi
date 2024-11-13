<script setup lang="ts">
// export interface Model {
//   lang: string;
//   gender: string;
//   name: string;
//   code: string;
//   level?: string;
//   emotions: Emotion[];
// }
const { model } = defineProps(["model"]);
</script>

<template>
  <div
    class="min-w-32 p-1 m-1 rounded-md"
    :class="model.gender == '女' ? 'bg-pink-500/20' : 'bg-blue-500/20'"
  >
    <div class="flex justify-between items-center">
      <h4>{{ model.name }}</h4>
      <span class="text-sm text-gray-500">{{ model.gender }}</span>
    </div>
    <p class="text-sm text-gray-500 flex justify-between">
      {{ model.code }}
    </p>
    <div class="flex justify-between items-center">
      <span class="text-sm text-gray-500">{{ model.lang }}</span>
      <span class="text-sm text-gray-500">{{ model.level }}</span>
    </div>
    <div v-show="model.emotions.length > 0" class="flex flex-wrap">
      <span
        class="text-sm text-gray-500 mx-1 underline"
        v-for="e in model.emotions"
        :key="e.code"
        :title="e.code"
      >
        {{ e.name }}
      </span>
    </div>
  </div>
</template>

<style scoped></style>
