const say = require("say");
const fs = require("fs");
const path = require("path");
const { success, error } = require("../utils/result");

/**
 * 获取可用的TTS声音列表
 * @returns {Promise<string[]>} 可用声音名称列表
 */
function getAvailableVoices() {
  return new Promise((resolve) => {
    console.log("[LocalTTS] Getting installed voices...");

    say.getInstalledVoices((err, voices) => {
      if (err) {
        console.error("[LocalTTS] Error getting installed voices:", err);
        // 错误时返回空数组而不是拒绝Promise
        resolve([]);
      } else {
        if (!voices || !Array.isArray(voices)) {
          console.warn("[LocalTTS] No voices returned or invalid format");
          resolve([]);
        } else {
          console.log(`[LocalTTS] Available voices: ${voices.join(", ")}`);
          resolve(voices);
        }
      }
    });
  });
}

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
      // 获取可用声音列表
      const availableVoices = await getAvailableVoices();
      
      // 选择声音
      let selectedVoice = null;
      
      // 检查用户偏好
      if (settings.voice && availableVoices.includes(settings.voice)) {
        selectedVoice = settings.voice;
        console.log(`[LocalTTS] Using user-preferred voice: ${selectedVoice}`);
      }
      // 如果没有偏好或偏好的声音不可用，尝试查找中文声音
      else if (availableVoices.includes("Microsoft Huihui Desktop")) {
        selectedVoice = "Microsoft Huihui Desktop";
        console.log(`[LocalTTS] Using Chinese voice: ${selectedVoice}`);
      }
      // 尝试其他已知的中文声音
      else if (availableVoices.includes("Microsoft Yaoyao Desktop")) {
        selectedVoice = "Microsoft Yaoyao Desktop";
        console.log(`[LocalTTS] Using Chinese voice: ${selectedVoice}`);
      } else if (availableVoices.includes("Microsoft Kangkang Desktop")) {
        selectedVoice = "Microsoft Kangkang Desktop";
        console.log(`[LocalTTS] Using Chinese voice: ${selectedVoice}`);
      }
      // 回退到任何可用声音
      else if (availableVoices.length > 0) {
        selectedVoice = availableVoices[0];
        console.log(`[LocalTTS] Using fallback voice: ${selectedVoice}`);
      }

      // Windows可能对中文字符有编码问题，确保正确编码
      const isWindows = process.platform === "win32";
      if (isWindows) {
        console.log(`[LocalTTS] Using Windows-specific handling for TTS`);
      }

      // 使用say.js播放文本
      const speed = settings.speed || 1.0;
      
      say.speak(text, selectedVoice, speed, (err) => {
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

      // 获取可用声音列表
      const availableVoices = await getAvailableVoices();
      
      // 选择声音（同play方法）
      let selectedVoice = null;
      if (settings.voice && availableVoices.includes(settings.voice)) {
        selectedVoice = settings.voice;
      } else if (availableVoices.includes("Microsoft Huihui Desktop")) {
        selectedVoice = "Microsoft Huihui Desktop";
      } else if (availableVoices.includes("Microsoft Yaoyao Desktop")) {
        selectedVoice = "Microsoft Yaoyao Desktop";
      } else if (availableVoices.includes("Microsoft Kangkang Desktop")) {
        selectedVoice = "Microsoft Kangkang Desktop";
      } else if (availableVoices.length > 0) {
        selectedVoice = availableVoices[0];
      }

      // 使用say.js将文本导出为音频文件
      const speed = settings.speed || 1.0;
      
      say.export(text, selectedVoice, speed, fileName, (err) => {
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
  getAvailableVoices
}; 