<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";

import AppHeader from "./components/AppHeader.vue";
import AppAside from "./components/AppAside.vue";
import Message from "./components/Message.vue";
import { GlobalConfig, GlobalUserLogin } from "./utils/global.store";
import request from "@/utils/request";
import { alertError, alertInfo, alertSuccess } from "./utils/common";

alertInfo("配置加载中……");
request("getConfigApi")
  .then((res) => {
    // console.log(res);
    GlobalConfig.value = res;
    alertSuccess("系统配置加载完成!");
    initUser();
  })
  .catch((err) => {
    alertSuccess("系统配置加载失败!" + err);
  });

const initUser = () => {
  // alertInfo("用户信息加载中…");
  request("userInit").then((res) => {
    if (res && res.name) {
      GlobalUserLogin.value = res;
      alertSuccess(`欢迎 ${res.name}!`);
    } else {
      alertError("未登录!");
    }
  });
};
</script>

<template>
  <div class="rounded-md overflow-hidden">
    <AppHeader />
    <main class="h-screen pt-12">
      <div
        style="height: calc(100vh - 3rem)"
        class="overflow-y-auto flex justify-between relative"
      >
        <div class="h-full border-r border-gray-700 bg-gray-950">
          <AppAside />
        </div>
        <div class="w-full h-full overflow-y-auto bg-gray-900 relative">
          <Message />
          <RouterView />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts"></script>
