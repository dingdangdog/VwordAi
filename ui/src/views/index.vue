<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import local from "@/utils/local";
import type {
  EditEmotionModel,
  EmotionStyle,
  Project,
  SerivceProvider,
  SsmlText,
  VoiceModel,
  VoiceStyle,
} from "@/utils/model";
import EditBlankIcon from "@/components/edit/BlankIcon.vue";
import EditEmotionIcon from "@/components/edit/EmotionIcon.vue";
import EditModelCard from "@/components/card/EditModelCard.vue";
import {
  alertError,
  alertInfo,
  alertSuccess,
  alertWarning,
  playAudio,
  processVoiceNode,
  selectFloder,
  stopPalyAudio,
  VoiceTestText,
} from "@/utils/common";
import MySelect from "@/components/MySelect.vue";
import {
  openProjectFlag,
  saveProjectFlag,
  project,
  ModelCategoryItems,
} from "@/utils/global.store";
import BreakMenu from "@/components/menu/Break.vue";
import EmotionMenu from "@/components/menu/Emotion.vue";
import VoiceMenu from "@/components/menu/Voice.vue";
import VoiceEmotionMenu from "@/components/menu/VoiceEmotion.vue";
import { playSSML } from "@/utils/api";
import EditEmotionForm from "@/components/form/EditEmotion.vue";
import AddVoiceForm from "@/components/form/AddVoice.vue";

/**
 * html逻辑：所有特殊元素都使用 span 标签，特殊属性：
 *    data-type 属性表示元素类型：global - 全局旁白；voice - 语音模型；emotion - 情感模型；blank - 空白模板
 *    data-provider 属性标示模型提供商：azure/aliyun等，用于后续处理判断选用的服务商
 *    data-model 属性标示模型的名称/空白时长ms，在 data-type=global/voice/blank 时有作用
 *    data-style 属性标示情感名称，在 data-type=emotion 时有作用
 *    data-styledegree 属性标示情感程度，在 data-type=emotion 时有作用
 *    data-role 属性标示情感角色，在 data-type=emotion 时有作用
 *
 * span 标签的 class 可能有一些特殊的值，如：global/voice/blank/emotion，回显时通过 class 查询元素，然后添加对应不同的点击事件
 *
 * class=voice 元素拥有右键菜单，功能有：试听、清除设置
 * class=emotion 元素拥有右键菜单，功能有：试听、编辑、清除设置，左键点击直接开始编辑
 * class=blank 元素拥有右键菜单，功能有：编辑、删除，左键点击直接开始编辑
 */

// @ts-ignore
const systemConfig = ref<SystemConfig>({});
local("getConfigApi", "").then((res) => {
  // console.log(res);
  systemConfig.value = res;
});

// 选择的服务提供商:azure/aliyun等
const selectServiceProvider = ref<SerivceProvider>();
const models = ref<VoiceModel[]>();
const showModels = ref<VoiceModel[]>();
const getModels = (provider: SerivceProvider) => {
  selectServiceProvider.value = provider;
  local("getModels", provider.code).then((res) => {
    models.value = res;
    showModels.value = res;
  });
};
// 过滤模型的参数
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

// 文本编辑器(DIV)
const textEditor = ref();
// 初始化编辑器内容
const initEditor = (text: string) => {
  textEditor.value.innerHTML = text;
  // 旁白声音模型标签事件初始化
  const globalElements = document.getElementsByClassName("global");
  // console.log(voiceElements);
  for (let e of globalElements) {
    let voice = e as HTMLElement;
    addVoiceClickListener(voice);
    // addVoiceContentMenuListener(voice); 旁白不需要右键
  }
  // 声音模型标签事件初始化
  const voiceElements = document.getElementsByClassName("voice");
  // console.log(voiceElements);
  for (let e of voiceElements) {
    let voice = e as HTMLElement;
    addVoiceClickListener(voice);
    addVoiceContentMenuListener(voice);
  }
  // 情感标签事件初始化
  const emotionElements = document.getElementsByClassName("emotion");
  // console.log(emotionElements);
  for (let e of emotionElements) {
    let emotion = e as HTMLElement;
    addEmotionClickListener(emotion);
    addEmotionContentMenuListener(emotion);
  }
  // 空白标签事件初始化
  const breakElements = document.getElementsByClassName("break");
  // console.log(breakElements);
  for (let e of breakElements) {
    let blank = e as HTMLElement;
    addBreakClickListener(blank);
    addBreakContentMenuListener(blank);
  }

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
  } else {
    textEditor.value.classList.remove("empty");
  }
};

