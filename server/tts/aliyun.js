const fs = require("fs");
const path = require("path");
const Nls = require("alibabacloud-nls");
const { success, error } = require("../utils/result");
const Settings = require("../models/Settings");
// Aliyun SDK modules
// 注意：实际项目中需要安装 @alicloud/pop-core 或 相应的阿里云语音合成SDK
// const Core = require('@alicloud/pop-core');
// 模拟SDK

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
    if (!config || !config.appkey || !config.token) {
      return Promise.reject(error("Aliyun configuration is incomplete"));
    }

    console.log(
      `[Aliyun] Synthesizing text (${text.length} chars) to ${fileName}`
    );
    console.log(`[Aliyun] Using voice: ${settings.voice}`);

    // Ensure output directory exists
    const outputDir = path.dirname(fileName);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create a write stream for the output file
    const writeStream = fs.createWriteStream(fileName);

    // Configure the Aliyun TTS client
    const url = config.endpoint + "/stream/v1/tts";
    const tts = new Nls.SpeechSynthesizer({
      url: url,
      appkey: config.appkey,
      token: config.token,
    });

    // Setup the parameters for synthesis
    const param = tts.defaultStartParams();
    param.text = text;
    param.voice = settings.voice;
    param.format = "wav"; // Force WAV format for compatibility
    param.sample_rate = settings.sampleRate || 16000;

    // Set optional parameters if provided
    if (settings.volume !== undefined) param.volume = settings.volume;
    if (settings.speed !== undefined) param.speech_rate = settings.speed;
    if (settings.pitch !== undefined) param.pitch_rate = settings.pitch;
    if (settings.enableSubtitle !== undefined)
      param.enable_subtitle = settings.enableSubtitle;

    return new Promise((resolve, reject) => {
      // Setup event handlers
      tts.on("meta", (msg) => {
        console.log("[Aliyun] Received metadata:", msg);
      });

      tts.on("data", (data) => {
        console.log(`[Aliyun] Received audio data: ${data.length} bytes`);
        writeStream.write(data, "binary");
      });

      tts.on("completed", (msg) => {
        console.log("[Aliyun] Synthesis completed:", msg);
        writeStream.end();
        resolve(success({ filePath: fileName }, "success"));
      });

      tts.on("closed", () => {
        console.log("[Aliyun] Connection closed");
      });

      tts.on("failed", (msg) => {
        console.error("[Aliyun] Synthesis failed:", msg);
        writeStream.end();
        reject(error(msg || "Aliyun speech synthesis failed"));
      });

      // Start the synthesis process
      console.log(
        "[Aliyun] Starting synthesis with parameters:",
        JSON.stringify(param)
      );
      tts.start(param, true, 6000).catch((err) => {
        console.error("[Aliyun] Error during synthesis:", err);
        writeStream.end();
        reject(error(err.message || "Aliyun speech synthesis failed"));
      });
    });
  } catch (err) {
    console.error("[Aliyun] Synthesis setup error:", err);
    return Promise.reject(
      error(err.message || "Aliyun speech synthesis initialization failed")
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
    if (!config || !config.appkey || !config.token) {
      return Promise.reject(error("Aliyun configuration is incomplete"));
    }

    console.log(
      `[Aliyun] Synthesizing SSML (${ssml.length} chars) to ${fileName}`
    );
    console.log(`[Aliyun] Using voice: ${settings.voice}`);

    // Ensure output directory exists
    const outputDir = path.dirname(fileName);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create a write stream for the output file
    const writeStream = fs.createWriteStream(fileName);

    // Configure the Aliyun TTS client
    const url =
      config.endpoint || "wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1";
    const tts = new Nls.SpeechSynthesizer({
      url: url,
      appkey: config.appkey,
      token: config.token,
    });

    // Setup the parameters for synthesis
    const param = tts.defaultStartParams();
    param.text = ssml; // Pass SSML directly as text (Aliyun supports SSML within the text parameter)
    param.voice = settings.voice;
    param.format = "wav";
    param.sample_rate = settings.sampleRate || 16000;

    // Set optional parameters if provided
    if (settings.volume !== undefined) param.volume = settings.volume;
    if (settings.speed !== undefined) param.speech_rate = settings.speed;
    if (settings.pitch !== undefined) param.pitch_rate = settings.pitch;
    if (settings.enableSubtitle !== undefined)
      param.enable_subtitle = settings.enableSubtitle;

    return new Promise((resolve, reject) => {
      // Setup event handlers
      tts.on("meta", (msg) => {
        console.log("[Aliyun] Received metadata:", msg);
      });

      tts.on("data", (data) => {
        console.log(`[Aliyun] Received audio data: ${data.length} bytes`);
        writeStream.write(data, "binary");
      });

      tts.on("completed", (msg) => {
        console.log("[Aliyun] SSML synthesis completed:", msg);
        writeStream.end();
        resolve(success({ filePath: fileName }, "success"));
      });

      tts.on("closed", () => {
        console.log("[Aliyun] Connection closed");
      });

      tts.on("failed", (msg) => {
        console.error("[Aliyun] SSML synthesis failed:", msg);
        writeStream.end();
        reject(error(msg || "Aliyun SSML synthesis failed"));
      });

      // Start the synthesis process
      tts.start(param, true, 6000).catch((err) => {
        console.error("[Aliyun] Error during SSML synthesis:", err);
        writeStream.end();
        reject(error(err.message || "Aliyun SSML synthesis failed"));
      });
    });
  } catch (err) {
    console.error("[Aliyun] SSML synthesis setup error:", err);
    return Promise.reject(
      error(err.message || "Aliyun SSML synthesis initialization failed")
    );
  }
};

