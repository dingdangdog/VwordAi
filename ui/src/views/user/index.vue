<script setup lang="ts">
import { ref } from "vue";

import UserInfo from "./info.vue";
import UserOrder from "./order.vue";
import UserProject from "./project.vue";
import UserUsed from "./used.vue";

const selectedMenu = ref("info");

const menus = ref([
  {
    id: "1",
    name: "个人信息",
    path: "info",
  },
  {
    id: "2",
    name: "我的作品",
    path: "project",
  },
  {
    id: "3",
    name: "充值记录",
    path: "order",
  },
  {
    id: "4",
    name: "消费记录",
    path: "used",
  },
]);
// console.log(selectedMenu.value);
</script>

<template>
  <div class="h-full w-full flex justify-between">
    <div class="w-40 h-full bg-black/20 flex flex-col">
      <a
        v-for="menu in menus"
        :key="menu.id"
        class="p-2 hover:bg-gray-700 cursor-pointer duration-300"
        :class="selectedMenu == menu.path ? 'bg-gray-800' : ''"
        @click="selectedMenu = menu.path"
      >
        {{ menu.name }}
      </a>
    </div>
    <div class="flex-1 h-full overflow-y-auto">
      <UserInfo v-if="selectedMenu === 'info'" />
      <UserOrder v-if="selectedMenu === 'order'" />
      <UserProject v-if="selectedMenu === 'project'" />
      <UserUsed v-if="selectedMenu === 'used'" />
    </div>
  </div>
</template>

<style scoped></style>
