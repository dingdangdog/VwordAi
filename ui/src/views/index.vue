<script setup lang="ts">
import { onMounted, ref } from "vue";
import local from "@/utils/local";
import type {
  Project,
  SerivceProvider,
  SsmlText,
  VoiceModel,
} from "@/utils/model";
import EditBlankIcon from "@/components/edit/BlankIcon.vue";
import EditModelCard from "@/components/EditModelCard.vue";
import { alertSuccess, playAudio, VoiceTestText } from "@/utils/common";
import MySelect from "@/components/MySelect.vue";

const webList = ref([]);
local("test", "null").then((res) => {
  // console.log(res);
  webList.value = res;
});

const editText = ref("");
const selectServiceProvider = ref("");

const textEditor = ref();

onMounted(() => {
  textEditor.value.innerHTML = editText.value;
  textEditor.value.addEventListener("input", () => {
    if (textEditor.value.innerText.trim() === "") {
      textEditor.value.classList.add("empty");
    } else {
      textEditor.value.classList.remove("empty");
    }
  });

  if (textEditor.value.innerText.trim() === "") {
    textEditor.value.classList.add("empty");
  }
});

const addBlank = () => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;

  // 获取当前选区
  const range = selection.getRangeAt(0);
  range.deleteContents(); // 删除选中的内容

  // 创建一个文本节点，并将其插入到选区位置
  const blankNode = document.createElement("span");
  blankNode.className = "bg-gray-600 rounded-sm blank px-1 text-sm mx-1";
  blankNode.setAttribute("data-type", "blank");
  blankNode.setAttribute("data-model", "500");
  blankNode.textContent = "500ms";
  blankNode.contentEditable = "false";
  range.insertNode(blankNode);

  // 移动光标到插入的文本节点之后
  range.setStartAfter(blankNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
};

const addTextSsml = (model: VoiceModel) => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;

  // 获取当前选区
  const range = selection.getRangeAt(0);

  const span = document.createElement("span");
  span.className = "bg-red-800 rounded-sm blank px-1 mx-1";
  span.setAttribute("data-type", "text");
  span.setAttribute("data-model", model.code);
  range.surroundContents(span);
};

const showHtml = () => {
  console.log(textEditor.value.innerHTML);
};

const tts = () => {
  local("speech", editText.value, project.value.name).then((res) => {
    // console.log(res);
  });
};

// @ts-ignore
const systemConfig = ref<SystemConfig>({});
const filterModelParam = ref("");

local("getConfigApi", "").then((res) => {
  // console.log(res);
  systemConfig.value = res;
});

const models = ref<VoiceModel[]>();
const getModels = (provider: SerivceProvider) => {
  selectServiceProvider.value = provider.code;
  local("getModels", provider.code).then((res) => {
    models.value = res;
  });
};

const playTest = (model: VoiceModel) => {
  let testText = "";
  const selection = window.getSelection();
  if (selection?.rangeCount) {
    // 获取当前选区
    const range = selection.getRangeAt(0);
    testText = range.cloneContents().textContent || "";
  }

  if (!testText) {
    testText = VoiceTestText.replace("{}", model.name);
  }
  local("playTest", model.code, testText, selectServiceProvider.value)
    .then((res) => {
      playAudio(res);
    })
    .finally(() => {});
};

const doTTS = (ssml: string) => {
  local("dotts", ssml, project.value.name).then();
};

// 是否添加了旁白标识
const layoutFlag = ref(false);

const addLayoutVoice = () => {
  const text = textEditor.value.innerHTML;
  const span = document.createElement("span");
  span.className = "brank bg-gray-700 rounded-sm blank px-1 block";
  span.setAttribute("data-type", "text");
  span.setAttribute("data-model", "zh-CN-YunyangNeural");
  span.innerHTML = text;
  textEditor.value.innerHTML = span.outerHTML;
  layoutFlag.value = true;
};

const convertHTMLToSSML = () => {
  const htmlContent = textEditor.value.innerHTML;
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  const ssmlContent = Array.from(doc.body.childNodes)
    .map((node) => processNode(node, null))
    .join("");

  console.log(ssmlContent);
  doTTS(ssmlContent);
};

// 常量配置
const DEFAULT_BREAK_TIME = "500ms";

