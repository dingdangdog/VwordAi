<template>
  <div
    class="absolute min-w-24 rounded-md overflow-hidden cursor-pointer bg-gray-700 border border-gray-200"
    style="z-index: 999"
    :style="{ top: `${y}px`, left: `${x}px` }"
  >
    <div class="hover:bg-gray-800 p-2 text-center" @click="handlePlay">
      试听
    </div>
    <!-- <div class="hover:bg-gray-800 p-2 text-center" @click="handleColloct">
      收藏
    </div> -->
    <div class="hover:bg-gray-800 p-2 text-center" @click="handleEdit">
      编辑
    </div>
    <div class="hover:bg-gray-800 p-2 text-center" @click="addVoice">
      添加声音
    </div>
    <div class="hover:bg-gray-800 p-2 text-center" @click="handleDelete">
      清除设置
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

const { x, y } = defineProps(["x", "y"]);
const emit = defineEmits(["edit", "collect", "delete", "play", "addVoice"]);

const handleColloct = () => {
  emit("collect");
};
const handleEdit = () => {
  emit("edit");
};
const handleDelete = () => {
  emit("delete");
};
const handlePlay = () => {
  emit("play");
};
const addVoice = () => {
  emit("addVoice");
};
</script>

<style scoped></style>
