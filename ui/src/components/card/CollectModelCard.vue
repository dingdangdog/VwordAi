<script setup lang="ts">
import { ref } from "vue";

import IconPlay from "@/components/icon/play.vue";
import IconPause from "@/components/icon/pause.vue";
import IconStarMinus from "@/components/icon/starminus.vue";
import IconStarPlus from "@/components/icon/starplus.vue";
import { request } from "@/utils/request";
import {
  alertInfo,
  alertSuccess,
  playAudio,
  VoiceTestText,
} from "@/utils/common";
import type { VoiceModel } from "@/utils/model";

const { model, set } = defineProps(["model", "set"]);

const modelRef = ref(model);

const playing = ref(false);

const playTest = (modelRef: VoiceModel) => {
  let testText = "";
  const selection = window.getSelection();
  if (selection?.rangeCount) {
    // 获取当前选区
    const range = selection.getRangeAt(0);
    testText = range.cloneContents().textContent || "";
  }

  if (!testText) {
    testText = VoiceTestText.replace("{}", modelRef.name);
  }
  request("playTest", modelRef.code, testText, modelRef.provider)
    .then((res) => {
      playing.value = true;
      playAudio(res);
    })
    .finally(() => {
      playing.value = false;
    });
};

const collectModel = () => {
  modelRef.value.collect = true;
  const m = {
    ...modelRef.value,
    collect: true,
  };
  request("saveModel", m).then(() => {
    modelRef.value.collect = true;
    alertSuccess("已收藏");
  });
};
const unCollectModel = () => {
  const m = {
    ...modelRef.value,
    collect: false,
  };
  request("saveModel", m).then(() => {
    modelRef.value.collect = false;
    alertInfo("取消收藏");
  });
};
</script>

<template>
  <div
    class="min-w-52 p-1 m-1 rounded-md"
    :class="modelRef.gender == '0' ? 'bg-pink-600/30' : 'bg-blue-600/30'"
  >
    <div class="flex justify-between items-center">
      <h4>{{ modelRef.name }}</h4>
      <span class="text-sm text-gray-500">{{ modelRef.gender }}</span>
      <div class="flex">
        <button
          class="px-1 flex items-center text-sm bg-gray-500 hover:bg-gray-400 rounded-md"
          @click="playTest(modelRef)"
        >
          <span class="w-4 h-4" v-if="!playing">
            <IconPlay color="black" />
          </span>
          <span class="text-black">试听</span>
        </button>

        <button
          class="ml-1 px-1 flex items-center text-sm bg-gray-500 hover:bg-gray-400 rounded-md"
          @click="set(modelRef)"
        >
          <span
            class="w-4 h-4"
            v-show="!modelRef.collect"
            title="添加收藏"
            @click="collectModel()"
          >
            <IconStarPlus />
          </span>
          <span
            class="w-4 h-4"
            v-show="modelRef.collect"
            title="取消收藏"
            @click="unCollectModel()"
          >
            <IconStarMinus />
          </span>
        </button>
      </div>
    </div>
    <p class="text-sm text-gray-500 flex justify-between">
      {{ modelRef.code }}
    </p>
    <div class="flex justify-between items-center">
      <span class="text-sm text-gray-500">{{ modelRef.lang }}</span>
      <span class="text-sm text-gray-500">{{ modelRef.level }}</span>
    </div>
    <div v-show="modelRef.emotions.length > 0" class="flex flex-wrap">
      <span
        class="text-sm text-gray-500 mx-1 underline"
        v-for="e in modelRef.emotions"
        :key="e.code"
        :title="e.code"
      >
        {{ e.name }}
      </span>
    </div>
    <p class="text-sm text-gray-500 flex justify-between">
      {{ model.provider }}
    </p>
  </div>
</template>

<style scoped></style>
