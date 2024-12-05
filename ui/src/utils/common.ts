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

export const formatDate = (date: Date): string => {
  const pad = (num: number) => String(num).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // 月份从 0 开始，需要加 1
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const getOrderStatusText = (status: string) => {
  switch (status) {
    case "-1":
      return "已取消";
    case "0":
      return "待支付";
    case "1":
      return "支付成功";
    case "2":
      return "支付失败";
    case "3":
      return "已退款";
    default:
      return status;
  }
};

export const getProjectStatusText = (status: string) => {
  switch (status) {
    case "-1":
      return "处理失败";
    case "0":
      return "已上传";
    case "1":
      return "处理中";
    case "2":
      return "处理成功";
    default:
      return status;
  }
};
