<script setup lang="ts">
import { ref } from "vue";

const { items, select, selected } = defineProps([
  "items",
  "select",
  "selected",
]);

const showOptions = ref(false); // 用于控制选项显示状态
const selectedItem = ref(selected);
console.log(selectedItem.value);

const changeSelected = (item: any) => {
  // console.log(item);
  showOptions.value = false;
  selectedItem.value = item;
  select(item);
};

const taggleShowOptions = () => {
  showOptions.value = !showOptions.value;
};
</script>

<template>
  <div class="select relative cursor-pointer" @click="taggleShowOptions()">
    <div
      class="selected flex justify-between items-center px-2 py-1 border rounded-md border-gray-400"
      :data="selectedItem ? selectedItem.name : '请选择'"
      style="z-index: 100"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="1em"
        viewBox="0 0 512 512"
        class="arrow"
        :style="
          showOptions
            ? 'transform: rotate(0deg);'
            : 'transform: rotate(-90deg);'
        "
        style="z-index: 100"
      >
        <path
          d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
        ></path>
      </svg>
    </div>
    <div
      class="absolute w-full overflow-hidden overflow-y-auto border border-gray-400 rounded-md duration-300"
      :style="
        showOptions
          ? 'opacity: 1; top: 32px; max-height: 160px;'
          : 'opacity: 0; top: 0px; max-height: 30px;'
      "
      v-show="showOptions"
      style="z-index: 101"
    >
      <div
        class="cursor-pointer px-2 py-1 bg-gray-800 hover:bg-gray-700 duration-300"
        :title="item.desc"
        style="z-index: 101"
        v-for="item in items"
        @click.stop="changeSelected(item)"
      >
        <span>{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.arrow {
  position: relative;
  right: 0px;
  height: 10px;
  transform: rotate(-90deg);
  width: 25px;
  fill: white;
  z-index: 100000;
  transition: 300ms;
}

.select .selected::before {
  content: attr(data);
}
</style>
