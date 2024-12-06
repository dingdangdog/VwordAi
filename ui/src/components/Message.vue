<script setup lang="ts">
import { getMessageClass } from "@/utils/common";
import { messages } from "@/utils/global.store";
</script>

<template>
  <div
    class="absolute bottom-4 right-4 min-w-36"
    style="margin: 0 auto; z-index: 9999"
    v-show="messages.length > 0"
  >
    <p
      class="rounded-md my-1 ml-2 px-2 py-1 text-md text-gray-100"
      :class="getMessageClass(message)"
      v-for="(message, index) in messages"
      :key="index"
      v-show="message.show"
    >
      {{ message.info }}
    </p>
  </div>
</template>

<style scoped></style>
