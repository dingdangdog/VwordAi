<template>
  <div
    class="h-full flex flex-col justify-between duration-300 overflow-hidden"
    :class="menuOpen ? 'w-40' : 'w-12'"
  >
    <div class="flex-1">
      <div
        v-for="menu in menus"
        :key="menu.code"
        :title="menu.name"
        @click="goPage(menu.code)"
        class="flex items-center p-2 hover:bg-gray-700 cursor-pointer duration-300"
        :class="activeMenu == menu.code ? 'bg-gray-800' : ''"
      >
        <div class="p-1">
          <div class="w-5 h-5 z-10">
            <component :is="getIcon(menu.icon)" />
          </div>
        </div>
        <div
          v-show="menuOpen"
          class="px-2 duration-300 overflow-hidden transition-opacity whitespace-nowrap"
          :class="menuOpen ? 'opacity-100 w-32' : 'opacity-0 w-0'"
        >
          {{ menu.name }}
        </div>
      </div>
    </div>
    <div
      class="w-full flex justify-center hover:bg-gray-800 cursor-pointer"
      @click="menuOpen = !menuOpen"
    >
      <div class="w-6 h-8 flex items-center">
        <IconMenu />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import router from "@/router";

import IconMicrophone from "@/components/icon/microphone.vue";
import IconCog from "@/components/icon/cog.vue";
import IconAccount from "@/components/icon/account.vue";
import IconAccountVoice from "@/components/icon/accountvoice.vue";
import IconWifi from "@/components/icon/wifi.vue";
import IconMenu from "@/components/icon/menu.vue";

const getIcon = (icon: string) => {
  switch (icon) {
    case "IconMicrophone":
      return IconMicrophone;
    case "IconCog":
      return IconCog;
    case "IconAccount":
      return IconAccount;
    case "IconAccountVoice":
      return IconAccountVoice;
    case "IconWifi":
      return IconWifi;
    default:
      return IconCog;
  }
};

const activeMenu = ref("oldmoon");
const menuOpen = ref(true);

const menus = [
  {
    code: "",
    name: "读书",
    icon: "IconMicrophone",
  },
  // {
  //   code: "novels",
  //   name: "读小说",
  //   icon: "IconMicrophone",
  // },
  // {
  //   code: "local",
  //   name: "本地开放",
  //   icon: "IconWifi",
  // },
  {
    code: "models",
    name: "模型库",
    icon: "IconAccountVoice",
  },
  {
    code: "setting",
    name: "系统设置",
    icon: "IconCog",
  },
  // {
  //   code: "account",
  //   name: "账户管理",
  //   icon: "IconAccount",
  // },
];

const goPage = (code: string) => {
  activeMenu.value = code;
  // navigateTo("/" + code);
  router.push({ path: "/" + code });
};

goPage("");
</script>

<style scoped></style>