onMounted(() => {
  getModels(ModelCategoryItems.value[0]);
  if (openProjectFlag.value) {
    initEditor(project.value.content || "");
  }

  document.addEventListener("click", (event) => {
    showBlankMenu.value = false;
    showEmotionMenu.value = false;
    showVoiceMenu.value = false;
  });
});

// 新建项目
const addProject = () => {
  project.value = {};
  project.value.createTime = Date.now();
  // 初始化创建项目所在目录，并保存基本数据
  saveProject();
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
const saveProject = async () => {
  project.value.content = textEditor.value.innerHTML;
  if (project.value.path) {
    project.value.updateTime = Date.now();
  }

  const res = await local("saveProject", project.value);
  // console.log(res);
  if (res) {
    project.value = res;
    // alertSuccess("保存成功");
    saveProjectFlag.value = true;
  } else {
    alertError("保存失败");
  }
};

// 关闭项目
const closeProject = (canSave: boolean) => {
  if (!canSave) {
    return;
  }
  if (openProjectFlag.value) {
    openProjectFlag.value = false;
  }
  project.value = {};
  // alertInfo("项目已关闭");
};
// 保存并关闭项目
const saveAndCloseProject = async () => {
  await saveProject();
  closeProject(saveProjectFlag.value);
};

// 打开文件，读取文本【导入文本】
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
        // alertError("未选择文件/文件内容为空");
      }
    })
    .catch((err: any) => {
      console.log(err);
      alertError("读取文件出错");
    });
};

// 打开项目文件夹
const openProjectFolder = () => {
  // @ts-ignore
  window.electron.openFolder(project.value.path);
};

// 播放模型试听
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
  local("playTest", model.code, testText, model.provider)
    .then((res) => {
      playAudio(res);
    })
    .finally(() => {});
};

// 执行本地语音转换（保存语音文件到本地）
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
    // @ts-ignore 直接打开生成后的文件
    // 自动打开文件/文件夹
    window.electron.openFolder(res);
    // window.electron.openFolder(project.value.path);
  });
};

// 将 HTML 转换成 SSML
const convertHTMLToSSML = () => {
  const htmlContent = textEditor.value.innerHTML;
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  const ssmlContent = Array.from(doc.body.childNodes)
    .map((node) => processVoiceNode(node, null))
    .join("");

  console.log(ssmlContent);
  doTTS(ssmlContent);
};

// 是否添加了旁白标识
const layoutFlag = ref(false);

// 添加旁白
const addLayoutVoice = () => {
  const text = textEditor.value.innerHTML;
  const span = document.createElement("span");
  span.className =
    "global bg-gray-600/50 rounded-sm p-1 block pointer-events-auto";
  span.setAttribute("data-type", "voice");
  span.setAttribute("data-provider", "azure");
  span.setAttribute("data-model", "zh-CN-YunyangNeural");
  span.innerHTML = text;
  textEditor.value.innerHTML = span.outerHTML;
  layoutFlag.value = true;
  // console.log(span);
  addVoiceClickListener(span);
  // addVoiceContentMenuListener(span);
};

// 为选中文字添加指定语音模型
const addTextVoice = (model: VoiceModel) => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;

  // 获取当前选区
  const range = selection.getRangeAt(0);

  const voice = document.createElement("span");
  voice.className =
    "voice bg-red-500/50 rounded-sm px-1 mx-1 pointer-events-auto";
  voice.setAttribute("data-type", "voice");
  voice.setAttribute("data-provider", model.provider);
  voice.setAttribute("data-model", model.code);
  range.surroundContents(voice);
  addVoiceClickListener(voice);
  addVoiceContentMenuListener(voice);
};

// 右键菜单的定位
const menuPosition = ref({ x: 0, y: 0 });

/************** 空白间隔相关 ***************/
const showBlankMenu = ref(false);
const editBlankFlag = ref(false);
const blankTime = ref(0);
const selectedBlank = ref<HTMLElement | null>(null); // 保存当前选中的 span
// 常量配置 默认空白间隔
const addBreak = () => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;

  // 获取当前选区
  const range = selection.getRangeAt(0);
  range.deleteContents(); // 删除选中的内容

  // 创建一个文本节点，并将其插入到选区位置
  const blankNode = document.createElement("span");
  blankNode.className =
    "break bg-gray-600 hover:bg-gray-500 rounded-sm px-1 text-sm mx-1 cursor-pointer pointer-events-auto";
  blankNode.setAttribute("data-type", "break");
  blankNode.setAttribute("data-model", "500");
  blankNode.textContent = "500ms";
  blankNode.contentEditable = "false";
  // 左键功能
  addBreakClickListener(blankNode);
  // 右键菜单
  addBreakContentMenuListener(blankNode);

  range.insertNode(blankNode);

  // 移动光标到插入的文本节点之后
  range.setStartAfter(blankNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  // 直接触发点击事件
  blankNode.click();
};

