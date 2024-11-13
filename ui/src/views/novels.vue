<script setup lang="ts">
import { ref } from "vue";
import local from "@/utils/local";

const webList = ref([]);
local("test", "null").then((res) => {
  console.log(res);
  webList.value = res;
});

const editText = ref(
  "阿莎空间的黄金卡上贷记卡和健康的啥叫看活动空间撒谎的看见哈萨克家里的贺卡距离首都看见了还是看还得看"
);
const textareaEdit = ref();

const showSelection = () => {
  const start = textareaEdit.value.selectionStart;
  const end = textareaEdit.value.selectionEnd;

  const selectedText = editText.value.substring(start, end);
  const highlightedText = `<span class="bg-yellow-900">${selectedText}</span>`;
  const newText =
    editText.value.substring(0, start) +
    highlightedText +
    editText.value.substring(end);

  // 更新文本框内容
  editText.value = newText;

  // return alert(editText.value.substring(start, end));
};
</script>

<template>
  <div class="h-full p-2 flex justify-between">
    <div
      class="h-full w-64 overflow-y-auto overflow-x-hidden p-2 bg-gray-800 rounded-md"
    >
      <div class="links">
      </div>
    </div>
    <div class="h-full w-full ml-2 flex flex-col">
      <div class="p-2 bg-gray-800 rounded-md h-24">
        <button
          class="px-2 py-1 bg-gray-800 rounded-md hover:bg-gray-700"
          @click="showSelection()"
        >
          show
        </button>
      </div>
      <div class="mt-2 p-2 bg-gray-800 rounded-md flex-1 h-[90%] flex">
        <textarea
          ref="textareaEdit"
          class="bg-gray-900 w-1/2 p-2 h-full"
          placeholder="请输入文本"
          v-model="editText"
        >
        </textarea>
        <div
          class="w-1/2 h-full ml-2 p-2 bg-gray-900 rounded-md overflow-y-auto"
          v-html="editText"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
