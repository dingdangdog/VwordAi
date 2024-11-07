<script setup lang="ts">
import { ref } from "vue";
import local from "@/utils/local";
import type { VoiceModel } from "@/utils/model";
import EditModelCard from "@/components/EditModelCard.vue";
import { VoiceTestText } from "@/utils/common";

const webList = ref([]);
local("test", "null").then((res) => {
  console.log(res);
  webList.value = res;
});

const editText = ref(
  "阿莎空间的黄金卡上贷记卡和健康的，啥叫看活动空间撒谎的，看见哈萨克家里的贺卡，距离首都看见了，还是看，还得看。"
);
const voiceFileName = ref("");

const textareaEdit = ref();

const showSelection = () => {
  const start = textareaEdit.value.selectionStart;
  const end = textareaEdit.value.selectionEnd;

  const selectedText = editText.value.substring(start, end);
  const highlightedText = `<span class="bg-yellow-900">${selectedText}</span>`;
  const newText =
    editText.value.substring(0, start) +
    highlightedText +
    editText.value.substring(end);

  // 更新文本框内容
  editText.value = newText;

  // return alert(editText.value.substring(start, end));
};

const tts = () => {
  local("speech", editText.value, voiceFileName.value).then((res) => {
    console.log(res);
  });
};

// @ts-ignore
const systemConfig = ref<SystemConfig>({});
const selectServiceProvider = ref("");

local("getConfigApi", "").then((res) => {
  console.log(res);
  systemConfig.value = res;
});

const models = ref<VoiceModel[]>();
const getModels = () => {
  local("getModels", selectServiceProvider.value).then((res) => {
    models.value = res;
  });
};

const playTest = (model: VoiceModel) => {
  // toPlaying.value = true;

  const start = textareaEdit.value.selectionStart;
  const end = textareaEdit.value.selectionEnd;

  let testText = editText.value.substring(start, end);

  if (!testText) {
    testText = VoiceTestText.replace("{}", model.name);
  }
  local("playTest", model.code, testText, selectServiceProvider.value)
    .then((res) => {
      console.log(res);
      // 已知res是音频文件流，如：const audioData = Buffer.from(result.audioData);，如何播放？
      // 将音频数据转换为 Blob
      const audioBlob = new Blob([res], { type: "audio/wav" });

      // 创建一个 URL 来供 <audio> 标签使用
      const audioUrl = URL.createObjectURL(audioBlob);

      // 创建 <audio> 元素并播放音频
      const audio = new Audio(audioUrl);
      audio
        .play()
        .then(() => {
          console.log("Audio is playing");
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
        });

      // 可选：释放内存
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    })
    .finally(() => {});
};
</script>

<template>
  <div class="h-full p-2 flex justify-between">
    <div
      class="h-full w-96 overflow-y-auto overflow-x-hidden p-2 bg-gray-800 rounded-md flex flex-col justify-between"
    >
      <div>
        <select
          v-model="selectServiceProvider"
          class="w-full bg-transparent border-2 px-2 py-1 rounded-md focus:outline-none"
          @change="getModels()"
        >
          <option
            class="bg-gray-800 px-2 py-4"
            v-for="sp in systemConfig.serviceProviders"
            :key="sp.code"
            :value="sp.code"
          >
            <span class="px-2 py-1">
              {{ sp.name }}
            </span>
          </option>
        </select>
      </div>
      <div class="flex-1 mt-2 overflow-y-auto">
        <EditModelCard
          v-for="(model, index) in models"
          :key="index"
          :model="model"
          :provider="selectServiceProvider"
          :play="playTest"
        ></EditModelCard>
      </div>
    </div>
    <div class="h-full w-full ml-2 flex flex-col">
      <div class="p-2 bg-gray-800 rounded-md h-12">
        <button
          class="px-2 py-1 bg-gray-800 rounded-md hover:bg-gray-700"
          @click="showSelection()"
        >
          打开文件
        </button>
      </div>
      <div class="my-2 p-2 bg-gray-800 rounded-md flex-1 h-[90%] flex">
        <textarea
          ref="textareaEdit"
          class="bg-gray-900 w-1/2 h-full p-2 resize-none focus:outline-none"
          placeholder="请输入文本"
          v-model="editText"
        >
        </textarea>
        <div
          class="w-1/2 h-full ml-2 p-2 bg-gray-900 rounded-md overflow-y-auto select-none"
          v-html="editText"
        ></div>
      </div>
      <div class="p-2 bg-gray-800 rounded-md h-12 flex items-center">
        <h3>项目名:</h3>
        <input
          class="w-64 bg-transparent border-b mx-2 py-1 focus:outline-none"
          v-model="voiceFileName"
        />
        <button
          class="px-2 py-1 bg-gray-700 rounded-md hover:bg-gray-600"
          @click="tts()"
        >
          语音合成
        </button>
        <button
          class="ml-2 px-2 py-1 bg-gray-700 rounded-md hover:bg-gray-600"
          @click="tts()"
        >
          保存项目
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