// 编辑空白间隔功能
const editBreak = () => {
  if (selectedBlank.value) {
    showBlankMenu.value = false; // 隐藏菜单
    editBlankFlag.value = true;
    blankTime.value = parseInt(
      selectedBlank.value.getAttribute("data-model") || ""
    );
  }
};
// 保存编辑的空白间隔
const saveBreak = () => {
  if (selectedBlank.value) {
    selectedBlank.value.setAttribute("data-model", blankTime.value.toString());
    selectedBlank.value.innerText = `${blankTime.value}ms`;
    editBlankFlag.value = false;
    // selectedBlank.value = null;
  }
};
// 删除空白
const deleteBreak = () => {
  if (selectedBlank.value) {
    selectedBlank.value.remove(); // 删除当前选中的 span
    showBlankMenu.value = false; // 隐藏菜单
    editBlankFlag.value = false;
  }
};

// 添加右键菜单事件监听
const addBreakContentMenuListener = (blankNode: HTMLSpanElement) => {
  blankNode.addEventListener("contextmenu", (e) => {
    // console.log("右键菜单");
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡
    selectedBlank.value = blankNode;
    showBlankMenu.value = true;
    menuPosition.value = { x: e.clientX - 160, y: e.clientY - 40 };
  });
};

// 添加右键菜单事件监听
const addBreakClickListener = (blankNode: HTMLSpanElement) => {
  blankNode.addEventListener("click", (e) => {
    // console.log("左键菜单");
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡
    showBlankMenu.value = false;
    showEmotionMenu.value = false;
    showVoiceMenu.value = false;
    selectedBlank.value = blankNode;
    editBreak();
  });
};

/************** 情感相关 ***************/
const showEmotionMenu = ref(false);
const editEmotionFlag = ref(false);
const emotion = ref<EditEmotionModel>({});
// const emotionEdit = ref<EditVoiceStyle>({});
const selectedEmotion = ref<HTMLElement | null>(null); // 保存当前选中的 span
const selectedRange = ref();
const showAddVoiceForm = ref(false);
const addEmotionProvider = ref<SerivceProvider>();
// 情感添加新声音
const addEmotionVoice = () => {
  addEmotionProvider.value = {
    name: "",
    code: selectedVoice.value?.getAttribute("data-provider") || "",
  };
  showAddVoiceForm.value = true;
};
const cancelAddEmotionVoice = () => {
  showAddVoiceForm.value = false;
};
const saveEmotionVoice = (model: VoiceModel) => {
  if (!model.code) {
    alertWarning("未选择语音模型!");
  }
  console.log(model);
  selectedEmotion.value?.classList.add("voice-emotion");
  selectedEmotion.value?.classList.remove("emotion");
  selectedEmotion.value?.setAttribute("data-type", "voice-emotion");
  selectedEmotion.value?.setAttribute("data-model", model.code || "");
  showAddVoiceForm.value = false;
  // 添加 voice-emotion 相关的点击事件
};
// 为选中文字添加指定语音模型
const addEmotion = () => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  // 获取当前选区
  selectedRange.value = selection.getRangeAt(0);
  // console.log(selectedRange.value);
  if (selectedRange.value.startOffset === selectedRange.value.endOffset) {
    alertWarning("未选中任何文字，无法添加情感!");
    return;
  }
  if (!selectedVoice.value) {
    alertWarning("当前区域未选择语音模型，无法添加情感!");
    return;
  }
  const voiceProvider = selectedVoice.value.getAttribute("data-provider");
  if (!voiceProvider) {
    alertWarning("未知语音模型，无法添加情感!");
    return;
  }
  // 创建标签
  const emotionElement = document.createElement("span");
  // 添加样式
  emotionElement.className =
    "emotion rounded-sm px-1 mx-1 underline underline-offset-4 cursor-pointer pointer-events-auto";
  // 标签类型：情感
  emotionElement.setAttribute("data-type", "emotion");
  // 模型提供商
  emotionElement.setAttribute("data-provider", voiceProvider);
  selectedRange.value.surroundContents(emotionElement);

  // 添加事件监听
  addEmotionClickListener(emotionElement);
  addEmotionContentMenuListener(emotionElement);
  // 直接触发点击事件
  emotionElement.click();
};

