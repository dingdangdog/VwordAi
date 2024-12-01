<script setup lang="ts">
import { ref } from "vue";

import IconPlay from "@/components/icon/play.vue";
import IconPause from "@/components/icon/pause.vue";
import request from "@/utils/request";
import { VoiceTestText } from "@/utils/common";

const { model, provider, play, set } = defineProps([
  "model",
  "provider",
  "play",
  "set",
]);
</script>

<template>
  <div
    class="min-w-32 p-1 m-1 rounded-md"
    :class="model.gender == '0' ? 'bg-pink-600/30' : 'bg-blue-600/30'"
  >
    <div class="flex justify-between items-center">
      <h4>{{ model.name }}</h4>
      <span class="text-sm text-gray-500">{{ model.gender }}</span>
      <div class="flex">
        <button
          class="px-1 flex items-center text-sm bg-gray-500 hover:bg-gray-400 rounded-md"
          @click="play(model)"
        >
          <span class="w-4 h-4">
            <IconPlay color="black" />
          </span>
          <!-- <span class="w-4 h-4">
          <IconPause color="black" />
        </span> -->
          <span class="text-black">试听</span>
        </button>

        <button
          class="ml-1 px-1 flex items-center text-sm bg-gray-500 hover:bg-gray-400 rounded-md"
          @click="set(model)"
        >
          <span class="text-black">使用</span>
        </button>
      </div>
    </div>
    <p class="text-sm text-gray-500 flex justify-between">
      {{ model.code }}
    </p>
    <div class="flex justify-between items-center">
      <span class="text-sm text-gray-500">{{ model.lang }}</span>
      <span class="text-sm text-gray-500">{{ model.level }}</span>
    </div>
    <div v-show="model.emotions.length > 0" class="flex flex-wrap">
      <span
        class="text-sm text-gray-500 mx-1 underline"
        v-for="e in model.emotions"
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
