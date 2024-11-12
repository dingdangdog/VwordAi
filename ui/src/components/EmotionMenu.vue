<template>
  <div
    class="absolute min-w-24 bg-gray-900 rounded-md overflow-hidden cursor-pointer"
    style="z-index: 999"
    :style="{ top: `${y}px`, left: `${x}px` }"
  >
    <div class="hover:bg-gray-800 p-2 text-center" @click="handlePlay">
      试听
    </div>
    <div class="hover:bg-gray-800 p-2 text-center" @click="handleEdit">
      编辑
    </div>
    <div class="hover:bg-gray-800 p-2 text-center" @click="handleDelete">
      清除设置
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

const { x, y } = defineProps(["x", "y"]);
const emit = defineEmits(["edit", "delete", "play"]);

const handleEdit = () => {
  emit("edit");
};
const handleDelete = () => {
  emit("delete");
};
const handlePlay = () => {
  emit("play");
};
</script>

<style scoped></style>
