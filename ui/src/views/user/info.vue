<script setup lang="ts">
import type { UserInfo } from "@/utils/cloud";
import { GlobalUserInfo, GlobalUserLogin } from "@/utils/global.store";
import request from "@/utils/request";
import { ref } from "vue";

const user = ref<UserInfo>();
const getUserInfo = () => {
  request("userInfo").then((res) => {
    user.value = res;
  });
};

getUserInfo();

const logout = () => {
  request("logout").then(() => {
    GlobalUserLogin.value = undefined;
    GlobalUserInfo.value = undefined;
  });
};
</script>

<template>
  <!-- <div>{{ user }}</div> -->
  <div>
    <div class="flex py-2">
      <span class="min-w-36">昵称：</span>
      <span>{{ user?.name }}</span>
    </div>
    <div class="flex py-2">
      <span class="min-w-36">账号：</span>
      <span>{{ user?.account }}</span>
    </div>
    <div class="flex py-2">
      <span class="min-w-36">余额（椟）：</span>
      <span>{{ user?.balance }}</span>
    </div>
    <div class="flex py-2">
      <span class="min-w-36">手机号：</span>
      <span>{{ user?.phone }}</span>
    </div>
    <div class="flex py-2">
      <span class="min-w-36">邮箱：</span>
      <span>{{ user?.email }}</span>
    </div>
    <div>
      <button
        class="px-2 py-1 rounded-md bg-red-500 hover:bg-red-400"
        @click="logout()"
      >
        退出登录
      </button>
    </div>
  </div>
</template>

<style scoped></style>
