<script setup lang="ts">
import { getMessageClass } from "@/utils/common";
import { messages } from "@/utils/global.store";
</script>

<template>
  <div
    class="absolute top-0 w-full flex flex-col justify-center items-center"
    style="margin: 0 auto"
    v-show="messages.length > 0"
  >
    <span
      class="rounded-md px-2 mt-2 py-1 text-gray-100"
      :class="getMessageClass(message)"
      v-for="(message, index) in messages"
      :key="index"
      v-show="message.show"
    >
      {{ message.info }}
    </span>
  </div>
</template>

<style scoped></style>
