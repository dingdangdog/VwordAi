const fs = require("fs");
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const path = require("path");
const { success, error } = require("../utils/result");

/**
 * Synthesize text to speech and save to file
 * @param {string} text The text to synthesize
 * @param {string} fileName The output file path
 * @param {Object} settings Synthesis settings
 * @param {Object} config Provider configuration
 * @returns {Promise} Returns a Promise containing the file path
 */
const synthesize = (text, fileName, settings, config) => {
  if (!text) {
    return Promise.reject(error("Text content is empty"));
  }

  if (!settings || !settings.voice) {
    return Promise.reject(error("Speech voice is not specified"));
  }
  try {
    if (!config || !config.key || !config.region) {
      return Promise.reject(error("Azure configuration is incomplete"));
    }

    console.log(
      `[Azure] Synthesizing text (${text.length} chars) to ${fileName}`
    );
    console.log(`[Azure] Using voice: ${settings.voice}`);

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      config.key,
      config.region
    );

    // Set speech model - Map settings.voice to speechSynthesisVoiceName
    // This is critical - the voice ID must be used as the model name
    speechConfig.speechSynthesisVoiceName = settings.voice;
    console.log(`[Azure] Set voice model to: ${settings.voice}`);

    // Set speech rate and emotion if available
    if (settings.speed) {
      // Convert to string with percent format
      const speedValue = settings.speed.toString();
      speechConfig.speechSynthesisRate = speedValue;
      // speechConfig.setProperty("SpeechServiceConnection_SynthesisRate",
      //   speedValue
      // );
      console.log(`[Azure] Set speech rate to: ${speedValue}`);
    }

    if (settings.emotion) {
      speechConfig.speechSynthesisEmotionStyle = settings.emotion;
      // speechConfig.setProperty(
      //   "SpeechServiceConnection_SynthesisEmotionStyle",
      //   settings.emotion
      // );
      console.log(`[Azure] Set emotion to: ${settings.emotion}`);
    }

    // Specify audio output format as .wav (16khz, 16bit, mono PCM)
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

    // Ensure output directory exists
    const outputDir = path.dirname(fileName);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(fileName);
    const speechSynthesizer = new sdk.SpeechSynthesizer(
      speechConfig,
      audioConfig
    );
    // 返回一个 Promise，用于处理异步操作
    return new Promise((resolve, reject) => {
      // 使用 speakTextAsync 播放语音
      speechSynthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            // 将 ArrayBuffer 转换为 Buffer
            const audioData = Buffer.from(result.audioData);

            // 成功时，返回音频数据
            resolve(success({ filePath: fileName, audioData }, "success"));
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
  } catch (err) {
    console.error("[Azure] synthesis setup error:", err);
    return Promise.reject(
      error(err.message || "Speech synthesis initialization failed")
    );
  }
};

/**
 * Synthesize text to speech using SSML and save to file
 * @param {string} ssml SSML formatted text
 * @param {string} fileName The output file path
 * @param {Object} settings Synthesis settings
 * @param {Object} config Provider configuration
 * @returns {Promise} Returns a Promise containing the file path
 */
const synthesizeSSML = (ssml, fileName, settings, config) => {
  if (!ssml) {
    return Promise.reject(error("SSML content is empty"));
  }

  if (!settings || !settings.voice) {
    return Promise.reject(error("Speech voice is not specified"));
  }

  try {
    if (!config || !config.key || !config.region) {
      return Promise.reject(error("Azure configuration is incomplete"));
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      config.key,
      config.region
    );

    // Specify audio output format as .wav
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

    // Ensure output directory exists
    if (!fs.existsSync(path.dirname(fileName))) {
      fs.mkdirSync(path.dirname(fileName), { recursive: true });
    }

    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(fileName);
    const speechSynthesizer = new sdk.SpeechSynthesizer(
      speechConfig,
      audioConfig
    );

    return new Promise((resolve, reject) => {
      // Wrap text in a complete SSML structure
      const fullSSML = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" 
        xmlns:mstts="https://www.w3.org/2001/mstts" 
        xmlns:emo="http://www.w3.org/2009/10/emotionml" 
        xml:lang="zh-CN"> 
        <voice name="${settings.voice}" rate="${settings.speed || "1.0"}">
        ${ssml}
        </voice>
        </speak>`;

      speechSynthesizer.speakSsmlAsync(
        fullSSML,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve(success({ filePath: fileName }, "success"));
          } else {
            console.error(
              "SSML Synthesis failed. Reason:",
              result.errorDetails
            );
            reject(error(result.errorDetails));
          }
          speechSynthesizer.close();
        },
        (err) => {
          console.error("Error in SSML synthesis:", err);
          reject(
            error(
              err.message || "An error occurred during SSML speech synthesis"
            )
          );
          speechSynthesizer.close();
        }
      );
    });
  } catch (err) {
    console.error("Azure SSML synthesis setup error:", err);
    return Promise.reject(
      error(err.message || "SSML speech synthesis initialization failed")
    );
  }
};

/**
 * SSML template containing various Azure-specific speech control features
 * Can be used to build more complex SSML structures
 */
const TEMPLATE_TEXT =
  '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" ' +
  'xmlns:mstts="https://www.w3.org/2001/mstts" ' +
  'xmlns:emo="http://www.w3.org/2009/10/emotionml" ' +
  'xml:lang="zh-CN">' +
  '<voice name="{voice_model}" rate="{voice_speed}">' +
  '<mstts:silence type="Leading" value="1000ms"/>' + // Additional silence at the beginning of the text
  '<mstts:silence type="Tailing" value="1000ms"/>' + // Silence at the end of the text
  '<mstts:silence type="Sentenceboundary" value="1000ms"/>' + // Add 1000 ms silence between two sentences
  '<mstts:silence type="Comma" value="300ms"/>' + // Add 300 ms silence at commas
  '<mstts:silence type="Semicolon" value="500ms"/>' + // Add 500 ms silence at semicolons
  '<mstts:silence type="Enumerationcomma" value="300ms"/>' + // Add 300 ms silence at enumeration commas
  '<mstts:express-as style="{emotion}" styledegree="{emotion_degree}">' + // Emotion, style
  "{voice_text}" +
  "</mstts:express-as>" +
  "</voice>" +
  "</speak>";

/**
 * Build SSML with advanced settings
 * @param {string} text The text to synthesize
 * @param {Object} settings Contains model, speed, emotion, etc.
 * @returns {string} Complete SSML string
 */
const buildSSML = (text, settings) => {
  if (!text || !settings || !settings.model) {
    throw new Error("Building SSML requires text and speech model");
  }

  let ssml = TEMPLATE_TEXT;
  ssml = ssml.replace("{voice_model}", settings.model);
  ssml = ssml.replace("{voice_speed}", settings.speed || "1.0");
  ssml = ssml.replace("{emotion}", settings.emotion || "general");
  ssml = ssml.replace("{emotion_degree}", settings.emotionDegree || "1");
  ssml = ssml.replace("{voice_text}", text);

  return ssml;
};

/**
 * Play speech directly (without saving file, returns audio data)
 * @param {string} text The text to synthesize
 * @param {Object} settings Speech settings
 * @param {Object} config Provider configuration
 * @returns {Promise} Returns a Promise containing audio data
 */
const play = (text, settings, config) => {
  if (!text) {
    return Promise.reject(error("Text content is empty"));
  }

  if (!settings || !settings.voice) {
    return Promise.reject(error("Speech voice is not specified"));
  }

  try {
    if (!config || !config.key || !config.region) {
      return Promise.reject(error("Azure configuration is incomplete"));
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      config.key,
      config.region
    );

    // Set speech model
    speechConfig.speechSynthesisVoiceName = settings.voice;

    // Specify audio output format as .wav
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

    const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);

    // Return a Promise to handle asynchronous operation
    return new Promise((resolve, reject) => {
      // Use speakTextAsync to synthesize speech
      speechSynthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            // Convert ArrayBuffer to Buffer
            const audioData = Buffer.from(result.audioData);
            // On success, return audio data
            resolve(success({ audioData }, "success"));
          } else {
            console.error(
              "Play synthesis failed. Reason:",
              result.errorDetails
            );
            reject(error(result.errorDetails));
          }
          speechSynthesizer.close();
        },
        (err) => {
          console.error("Error in play synthesis:", err);
          reject(
            error(err.message || "An error occurred during play synthesis")
          );
          speechSynthesizer.close();
        }
      );
    });
  } catch (err) {
    console.error("Azure play synthesis setup error:", err);
    return Promise.reject(
      error(err.message || "Play synthesis initialization failed")
    );
  }
};

/**
 * Play speech directly using SSML (without saving file, returns audio data)
 * @param {string} ssml SSML formatted text
 * @param {Object} settings Speech settings
 * @param {Object} config Provider configuration
 * @returns {Promise} Returns a Promise containing audio data
 */
const playSSML = (ssml, settings, config) => {
  if (!ssml) {
    return Promise.reject(error("SSML content is empty"));
  }

  if (!settings || !settings.voice) {
    return Promise.reject(error("Speech voice is not specified"));
  }

  try {
    if (!config || !config.key || !config.region) {
      return Promise.reject(error("Azure configuration is incomplete"));
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      config.key,
      config.region
    );

    // Specify audio output format as .wav
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

    const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);

    // Return a Promise to handle asynchronous operation
    return new Promise((resolve, reject) => {
      // Add complete SSML tags
      const fullSSML = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" 
      xmlns:mstts="https://www.w3.org/2001/mstts" 
      xmlns:emo="http://www.w3.org/2009/10/emotionml"
      xml:lang="zh-CN"> 
      <voice name="${settings.voice}" rate="${settings.speed || "1.0"}">
      ${ssml}
      </voice>
      </speak>`;

      speechSynthesizer.speakSsmlAsync(
        fullSSML,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            // Convert ArrayBuffer to Buffer
            const audioData = Buffer.from(result.audioData);
            // On success, return audio data
            resolve(success({ audioData }, "success"));
          } else {
            console.error(
              "SSML Play synthesis failed. Reason:",
              result.errorDetails
            );
            reject(error(result.errorDetails));
          }
          speechSynthesizer.close();
        },
        (err) => {
          console.error("Error in SSML play synthesis:", err);
          reject(
            error(err.message || "An error occurred during SSML play synthesis")
          );
          speechSynthesizer.close();
        }
      );
    });
  } catch (err) {
    console.error("Azure SSML play synthesis setup error:", err);
    return Promise.reject(
      error(err.message || "SSML play synthesis initialization failed")
    );
  }
};

// Export module functions
module.exports = {
  synthesize,
  synthesizeSSML,
  buildSSML,
  play,
  playSSML,
};
