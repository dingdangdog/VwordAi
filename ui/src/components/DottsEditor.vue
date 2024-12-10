<script setup lang="ts">
import { onMounted, ref } from "vue";
import { request, requestByToken } from "@/utils/request";
import type {
  EditEmotionModel,
  EditVoiceEmotionModel,
  SerivceProvider,
  VoiceModel,
  VoiceObject,
} from "@/utils/model";
import EditBlankIcon from "@/components/edit/BlankIcon.vue";
import EditEmotionIcon from "@/components/edit/EmotionIcon.vue";
import EditModelCard from "@/components/card/EditModelCard.vue";
import {
  alertError,
  alertSuccess,
  alertWarning,
  playAudio,
  stopPalyAudio,
  VoiceTestText,
} from "@/utils/common";
import MySelect from "@/components/MySelect.vue";
import {
  openProjectFlag,
  saveProjectFlag,
  GlobalEditProject,
  ModelCategoryItems,
  GlobalConfig,
} from "@/utils/global.store";
import { playSSML } from "@/utils/api";
import BreakMenu from "@/components/menu/Break.vue";
import EmotionMenu from "@/components/menu/Emotion.vue";
import VoiceMenu from "@/components/menu/Voice.vue";
import VoiceEmotionMenu from "@/components/menu/VoiceEmotion.vue";
import EditLayoutForm from "@/components/form/EditLayout.vue";
import EditBreakForm from "@/components/form/EditBreak.vue";
import EditVoiceForm from "@/components/form/EditVoice.vue";
import EditEmotionForm from "@/components/form/EditEmotion.vue";
import EditVoiceEmotionForm from "@/components/form/EditVoiceEmotion.vue";
import { processVoiceNode } from "@/utils/ssml";

const editCommonStyleClass = new Set(["cursor-pointer", "pointer-events-auto"]);

const breakStyleClass = new Set([
  "bg-gray-600",
  "hover:bg-gray-500",
  "rounded-sm",
  "px-1",
  "mx-1",
  "text-sm",
]);
editCommonStyleClass.forEach((c) => breakStyleClass.add(c));

const voiceStyleClass = new Set(["bg-red-500/50", "px-1", "mx-1", "text-sm"]);
editCommonStyleClass.forEach((c) => voiceStyleClass.add(c));

const emotionStyleClass = new Set([
  "rounded-sm",
  "px-1",
  "italic",
  "underline",
  "underline-offset-4",
  "decoration-pink-500",
]);
editCommonStyleClass.forEach((c) => emotionStyleClass.add(c));

const voiceEmotionStyleClass = new Set<string>([]);
voiceStyleClass.forEach((c) => voiceEmotionStyleClass.add(c));
emotionStyleClass.forEach((c) => voiceEmotionStyleClass.add(c));
editCommonStyleClass.forEach((c) => voiceEmotionStyleClass.add(c));

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

