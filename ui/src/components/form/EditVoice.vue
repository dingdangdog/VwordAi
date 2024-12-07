<script setup lang="ts">
import type { SerivceProvider, VoiceModel } from "@/utils/model";
import MySelect from "../MySelect.vue";
import { ref } from "vue";
import { request } from "@/utils/request";

const { flag, item } = defineProps(["flag", "item"]);
const emit = defineEmits(["cancel", "save"]);

const selectServiceProvider = ref<SerivceProvider>();
const models = ref<VoiceModel[]>();
const showModels = ref<any[]>([]);

const getModels = (p: SerivceProvider) => {
  selectServiceProvider.value = p;
  request("getModels", p.code).then((res) => {
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

const selectedModel = ref<any>({
  name: "",
  code: item.model,
});
const selectModel = (model: any) => {
  selectedModel.value = model;
};

const handleCancel = () => emit("cancel");
const handleSave = () => emit("save", selectedModel.value);
</script>

<template>
  <div
    v-if="flag"
    class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-400/50"
    style="z-index: 999"
  >
    <div class="px-4 py-2 bg-gray-900 rounded-md min-w-72">
      <h3 class="text-lg text-center pb-4">声音设置</h3>
      <!-- <div class="flex items-center">
        <label class="min-w-20">服务商</label>
        <div class="w-full">
          <MySelect :items="ModelCategoryItems" :select="getModels" />
        </div>
      </div> -->
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
