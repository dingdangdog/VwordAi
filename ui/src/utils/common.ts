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
