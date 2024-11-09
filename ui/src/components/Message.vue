<script setup lang="ts">
import { getMessageClass, messages } from "@/utils/common";
import type { MessageModel } from "@/utils/model";
import { ref, watch } from "vue";
</script>

<template>
  <div
    class="absolute top-0 w-full flex flex-col justify-center items-center"
    style="margin: 0 auto"
    v-show="messages.length > 0"
  >
    <span
      class="rounded-md px-2 my-1 py-1 text-gray-100"
      :class="getMessageClass()"
      v-for="(message, index) in messages"
      :key="index"
      v-show="message.show"
    >
      {{ message.info }}
    </span>
  </div>
</template>

<style scoped></style>
