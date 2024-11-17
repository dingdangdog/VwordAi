<script setup lang="ts">
import { ref } from "vue";

const { flag, item } = defineProps(["flag", "item"]);

const time = ref(item);
const emit = defineEmits(["cancel", "save"]);

const handleCancel = () => {
  emit("cancel");
};

const handleSave = () => {
  emit("save", time.value);
};
</script>

<template>
  <div
    v-show="flag"
    class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-400/50"
    style="z-index: 999"
  >
    <div class="px-4 py-2 bg-gray-900 rounded-md overflow-hidden">
      <h3 class="text-lg text-center pb-4">空白间隔设置</h3>
      <div class="flex items-center">
        <label for="blankTime">时长(毫秒)</label>
        <input
          name="blankTime"
          class="flex-1 w-full h-8 bg-transparent border border-gray-400 ml-4 p-2 my-2 rounded-md focus:outline-none"
          v-model="time"
        />
      </div>
      <div class="flex justify-center py-2">
        <div
          class="px-2 py-1 bg-gray-700 hover:bg-gray-600 cursor-pointer rounded-sm"
          @click="handleCancel"
        >
          取消
        </div>
        <div
          class="ml-2 px-2 py-1 bg-blue-500 hover:bg-blue-400 cursor-pointer rounded-sm"
          @click="handleSave"
        >
          确定
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
