const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { success, error } = require("../utils/result");

/**
 * 使用SoVITS合成语音并保存为文件
 * @param {string} text 文本内容
 * @param {string} fileName 输出文件路径
 * @param {Object} settings 合成设置
 * @param {Object} config SoVITS配置
 * @returns {Promise} 返回包含文件路径的Promise
 */
const synthesize = async (text, fileName, settings, config) => {
  if (!text) {
    return Promise.reject(error("文本内容为空"));
  }

  try {
    if (!config || !config.sovits_host) {
      return Promise.reject(error("SoVITS配置不完整"));
    }

    console.log(`[SoVITS] 正在合成文本到 ${fileName}`);
    
    // 准备请求参数
    const params = buildParams(text, settings);
    
    // 确保输出目录存在
    const outputDir = path.dirname(fileName);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 请求SoVITS API
    const response = await axios.get(config.sovits_host, {
      params: params,
      responseType: "arraybuffer",
      timeout: 15000,
    });

    if (response.status === 200 && response.data) {
      // 将音频数据写入文件
      await fs.promises.writeFile(fileName, response.data);
      console.log(`[SoVITS] 音频已保存到: ${fileName}`);
      return success({ filePath: fileName }, "success");
    } else {
      return error("SoVITS API返回错误: " + (response.statusText || "未知错误"));
    }
  } catch (err) {
    console.error("[SoVITS] 合成失败:", err);
    return error(err.message || "SoVITS语音合成失败");
  }
};

/**
 * 使用SoVITS直接播放语音
 * @param {string} text 文本内容
 * @param {Object} settings 合成设置
 * @param {Object} config SoVITS配置
 * @returns {Promise} 返回包含音频数据的Promise
 */
const play = async (text, settings, config) => {
  if (!text) {
    return Promise.reject(error("文本内容为空"));
  }

  try {
    if (!config || !config.sovits_host) {
      return Promise.reject(error("SoVITS配置不完整"));
    }

    // 准备请求参数
    const params = buildParams(text, settings);

    // 请求SoVITS API
    const response = await axios.get(config.sovits_host, {
      params: params,
      responseType: "arraybuffer",
      timeout: 15000,
    });

    if (response.status === 200 && response.data) {
      // 返回音频数据
      return success({ audioData: response.data }, "success");
    } else {
      return error("SoVITS API请求失败: " + (response.statusText || "未知错误"));
    }
  } catch (err) {
    console.error("[SoVITS] 播放失败:", err);
    return error(err.message || "SoVITS播放语音失败");
  }
};

/**
 * 构建SoVITS API请求参数
 * @param {string} text 文本内容
 * @param {Object} settings 合成设置
 * @returns {Object} 参数对象
 */
const buildParams = (text, settings = {}) => {
  const params = {
    text: text,
    text_language: settings.language || "auto",
    speaker: settings.model || "",  // speaker ID
    sdp_ratio: 0.2,
    noise: 0.2,
    noise_w: 0.9,
    length: 1.0,
    speed: settings.speed || 1.0,
  };

  // 添加可选参数
  if (settings.topK) params.top_k = settings.topK;
  if (settings.topP) params.top_p = settings.topP;
  if (settings.temperature) params.temperature = settings.temperature;
  if (settings.emotion) params.emotion = settings.emotion;

  // 清理undefined或空字符串参数
  Object.keys(params).forEach(
    (key) => (params[key] === undefined || params[key] === "") && delete params[key]
  );

  return params;
};

module.exports = {
  synthesize,
  play,
  buildParams,
}; 