// 选择的服务提供商:azure/aliyun等
const selectServiceProvider = ref<SerivceProvider>();
const models = ref<VoiceModel[]>();
const showModels = ref<VoiceModel[]>();
const getModels = (provider: SerivceProvider) => {
  selectServiceProvider.value = provider;
  request("getModels", provider.code).then((res) => {
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
  // 声音模型标签事件初始化
  const voiceElements = document.getElementsByClassName("voice");
  // console.log(voiceElements);
  for (let e of voiceElements) {
    let voice = e as HTMLElement;
    // voice.addEventListener("click", voiceClickFunc);
    voice.addEventListener("contextmenu", voiceRightClickFunc);
  }
  // 情感标签事件初始化
  const emotionElements = document.getElementsByClassName("emotion");
  // console.log(emotionElements);
  for (let e of emotionElements) {
    let emotion = e as HTMLElement;
    // emotion.addEventListener("click", emotionClickFunc);
    emotion.addEventListener("contextmenu", emotionRightClickFunc);
  }
  // 空白标签事件初始化
  const breakElements = document.getElementsByClassName("break");
  // console.log(breakElements);
  for (let e of breakElements) {
    let blank = e as HTMLElement;
    blank.addEventListener("click", breakClickFunc);
    blank.addEventListener("contextmenu", breakRightClickFunc);
  }
  // 声音模型标签事件初始化
  const voiceEmotionElements = document.getElementsByClassName("voice-emotion");
  // console.log(voiceElements);
  for (let e of voiceEmotionElements) {
    let voiceEmotion = e as HTMLElement;
    // voiceEmotion.addEventListener("click", voiceEmotionClickFunc);
    voiceEmotion.addEventListener("contextmenu", voiceEmotionRightClickFunc);
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
    initEditor(GlobalEditProject.value.content || "");
  }

  document.addEventListener("click", (event) => {
    showBreakMenu.value = false;
    showEmotionMenu.value = false;
    showVoiceMenu.value = false;
    showVoiceEmotionMenu.value = false;
  });
});

// 保存项目
const saveProject = async () => {
  GlobalEditProject.value.content = textEditor.value.innerHTML;
  GlobalEditProject.value.update_by = Date.now();
  GlobalEditProject.value.voices = [];
  const res = await request("saveProject", GlobalEditProject.value);
  // console.log(res);
  if (res) {
    GlobalEditProject.value = res;
    alertSuccess("保存成功");
    saveProjectFlag.value = true;
  } else {
    alertError("保存失败");
  }
};

// 上传项目
const uploadProject = async () => {
  await saveProject();
  console.log(GlobalEditProject.value);
  requestByToken("uploadProject", GlobalEditProject.value).then((res) => {
    alertSuccess("上传成功");
    GlobalEditProject.value.id = res.id;
  });
};

// 关闭项目
const closeProject = (canSave: boolean) => {
  if (!canSave) {
    return;
  }
  if (openProjectFlag.value) {
    openProjectFlag.value = false;
  }
  GlobalEditProject.value = {};
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
  window.electron.openFolder(GlobalEditProject.value.path);
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
  request("playTest", model.code, testText, model.provider)
    .then((res) => {
      playAudio(res);
    })
    .finally(() => {});
};

// 执行本地语音转换（保存语音文件到本地）
const doTTS = (ssml: string) => {
  if (!GlobalEditProject.value.path) {
    GlobalEditProject.value.path = `${GlobalConfig.value.dataPath}/${GlobalEditProject.value.name}`;
  }
  // 组装本次转换的文件名
  const fileName = `${GlobalEditProject.value.path}/${
    GlobalEditProject.value.name
  }_${Date.now()}.wav`;
  request("dotts", ssml, fileName).then((res) => {
    alertSuccess("生成成功");
    saveProject();
    // @ts-ignore 直接打开生成后的文件
    // 自动打开文件/文件夹
    window.electron.openFolder(res);
    // window.electron.openFolder(project.value.path);
  });
};

// 将 HTML 转换成 SSML
const convertHTMLToSSML = () => {
  // if (!project.value.layout?.model) {
  //   alertError("请至少进行旁白设置！");
  //   return;
  // }
  const htmlContent = textEditor.value.innerHTML;
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  // const voices = htmlToVoice(doc.body, undefined, undefined);
  // console.log(voices);
  const ssmlContent = Array.from(doc.body.childNodes)
    .map((node) => processVoiceNode(node, null))
    .join("");

  // console.log(ssmlContent);
  doTTS(ssmlContent);
};
/*******************************************
 ************【旁白设置相关代码】*************
 *******************************************/
// 是否添加了旁白标识
const editLayoutFlag = ref(false);
// 编辑旁白
const editLayoutVoice = () => {
  editLayoutFlag.value = true;
};
// 保存旁白设置
const saveLayout = (layout: VoiceObject) => {
  if (!layout.model) {
    alertError("设置无效未选择语音模型！");
    return;
  }
  GlobalEditProject.value.layout = layout;
  editLayoutFlag.value = false;
};
// 取消旁白编辑
const cancelLayout = () => {
  editLayoutFlag.value = false;
};

// 为选中文字添加指定语音模型
const addTextVoice = (model: VoiceModel) => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;

  // 获取当前选区
  const range = selection.getRangeAt(0);

  const voiceNode = document.createElement("span");
  voiceNode.setAttribute("title", `角色名称: ${model.name}`);
  voiceNode.classList.add("voice");
  // 添加声音样式
  voiceStyleClass.forEach((c) => voiceNode.classList.add(c));
  voiceNode.setAttribute("data-type", "voice");
  voiceNode.setAttribute("data-provider", model.provider);
  voiceNode.setAttribute("data-model", model.code);
  range.surroundContents(voiceNode);

  // voiceNode.addEventListener("click", voiceClickFunc);
  voiceNode.addEventListener("contextmenu", voiceRightClickFunc);
};

