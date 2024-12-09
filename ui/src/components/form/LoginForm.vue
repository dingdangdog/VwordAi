<script setup lang="ts">
import { onMounted, ref } from "vue";
import { alertSuccess } from "@/utils/common";
import { GlobalConfig, GlobalUserLogin } from "@/utils/global.store";
import { request } from "@/utils/request";

const { success } = defineProps(["success"]);

const showForm = ref("login");
const lookPs = ref(false);
const lookRegisterPs = ref(false);

const loginParam = ref<any>({
  account: "",
  password: "",
});
const saveFlag = ref({
  save: false,
  autoLogin: false,
});

onMounted(() => {
  loginParam.value.account = GlobalConfig.value?.account?.data.account || "";
  loginParam.value.password = GlobalConfig.value?.account?.data.password || "";
  saveFlag.value.save = GlobalConfig.value.account?.save || false;
  saveFlag.value.autoLogin = GlobalConfig.value.account?.autoLogin || false;
});

const accountRules = [(v: string) => !!v || "必填"];
const passwordRules = [
  (v: string) => !!v || "必填",
  (v: string) => (v && v.length >= 8) || "密码必须大于等于8个字符",
];
const againPasswordRules = [
  (v: string) => !!v || "必填",
  (v: string) => v == registerParam.value.password || "密码不一致",
];

const logining = ref(false);
const loginForm = ref();
const login = async () => {
  const { valid } = await loginForm.value.validate();
  if (!valid) {
    return;
  }
  if (logining.value) {
    return;
  }
  logining.value = true;
  // 登录
  request("login", loginParam.value, saveFlag.value)
    .then((res) => {
      // console.log(res);
      localStorage.setItem("token", res.token);
      alertSuccess("登录成功");
      GlobalUserLogin.value = res;
    })
    .finally(() => {
      logining.value = false;
    });
};

const registerForm = ref();
const registerParam = ref({
  username: "",
  account: "",
  password: "",
  againPassword: "",
});
const registering = ref(false);
const register = async () => {
  const { valid } = await registerForm.value.validate();
  if (!valid) {
    return;
  }
  if (registering.value) {
    return;
  }
  registering.value = true;

  // 注册
  request("register", registerParam.value, saveFlag.value)
    .then((res) => {
      console.log(res);
      localStorage.setItem("token", res.token);
      alertSuccess("注册成功");
      GlobalUserLogin.value = res;
    })
    .finally(() => {
      registering.value = false;
    });
};
</script>

<template>
  <div class="flex flex-col items-center">
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
      <v-form ref="loginForm">
        <v-text-field
          v-model="loginParam.account"
          :rules="accountRules"
          :counter="16"
          name="account"
          label="账号"
          required
        ></v-text-field>
        <v-text-field
          v-model="loginParam.password"
          :rules="passwordRules"
          name="password"
          :counter="36"
          label="密码"
          required
          :type="lookPs ? 'text' : 'password'"
          :append-inner-icon="lookPs ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="lookPs = !lookPs"
        ></v-text-field>

        <div class="flex justify-between">
          <div class="px-4 flex justify-center items-center">
            <input
              type="checkbox"
              class="mx-2 w-4 h-4"
              v-model="saveFlag.save"
            />
            <span class="">记住密码</span>
          </div>
          <div class="px-4 flex justify-center items-center">
            <input
              type="checkbox"
              class="mx-2 w-4 h-4"
              v-model="saveFlag.autoLogin"
              :disabled="!saveFlag.save"
            />
            <span class="">自动登录</span>
          </div>
        </div>
        <div class="flex flex-col">
          <v-btn
            class="mt-4"
            color="primary"
            block
            @click="login()"
            :disabled="logining"
          >
            登录
          </v-btn>

          <!-- <v-btn class="mt-4" color="error" block @click="resetLoginForm">
              重置
            </v-btn> -->
        </div>
      </v-form>
    </div>
    <div v-show="showForm == 'register'" class="mt-4 w-full">
      <v-form ref="registerForm">
        <v-text-field
          v-model="registerParam.username"
          name="name"
          :counter="24"
          label="昵称"
          required
        ></v-text-field>
        <v-text-field
          v-model="registerParam.account"
          :rules="accountRules"
          name="account"
          :counter="16"
          label="账号"
          clearable
          required
        ></v-text-field>
        <v-text-field
          v-model="registerParam.password"
          :rules="passwordRules"
          :counter="36"
          name="password"
          label="密码"
          clearable
          required
          :type="lookRegisterPs ? 'text' : 'password'"
          :append-inner-icon="lookRegisterPs ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="lookRegisterPs = !lookRegisterPs"
        ></v-text-field>
        <v-text-field
          v-model="registerParam.againPassword"
          :rules="againPasswordRules"
          :counter="36"
          label="确认密码"
          clearable
          required
          :type="lookRegisterPs ? 'text' : 'password'"
          :append-inner-icon="lookRegisterPs ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="lookRegisterPs = !lookRegisterPs"
        ></v-text-field>
      </v-form>
      <div class="flex justify-between">
        <div class="px-4 flex justify-center items-center">
          <input type="checkbox" class="mx-2 w-4 h-4" v-model="saveFlag.save" />
          <span class="">记住密码</span>
        </div>
        <div class="px-4 flex justify-center items-center">
          <input
            type="checkbox"
            class="mx-2 w-4 h-4"
            v-model="saveFlag.autoLogin"
            :disabled="!saveFlag.save"
          />
          <span class="">自动登录</span>
        </div>
      </div>
      <div class="flex flex-col">
        <v-btn class="mt-4" color="success" block @click="register">
          注册
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
