<template>
  <div
    class="absolute min-w-24 bg-gray-900 rounded-md overflow-hidden cursor-pointer"
    style="z-index: 999"
    :style="{ top: `${y}px`, left: `${x}px` }"
  >
    <div class="hover:bg-gray-800 p-2 text-center" @click="handlePlay">
      试听
    </div>
    <!-- <div class="hover:bg-gray-800 p-2 text-center" @click="handleColloct">
      收藏
    </div> -->
    <div class="hover:bg-gray-800 p-2 text-center" @click="handleDeleteVoice">
      清除声音
    </div>
    <div class="hover:bg-gray-800 p-2 text-center" @click="handleDeleteEmotion">
      清除情感
    </div>
    <div class="hover:bg-gray-800 p-2 text-center" @click="handleDelete">
      清除全部
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

const { x, y } = defineProps(["x", "y"]);
const emit = defineEmits([
  "play",
  "collect",
  "delete",
  "addEmotion",
  "deleteVoice",
  "deleteEmotion",
]);

const handlePlay = () => {
  emit("play");
};
const handleColloct = () => {
  emit("collect");
};
const handleDeleteVoice = () => {
  emit("deleteVoice");
};
const handleDeleteEmotion = () => {
  emit("deleteEmotion");
};
const handleDelete = () => {
  emit("delete");
};
const addEmotion = () => {
  emit("addEmotion");
};
</script>

<style scoped></style>
