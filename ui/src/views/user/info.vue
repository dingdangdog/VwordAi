<script setup lang="ts">
import { GlobalUserInfo, GlobalUserLogin } from "@/utils/global.store";
import request from "@/utils/request";

// const user = ref<UserInfo>();
const getUserInfo = () => {
  request("userInfo").then((res) => {
    // user.value = res;
    GlobalUserInfo.value = res;
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
  <div class="p-2 h-full flex flex-col justify-center items-center">
    <div class="p-2 min-w-72">
      <div class="flex py-2">
        <span class="min-w-36">昵称</span>
        <span>{{ GlobalUserInfo?.name }}</span>
      </div>
      <div class="flex py-2">
        <span class="min-w-36">账号</span>
        <span>{{ GlobalUserInfo?.account }}</span>
      </div>
      <div class="flex py-2">
        <span class="min-w-36">余额（文）</span>
        <span>{{ GlobalUserInfo?.balance }}</span>
      </div>
      <div class="flex py-2">
        <span class="min-w-36">手机号</span>
        <span>{{ GlobalUserInfo?.phone }}</span>
      </div>
      <div class="flex py-2">
        <span class="min-w-36">邮箱</span>
        <span>{{ GlobalUserInfo?.email }}</span>
      </div>
    </div>
    <div>
      <button
        class="px-2 py-1 rounded-md bg-blue-500 hover:bg-blue-400"
        @click="logout()"
      >
        修改密码
      </button>
      <button
        class="ml-2 px-2 py-1 rounded-md bg-red-500 hover:bg-red-400"
        @click="logout()"
      >
        退出登录
      </button>
    </div>
  </div>
</template>

<style scoped></style>
