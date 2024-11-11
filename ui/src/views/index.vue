<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import local from "@/utils/local";
import type {
  Project,
  SerivceProvider,
  SsmlText,
  VoiceModel,
} from "@/utils/model";
import EditBlankIcon from "@/components/edit/BlankIcon.vue";
import EditModelCard from "@/components/EditModelCard.vue";
import {
  alertError,
  alertInfo,
  alertSuccess,
  playAudio,
  selectFloder,
  VoiceTestText,
} from "@/utils/common";
import MySelect from "@/components/MySelect.vue";
import {
  openProjectFlag,
  saveProjectFlag,
  project,
  ModelCategoryItems,
} from "@/utils/global.store";

// 新建项目
const addProject = () => {
  project.value = {};
  project.value.createTime = Date.now();
  initEditor("");
  openProjectFlag.value = true;
};

// 打开项目
const openProject = () => {
  selectFloder().then((path) => {
    project.value.path = path;
    if (path) {
      local("getProject", path).then((res) => {
        alertSuccess("打开成功");
        project.value.name = res.name;
        project.value.createTime = res.createTime;
        project.value.content = res.content;
        // TODO 弹出文件夹选择，选择后读取文件夹中的项目内容
        initEditor(project.value.content || "");
        openProjectFlag.value = true;
      });
    }
  });
};

// 保存项目
const saveProject = () => {
  project.value.content = textEditor.value.innerHTML;
  if (project.value.path) {
    project.value.updateTime = Date.now();
  }
  if (!project.value.name && !project.value.path && !project.value.content) {
    alertError("项目没有任何内容，无需保存");
    return;
  }

  local("saveProject", project.value).then((res) => {
    // console.log(res);
    alertSuccess("保存成功");
    saveProjectFlag.value = true;
  });
};

// 关闭项目
const closeProject = () => {
  if (!saveProjectFlag.value && textEditor.value.innerHTML) {
    alertError("请先保存项目");
    return;
  }
  if (openProjectFlag.value) {
    openProjectFlag.value = false;
  }
  project.value = {};
  alertInfo("项目已关闭");
};

const initEditor = (text: string) => {
  textEditor.value.innerHTML = text;
  textEditor.value.addEventListener("input", () => {
    if (textEditor.value.innerText.trim() === "") {
      // 内容为空时，将已保存标示设置为true
      saveProjectFlag.value = true;
      textEditor.value.classList.add("empty");
    } else {
      // 内容变更且不为空，将已保存标示设置为false
      saveProjectFlag.value = false;
      textEditor.value.classList.remove("empty");
    }
  });

  if (textEditor.value.innerText.trim() === "") {
    textEditor.value.classList.add("empty");
  }
};

onMounted(() => {
  if (openProjectFlag.value) {
    initEditor(project.value.content || "");
  }
});

// 打开文件，读取文本
const importText = () => {
  // @ts-ignore
  window.electron
    .openFile()
    .then((res: string) => {
      // console.log(res)
      if (res) {
        textEditor.value.classList.remove("empty");
        textEditor.value.innerHTML = res;
      } else {
        alertError("文件内容为空");
      }
    })
    .catch((err: any) => {
      console.log(err);
      alertError("读取文件出错");
    });
};

// 初次打开项目时编辑的文本
const editText = ref("");
// 选择的服务提供商:azure/aliyun等
const selectServiceProvider = ref("");

// 文本编辑器(DIV)
const textEditor = ref();

// 常量配置 默认空白间隔
const DEFAULT_BREAK_TIME = "500ms";
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

// 为选中文字添加指定语音模型
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

const tts = () => {
  local("speech", editText.value, project.value.name).then((res) => {
    // console.log(res);
  });
};

// @ts-ignore
const systemConfig = ref<SystemConfig>({});

local("getConfigApi", "").then((res) => {
  // console.log(res);
  systemConfig.value = res;
});

const models = ref<VoiceModel[]>();
const showModels = ref<VoiceModel[]>();
const getModels = (provider: SerivceProvider) => {
  selectServiceProvider.value = provider.code;
  local("getModels", provider.code).then((res) => {
    models.value = res;
    showModels.value = res;
  });
};
const filterModelParam = ref("");
const filterModel = () => {
  if (!filterModelParam.value) {
    showModels.value = models.value;
    return;
  }
  const filterParam = filterModelParam.value.toLowerCase(); // 转换为小写
  showModels.value = models.value?.filter(
    (model) =>
      model.name.toLowerCase().includes(filterParam) ||
      model.code.toLowerCase().includes(filterParam) ||
      model.gender.toLowerCase().includes(filterParam) ||
      model.lang.toLowerCase().includes(filterParam)
  );
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
  if (!project.value.path) {
    project.value.path = `${systemConfig.value.dataPath}/${project.value.name}`;
  }
  // 组装本次转换的文件名
  const fileName = `${project.value.path}/${
    project.value.name
  }_${Date.now()}.wav`;
  local("dotts", ssml, fileName).then((res) => {
    alertSuccess("生成成功");
    // @ts-ignore
    window.electron.openFolder(project.value.path);
    // window.electron.openFolder(res);
    // 自动打开文件夹
  });
};

// 是否添加了旁白标识
const layoutFlag = ref(false);
// 添加旁白
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
// 将 HTML 转换成 SSML
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
</script>

<template>
  <div
    class="h-full w-full flex justify-center items-center"
    v-show="!openProjectFlag"
  >
    <div class="-mt-52 flex justify-center items-center">
      <button
        class="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
        @click="addProject()"
      >
        新建项目
      </button>
      <button
        class="px-4 py-2 ml-4 rounded-md bg-gray-700 hover:bg-gray-600"
        @click="openProject()"
      >
        打开项目
      </button>
    </div>
  </div>
  <div class="h-full w-full p-2 flex justify-between" v-show="openProjectFlag">
    <div
      class="h-full w-72 overflow-y-auto overflow-x-hidden p-2 bg-gray-800 rounded-md flex flex-col justify-between"
    >
      <MySelect :items="ModelCategoryItems" :select="getModels" />
      <input
        class="w-full h-8 bg-transparent border border-gray-400 p-2 my-2 rounded-md focus:outline-none"
        placeholder="筛选"
        v-model="filterModelParam"
        @keyup.enter="filterModel()"
      />
      <div class="flex-1 overflow-y-auto">
        <EditModelCard
          v-for="(model, index) in showModels"
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
          @click="importText()"
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
            class="w-full p-2 bg-gray-900 rounded-md overflow-y-auto focus:outline-none h-full whitespace-pre-wrap"
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
          class="px-2 py-1 ml-2 rounded-md bg-green-700 hover:bg-green-600"
          @click="saveProject()"
        >
          保存项目
        </button>
        <button
          class="px-2 py-1 ml-2 rounded-md bg-red-500 hover:bg-red-400"
          @click="closeProject()"
        >
          关闭项目
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
