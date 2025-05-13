const say = require("say");
const fs = require("fs");
const path = require("path");
const { success, error } = require("../utils/result");

/**
 * 使用本地TTS引擎播放文本
 * @param {string} text 要播放的文本
 * @param {Object} settings 播放设置
 * @returns {Promise} 操作结果
 */
const play = (text, settings = {}) => {
  if (!text) {
    return Promise.reject(error("文本内容为空"));
  }

  return new Promise(async (resolve, reject) => {
    try {
      // Windows可能对中文字符有编码问题，确保正确编码
      const isWindows = process.platform === "win32";
      if (isWindows) {
        console.log(`[LocalTTS] Using Windows-specific handling for TTS`);
      }

      // 使用say.js播放文本，不指定声音名称，使用系统默认声音
      const speed = settings.speed || 1.0;

      say.speak(text, null, speed, (err) => {
        if (err) {
          console.error("[LocalTTS] Playback error:", err);
          reject(error(err.message || "本地TTS播放失败"));
        } else {
          console.log("[LocalTTS] Playback completed");
          resolve(success({}, "本地TTS播放成功"));
        }
      });
    } catch (err) {
      console.error("[LocalTTS] Setup error:", err);
      reject(error(err.message || "本地TTS初始化失败"));
    }
  });
};

/**
 * 使用本地TTS引擎将文本合成为音频文件
 * @param {string} text 要合成的文本
 * @param {string} fileName 输出文件路径
 * @param {Object} settings 合成设置
 * @returns {Promise} 操作结果
 */
const synthesize = (text, fileName, settings = {}) => {
  if (!text) {
    return Promise.reject(error("文本内容为空"));
  }

  if (!fileName) {
    return Promise.reject(error("输出文件路径未指定"));
  }

  return new Promise(async (resolve, reject) => {
    try {
      // 确保输出目录存在
      const outputDir = path.dirname(fileName);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 使用say.js将文本导出为音频文件，使用系统默认声音
      const speed = settings.speed || 1.0;

      say.export(text, null, speed, fileName, (err) => {
        if (err) {
          console.error("[LocalTTS] Export error:", err);
          reject(error(err.message || "本地TTS导出失败"));
        } else {
          console.log(`[LocalTTS] Export completed to: ${fileName}`);
          resolve(success({ filePath: fileName }, "本地TTS导出成功"));
        }
      });
    } catch (err) {
      console.error("[LocalTTS] Export setup error:", err);
      reject(error(err.message || "本地TTS导出初始化失败"));
    }
  });
};

module.exports = {
  play,
  synthesize,
};