// 编辑功能
const editEmotion = () => {
  // console.log(selectedEmotion.value);
  if (selectedEmotion.value) {
    showEmotionMenu.value = false; // 隐藏菜单
    emotion.value = {
      provider: selectedEmotion.value.getAttribute("data-provider") || "",
      style: {
        code: selectedEmotion.value.getAttribute("data-style") || "",
      },
      styledegree: selectedEmotion.value.getAttribute("data-styledegree") || "",
      role: { code: selectedEmotion.value.getAttribute("data-role") || "" },
    };
    editEmotionFlag.value = true;
  }
};
// 删除功能
const deleteEmotion = () => {
  if (selectedEmotion.value) {
    // selectedEmotion.value.remove(); // 删除当前选中的 span
    // 获取 `span` 标签的文本内容
    const textContent = selectedEmotion.value.textContent || "";
    // 创建一个新的文本节点
    const textNode = document.createTextNode(textContent);
    // 使用父节点替换 `span` 为 `textNode`
    selectedEmotion.value.replaceWith(textNode);
    showEmotionMenu.value = false; // 隐藏菜单
    editEmotionFlag.value = false;
  }
};
const saveEmotion = (item: EditEmotionModel) => {
  let title = "";
  if (selectedEmotion.value) {
    // 模型提供商
    if (item.provider) {
      selectedEmotion.value.setAttribute("data-provider", item.provider);
      title += `服务商：${item.provider}`;
    }
    // 情感
    if (item.style?.code) {
      selectedEmotion.value.setAttribute("data-style", item.style.code);
      title += `情感：${item.style.name}`;
    }
    // 情感级别
    if (item.styledegree) {
      selectedEmotion.value.setAttribute("data-styledegree", item.styledegree);
      title += `情感级别：${item.styledegree}`;
    }
    // 模仿
    if (item.role?.code) {
      selectedEmotion.value.setAttribute("data-role", item.role.code);
      title += `模仿：${item.role.name}`;
    }
  }

  showEmotionMenu.value = false; // 隐藏菜单
  editEmotionFlag.value = false;
};
// 取消功能
const cancelEmotion = (item: EditEmotionModel) => {
  showEmotionMenu.value = false; // 隐藏菜单
  editEmotionFlag.value = false;
  if (!item.style && !item.role) {
    deleteEmotion();
  }
  emotion.value = {};
};
const playEmotion = () => {
  const voice = selectedEmotion.value?.parentNode as Element;
  const model = voice.getAttribute("data-model");
  // const voiceProvider = voice?.getAttribute("data-provider");
  if (selectedEmotion.value) {
    let ssml = processVoiceNode(selectedEmotion.value, null);
    ssml = `<voice name="${model}">${ssml}</voice>`;
    // console.log(ssml);
    playSSML(ssml);
  }
};

// 添加右键菜单事件监听
const addEmotionContentMenuListener = (emotionNode: HTMLElement) => {
  emotionNode.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡
    selectedEmotion.value = emotionNode;
    showEmotionMenu.value = true;
    menuPosition.value = { x: e.clientX - 160, y: e.clientY - 40 };
  });
};

// 添加左键菜单事件监听
const addEmotionClickListener = (emotionNode: HTMLElement) => {
  emotionNode.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡
    showBlankMenu.value = false;
    showEmotionMenu.value = false;
    showVoiceMenu.value = false;
    selectedEmotion.value = emotionNode;
    editEmotion();
  });
};

/************** 声音模型相关 ***************/
const showVoiceMenu = ref(false);
const selectedVoice = ref<HTMLElement | null>(null); // 保存当前选中的 span
const addVoiceEmotion = () => {
  // if (selectedVoice.value) {
  //   const ssml = processVoiceNode(selectedVoice.value, null);
  //   playSSML(ssml);
  // }
};
// 试听选中voice元素
const playVoice = () => {
  if (selectedVoice.value) {
    const ssml = processVoiceNode(selectedVoice.value, null);
    console.log(ssml);
    playSSML(ssml);
  }
};
// 清除选中voice的设置，保留文本
const deleteVoice = () => {
  if (selectedVoice.value) {
    // 获取 `span` 标签的文本内容
    const textContent = selectedVoice.value.textContent || "";
    // 创建一个新的文本节点
    const textNode = document.createTextNode(textContent);
    // 使用父节点替换 `span` 为 `textNode`
    selectedVoice.value.replaceWith(textNode);
  }
};
// 添加右键菜单事件监听
const addVoiceContentMenuListener = (voiceNode: HTMLElement) => {
  voiceNode.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡
    console.log(voiceNode);
    selectedVoice.value = voiceNode;
    showVoiceMenu.value = true;
    menuPosition.value = { x: e.clientX - 160, y: e.clientY - 40 };
  });
};

