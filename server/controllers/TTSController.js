/**
 * 语音合成控制器
 * 处理所有与语音合成相关的IPC通信
 */
const { ipcMain } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const { success, error } = require("../utils/result");
const TTSService = require("../services/TTSService");

// 语音模型文件路径
const MODELS_JSON_PATH = path.join(__dirname, "../assets/models.json");

/**
 * 注册所有语音合成相关的IPC事件处理程序
 */
function init() {
  // TTS相关事件处理
  registerTTSHandlers();

  // 模型相关事件处理
  registerModelHandlers();
}

/**
 * 注册语音合成服务相关的IPC事件处理程序
 */
function registerTTSHandlers() {
  // 合成单个章节的语音
  ipcMain.handle("tts:synthesize", async (event, chapterId) => {
    return await TTSService.synthesizeChapter(chapterId);
  });

  // 批量合成多个章节的语音
  ipcMain.handle("tts:synthesize-multiple", async (event, chapterIds) => {
    return await TTSService.synthesizeMultipleChapters(chapterIds);
  });

  // 获取特定服务商支持的声音角色列表
  ipcMain.handle("tts:get-voice-roles", async (event, providerId) => {
    return await TTSService.getVoiceRoles(providerId);
  });

  // 获取特定服务商支持的情感列表
  ipcMain.handle("tts:get-emotions", async (event, providerId) => {
    return await TTSService.getEmotions(providerId);
  });
}

/**
 * 注册语音模型相关的IPC事件处理程序
 */
function registerModelHandlers() {
  // 获取所有语音模型
  ipcMain.handle("get-voice-models", async () => {
    try {
      // 直接从文件读取语音模型数据
      const data = await fs.readFile(MODELS_JSON_PATH, "utf8");
      const models = JSON.parse(data);
      return success(models);
    } catch (err) {
      console.error("读取语音模型文件失败:", err);
      return error(`读取语音模型失败: ${err.message}`);
    }
  });
}

module.exports = {
  init,
};
