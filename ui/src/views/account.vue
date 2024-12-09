<script setup lang="ts">
import UserIndex from "@/views/user/index.vue";
import LoginForm from "@/components/form/LoginForm.vue";
import { GlobalUserLogin } from "@/utils/global.store";
</script>

<template>
  <!-- <div>尚未登录</div> -->
  <div class="h-full w-full flex flex-col justify-center items-center">
    <LoginForm v-if="!GlobalUserLogin" class="w-96 -mt-16" />

    <div class="h-full w-full" v-if="GlobalUserLogin">
      <UserIndex />
    </div>
  </div>
</template>

<style scoped></style>
