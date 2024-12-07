<script setup lang="ts">
import type { AliyunOrderCode, Combo, Order } from "@/utils/cloud";
import { GlobalUserInfo, GlobalUserLogin } from "@/utils/global.store";
import { request, requestByToken } from "@/utils/request";
import { ref } from "vue";
// @ts-ignore
import QRCode from "qrcode";
import { alertError, alertSuccess, alertWarning } from "@/utils/common";
import { logout } from "@/utils/api";

// const user = ref<UserInfo>();
const getUserInfo = () => {
  requestByToken("userInfo").then((res) => {
    // user.value = res;
    GlobalUserInfo.value = res;
  });
};

getUserInfo();

const toBuy = () => {
  getCombos();
  showBuyDialog.value = true;
};

const showBuyDialog = ref(false);
const combos = ref<Combo[]>([]);
const selectedCombo = ref<Combo>();
const getCombos = () => {
  request("getCombos").then((res) => {
    combos.value = res;
  });
};

const showPayDialog = ref(false);

// 本地订单
const buyOrder = ref<Order>({});
// 支付机构创建后的订单【二维码、订单号等】
const payOrder = ref<AliyunOrderCode>({});
const creatrOrdering = ref(false);
const qrCode = ref("");

const createOrder = () => {
  if (!selectedCombo.value) {
    return;
  }
  buyOrder.value.comboId = selectedCombo.value.id;
  // TODO 选择支付方式，这里先写死支付宝
  buyOrder.value.payType = "alipay";

  if (creatrOrdering.value) {
    return;
  }
  creatrOrdering.value = true;
  // 创建订单开始支付
  request("createOrder", buyOrder.value)
    .then((res) => {
      // console.log(res);
      payOrder.value = res;
      if (payOrder.value.code == "10000") {
        urlToQrCode(payOrder.value.qr_code || "");
        showPayDialog.value = true;
        // 监听支付结果
        queryOrder(payOrder.value.out_trade_no);
      } else {
        alertError(payOrder.value.msg || "");
      }
    })
    .finally(() => {
      creatrOrdering.value = false;
    });

  // 支付成功
};

// 定时任务查询订单支付状态
const queryTimer = ref();
const QueryTime = 120;
const queryTime = ref(0);
const queryOrder = (no: string | undefined) => {
  if (!no) {
    return;
  }
  queryTime.value = QueryTime;
  queryTimer.value = setInterval(() => {
    if (queryTime.value >= 0) {
      request("queryOrder", { no }).then((res) => {
        if (res.status == "1") {
          alertSuccess("支付成功");
          showPayDialog.value = false;
          showBuyDialog.value = false;
          clearInterval(queryTimer.value);
          getUserInfo();
        } else {
          queryTime.value -= 2;
        }
      });
    } else {
      clearInterval(queryTimer.value);
    }
  }, 2000);
};

const urlToQrCode = (url: string) => {
  QRCode.toDataURL(url)
    .then((code: string) => {
      qrCode.value = code; // 生成的二维码图片 URL
    })
    .catch((err: any) => {
      console.error("Failed to generate QR code", err);
    });
};

const cancelOrder = () => {
  request("cancelOrder", { no: payOrder.value.out_trade_no })
    .then(() => {
      alertWarning("取消订单");
    })
    .finally(() => {
      showPayDialog.value = false;
      if (queryTimer.value) {
        clearInterval(queryTimer.value);
      }
    });
};
</script>

<template>
  <!-- <div>{{ user }}</div> -->
  <div class="p-2">
    <div class="border border-gray-200 p-2 rounded-md text-center">
      <p class="text-2xl font-bold">{{ GlobalUserInfo?.name }}</p>
      <p class="text-[12px] text-gray-300">
        账号: {{ GlobalUserInfo?.account }}
      </p>
      <div>
        <span class="text-sm text-gray-300 font-bold">
          余额: {{ GlobalUserInfo?.balance
          }}<span class="text-[10px]">(文)</span>
        </span>
        <button
          class="ml-2 px-2 py-1 rounded-md bg-green-600 hover:bg-green-500 text-gray-100 cursor-pointer"
          @click="toBuy()"
        >
          充值
        </button>
      </div>
    </div>
    <div
      class="mt-2 border border-gray-200 p-2 rounded-md flex flex-col items-center"
    >
      <div class="flex py-2 items-center">
        <span class="min-w-24">手机号</span>
        <span>{{
          GlobalUserInfo?.phone ? GlobalUserInfo?.phone : "未绑定"
        }}</span>
        <button
          class="ml-4 px-2 py-1 rounded-md text-blue-500 hover:text-blue-400"
          @click="logout()"
        >
          绑定
        </button>
      </div>
      <div class="flex py-2 items-center">
        <span class="min-w-24">邮箱</span>
        <span>{{
          GlobalUserInfo?.email ? GlobalUserInfo?.email : "未绑定"
        }}</span>
        <button
          class="ml-4 px-2 py-1 rounded-md text-blue-500 hover:text-blue-400"
          @click="logout()"
        >
          绑定
        </button>
      </div>
    </div>
    <div class="mt-2 p-2 text-center">
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

  <v-dialog v-model="showBuyDialog" width="30rem">
    <v-card title="【文】充值">
      <v-card-text>
        <v-autocomplete
          v-model="selectedCombo"
          :items="combos"
          :label="'选择套餐'"
          :item-title="
            (item) => `${item.name}(¥${item.price} - ${item.words}文)`
          "
          :item-value="(item) => item"
          hide-details="auto"
        >
        </v-autocomplete>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="blue-darken-1"
          variant="text"
          @click="showBuyDialog = false"
          >取消</v-btn
        >
        <v-btn color="blue-darken-1" variant="text" @click="createOrder()"
          >支付</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog
    max-width="30rem"
    transition="dialog-bottom-transition"
    persistent
    v-model="showPayDialog"
  >
    <v-card :title="`购买套餐: ${selectedCombo?.name}`">
      <v-card-text>
        <div class="text-center py-4 text-gray-400">
          <span class="text-red-500"> ￥{{ selectedCombo?.price }}</span>
          获得
          <span class="text-blue-500 font-bold"
            >{{ selectedCombo?.words }}
          </span>
          文
        </div>
        <div class="h-64 p-4">
          <img class="w-full h-52 object-contain" :src="qrCode" />
        </div>
        <div class="text-sm pt-4 text-center text-gray-400">
          请使用支付宝扫码支付
        </div>
      </v-card-text>
      <v-card-actions>
        <div class="flex flex-col w-full">
          <v-btn class="w-full" @click="cancelOrder">取消</v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
