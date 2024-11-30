<script setup lang="ts">
import type { UserInfo } from "@/utils/cloud";
import local from "@/utils/local";
import { ref } from "vue";

const user = ref<UserInfo>();
const getUserInfo = () => {
  local("userInfo").then((res) => {
    user.value = res;
  });
};

getUserInfo();
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
  </div>
</template>

<style scoped></style>
