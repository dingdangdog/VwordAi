const fs = require("fs");
const path = require("path");
const sdk = require("microsoft-cognitiveservices-speech-sdk");

const { getConfig } = require("./config");
const { success, error } = require("./util");

const dotts = (ssml, fileName) => {
  if (!ssml) {
    return;
  }
  const config = getConfig();
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    config.serviceConfig.azure.key,
    config.serviceConfig.azure.region
  );
  const time = new Date().getMilliseconds();
  fileName = path.join(config.dataPath, `${fileName}_${time}.wav`);
  console.log(fileName);
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
    ${ssml}
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
  return success(fileName, "success");
};

module.exports = { dotts };
