<script setup lang="ts">
import { ref } from "vue";

const { items, select } = defineProps(["items", "select"]);

const selectedItem = ref("");

const changeSelected = (item: any) => {
  // console.log(item);
  selectedItem.value = item.name;
  select(item);
};
</script>

<template>
  <div class="select relative">
    <div
      class="selected flex justify-between items-center px-2 py-1 border rounded-md border-gray-400"
      :data="selectedItem ? selectedItem : '请选择'"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="1em"
        viewBox="0 0 512 512"
        class="arrow"
      >
        <path
          d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
        ></path>
      </svg>
    </div>
    <div class="options border border-gray-400 rounded-md overflow-hidden">
      <div
        class="cursor-pointer px-2 py-1 bg-gray-800 hover:bg-gray-700 duration-300"
        v-for="item in items"
        @click="changeSelected(item)"
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

.options {
  position: absolute;
  top: 0px;
  max-height: 30px;
  overflow-y: auto;
  width: 100%;
  opacity: 0;
  transition: 300ms;
}

.select:hover > .options {
  opacity: 1;
  top: 35px;
  max-height: 180px;
}

.select:hover > .selected .arrow {
  transform: rotate(0deg);
}

.select .selected::before {
  content: attr(data);
}
</style>
