import type { MessageModel } from "./model";
import { messages } from "./global.store";

export const selectFloder = async () => {
  // @ts-ignore
  return await window.electron.selectFolder();
};

export const VoiceTestText = "你好，我是{}，很高兴认识你！";
let audio: HTMLAudioElement | null = null; // 用于持有 Audio 对象
export const playAudio = (res: any) => {
  // console.log(res);
  // 已知res是音频文件流，如：const audioData = Buffer.from(result.audioData);，如何播放？
  // 将音频数据转换为 Blob
  const audioBlob = new Blob([res], { type: "audio/wav" });

  // 创建一个 URL 来供 <audio> 标签使用
  const audioUrl = URL.createObjectURL(audioBlob);

  // 创建 <audio> 元素并播放音频
  audio = new Audio(audioUrl);
  audio
    .play()
    .then(() => {
      console.log("Audio is playing");
    })
    .catch((error) => {
      console.error("Error playing audio:", error);
    });

  // 可选：在音频结束后释放内存
  audio.onended = () => {
    URL.revokeObjectURL(audioUrl);
    audio = null; // 重置 audio 对象
  };
};

export const stopPalyAudio = () => {
  if (audio) {
    audio.pause();
    audio.currentTime = 0; // 重置到音频开始位置
    audio = null; // 重置 audio 对象
    console.log("Audio has been stopped");
  }
};

export const addMessage = (message: MessageModel) => {
  messages.value.push(message);
  const id = message.id;
  setTimeout(() => {
    // 根据 id 删除元素
    const index = messages.value.findIndex((msg) => msg.id === id);
    if (index !== -1) {
      messages.value.splice(index, 1); // 删除消息
    }
  }, 2000);
};

export const alertSuccess = (info: string) => {
  addMessage({ id: String(Date.now()), type: "success", info, show: true });
};

export const alertError = (info: string) => {
  addMessage({ id: String(Date.now()), type: "error", info, show: true });
};

export const alertInfo = (info: string) => {
  addMessage({ id: String(Date.now()), type: "info", info, show: true });
};

export const alertWarning = (info: string) => {
  addMessage({ id: String(Date.now()), type: "warning", info, show: true });
};

export const getMessageClass = (message: MessageModel) => {
  switch (message.type) {
    case "success":
      return "bg-green-600/90";
    case "error":
      return "bg-red-400/90";
    case "info":
      return "bg-gray-400/90";
    case "warning":
      return "bg-yellow-700/90";
    default:
      return "bg-gray-800/90";
  }
};

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
