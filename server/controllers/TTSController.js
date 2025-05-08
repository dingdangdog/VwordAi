/**
 * 语音合成控制器
 * 处理所有与语音合成相关的IPC通信
 */
const { ipcMain } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const { success, error } = require("../utils/result");
const TTSService = require("../services/TTSService");
const os = require("os");

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

  // 注意：Azure TTS测试功能已移至 SettingsController.js
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

  // 注册Aliyun TTS测试处理程序
  registerAliyunTTSTestHandler();
}

/**
 * 注册Aliyun TTS测试处理程序
 */
function registerAliyunTTSTestHandler() {
  // 测试阿里云语音服务连接
  ipcMain.handle("settings:test-aliyun-connection", async (event, config) => {
    try {
      if (!config || !config.appkey || !config.token) {
        return { success: false, message: "阿里云配置不完整，请检查配置信息" };
      }

      // 加载阿里云语音模块
      const aliyunProvider = require("../provider/aliyun");

      // 创建临时文件路径
      const tempFilePath = path.join(
        os.tmpdir(),
        `aliyun_test_${Date.now()}.wav`
      );

      // 合成测试语音
      const settings = {
        voice: "xiaoyun", // 默认使用小云声音
        volume: 50,
        speed: 0,
        pitch: 0,
      };

      // 测试文本
      const testText =
        "这是一个阿里云语音合成测试，如果您能听到这段话，说明配置正确。";

      const result = await aliyunProvider.synthesize(
        testText,
        tempFilePath,
        settings,
        config
      );

      if (!result.success) {
        return {
          success: false,
          message: result.message || "阿里云语音合成测试失败",
        };
      }

      // 读取生成的音频文件，以便在前端播放
      if (fs.existsSync(tempFilePath)) {
        const audioData = fs.readFileSync(tempFilePath);

        // 完成后清理临时文件
        try {
          fs.unlinkSync(tempFilePath);
        } catch (err) {
          console.log("删除测试音频文件失败", err);
        }

        return {
          success: true,
          message: "阿里云语音合成测试成功",
          data: {
            audioData,
          },
        };
      } else {
        return {
          success: false,
          message: "阿里云测试音频文件未生成",
        };
      }
    } catch (err) {
      console.error("阿里云语音服务测试失败:", err);
      return {
        success: false,
        message: `阿里云语音服务测试失败: ${err.message}`,
      };
    }
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
