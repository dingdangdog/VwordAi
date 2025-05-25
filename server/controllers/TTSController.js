/**
 * TTS控制器
 * 只负责TTS配置管理和连接测试，不涉及具体业务逻辑
 */
const { ipcMain } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const { success, error } = require("../utils/result");
const Settings = require("../models/Settings");
const os = require("os");

/**
 * 初始化TTS控制器
 */
function init() {
  // 注册TTS配置和测试相关的IPC处理器
  registerTTSConfigHandlers();
  registerTTSTestHandlers();

  console.log("TTS controller initialized - configuration and testing only");
}

/**
 * 注册TTS配置相关的IPC处理器
 */
function registerTTSConfigHandlers() {
  // 获取TTS配置
  ipcMain.handle("tts:get-config", async () => {
    try {
      const ttsSettings = Settings.getTTSSettings();
      return success(ttsSettings);
    } catch (err) {
      console.error("获取TTS配置失败:", err);
      return error(err.message);
    }
  });

  // 更新TTS配置
  ipcMain.handle("tts:update-config", async (event, configData) => {
    try {
      Settings.saveTTSSettings(configData);
      return success(Settings.getTTSSettings());
    } catch (err) {
      console.error("更新TTS配置失败:", err);
      return error(err.message);
    }
  });

  // 获取TTS提供商配置
  ipcMain.handle("tts:get-provider-config", async (event, provider) => {
    try {
      const ttsSettings = Settings.getTTSSettings();
      return success({
        provider,
        config: ttsSettings[provider] || {},
      });
    } catch (err) {
      console.error("获取TTS提供商配置失败:", err);
      return error(err.message);
    }
  });

  // 更新TTS提供商配置
  ipcMain.handle("tts:update-provider-config", async (event, provider, providerData) => {
    try {
      const ttsSettings = Settings.getTTSSettings();
      ttsSettings[provider] = {
        ...(ttsSettings[provider] || {}),
        ...providerData,
      };
      Settings.saveTTSSettings(ttsSettings);
      return success({
        provider,
        config: ttsSettings[provider],
      });
    } catch (err) {
      console.error("更新TTS提供商配置失败:", err);
      return error(err.message);
    }
  });
}

/**
 * 注册TTS测试相关的IPC处理器
 */
function registerTTSTestHandlers() {
  // 测试TTS提供商连接
  ipcMain.handle("tts:test-provider-connection", async (event, provider, testData) => {
    try {
      console.log(`[TTSController] 测试TTS提供商连接: ${provider}`);

      // 获取TTS设置
      const ttsSettings = Settings.getTTSSettings();
      const providerConfig = ttsSettings[provider];

      if (!providerConfig) {
        return error(`TTS提供商 ${provider} 未配置`);
      }

      // 调用对应的TTS客户端进行测试
      const result = await testTTSProvider(provider, testData, providerConfig);

      if (result.success) {
        // 更新状态
        ttsSettings[provider].status = "success";
        Settings.saveTTSSettings(ttsSettings);
        return success({
          status: 'success',
          message: result.message || `${provider} 连接测试成功`
        });
      } else {
        ttsSettings[provider].status = "failure";
        Settings.saveTTSSettings(ttsSettings);
        return error(result.message || `${provider} 连接测试失败`);
      }
    } catch (err) {
      console.error("测试TTS提供商连接失败:", err);
      return error(err.message);
    }
  });
}

/**
 * 测试TTS提供商连接
 * @param {string} provider 提供商名称
 * @param {object} testData 测试数据
 * @param {object} providerConfig 提供商配置
 * @returns {Promise<object>} 测试结果
 */
async function testTTSProvider(provider, testData, providerConfig) {
  try {
    const testText = testData.text || "这是一个语音合成测试，如果您能听到这段话，说明配置正确。";

    // 创建临时文件路径
    const tempFilePath = path.join(
      os.tmpdir(),
      `${provider}_test_${Date.now()}.wav`
    );

    let ttsClient;

    // 根据提供商类型加载对应的客户端
    switch (provider) {
      case 'azure':
        ttsClient = require("../tts/azure");
        break;
      case 'aliyun':
      case 'alibaba':
        ttsClient = require("../tts/aliyun");
        break;
      case 'sovits':
        ttsClient = require("../tts/sovits");
        break;
      case 'local':
        ttsClient = require("../tts/local");
        break;
      case 'tencent':
        ttsClient = require("../tts/tencent");
        break;
      case 'baidu':
        ttsClient = require("../tts/baidu");
        break;
      default:
        return {
          success: false,
          message: `不支持的TTS提供商: ${provider}`
        };
    }

    // 准备测试设置
    const settings = {
      voice: testData.voice || providerConfig.voice || "default",
      speed: testData.speed || providerConfig.speed || 1.0,
      pitch: testData.pitch || providerConfig.pitch || 0,
      volume: testData.volume || providerConfig.volume || 50,
      ...testData.settings
    };

    // 执行测试
    const result = await ttsClient.synthesize(
      testText,
      tempFilePath,
      settings,
      providerConfig
    );

    // 清理临时文件
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    if (result.success) {
      return {
        success: true,
        message: `${provider} 语音服务连接成功`
      };
    } else {
      return {
        success: false,
        message: result.message || `${provider} 语音服务连接失败`
      };
    }
  } catch (error) {
    console.error(`测试${provider}语音服务连接失败:`, error);
    return {
      success: false,
      message: error.message || `${provider} 语音服务连接失败`
    };
  }
}

module.exports = {
  init,
};
