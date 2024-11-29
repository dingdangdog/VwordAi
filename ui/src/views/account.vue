<script setup lang="ts">
import { ref } from "vue";

const showForm = ref("login");

const loginParam = ref<any>({
  account: "",
  password: "",
});

const errorInfo = ref("");
const loginAccountError = ref(false);
const validAccount = () => {
  if (!loginParam.value.account) {
    loginAccountError.value = true;
    errorInfo.value = "必填";
  } else {
    loginAccountError.value = false;
  }
};
const loginPasswordError = ref(false);
const validPassword = () => {
  if (!loginParam.value.password) {
    loginPasswordError.value = true;
    errorInfo.value = "必填";
  } else if (loginParam.value.password.length < 8) {
    loginPasswordError.value = true;
    errorInfo.value = "密码必须大于8个字符";
  } else {
    loginAccountError.value = false;
  }
};

const logining = ref(false);
const login = () => {
  if (loginAccountError || loginPasswordError) {
    return;
  }
  if (logining.value) {
    return;
  }
  
  // 登录
};

const passwordRules = [
  (v: string) => !!v || "必填",
  (v: string) => (v && v.length >= 8) || "密码必须大于等于8个字符",
];

const registerParam = ref({
  username: "",
  account: "",
  password: "",
  againPassword: "",
});
</script>

<template>
  <!-- <div>尚未登录</div> -->
  <div class="h-full w-full flex flex-col justify-center items-center">
    <div class="w-80 -mt-36 flex flex-col items-center">
      <div class="w-48 flex justify-between rounded-md overflow-hidden">
        <span
          class="flex-1 cursor-pointer py-2 text-center hover:bg-gray-700 font-bold"
          :class="showForm == 'login' ? 'bg-gray-600' : 'bg-gray-800'"
          @click="showForm = 'login'"
          >登录</span
        >
        <span
          class="flex-1 cursor-pointer py-2 text-center hover:bg-gray-700 font-bold"
          :class="showForm == 'register' ? 'bg-gray-600' : 'bg-gray-800'"
          @click="showForm = 'register'"
          >注册</span
        >
      </div>
      <div v-show="showForm == 'login'" class="mt-4 w-full">
        <div class="flex flex-col">
          <div class="relative w-full flex flex-col">
            <input
              class="rounded-md p-2 mt-4 bg-gray-500/50 focus:outline-none border border-gray-600"
              type="text"
              v-model="loginParam.account"
              :class="
                loginAccountError ? 'border-red-500' : 'focus:border-gray-300'
              "
              @change="validAccount()"
              @focus="validAccount()"
              placeholder="* 账号"
            />
            <span
              class="text-red-500 text-sm absolute -right-8 top-6"
              v-show="loginAccountError"
              >{{ errorInfo }}
            </span>
          </div>
          <div class="relative w-full flex flex-col">
            <input
              class="rounded-md p-2 mt-4 bg-gray-500/50 focus:outline-none border border-gray-600"
              type="password"
              v-model="loginParam.password"
              :class="
                loginPasswordError ? 'border-red-500' : 'focus:border-gray-300'
              "
              @change="validPassword()"
              @focus="validPassword()"
              placeholder="* 密码"
            />
            <span
              class="text-red-500 text-sm absolute -right-8 top-6"
              v-show="loginPasswordError"
              >{{ errorInfo }}
            </span>
          </div>
        </div>
        <button
          class="w-full text-center py-2 rounded-md bg-gray-800 hover:bg-gray-700 mt-8"
        >
          登录
        </button>
      </div>
      <div v-show="showForm == 'register'" class="mt-4 w-full">
        <div class="flex flex-col">
          <input
            class="rounded-md p-2 mt-4 bg-gray-500/50 focus:outline-none border border-gray-600 focus:border-gray-300"
            type="text"
            v-model="registerParam.username"
            placeholder="昵称"
          />
          <input
            class="rounded-md p-2 mt-4 bg-gray-500/50 focus:outline-none border border-gray-600 focus:border-gray-300"
            type="text"
            v-model="registerParam.account"
            placeholder="账号"
          />
          <input
            class="rounded-md p-2 mt-4 bg-gray-500/50 focus:outline-none border border-gray-600 focus:border-gray-300"
            type="password"
            v-model="registerParam.password"
            placeholder="密码"
          />
          <input
            class="rounded-md p-2 mt-4 bg-gray-500/50 focus:outline-none border border-gray-600 focus:border-gray-300"
            type="password"
            v-model="registerParam.againPassword"
            placeholder="确认密码"
          />
        </div>
        <button
          class="w-full text-center py-2 rounded-md bg-gray-800 hover:bg-gray-700 mt-8"
        >
          注册
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