// 添加左键菜单事件监听
const addVoiceClickListener = (voiceNode: HTMLElement) => {
  voiceNode.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡
    showBlankMenu.value = false;
    showEmotionMenu.value = false;
    showVoiceMenu.value = false;
    selectedVoice.value = voiceNode;
  });
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
      v-if="openProjectFlag"
    >
      <MySelect
        :items="ModelCategoryItems"
        :select="getModels"
        :selected="selectServiceProvider"
      />
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
          :set="addTextVoice"
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
          @click="openProjectFolder()"
        >
          打开文件夹
        </button>
        <button
          class="ml-2 px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600"
          @click="addLayoutVoice()"
        >
          添加旁白
        </button>
        <button
          class="ml-2 px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600"
          @click="stopPalyAudio()"
        >
          停止试听
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
            @click="addBreak()"
          >
            <EditBlankIcon class="w-6 h-6" color="white" />
          </button>
          <button
            class="p-1 rounded-sm cursor-pointer hover:bg-gray-700"
            title="添加情感"
            @click="addEmotion()"
          >
            <EditEmotionIcon class="w-6 h-6" color="white" />
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
          class="px-2 py-1 ml-2 rounded-md bg-yellow-700 hover:bg-yellow-600"
          @click="saveProject()"
        >
          保存
        </button>
        <button
          class="px-2 py-1 ml-2 rounded-md bg-red-500/80 hover:bg-red-500"
          title="关闭项目但不会自动保存"
          @click="closeProject(true)"
        >
          关闭
        </button>
        <button
          class="px-2 py-1 ml-2 rounded-md bg-green-700 hover:bg-green-600"
          @click="saveAndCloseProject()"
        >
          保存并关闭
        </button>
      </div>
    </div>

    <BreakMenu
      v-if="showBlankMenu"
      :x="menuPosition.x"
      :y="menuPosition.y"
      @edit="editBreak"
      @delete="deleteBreak"
    />
    <div
      v-show="editBlankFlag"
      class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-400/50"
      style="z-index: 999"
    >
      <div class="px-4 py-2 bg-gray-900 rounded-md overflow-hidden">
        <h3 class="text-lg text-center pb-4">插入空白间隔</h3>
        <div class="flex items-center">
          <label for="blankTime">时长(ms/毫秒)</label>
          <input
            name="blankTime"
            class="flex-1 w-full h-8 bg-transparent border border-gray-400 ml-4 p-2 my-2 rounded-md focus:outline-none"
            v-model="blankTime"
          />
        </div>
        <div class="flex justify-center py-2">
          <!-- <div
            class="px-2 py-1 bg-red-500 hover:bg-red-400 cursor-pointer rounded-sm"
            @click="deleteBreak"
          >
            删除
          </div> -->
          <div
            class="ml-2 px-2 py-1 bg-blue-500 hover:bg-blue-400 cursor-pointer rounded-sm"
            @click="saveBreak"
          >
            确定
          </div>
        </div>
      </div>
    </div>
    <EmotionMenu
      v-if="showEmotionMenu"
      :x="menuPosition.x"
      :y="menuPosition.y"
      @addVoice="addEmotionVoice"
      @play="playEmotion"
      @edit="editEmotion"
      @delete="deleteEmotion"
    />
    <EditEmotionForm
      v-if="editEmotionFlag"
      :flag="editEmotionFlag"
      :item="emotion"
      @save="saveEmotion"
      @cancel="cancelEmotion"
    />
    <AddVoiceForm
      v-if="showAddVoiceForm"
      :flag="showAddVoiceForm"
      :provider="addEmotionProvider"
      @cancel="cancelAddEmotionVoice"
      @save="saveEmotionVoice"
    />
    <VoiceMenu
      v-if="showVoiceMenu"
      :x="menuPosition.x"
      :y="menuPosition.y"
      @addEmotion="addVoiceEmotion"
      @play="playVoice"
      @delete="deleteVoice"
    />
  </div>
</template>

<style scoped>
#textEditor[data-placeholder].empty::before {
  content: attr(data-placeholder);
  color: #a0a0a0;
  font-style: italic;
}
</style>
