<template>
  <div
    class="absolute min-w-24 bg-gray-900 rounded-md overflow-hidden cursor-pointer"
    style="z-index: 999"
    :style="{ top: `${y}px`, left: `${x}px` }"
  >
    <div class="hover:bg-gray-800 p-2 text-center" @click="handlePlay">
      试听
    </div>
    <div class="hover:bg-gray-800 p-2 text-center" @click="handleDelete">
      清除设置
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

const { x, y } = defineProps(["x", "y"]);
const emit = defineEmits(["play", "delete"]);

const handlePlay = () => {
  emit("play");
};

const handleDelete = () => {
  emit("delete");
};
</script>

<style scoped></style>