// 右键菜单的定位
const menuPosition = ref({ x: 0, y: 0 });

/************** 空白间隔相关 ***************/
const showBreakMenu = ref(false);
const editBreakFlag = ref(false);
const breakTime = ref(0);
const selectedBreak = ref<HTMLElement | null>(null); // 保存当前选中的 span
// 常量配置 默认空白间隔
const addBreak = () => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;

  // 获取当前选区
  const range = selection.getRangeAt(0);
  range.deleteContents(); // 删除选中的内容

  // 创建一个文本节点，并将其插入到选区位置
  const breakNode = document.createElement("span");
  breakNode.classList.add("break");
  // 添加样式
  breakStyleClass.forEach((c) => breakNode.classList.add(c));
  breakNode.setAttribute("title", `空白时间: 500毫秒`);
  breakNode.setAttribute("data-type", "break");
  breakNode.setAttribute("data-model", "500");
  breakNode.textContent = "500ms";
  breakNode.contentEditable = "false";
  breakNode.addEventListener("click", breakClickFunc);
  breakNode.addEventListener("contextmenu", breakRightClickFunc);

  range.insertNode(breakNode);

  // 移动光标到插入的文本节点之后
  range.setStartAfter(breakNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  // 直接触发点击事件
  // breakNode.click();
};

// 编辑空白间隔功能
const editBreak = () => {
  if (selectedBreak.value) {
    showBreakMenu.value = false; // 隐藏菜单
    editBreakFlag.value = true;
    breakTime.value = parseInt(
      selectedBreak.value.getAttribute("data-model") || ""
    );
  }
};
// 保存编辑的空白间隔
const saveBreak = (time: number | string) => {
  if (selectedBreak.value) {
    selectedBreak.value.setAttribute("data-model", time.toString());
    selectedBreak.value.setAttribute("title", `空白时间: ${time}毫秒`);
    selectedBreak.value.innerText = `${time}ms`;
    editBreakFlag.value = false;
    // selectedBlank.value = null;
  }
};
// 删除空白
const deleteBreak = () => {
  if (selectedBreak.value) {
    selectedBreak.value.remove(); // 删除当前选中的 span
    showBreakMenu.value = false; // 隐藏菜单
    editBreakFlag.value = false;
  }
};

const cancelBreak = () => {
  showBreakMenu.value = false; // 隐藏菜单
  editBreakFlag.value = false;
};

const breakClickFunc = (e: MouseEvent) => {
  // console.log("左键菜单");
  e.preventDefault();
  e.stopPropagation(); // 阻止事件冒泡
  closeAllMenu();
  selectedBreak.value = e.target as HTMLElement;
  editBreak();
};
const breakRightClickFunc = (e: MouseEvent) => {
  // console.log("右键菜单");
  e.preventDefault();
  e.stopPropagation(); // 阻止事件冒泡
  closeAllMenu();
  selectedBreak.value = e.target as HTMLElement;
  showBreakMenu.value = true;
  menuPosition.value = { x: e.clientX - 160, y: e.clientY - 40 };
};

