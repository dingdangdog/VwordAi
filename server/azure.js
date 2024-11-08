const fs = require("fs");
const sdk = require("microsoft-cognitiveservices-speech-sdk");

const { getConfig } = require("./config");
const path = require("path");
const { success, error } = require("./util");

const speech = (text, fileName) => {
  if (!text) {
    return;
  }
  const config = getConfig();
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    config.serviceConfig.azure.key,
    config.serviceConfig.azure.region
  );
  const time = new Date().getMilliseconds();
  fileName = path.join(config.dataPath, `${fileName}_${time}.wav`);

  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(fileName);

  const speechSynthesizer = new sdk.SpeechSynthesizer(
    speechConfig,
    audioConfig
  );
  speechSynthesizer.speakSsmlAsync(
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" 
    xmlns:mstts="https://www.w3.org/2001/mstts" 
    xmlns:emo="http://www.w3.org/2009/10/emotionml" 
    xml:lang="zh-CN"> 
    <voice name="zh-CN-YunfengNeural" rate="1.0">
    ${text}
    </voice>
    </speak>
    `,
    (result) => {
      speechSynthesizer.close();
      if (result) {
        // return result as stream
        return fs.createReadStream(fileName);
      }
    },
    (error) => {
      console.log(error);
      speechSynthesizer.close();
    }
  );
};

const TEMPLATE_TEXT =
  '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" ' +
  'xmlns:mstts="https://www.w3.org/2001/mstts" ' +
  'xmlns:emo="http://www.w3.org/2009/10/emotionml" ' +
  'xml:lang="zh-CN">' +
  '<voice name="{voice_model}" rate="{voice_speed}">' +
  '<mstts:silence type="Leading" value="1000ms"/>' + // 文本开头的附加静音
  '<mstts:silence type="Tailing" value="1000ms"/>' + // 文本末尾的静音
  '<mstts:silence type="Sentenceboundary" value="1000ms"/>' + // 在两个句子之间添加 1000 毫秒的静音
  '<mstts:silence type="Comma" value="300ms"/>' + // 逗号处添加 300 毫秒的静音
  '<mstts:silence type="Semicolon" value="500ms"/>' + // 分号处添加 300 毫秒的静音
  '<mstts:silence type="Enumerationcomma" value="300ms"/>' + // 枚举逗号处添加 300 毫秒的静音
  '<mstts:express-as style="sad" styledegree="2">' + // 情感、风格使用示例
  // 带情感文本
  // '</mstts:express-as>' +
  // '<break time="1s" />' + // 开头停顿1秒
  "{voice_text}" +
  "</voice>" +
  "</speak>";

const play = (model, text) => {
  if (!text || !model) {
    return;
  }

  const config = getConfig();
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    config.serviceConfig.azure.key,
    config.serviceConfig.azure.region
  );

  // 设置语音模型
  speechConfig.speechSynthesisVoiceName = model;

  // 指定音频输出格式为 .wav 格式
  speechConfig.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

  const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);

  // 返回一个 Promise，用于处理异步操作
  return new Promise((resolve, reject) => {
    // 使用 speakTextAsync 播放语音
    speechSynthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log("Synthesis finished.");

          // 将 ArrayBuffer 转换为 Buffer
          const audioData = Buffer.from(result.audioData);

          // 成功时，返回音频数据
          resolve(success(audioData, "success"));
        } else {
          console.error("Synthesis failed. Reason:", result.errorDetails);
          reject(error(result.errorDetails)); // 失败时返回错误
        }
        speechSynthesizer.close();
      },
      (error) => {
        console.log("Error:", error);
        reject(new Error(error)); // 失败时返回错误
        speechSynthesizer.close();
      }
    );
  });
};

const azurePlaySSML = (ssml) => {
  if (!ssml) {
    return;
  }
  const config = getConfig();
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    config.serviceConfig.azure.key,
    config.serviceConfig.azure.region
  );

  // 指定音频输出格式为 .wav 格式
  speechConfig.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

  const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);

  // 返回一个 Promise，用于处理异步操作
  return new Promise((resolve, reject) => {
    speechSynthesizer.speakSsmlAsync(
      `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" 
    xmlns:mstts="https://www.w3.org/2001/mstts" 
    xmlns:emo="http://www.w3.org/2009/10/emotionml"
    xml:lang="zh-CN"> 
    ${ssml}
    </speak>
    `,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log("Synthesis finished.");

          // 将 ArrayBuffer 转换为 Buffer
          const audioData = Buffer.from(result.audioData);

          // 成功时，返回音频数据
          resolve(success(audioData, "success"));
        } else {
          console.error("Synthesis failed. Reason:", result.errorDetails);
          reject(error(result.errorDetails)); // 失败时返回错误
        }
        speechSynthesizer.close();
      },
      (error) => {
        console.log(error);
        speechSynthesizer.close();
      }
    );
  });
};
// 播放本地语音文件（如 mp3, wav 等）

module.exports = {
  speech,
  play,
  azurePlaySSML,
};
