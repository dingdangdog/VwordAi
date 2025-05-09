/**
 * BiliLive Controller
 * 处理与B站直播相关的请求
 */
const BiliLiveService = require("../services/BiliLiveService");
const { success, error } = require("../utils/result");

/**
 * 连接到B站直播间
 * @param {number} roomId 房间ID
 */
async function connect(roomId) {
  try {
    return await BiliLiveService.connect(roomId);
  } catch (err) {
    console.error("[BiliLiveController] Connect error:", err);
    return error(err.message);
  }
}

/**
 * 断开与B站直播间的连接
 */
async function disconnect() {
  try {
    BiliLiveService.closeClient();
    return success({ message: "已断开连接" });
  } catch (err) {
    console.error("[BiliLiveController] Disconnect error:", err);
    return error(err.message);
  }
}

/**
 * 获取所有配置
 */
async function getAllConfig() {
  try {
    await BiliLiveService.loadAllConfig();
    const config = await BiliLiveService.getConfig();
    return success(config);
  } catch (err) {
    console.error("[BiliLiveController] Get config error:", err);
    return error("获取配置失败: " + err.message);
  }
}

/**
 * 保存B站配置
 * @param {object} configData 配置数据
 */
async function saveBiliConfig(configData) {
  try {
    return await BiliLiveService.saveBiliveConfig(configData);
  } catch (err) {
    console.error("[BiliLiveController] Save Bili config error:", err);
    return error("保存B站配置失败: " + err.message);
  }
}

/**
 * 保存TTS模式
 * @param {string} mode TTS模式 ('local'|'azure'|'aliyun'|'sovits')
 */
async function saveTTSMode(mode) {
  try {
    return await BiliLiveService.saveTTSMode(mode);
  } catch (err) {
    console.error("[BiliLiveController] Save TTS mode error:", err);
    return error("保存TTS模式失败: " + err.message);
  }
}

/**
 * 保存Azure TTS配置
 * @param {object} configData 配置数据
 */
async function saveAzureConfig(configData) {
  try {
    return await BiliLiveService.saveAzureConfig(configData);
  } catch (err) {
    console.error("[BiliLiveController] Save Azure config error:", err);
    return error("保存Azure TTS配置失败: " + err.message);
  }
}

/**
 * 保存阿里云TTS配置
 * @param {object} configData 配置数据
 */
async function saveAlibabaConfig(configData) {
  try {
    return await BiliLiveService.saveAlibabaConfig(configData);
  } catch (err) {
    console.error("[BiliLiveController] Save Alibaba config error:", err);
    return error("保存阿里云TTS配置失败: " + err.message);
  }
}

/**
 * 保存SoVITS TTS配置
 * @param {object} configData 配置数据
 */
async function saveSovitsConfig(configData) {
  try {
    return await BiliLiveService.saveSovitsConfig(configData);
  } catch (err) {
    console.error("[BiliLiveController] Save SoVITS config error:", err);
    return error("保存SoVITS TTS配置失败: " + err.message);
  }
}

/**
 * 测试TTS（发送测试文本）
 * @param {string} text 测试文本
 */
async function testTTS(text) {
  try {
    if (!text) {
      text = "如果你能听到，说明语音配置成功。";
    }
    BiliLiveService.speechText(text);
    return success({ message: "测试语音已发送" });
  } catch (err) {
    console.error("[BiliLiveController] Test TTS error:", err);
    return error("测试TTS失败: " + err.message);
  }
}

/**
 * 获取可用的系统TTS声音
 */
async function getAvailableVoices() {
  try {
    const voices = await BiliLiveService.getAvailableVoices();
    console.log("[BiliLiveController] Available voices:", voices);
    return success({ voices: voices });
  } catch (err) {
    console.error("[BiliLiveController] Get available voices error:", err);
    return error("获取可用声音失败: " + err.message);
  }
}

/**
 * 保存本地TTS配置
 * @param {string} voice 声音名称
 */
async function saveLocalConfig(voice) {
  try {
    return await BiliLiveService.saveLocalConfig(voice);
  } catch (err) {
    console.error("[BiliLiveController] Save local TTS config error:", err);
    return error("保存本地TTS配置失败: " + err.message);
  }
}

module.exports = {
  connect,
  disconnect,
  getAllConfig,
  saveBiliConfig,
  saveTTSMode,
  saveAzureConfig,
  saveAlibabaConfig,
  saveSovitsConfig,
  testTTS,
  getAvailableVoices,
  saveLocalConfig,
};
