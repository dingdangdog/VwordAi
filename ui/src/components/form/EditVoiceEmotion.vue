<script setup lang="ts">
import type {
  EditVoiceEmotionModel,
  EmotionStyle,
  VoiceModel,
  VoiceStyle,
} from "@/utils/model";
import MySelect from "../MySelect.vue";

import { defineProps, defineEmits, ref } from "vue";
import { request } from "@/utils/request";
import { alertWarning } from "@/utils/common";

const { flag, item } = defineProps(["flag", "item"]);
const emit = defineEmits(["cancel", "save"]);

// console.log(item);
const selectedModel = ref({
  name: "",
  code: item.model,
});

// console.log(selectedModel.value);
const voiceEmotion = ref<EditVoiceEmotionModel>(item);

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

const selectModel = (model: any) => {
  selectedModel.value = model;
  voiceEmotion.value.model = model.code;
};

// 选择的服务提供商:azure/aliyun等支持的情感模型
const emotions = ref<VoiceStyle>({});
const getEmotions = () => {
  request("getEmotions", item.provider).then((res) => {
    emotions.value = res;
  });
};
getEmotions();

const selectEmotionStyle = (style: EmotionStyle) => {
  voiceEmotion.value.style = style;
};
const selectEmotionRole = (style: EmotionStyle) => {
  voiceEmotion.value.role = style;
};

const handleCancel = () => {
  emit("cancel", voiceEmotion.value);
};
const handleSave = () => {
  if (!voiceEmotion.value.style && !voiceEmotion.value.role) {
    alertWarning("未选择情感或角色，无需设置!");
    return;
  }
  emit("save", voiceEmotion.value);
};
</script>

<template>
  <div
    v-if="flag"
    class="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-gray-400/50"
    style="z-index: 999"
  >
    <div class="px-4 py-2 bg-gray-900 rounded-md">
      <h3 class="text-lg text-center pb-4">声音与情感设置</h3>
      <div class="flex items-center">
        <label class="min-w-20">语音模型</label>
        <div class="w-full" v-if="showModels.length > 0">
          <MySelect
            :items="showModels"
            :select="selectModel"
            :selected="selectedModel"
          />
        </div>
      </div>
      <div class="flex items-center mt-2">
        <label for="style" class="min-w-20">情感</label>
        <div class="w-full" v-if="emotions.style">
          <MySelect
            :blank-item="true"
            :items="emotions.style"
            :select="selectEmotionStyle"
            :selected="voiceEmotion.style"
          />
        </div>
        <!-- <input
            name="style"
            class="w-full h-8 bg-transparent border border-gray-400 p-2 my-2 rounded-md focus:outline-none"
            v-model="emotionEdit.style"
          /> -->
      </div>
      <div class="flex items-center mt-2">
        <label for="styledegree" class="min-w-20">情感级别</label>
        <input
          name="styledegree"
          :placeholder="emotions.styledegree"
          class="w-full h-8 bg-transparent border border-gray-400 p-2 rounded-md focus:outline-none"
          v-model="voiceEmotion.styledegree"
        />
      </div>
      <div class="flex items-center mt-2">
        <label for="role" class="min-w-20">伪音模仿</label>
        <div class="w-full" v-if="emotions.role">
          <MySelect
            :blank-item="true"
            :items="emotions.role"
            :select="selectEmotionRole"
            :selected="voiceEmotion.role"
          />
        </div>
        <!-- <input
            name="role"
            class="w-full h-8 bg-transparent border border-gray-400 p-2 my-2 rounded-md focus:outline-none"
            v-model="emotionEdit.role"
          /> -->
      </div>
      <div class="flex justify-center mt-8">
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
          确定
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