/**
 * SSML template for Aliyun TTS
 * See documentation: https://help.aliyun.com/zh/isi/developer-reference/ssml-overview
 */
const TEMPLATE_TEXT =
  "<speak>" +
  '<voice name="{voice_model}">' +
  '<rate value="{voice_speed}"/>' +
  '<volume value="{voice_volume}"/>' +
  '<pitch value="{voice_pitch}"/>' +
  '<emotion category="{emotion}" intensity="{emotion_intensity}">' +
  "{voice_text}" +
  "</emotion>" +
  "</voice>" +
  "</speak>";

/**
 * Build SSML with advanced settings for Aliyun
 * @param {string} text The text to synthesize
 * @param {Object} settings Contains model, speed, emotion, etc.
 * @returns {string} Complete SSML string
 */
const buildSSML = (text, settings) => {
  if (!text || !settings || !settings.voice) {
    throw new Error("Building SSML requires text and voice model");
  }

  let ssml = TEMPLATE_TEXT;
  ssml = ssml.replace("{voice_model}", settings.voice);

  // Convert speech rate value to Aliyun format
  // Aliyun uses -500 to 500, where 0 is normal speed
  const speed = settings.speed !== undefined ? settings.speed : "medium";
  ssml = ssml.replace("{voice_speed}", speed);

  // Volume (0-100)
  const volume = settings.volume !== undefined ? settings.volume : "medium";
  ssml = ssml.replace("{voice_volume}", volume);

  // Pitch (-500 to 500)
  const pitch = settings.pitch !== undefined ? settings.pitch : "medium";
  ssml = ssml.replace("{voice_pitch}", pitch);

  // Emotion (only available for certain voices)
  const emotion = settings.emotion !== undefined ? settings.emotion : "neutral";
  ssml = ssml.replace("{emotion}", emotion);

  const emotionIntensity =
    settings.emotionIntensity !== undefined ? settings.emotionIntensity : "1.0";
  ssml = ssml.replace("{emotion_intensity}", emotionIntensity);

  // Text content
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
    if (!config || !config.appkey || !config.token) {
      return Promise.reject(error("Aliyun configuration is incomplete"));
    }

    console.log(
      `[Aliyun] Synthesizing text (${text.length} chars) for playback`
    );
    console.log(`[Aliyun] Using voice: ${settings.voice}`);

    // Configure the Aliyun TTS client
    const url =
      config.endpoint || "wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1";
    const tts = new Nls.SpeechSynthesizer({
      url: url,
      appkey: config.appkey,
      token: config.token,
    });

    // Setup the parameters for synthesis
    const param = tts.defaultStartParams();
    param.text = text;
    param.voice = settings.voice;
    param.format = "wav";
    param.sample_rate = settings.sampleRate || 16000;

    // Set optional parameters if provided
    if (settings.volume !== undefined) param.volume = settings.volume;
    if (settings.speed !== undefined) param.speech_rate = settings.speed;
    if (settings.pitch !== undefined) param.pitch_rate = settings.pitch;

    return new Promise((resolve, reject) => {
      let audioChunks = [];

      // Setup event handlers
      tts.on("meta", (msg) => {
        console.log("[Aliyun] Received metadata:", msg);
      });

      tts.on("data", (data) => {
        console.log(`[Aliyun] Received audio data: ${data.length} bytes`);
        audioChunks.push(data);
      });

      tts.on("completed", (msg) => {
        console.log("[Aliyun] Playback synthesis completed:", msg);

        // Combine all audio chunks
        const audioData = Buffer.concat(audioChunks);
        resolve(success({ audioData }, "success"));
      });

      tts.on("closed", () => {
        console.log("[Aliyun] Connection closed");
      });

      tts.on("failed", (msg) => {
        console.error("[Aliyun] Playback synthesis failed:", msg);
        reject(error(msg || "Aliyun playback synthesis failed"));
      });

      // Start the synthesis process
      tts.start(param, true, 6000).catch((err) => {
        console.error("[Aliyun] Error during playback synthesis:", err);
        reject(error(err.message || "Aliyun playback synthesis failed"));
      });
    });
  } catch (err) {
    console.error("[Aliyun] Playback synthesis setup error:", err);
    return Promise.reject(
      error(err.message || "Aliyun playback synthesis initialization failed")
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
    if (!config || !config.appkey || !config.token) {
      return Promise.reject(error("Aliyun configuration is incomplete"));
    }

    console.log(
      `[Aliyun] Synthesizing SSML (${ssml.length} chars) for playback`
    );
    console.log(`[Aliyun] Using voice: ${settings.voice}`);

    // Configure the Aliyun TTS client
    const url =
      config.endpoint || "wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1";
    const tts = new Nls.SpeechSynthesizer({
      url: url,
      appkey: config.appkey,
      token: config.token,
    });

    // Setup the parameters for synthesis
    const param = tts.defaultStartParams();
    param.text = ssml; // Aliyun handles SSML within the text parameter
    param.voice = settings.voice;
    param.format = "wav";
    param.sample_rate = settings.sampleRate || 16000;

    // Set optional parameters if provided
    if (settings.volume !== undefined) param.volume = settings.volume;
    if (settings.speed !== undefined) param.speech_rate = settings.speed;
    if (settings.pitch !== undefined) param.pitch_rate = settings.pitch;

    return new Promise((resolve, reject) => {
      let audioChunks = [];

      // Setup event handlers
      tts.on("meta", (msg) => {
        console.log("[Aliyun] Received SSML metadata:", msg);
      });

      tts.on("data", (data) => {
        console.log(`[Aliyun] Received SSML audio data: ${data.length} bytes`);
        audioChunks.push(data);
      });

      tts.on("completed", (msg) => {
        console.log("[Aliyun] SSML playback synthesis completed:", msg);

        // Combine all audio chunks
        const audioData = Buffer.concat(audioChunks);
        resolve(success({ audioData }, "success"));
      });

      tts.on("closed", () => {
        console.log("[Aliyun] Connection closed");
      });

      tts.on("failed", (msg) => {
        console.error("[Aliyun] SSML playback synthesis failed:", msg);
        reject(error(msg || "Aliyun SSML playback synthesis failed"));
      });

      // Start the synthesis process
      tts.start(param, true, 6000).catch((err) => {
        console.error("[Aliyun] Error during SSML playback synthesis:", err);
        reject(error(err.message || "Aliyun SSML playback synthesis failed"));
      });
    });
  } catch (err) {
    console.error("[Aliyun] SSML playback synthesis setup error:", err);
    return Promise.reject(
      error(
        err.message || "Aliyun SSML playback synthesis initialization failed"
      )
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