/************** 情感相关 ***************/
const showEmotionMenu = ref(false);
const editEmotionFlag = ref(false);
const emotion = ref<EditEmotionModel>({});
// const emotionEdit = ref<EditVoiceStyle>({});
const selectedEmotion = ref<HTMLElement | null>(null); // 保存当前选中的 span
const selectedRange = ref();

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
  const emotionNode = document.createElement("span");
  emotionNode.classList.add("emotion");
  // 添加样式
  emotionStyleClass.forEach((c) => emotionNode.classList.add(c));
  // 标签类型：情感
  emotionNode.setAttribute("data-type", "emotion");
  // 模型提供商
  emotionNode.setAttribute("data-provider", voiceProvider);
  selectedRange.value.surroundContents(emotionNode);

  // 添加事件监听
  // emotionNode.addEventListener("click", emotionClickFunc);
  emotionNode.addEventListener("contextmenu", emotionRightClickFunc);
  // 直接触发点击事件
  emotionNode.click();
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
    selectedEmotion.value.setAttribute("data-provider", item.provider || "");
    title += `服务商：${item.provider}`;
    // 情感
    selectedEmotion.value.setAttribute("data-style", item.style?.code || "");
    title += `情感：${item.style?.name}`;
    // 情感级别
    selectedEmotion.value.setAttribute(
      "data-styledegree",
      item.styledegree || ""
    );
    title += `情感级别：${item.styledegree}`;
    // 模仿
    selectedEmotion.value.setAttribute("data-role", item.role?.code || "");
    title += `伪音模仿：${item.role?.name}`;
  }

  showEmotionMenu.value = false; // 隐藏菜单
  editEmotionFlag.value = false;
};
// 取消功能
const cancelEmotion = (item: EditEmotionModel) => {
  showEmotionMenu.value = false; // 隐藏菜单
  editEmotionFlag.value = false;
  // console.log(item);
  if (!item.style?.code && !item.style?.code) {
    // 没有情感数据，删除默认增加的标签
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

// const emotionClickFunc = (e: MouseEvent) => {
//   e.preventDefault();
//   e.stopPropagation(); // 阻止事件冒泡
//   closeAllMenu();
//   selectedEmotion.value = e.target as HTMLElement;
//   editEmotion();
// };

const emotionRightClickFunc = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation(); // 阻止事件冒泡
  closeAllMenu();
  selectedEmotion.value = e.target as HTMLElement;
  showEmotionMenu.value = true;
  menuPosition.value = { x: e.clientX - 160, y: e.clientY - 40 };
};

/************** 声音模型相关 ***************/
const showVoiceMenu = ref(false);
const selectedVoice = ref<HTMLElement | null>(null); // 保存当前选中的 span
const editVoiceFlag = ref(false);
const voice = ref<any>();

// 试听选中voice元素
const playVoice = () => {
  if (selectedVoice.value) {
    const ssml = processVoiceNode(selectedVoice.value, null);
    // console.log(ssml);
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

// 编辑功能
const editVoice = () => {
  // console.log(selectedEmotion.value);
  if (selectedVoice.value) {
    showVoiceMenu.value = false; // 隐藏菜单
    voice.value = {
      provider: selectedVoice.value.getAttribute("data-provider") || "",
      model: selectedVoice.value.getAttribute("data-model") || "",
    };
    editVoiceFlag.value = true;
  }
};
const saveVoice = (item: any) => {
  if (selectedVoice.value) {
    selectedVoice.value.setAttribute("title", `角色名称：${item.name}`);
    // 模型提供商
    selectedVoice.value.setAttribute("data-provider", item.provider || "");
    // 模型
    selectedVoice.value.setAttribute("data-model", item.code || "");
  }
  editVoiceFlag.value = false; // 隐藏菜单
};
const cancelVoice = () => {
  editVoiceFlag.value = false; // 隐藏窗口
};
// const voiceClickFunc = (e: MouseEvent) => {
//   e.preventDefault();
//   e.stopPropagation(); // 阻止事件冒泡
//   closeAllMenu();
//   editVoice();
//   selectedVoice.value = e.target as HTMLElement;
// };

const voiceRightClickFunc = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation(); // 阻止事件冒泡
  // console.log(voiceNode);
  closeAllMenu();
  selectedVoice.value = e.target as HTMLElement;
  showVoiceMenu.value = true;
  menuPosition.value = { x: e.clientX - 160, y: e.clientY - 40 };
};

/************** 声音+模型相关 ***************/ // 情感添加新声音
const editVoiceEmotion = (
  type: "voice" | "emotion" | "all",
  element?: HTMLElement | null
) => {
  if (element) {
    selectedVoiceEmotion.value = element;
  }
  if (selectedVoiceEmotion.value) {
    // console.log(selectedVoiceEmotion.value);
    voiceEmotion.value = {
      provider: selectedVoiceEmotion.value?.getAttribute("data-provider") || "",
      model: selectedVoiceEmotion.value?.getAttribute("data-model") || "",
      style: {
        code: selectedVoiceEmotion.value?.getAttribute("data-style") || "",
      },
      styledegree:
        selectedVoiceEmotion.value?.getAttribute("data-styledegree") || "",
      role: {
        code: selectedVoiceEmotion.value?.getAttribute("data-role") || "",
      },
    };
    // console.log(voiceEmotion.value);
    editType.value = type;
    editVoiceEmotionFlag.value = true;
  }
};
const addEmotionVoice = () => {
  editVoiceEmotion("voice", selectedEmotion.value);
};
const addVoiceEmotion = () => {
  editVoiceEmotion("emotion", selectedVoice.value);
};
const showVoiceEmotionMenu = ref(false);
const editVoiceEmotionFlag = ref(false);
const voiceEmotion = ref<EditVoiceEmotionModel>({});
const editType = ref<"voice" | "emotion" | "all">("voice");
const selectedVoiceEmotion = ref<HTMLElement | null>(null);
const cancelVoiceEmotion = () => {
  editVoiceEmotionFlag.value = false;
  voiceEmotion.value = {};
  selectedVoiceEmotion.value = null;
};
const saveVoiceEmotion = (item: EditVoiceEmotionModel) => {
  if (!item) {
    alertWarning("未选择语音模型!");
  }
  // console.log(item);
  if (selectedVoiceEmotion.value) {
    selectedVoiceEmotion.value?.classList.add("voice-emotion");
    selectedVoiceEmotion.value?.classList.remove("emotion");
    selectedVoiceEmotion.value?.classList.remove("voice");
    // 清除声音样式
    voiceStyleClass.forEach((c) =>
      selectedVoiceEmotion.value?.classList.remove(c)
    );
    // 清除情感样式
    emotionStyleClass.forEach((c) =>
      selectedVoiceEmotion.value?.classList.remove(c)
    );
    // 添加声音+情感样式
    voiceEmotionStyleClass.forEach((c) =>
      selectedVoiceEmotion.value?.classList.add(c)
    );
    selectedVoiceEmotion.value?.setAttribute("data-type", "voice-emotion");
    selectedVoiceEmotion.value?.setAttribute(
      "data-provider",
      item.provider || ""
    );
    selectedVoiceEmotion.value?.setAttribute("data-model", item.model || "");
    selectedVoiceEmotion.value?.setAttribute(
      "data-style",
      item.style?.code || ""
    );
    selectedVoiceEmotion.value?.setAttribute(
      "data-styledegree",
      item.styledegree || ""
    );
    selectedVoiceEmotion.value?.setAttribute(
      "data-role",
      item.role?.code || ""
    );
    editVoiceEmotionFlag.value = false;
    // 添加 voice-emotion 相关的点击事件
    // selectedVoiceEmotion.value.removeEventListener("click", voiceClickFunc);
    selectedVoiceEmotion.value.removeEventListener(
      "contextmenu",
      voiceRightClickFunc
    );
    // selectedVoiceEmotion.value.removeEventListener("click", emotionClickFunc);
    selectedVoiceEmotion.value.removeEventListener(
      "contextmenu",
      emotionRightClickFunc
    );
    // selectedVoiceEmotion.value.addEventListener("click", voiceEmotionClickFunc);
    selectedVoiceEmotion.value.addEventListener(
      "contextmenu",
      voiceEmotionRightClickFunc
    );
  }
};

// 试听选中voice元素
const playVoiceEmotion = () => {
  if (selectedVoiceEmotion.value) {
    const ssml = processVoiceNode(selectedVoiceEmotion.value, null);
    // console.log(ssml);
    playSSML(ssml);
  }
};
// 清除选中voice的设置，保留文本
const deleteVoiceEmotion = () => {
  if (selectedVoiceEmotion.value) {
    // 获取 `span` 标签的文本内容
    const textContent = selectedVoiceEmotion.value.textContent || "";
    // 创建一个新的文本节点
    const textNode = document.createTextNode(textContent);
    // 使用父节点替换 `span` 为 `textNode`
    selectedVoiceEmotion.value.replaceWith(textNode);
  }
};

// 清除选中voice的设置，保留文本
const deleteVmVoice = () => {
  if (selectedVoiceEmotion.value) {
    selectedVoiceEmotion.value?.classList.add("emotion");
    selectedVoiceEmotion.value?.classList.remove("voice-emotion");
    selectedVoiceEmotion.value?.setAttribute("data-type", "emotion");
    selectedVoiceEmotion.value?.removeAttribute("data-model");
    voiceEmotionStyleClass.forEach((c) =>
      selectedVoiceEmotion.value?.classList.remove(c)
    );
    emotionStyleClass.forEach((c) =>
      selectedVoiceEmotion.value?.classList.add(c)
    );
    // 清除 voice-emotion 相关的点击事件
    // selectedVoiceEmotion.value.removeEventListener(
    //   "click",
    //   voiceEmotionClickFunc
    // );
    selectedVoiceEmotion.value.removeEventListener(
      "contextmenu",
      voiceEmotionRightClickFunc
    );
    // selectedVoiceEmotion.value.addEventListener("click", emotionClickFunc);
    selectedVoiceEmotion.value.addEventListener(
      "contextmenu",
      emotionRightClickFunc
    );
  }
};
// 清除选中voice的设置，保留文本
const deleteVmEmotion = () => {
  if (selectedVoiceEmotion.value) {
    selectedVoiceEmotion.value?.classList.add("voice");
    selectedVoiceEmotion.value?.classList.remove("voice-emotion");
    selectedVoiceEmotion.value?.setAttribute("data-type", "voice");
    selectedVoiceEmotion.value?.removeAttribute("data-style");
    selectedVoiceEmotion.value?.removeAttribute("data-styledegree");
    selectedVoiceEmotion.value?.removeAttribute("data-role");
    voiceEmotionStyleClass.forEach((c) =>
      selectedVoiceEmotion.value?.classList.remove(c)
    );
    voiceStyleClass.forEach((c) =>
      selectedVoiceEmotion.value?.classList.add(c)
    );
    // selectedVoiceEmotion.value.removeEventListener(
    //   "click",
    //   voiceEmotionClickFunc
    // );
    selectedVoiceEmotion.value.removeEventListener(
      "contextmenu",
      voiceEmotionRightClickFunc
    );
    // selectedVoiceEmotion.value.addEventListener("click", voiceClickFunc);
    selectedVoiceEmotion.value.addEventListener(
      "contextmenu",
      voiceRightClickFunc
    );
  }
};

const voiceEmotionRightClickFunc = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation(); // 阻止事件冒泡
  closeAllMenu();
  selectedVoiceEmotion.value = e.target as HTMLElement;
  showVoiceEmotionMenu.value = true;
  menuPosition.value = { x: e.clientX - 160, y: e.clientY - 40 };
};

const closeAllMenu = () => {
  showBreakMenu.value = false;
  showEmotionMenu.value = false;
  showVoiceMenu.value = false;
  showVoiceEmotionMenu.value = false;
};
</script>

<template>
  <div class="h-full w-full p-2 flex justify-between">
    <div
      class="h-full w-72 overflow-y-auto overflow-x-hidden p-2 bg-gray-800 rounded-md flex flex-col justify-between"
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
          @click="editLayoutVoice()"
        >
          旁白设置
        </button>
        <!-- <button
          class="ml-2 px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600"
          @click="stopPalyAudio()"
        >
          停止试听
        </button> -->
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
          v-model="GlobalEditProject.name"
        />
        <button
          class="px-2 py-1 ml-2 rounded-md bg-gray-700 hover:bg-gray-600"
          @click="convertHTMLToSSML()"
        >
          本地合成
        </button>
        <button
          class="px-2 py-1 ml-2 rounded-md bg-gray-700 hover:bg-gray-600"
          @click="uploadProject()"
        >
          上传云端
        </button>
        <!-- <button
          class="ml-2 px-2 py-1 bg-gray-700 rounded-md hover:bg-gray-600"
          @click="tts()"
        >
          云端合成
        </button> -->
        <button
          class="px-2 py-1 ml-2 rounded-md bg-sky-800 hover:bg-sky-700"
          @click="saveProject()"
        >
          保存
        </button>
        <button
          class="px-2 py-1 ml-2 rounded-md bg-red-500/60 hover:bg-red-500/80"
          title="关闭项目但不会自动保存"
          @click="closeProject(true)"
        >
          关闭
        </button>
        <button
          class="px-2 py-1 ml-2 rounded-md bg-green-700/80 hover:bg-green-600/80"
          @click="saveAndCloseProject()"
        >
          保存并关闭
        </button>
      </div>
    </div>

    <EditLayoutForm
      v-if="editLayoutFlag"
      :flag="editLayoutFlag"
      :item="GlobalEditProject.layout"
      @save="saveLayout"
      @cancel="cancelLayout"
    />

    <BreakMenu
      v-if="showBreakMenu"
      :x="menuPosition.x"
      :y="menuPosition.y"
      @edit="editBreak"
      @delete="deleteBreak"
    />
    <EditBreakForm
      v-if="editBreakFlag"
      :flag="editBreakFlag"
      :item="breakTime"
      @save="saveBreak"
      @cancel="cancelBreak"
    />
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
    <VoiceMenu
      v-if="showVoiceMenu"
      :x="menuPosition.x"
      :y="menuPosition.y"
      @edit="editVoice"
      @addEmotion="addVoiceEmotion"
      @play="playVoice"
      @delete="deleteVoice"
    />
    <EditVoiceForm
      v-if="editVoiceFlag"
      :flag="editVoiceFlag"
      :item="voice"
      @save="saveVoice"
      @cancel="cancelVoice"
    />
    <VoiceEmotionMenu
      v-if="showVoiceEmotionMenu"
      :x="menuPosition.x"
      :y="menuPosition.y"
      @play="playVoiceEmotion"
      @edit="editVoiceEmotion"
      @deleteEmotion="deleteVmEmotion"
      @deleteVoice="deleteVmVoice"
      @delete="deleteVoiceEmotion"
    />
    <EditVoiceEmotionForm
      v-if="editVoiceEmotionFlag"
      :flag="editVoiceEmotionFlag"
      :item="voiceEmotion"
      @save="saveVoiceEmotion"
      @cancel="cancelVoiceEmotion"
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
