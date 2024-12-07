<script setup lang="ts">
import { ref } from "vue";

import UserInfo from "./info.vue";
import UserOrder from "./order.vue";
import UserProject from "./project.vue";
import UserFundlogs from "./fundlogs.vue";

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
    name: "账户明细",
    path: "fundlogs",
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
    <div class="flex-1 h-full">
      <UserInfo v-if="selectedMenu === 'info'" />
      <UserOrder v-if="selectedMenu === 'order'" />
      <UserProject v-if="selectedMenu === 'project'" />
      <UserFundlogs v-if="selectedMenu === 'fundlogs'" />
    </div>
  </div>
</template>

<style scoped></style>