// 递归处理节点并转换成 SSML，避免 voice 嵌套
const processNode = (node: ChildNode, currentVoice: string | null): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
    const dataType = node.getAttribute("data-type");
    const dataModel = node.getAttribute("data-model");
    const innerSSML = Array.from(node.childNodes)
      .map((childNode) =>
        processNode(childNode, dataType === "text" ? dataModel : currentVoice)
      )
      .join("");

    switch (dataType) {
      case "text":
        if (dataModel && !currentVoice) {
          // 开始一个新的 voice 标签
          return `<voice name="${dataModel}">${innerSSML}</voice>`;
        } else if (dataModel && dataModel !== currentVoice && currentVoice) {
          // 开始一个新的 voice 标签
          return `</voice><voice name="${dataModel}">${innerSSML}</voice><voice name="${currentVoice}">`;
        } else {
          // 如果当前 voice 一致或没有指定，则直接返回内容
          return innerSSML;
        }
      case "blank":
        return `<break time="${dataModel || DEFAULT_BREAK_TIME}"/>`;
      default:
        return innerSSML;
    }
  }

  return "";
};

const project = ref<Project>({});

const saveProject = () => {
  project.value.content = textEditor.value.innerHTML;
  if (project.value.path) {
    project.value.updateTime = Date.now();
  } else {
    project.value.createTime = Date.now();
  }
  local("saveProject", project.value).then((res) => {
    // console.log(res);
  });
};
</script>

<template>
  <div class="h-full w-full p-2 flex justify-between">
    <div
      class="h-full w-[350px] overflow-y-auto overflow-x-hidden p-2 bg-gray-800 rounded-md flex flex-col justify-between"
    >
      <MySelect :items="systemConfig.serviceProviders" :select="getModels" />
      <input
        class="w-full h-8 bg-transparent border border-gray-400 p-2 my-2 rounded-md focus:outline-none"
        placeholder="筛选"
        v-model="filterModelParam"
        @change=""
      />
      <div class="flex-1 overflow-y-auto">
        <EditModelCard
          v-for="(model, index) in models"
          :key="index"
          :model="model"
          :provider="selectServiceProvider"
          :play="playTest"
          :set="addTextSsml"
        ></EditModelCard>
      </div>
    </div>
    <div
      class="h-full ml-2 flex-1 flex flex-col"
      style="width: calc(100% - 350px)"
    >
      <div class="p-2 bg-gray-800 rounded-md h-12">
        <button
          class="px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600"
          @click="showHtml()"
        >
          打开项目
        </button>
        <button
          class="ml-2 px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600"
          @click="showHtml()"
        >
          导入文本
        </button>
        <button
          class="ml-2 px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600"
          @click="addLayoutVoice()"
        >
          添加旁白
        </button>
      </div>
      <div
        class="my-2 p-2 bg-gray-800 rounded-md flex-1 flex flex-col"
        style="height: calc(100% - 8rem)"
      >
        <div class="flex items-center justify-center h-8">
          <button
            class="p-1 rounded-sm cursor-pointer hover:bg-gray-700"
            title="添加空白"
            @click="addBlank()"
          >
            <EditBlankIcon class="w-6 h-6" color="white" />
          </button>
        </div>
        <div
          class="mt-2 bg-gray-800 rounded-md flex-1 flex h-[calc(100%-4rem)]"
        >
          <div
            class="w-full p-2 bg-gray-900 rounded-md overflow-y-auto focus:outline-none h-full"
            ref="textEditor"
            id="textEditor"
            data-placeholder="请输入文本"
            contenteditable
          ></div>
        </div>
      </div>
      <div class="p-2 bg-gray-800 rounded-md h-12 flex items-center">
        <h3>项目名:</h3>
        <input
          class="w-64 bg-transparent border-b ml-2 py-1 focus:outline-none"
          v-model="project.name"
        />
        <button
          class="px-2 py-1 ml-2 rounded-md bg-gray-700 hover:bg-gray-600"
          @click="convertHTMLToSSML()"
        >
          本地合成
        </button>
        <!-- <button
          class="ml-2 px-2 py-1 bg-gray-700 rounded-md hover:bg-gray-600"
          @click="tts()"
        >
          云端合成
        </button> -->
        <button
          class="px-2 py-1 ml-2 rounded-md bg-gray-700 hover:bg-gray-600"
          @click="saveProject()"
        >
          保存项目
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
#textEditor[data-placeholder].empty::before {
  content: attr(data-placeholder);
  color: #a0a0a0;
  font-style: italic;
}
</style>
