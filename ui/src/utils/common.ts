import type { MessageModel } from "./model";
import { messages } from "./global.store";

export const selectFloder = async () => {
  // @ts-ignore
  return await window.electron.selectFolder();
};

export const VoiceTestText = "你好，我是{}，很高兴认识你！";

export const playAudio = (res: any) => {
  // console.log(res);
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
      return "bg-green-500/70";
    case "error":
      return "bg-red-400/80";
    case "info":
      return "bg-gray-400/60";
    case "warning":
      return "bg-yellow-700/60";
    default:
      return "bg-gray-800/80";
  }
};
