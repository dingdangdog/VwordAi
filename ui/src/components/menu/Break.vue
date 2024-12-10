<template>
  <div
    class="absolute min-w-24 rounded-md overflow-hidden cursor-pointer bg-gray-700 border border-gray-200"
    style="z-index: 999"
    :style="{ top: `${y}px`, left: `${x}px` }"
  >
    <div class="hover:bg-gray-800 p-2 text-center" @click="handleEdit">
      编辑
    </div>
    <div class="hover:bg-gray-800 p-2 text-center" @click="handleDelete">
      删除
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

const { x, y } = defineProps(["x", "y"]);
const emit = defineEmits(["edit", "delete"]);

const handleEdit = () => {
  emit("edit");
};

const handleDelete = () => {
  emit("delete");
};
</script>

<style scoped></style>
