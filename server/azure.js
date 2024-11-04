const fs = require("fs");
const sdk = require("microsoft-cognitiveservices-speech-sdk");

const { getConfig } = require("./config");
const path = require("path");

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

module.exports = {
  speech,
};
