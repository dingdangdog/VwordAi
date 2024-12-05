import type { VoiceObject } from "./model";

const DEFAULT_BREAK_TIME = "500ms";
// 递归处理节点并转换成 SSML，避免 voice 嵌套
export const processVoiceNode = (
  node: ChildNode,
  currentVoice: string | null
): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
    const dataType = node.getAttribute("data-type");
    const dataModel = node.getAttribute("data-model");
    const innerSSML = Array.from(node.childNodes)
      .map((childNode) =>
        processVoiceNode(
          childNode,
          dataType === "voice" ? dataModel : currentVoice
        )
      )
      .join("");

    switch (dataType) {
      case "voice":
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
      case "break":
        return `<break time="${dataModel || DEFAULT_BREAK_TIME}"/>`;
      case "emotion":
        const eDataStyle = node.getAttribute("data-style");
        let eStyle = eDataStyle ? `style="${eDataStyle}"` : "";
        const eDataStyledegree = node.getAttribute("data-styledegree");
        let eStyledegree = eDataStyledegree
          ? `styledegree="${eDataStyledegree}"`
          : "";
        const eDataRole = node.getAttribute("data-role");
        let eRole = eDataRole ? `role="${eDataRole}"` : "";
        return `<mstts:express-as ${eStyle} ${eStyledegree} ${eRole}>${innerSSML}</mstts:express-as>`;
      case "voice-emotion":
        const veDataStyle = node.getAttribute("data-style");
        let veStyle = veDataStyle ? `style="${veDataStyle}"` : "";
        const veDataStyledegree = node.getAttribute("data-styledegree");
        let veStyledegree = veDataStyledegree
          ? `styledegree="${veDataStyledegree}"`
          : "";
        const veDataRole = node.getAttribute("data-role");
        let veRole = veDataRole ? `role="${veDataRole}"` : "";
        if (dataModel) {
          if (veDataStyle || veDataRole) {
            return `<voice name="${dataModel}"><mstts:express-as ${veStyle} ${veStyledegree} ${veRole}>${innerSSML}</mstts:express-as></voice>`;
          } else {
            return `<voice name="${dataModel}">${innerSSML}</voice>`;
          }
        } else if (!dataModel) {
          if (veDataStyle || veDataRole) {
            return `<mstts:express-as ${veStyle} ${veStyledegree} ${veRole}>${innerSSML}</mstts:express-as>`;
          } else {
            return innerSSML;
          }
        }
      default:
        return innerSSML;
    }
  }

  return "";
};

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
// 递归处理节点并转换成 SSML，避免 voice 嵌套
export const htmlToVoice = (
  node: ChildNode,
  voice: VoiceObject | undefined,
  voices: VoiceObject[] | undefined
): VoiceObject[] => {
  if (!voices) {
    voices = [];
  }

  if (!node) {
    throw new Error("No element with id 'Node' found.");
  }

  if (node.nodeType === Node.TEXT_NODE) {
    // 只有文本的一段html
    const text = node.textContent;
    if (text && voice) {
      const newVoice = { ...voice, text };
      voices.push(newVoice);
    }
  } else if (
    node.nodeType === Node.ELEMENT_NODE &&
    node instanceof HTMLElement
  ) {
    // html元素
    const Provider = node.getAttribute("data-provider");
    const Type = node.getAttribute("data-type");
    const Model = node.getAttribute("data-model"); // 语音模型 / 间隔时间(毫秒)
    const Speed = node.getAttribute("data-speed");
    const Style = node.getAttribute("data-style");
    const Styledegree = node.getAttribute("data-styledegree");
    const Role = node.getAttribute("data-role");

    const childrenVoice: VoiceObject = {
      provider: Provider || "",
      model: Model || "",
      type: Type || "",
      speed: Speed || undefined,
      emotion: Style || undefined,
      emotionLevel: Styledegree || undefined,
      emotionRole: Role || undefined,
      text: "",
    };
    if (Type == "break") {
      voices.push(childrenVoice);
    } else {
      Array.from(node.childNodes).map((cn) => {
        voices = htmlToVoice(cn, childrenVoice, voices);
      });
    }
  }

  return voices;
};
