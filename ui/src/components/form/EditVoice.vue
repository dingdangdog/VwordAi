<script setup lang="ts">
import type {
  EditCommonModel,
  SerivceProvider,
  VoiceModel,
} from "@/utils/model";
import MySelect from "../MySelect.vue";
import { ref } from "vue";
import { request } from "@/utils/request";

const { flag, item } = defineProps(["flag", "item"]);
const emit = defineEmits(["cancel", "save"]);

const selectServiceProvider = ref<SerivceProvider>();
const models = ref<VoiceModel[]>();
const showModels = ref<any[]>([]);

const voice = ref<EditCommonModel>(item);

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
  voice.value.model = model;
};

const handleCancel = () => emit("cancel");
const handleSave = () => emit("save", voice.value);

const showColorPicker = ref(false);
const selectColor = ref(
  voice.value.color?.replace("background-color: ", "").replace(";", "")
);
const toSelectColor = () => {
  showColorPicker.value = true;
};
const closeColorPicker = () => {
  voice.value.color = `background-color: ${selectColor.value}`;
  showColorPicker.value = false;
};
</script>

<template>
  <div
    v-if="flag"
    class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-400/50"
    style="z-index: 999"
  >
    <div class="px-4 py-2 bg-gray-900 rounded-md min-w-72">
      <h3 class="text-lg text-center pb-4">声音设置</h3>

      <div class="flex items-center h-10">
        <label for="style" class="min-w-20">颜色</label>
        <div class="w-full relative">
          <span
            class="px-1 cursor-pointer rounded-sm"
            :style="
              selectColor
                ? `background-color: ${selectColor};`
                : 'background-color: #571040;'
            "
            @click="toSelectColor()"
            >修改颜色</span
          >

          <p
            class="absolute text-right -right-[6.5rem] top-0 w-full bg-gray-900 rounded-t-md"
            v-show="showColorPicker"
          >
            <button
              class="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-md"
              @click="closeColorPicker()"
            >
              确定
            </button>
          </p>
          <div
            class="w-full absolute bg-[#333333] top-8"
            style="z-index: 109"
            v-show="showColorPicker"
          >
            <v-color-picker v-model="selectColor"></v-color-picker>
          </div>
        </div>
      </div>
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
        <label class="min-w-20">语速</label>
        <div class="w-full">
          <input
            name="speed"
            placeholder="默认1.0"
            class="w-full h-8 bg-transparent border border-gray-400 p-2 rounded-md focus:outline-none"
            v-model="voice.speed"
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
