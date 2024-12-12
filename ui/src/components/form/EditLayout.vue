<script setup lang="ts">
import type { VoiceModel, VoiceObject, VoiceStyle } from "@/utils/model";
import { defineProps, defineEmits, ref } from "vue";
import { request } from "@/utils/request";

const { flag, item } = defineProps(["flag", "item"]);
const emit = defineEmits(["cancel", "save"]);

const layout = ref<VoiceObject>(item);
// console.log(layout.value);
if (!layout.value.type) {
  layout.value.type = "voice-emotion";
}

const models = ref<VoiceModel[]>();
const showModels = ref<any[]>([]);
const getModels = (p: string) => {
  request("getModels", p).then((res) => {
    models.value = res;
    models.value?.forEach((m) => {
      showModels.value.push({
        provider: m.provider,
        name: m.name,
        code: m.code,
      });
    });
  });
};
getModels(item.provider);

// 选择的服务提供商:azure/aliyun等支持的情感模型
const emotions = ref<VoiceStyle>({});
const getEmotions = () => {
  request("getEmotions", item.provider).then((res) => {
    emotions.value = res;
  });
};
getEmotions();

const handleCancel = () => {
  emit("cancel", layout.value);
};
const handleSave = () => {
  emit("save", layout.value);
};
</script>

<template>
  <div
    v-if="flag"
    class="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-gray-400/50"
    style="z-index: 999"
  >
    <div class="bg-gray-900 rounded-md w-96 -mt-40">
      <v-card title="旁白设置" class="bg-transparent">
        <v-card-text>
          <div class="flex items-center">
            <v-select
              label="语音模型"
              v-model="layout.model"
              :items="showModels"
              :item-title="(item) => item.name"
              :item-value="(item) => item.code"
              variant="outlined"
              hide-details="auto"
            ></v-select>
          </div>
          <div class="flex items-center mt-2">
            <v-text-field
              :label="`语速: 默认1.0`"
              v-model="layout.speed"
              variant="outlined"
              hide-details="auto"
            ></v-text-field>
          </div>
          <div class="flex items-center mt-2">
            <v-select
              label="情感"
              v-model="layout.emotion"
              :items="emotions.style"
              :item-title="(item) => item.name"
              :item-value="(item) => item.code"
              variant="outlined"
              hide-details="auto"
              clearable
            ></v-select>
          </div>
          <div class="flex items-center mt-2">
            <v-text-field
              :label="`情感级别: ${emotions.styledegree}`"
              v-model="layout.emotionLevel"
              variant="outlined"
              hide-details="auto"
            ></v-text-field>
          </div>
          <div class="flex items-center mt-2">
            <v-select
              label="伪音模仿"
              v-model="layout.emotionRole"
              :items="emotions.role"
              :item-title="(item) => item.name"
              :item-value="(item) => item.code"
              variant="outlined"
              hide-details="auto"
              clearable
            ></v-select>
          </div>
        </v-card-text>
        <v-card-actions>
          <div class="w-full flex justify-center">
            <div
              class="px-2 py-1 bg-gray-700 hover:bg-gray-600 cursor-pointer rounded-sm"
              @click="handleCancel"
            >
              取消
            </div>
            <div
              class="ml-2 px-2 py-1 bg-blue-500 hover:bg-blue-400 cursor-pointer rounded-sm"
              @click="handleSave"
            >
              保存
            </div>
          </div>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<style scoped></style>
