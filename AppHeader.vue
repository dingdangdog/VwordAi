<template>
  <div
    class="w-full h-12 bg-gray-950 fixed top-0 left-0 flex justify-between items-center drag-area rounded-t-md overflow-hidden border-b-2 border-gray-600"
  >
    <div class="w-1/2 px-3 flex items-center h-full">
      <img src="/logo.svg" class="w-8 h-8" />
      <h1 class="text-md px-2">文声 - Voice of Words</h1>
      <!-- <a
        class="h-full flex justify-center items-center px-4 hover:bg-gray-800 case-in-out duration-300"
        href="/donate"
        >{{ $t('menu.donate') }}
      </a> -->
    </div>

    <!-- <div class="w-1/2 flex h-full"></div> -->

    <div class="w-1/2 h-full flex justify-end items-center">
      <!-- <a href="https://github.com/dingdangdog/dingdangdog.github.io">
        <span><IconGithub class="w-8 h-8" :color="`rgb(243 244 246)`" /></span>
      </a>
      <LocaleSelect /> -->

      <div
        class="h-6 w-6 rounded-sm hover:bg-gray-800 mr-2 cursor-pointer no-drag"
        @click="minimizeWindow"
      >
        <IconMinimize class="text-white" />
      </div>
      <div
        class="h-6 w-6 rounded-sm hover:bg-gray-800 mr-2 cursor-pointer no-drag"
        @click="maximizeWindow"
        v-show="!isMax"
      >
        <IconMaximize />
      </div>
      <div
        class="h-6 w-6 rounded-sm hover:bg-gray-800 mr-2 cursor-pointer no-drag"
        @click="maximizeWindow"
        v-show="isMax"
      >
        <IconDock />
      </div>
      <div
        class="h-6 w-6 rounded-sm hover:bg-gray-800 mr-2 cursor-pointer no-drag"
        @click="closeWindow"
      >
        <IconClose />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import IconMinimize from "@/components/icon/minimize.vue";
import IconMaximize from "@/components/icon/maximize.vue";
import IconDock from "@/components/icon/dock.vue";
import IconClose from "@/components/icon/close.vue";
import { logout } from "@/utils/api";

// 最小化
const minimizeWindow = () => {
  // @ts-ignore
  window.electron.minimize();
};
// 最大化标志
const isMax = ref(false);
// 最大化
const maximizeWindow = () => {
  // @ts-ignore
  window.electron.maximize();
  isMas();
};
// 关闭窗口
const closeWindow = () => {
  logout();
  // @ts-ignore
  window.electron.close();
};

// 判断窗口是否最大化
const isMas = () => {
  // @ts-ignore
  window.electron.isMaximized().then((flag: boolean) => {
    isMax.value = flag;
  });
};

const onMouseDown = () => {
  if (isMax.value) {
    maximizeWindow();
  }
};

onMounted(() => {
  isMas();
});
</script>

<style scoped>
header.hidden {
  transform: translateY(-100%);
}

header.visible {
  transform: translateY(0);
}
</style>
