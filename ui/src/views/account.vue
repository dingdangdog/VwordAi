<script setup lang="ts">
import type { UserInfo } from "@/utils/cloud";
import { alertSuccess } from "@/utils/common";
import local from "@/utils/local";
import { ref } from "vue";

const user = ref<UserInfo>();
const getUserInfo = () => {
  local("userInfo").then((res) => {
    user.value = res;
  });
};

// getUserInfo();

const showForm = ref("login");

const loginParam = ref<any>({
  account: "",
  password: "",
});

const loginAccountError = ref(false);
const loginAccountErrorInfo = ref("");
const registerAccountError = ref(false);
const registerAccountErrorInfo = ref("");
const validAccount = (s: string, type: string) => {
  let flag = false;
  let errorInfo = "";
  if (!s) {
    flag = true;
    errorInfo = "必填";
  } else {
    flag = false;
  }
  if (type == "login") {
    loginAccountError.value = flag;
    loginAccountErrorInfo.value = errorInfo;
  } else if (type == "register") {
    registerAccountError.value = flag;
    registerAccountErrorInfo.value = errorInfo;
  }
};
const loginPasswordError = ref(false);
const loginPasswordErrorInfo = ref("");
const registerPasswordError = ref(false);
const registerPasswordErrorInfo = ref("");
const validPassword = (s: string, type: string) => {
  let flag = false;
  let errorInfo = "";
  if (!s) {
    flag = true;
    errorInfo = "必填";
  } else if (s.length < 8) {
    flag = true;
    errorInfo = "密码必须大于8个字符";
  } else {
    flag = false;
  }
  if (type == "login") {
    loginPasswordError.value = flag;
    loginPasswordErrorInfo.value = errorInfo;
  } else if (type == "register") {
    registerPasswordError.value = flag;
    registerPasswordErrorInfo.value = errorInfo;
  }
};
const registerAgainPasswordError = ref(false);
const registerAgainPasswordErrorInfo = ref("");
const validAgainPassword = (s: string, type: string) => {
  let flag = false;
  if (!s) {
    flag = true;
    registerAgainPasswordErrorInfo.value = "必填";
  } else if (s.length < 8) {
    flag = true;
    registerAgainPasswordErrorInfo.value = "密码必须大于8个字符";
  } else if (s != registerParam.value.password) {
    flag = true;
    registerAgainPasswordErrorInfo.value = "两次密码不一致";
  } else {
    flag = false;
  }
  if (type == "register") {
    registerAgainPasswordError.value = flag;
  }
};

const logining = ref(false);
const login = () => {
  validAccount(loginParam.value.account, "login");
  validPassword(loginParam.value.password, "login");
  if (loginAccountError.value || loginPasswordError.value) {
    return;
  }
  if (logining.value) {
    return;
  }
  logining.value = true;
  // TODO 登录
  local("login", loginParam.value)
    .then((res) => {
      console.log(res);
      alertSuccess("登录成功");
      getUserInfo();
    })
    .finally(() => {
      logining.value = false;
    });
};

const registerParam = ref({
  username: "",
  account: "",
  password: "",
  againPassword: "",
});
const registering = ref(false);
const register = () => {
  validAccount(registerParam.value.account, "register");
  validPassword(registerParam.value.password, "register");
  validAgainPassword(registerParam.value.againPassword, "register");
  if (
    registerAccountError.value ||
    registerPasswordError.value ||
    registerAgainPasswordError.value
  ) {
    return;
  }
  if (registering.value) {
    return;
  }
  registering.value = true;

  // TODO 注册
  local("register", registerParam.value)
    .then((res) => {
      console.log(res);
      alertSuccess("注册成功");
    })
    .finally(() => {
      registering.value = false;
    });
};
</script>

<template>
  <!-- <div>尚未登录</div> -->
  <div class="h-full w-full flex flex-col items-center">
    <div class="w-80 mt-36 flex flex-col items-center" v-show="!user">
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
              @change="validAccount(loginParam.account, 'login')"
              @focus="validAccount(loginParam.account, 'login')"
              placeholder="* 账号"
            />
            <span
              class="text-red-500 text-[12px] absolute right-2 bottom-2"
              v-show="loginAccountError"
              >{{ loginAccountErrorInfo }}
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
              @change="validPassword(loginParam.password, 'login')"
              @focus="validPassword(loginParam.password, 'login')"
              placeholder="* 密码"
            />
            <span
              class="text-red-500 text-[12px] absolute right-2 bottom-2"
              v-show="loginPasswordError"
              >{{ loginPasswordErrorInfo }}
            </span>
          </div>
        </div>
        <button
          class="w-full text-center py-2 rounded-md bg-gray-800 mt-8"
          :class="logining ? 'bg-gray-800' : 'hover:bg-gray-600'"
          @click="login()"
          :disabled="logining"
        >
          登录
        </button>
      </div>
      <div v-show="showForm == 'register'" class="mt-4 w-full">
        <div class="flex flex-col">
          <input
            class="rounded-md p-2 mt-4 bg-gray-500/50 focus:outline-none border border-gray-600"
            type="text"
            v-model="registerParam.username"
            placeholder="昵称"
          />
          <div class="relative w-full flex flex-col">
            <input
              class="rounded-md p-2 mt-4 bg-gray-500/50 focus:outline-none border border-gray-600"
              type="text"
              v-model="registerParam.account"
              :class="
                registerAccountError
                  ? 'border-red-500'
                  : 'focus:border-gray-300'
              "
              @change="validAccount(registerParam.account, 'register')"
              @focus="validAccount(registerParam.account, 'register')"
              placeholder="* 账号"
            />
            <span
              class="text-red-500 text-[12px] absolute right-2 bottom-2"
              v-show="registerAccountError"
              >{{ registerAccountErrorInfo }}
            </span>
          </div>
          <div class="relative w-full flex flex-col">
            <input
              class="rounded-md p-2 mt-4 bg-gray-500/50 focus:outline-none border border-gray-600"
              type="password"
              v-model="registerParam.password"
              :class="
                registerPasswordError
                  ? 'border-red-500'
                  : 'focus:border-gray-300'
              "
              @change="validPassword(registerParam.password, 'register')"
              @focus="validPassword(registerParam.password, 'register')"
              placeholder="* 密码"
            />
            <span
              class="text-red-500 text-[12px] absolute right-2 bottom-2"
              v-show="registerPasswordError"
              >{{ registerPasswordErrorInfo }}
            </span>
          </div>
          <div class="relative w-full flex flex-col">
            <input
              class="rounded-md p-2 mt-4 bg-gray-500/50 focus:outline-none border border-gray-600"
              type="password"
              v-model="registerParam.againPassword"
              :class="
                registerAgainPasswordError
                  ? 'border-red-500'
                  : 'focus:border-gray-300'
              "
              @change="
                validAgainPassword(registerParam.againPassword, 'register')
              "
              @focus="
                validAgainPassword(registerParam.againPassword, 'register')
              "
              placeholder="* 确认密码"
            />
            <span
              class="text-red-500 text-[12px] absolute right-2 bottom-2"
              v-show="registerAgainPasswordError"
              >{{ registerAgainPasswordErrorInfo }}
            </span>
          </div>
        </div>
        <button
          class="w-full text-center py-2 rounded-md bg-gray-800 mt-8"
          :class="registering ? 'bg-gray-800' : 'hover:bg-gray-600'"
          @click="register()"
          :disabled="registering"
        >
          注册
        </button>
      </div>
    </div>

    <div v-show="user">
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
  </div>
</template>

<style scoped></style>
