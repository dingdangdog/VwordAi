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

  // 注册TTS合成相关的IPC处理器
  registerTTSSynthesisHandlers();

  // 注册服务商配置相关的IPC处理器
  registerServiceProviderHandlers();

  console.log("TTS controller initialized - configuration, testing, synthesis and service providers");
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
 * 注册TTS合成相关的IPC处理器
 */
function registerTTSSynthesisHandlers() {
  // 合成单个章节语音
  ipcMain.handle("tts:synthesize", async (_, chapterId) => {
    try {
      console.log(`[TTSController] 合成章节语音: ${chapterId}`);

      // 调用TTS服务进行章节合成
      const TTSService = require('../services/TTSService');
      const result = await TTSService.synthesizeChapter(chapterId);

      return result;
    } catch (err) {
      console.error(`[TTSController] 合成章节语音失败: ${err.message}`, err);
      return error(err.message);
    }
  });

  // 批量合成多个章节语音
  ipcMain.handle("tts:synthesize-multiple", async (_, chapterIds) => {
    try {
      console.log(`[TTSController] 批量合成章节语音: ${chapterIds.length}个`);

      const TTSService = require('../services/TTSService');
      const result = await TTSService.synthesizeMultipleChapters(chapterIds);

      return result;
    } catch (err) {
      console.error(`[TTSController] 批量合成章节语音失败: ${err.message}`, err);
      return error(err.message);
    }
  });
}

/**
 * 注册TTS测试相关的IPC处理器
 */
function registerTTSTestHandlers() {
  // 测试TTS提供商连接 - 主要接口
  ipcMain.handle("tts:test-provider-connection", async (event, provider, testData) => {
    try {
      console.log(`[TTSController] Testing TTS provider connection: ${provider}`);
      console.log(`[TTSController] Test data:`, testData);

      // 获取TTS设置
      const ttsSettings = Settings.getTTSSettings();
      let providerConfig = ttsSettings[provider];

      // 如果传入了测试数据，先临时更新配置用于测试
      if (testData && typeof testData === 'object') {
        providerConfig = { ...providerConfig, ...testData };
        console.log(`[TTSController] Using test config:`, providerConfig);
      }

      if (!providerConfig) {
        console.error(`[TTSController] TTS provider ${provider} not configured`);
        return error(`TTS提供商 ${provider} 未配置`);
      }

      // 调用对应的TTS客户端进行测试
      const result = await testTTSProvider(provider, testData || {}, providerConfig);

      if (result.success) {
        // 更新状态到数据库
        const updatedSettings = Settings.getTTSSettings();
        if (!updatedSettings[provider]) {
          updatedSettings[provider] = {};
        }
        updatedSettings[provider].status = "success";

        // 如果测试数据包含配置更新，也保存配置
        if (testData && typeof testData === 'object') {
          Object.assign(updatedSettings[provider], testData);
        }

        Settings.saveTTSSettings(updatedSettings);
        console.log(`[TTSController] TTS provider ${provider} test successful, status updated`);

        return success({
          status: 'success',
          message: result.message || `${provider} 连接测试成功`,
          audioData: result.audioData // 传递音频数据用于前端播放
        });
      } else {
        // 更新失败状态
        const updatedSettings = Settings.getTTSSettings();
        if (!updatedSettings[provider]) {
          updatedSettings[provider] = {};
        }
        updatedSettings[provider].status = "failure";
        Settings.saveTTSSettings(updatedSettings);
        console.error(`[TTSController] TTS provider ${provider} test failed:`, result.message);

        return error(result.message || `${provider} 连接测试失败`);
      }
    } catch (err) {
      console.error(`[TTSController] Error testing TTS provider ${provider}:`, err);

      // 更新失败状态
      try {
        const updatedSettings = Settings.getTTSSettings();
        if (!updatedSettings[provider]) {
          updatedSettings[provider] = {};
        }
        updatedSettings[provider].status = "failure";
        Settings.saveTTSSettings(updatedSettings);
      } catch (saveErr) {
        console.error(`[TTSController] Failed to save failure status:`, saveErr);
      }

      return error(err.message);
    }
  });

  // 注意：test-tts-provider-connection 接口已在 SettingsController 中处理，避免重复注册
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
    console.log(`[TTSController] Testing ${provider} with text: ${testText}`);

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
        console.error(`[TTSController] Unsupported TTS provider: ${provider}`);
        return {
          success: false,
          message: `不支持的TTS提供商: ${provider}`
        };
    }

    // 准备测试设置
    const settings = {
      voice: testData.voice || providerConfig.voice || getDefaultVoice(provider),
      speed: testData.speed || providerConfig.speed || 1.0,
      pitch: testData.pitch || providerConfig.pitch || 0,
      volume: testData.volume || providerConfig.volume || 50,
      emotion: testData.emotion || providerConfig.emotion || "general",
      ...testData.settings
    };

    console.log(`[TTSController] Test settings for ${provider}:`, settings);
    console.log(`[TTSController] Provider config for ${provider}:`, providerConfig);

    // 对于Azure，使用play方法直接获取音频数据，避免文件操作
    if (provider === 'azure' && ttsClient.play) {
      console.log(`[TTSController] Using Azure play method for testing`);
      const result = await ttsClient.play(testText, settings, providerConfig);

      if (result.success) {
        console.log(`[TTSController] Azure test successful, audio data length: ${result.data?.audioData?.length || 0}`);
        return {
          success: true,
          message: `${provider} 语音服务连接成功`,
          audioData: result.data?.audioData // 返回音频数据用于前端播放
        };
      } else {
        console.error(`[TTSController] Azure test failed:`, result.error);
        return {
          success: false,
          message: result.error || `${provider} 语音服务连接失败`
        };
      }
    }

    // 对于其他提供商，使用文件方式测试
    const tempFilePath = path.join(
      os.tmpdir(),
      `${provider}_test_${Date.now()}.wav`
    );

    console.log(`[TTSController] Using file-based testing for ${provider}, temp file: ${tempFilePath}`);

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
      console.log(`[TTSController] Cleaned up temp file: ${tempFilePath}`);
    }

    if (result.success) {
      console.log(`[TTSController] ${provider} test successful`);
      return {
        success: true,
        message: `${provider} 语音服务连接成功`
      };
    } else {
      console.error(`[TTSController] ${provider} test failed:`, result.message);
      return {
        success: false,
        message: result.message || `${provider} 语音服务连接失败`
      };
    }
  } catch (error) {
    console.error(`[TTSController] Error testing ${provider} TTS service:`, error);
    return {
      success: false,
      message: error.message || `${provider} 语音服务连接失败`
    };
  }
}

/**
 * 获取提供商的默认语音
 * @param {string} provider 提供商名称
 * @returns {string} 默认语音
 */
function getDefaultVoice(provider) {
  const defaultVoices = {
    'azure': 'zh-CN-XiaoxiaoNeural',
    'aliyun': 'xiaoyun',
    'alibaba': 'xiaoyun',
    'tencent': 'zh-CN-XiaoxiaoNeural',
    'baidu': 'zh-CN-XiaoxiaoNeural',
    'local': 'default',
    'sovits': 'default'
  };
  return defaultVoices[provider] || 'default';
}

/**
 * 注册服务商配置相关的IPC处理器
 */
function registerServiceProviderHandlers() {
  // 获取所有服务商配置
  ipcMain.handle("service-provider:get-all", async () => {
    try {
      console.log("[TTSController] 获取所有服务商配置");

      // 返回支持的TTS服务商列表
      const providers = [
        { id: 'azure', name: 'Azure TTS', type: 'tts' },
        { id: 'aliyun', name: '阿里云TTS', type: 'tts' },
        { id: 'alibaba', name: '阿里巴巴TTS', type: 'tts' },
        { id: 'tencent', name: '腾讯云TTS', type: 'tts' },
        { id: 'baidu', name: '百度TTS', type: 'tts' },
        { id: 'local', name: '本地TTS', type: 'tts' },
        { id: 'sovits', name: 'SoVITS', type: 'tts' }
      ];

      return success(providers);
    } catch (err) {
      console.error("[TTSController] 获取服务商配置失败:", err);
      return error(err.message);
    }
  });

  // 获取特定服务商配置
  ipcMain.handle("service-provider:get", async (_, id) => {
    try {
      console.log(`[TTSController] 获取服务商配置: ${id}`);

      const ttsSettings = Settings.getTTSSettings();
      const providerConfig = ttsSettings[id];

      if (!providerConfig) {
        return error(`服务商 ${id} 未配置`);
      }

      return success({
        id,
        name: getProviderName(id),
        type: 'tts',
        config: providerConfig
      });
    } catch (err) {
      console.error(`[TTSController] 获取服务商配置失败:`, err);
      return error(err.message);
    }
  });

  // 创建服务商配置
  ipcMain.handle("service-provider:create", async (_, data) => {
    try {
      console.log("[TTSController] 创建服务商配置:", data);

      const ttsSettings = Settings.getTTSSettings();
      ttsSettings[data.id] = data.config;
      Settings.saveTTSSettings(ttsSettings);

      return success({
        id: data.id,
        name: getProviderName(data.id),
        type: 'tts',
        config: data.config
      });
    } catch (err) {
      console.error("[TTSController] 创建服务商配置失败:", err);
      return error(err.message);
    }
  });

  // 更新服务商配置
  ipcMain.handle("service-provider:update", async (_, id, data) => {
    try {
      console.log(`[TTSController] 更新服务商配置: ${id}`, data);

      const ttsSettings = Settings.getTTSSettings();
      ttsSettings[id] = {
        ...(ttsSettings[id] || {}),
        ...data
      };
      Settings.saveTTSSettings(ttsSettings);

      return success({
        id,
        name: getProviderName(id),
        type: 'tts',
        config: ttsSettings[id]
      });
    } catch (err) {
      console.error(`[TTSController] 更新服务商配置失败:`, err);
      return error(err.message);
    }
  });

  // 删除服务商配置
  ipcMain.handle("service-provider:delete", async (_, id) => {
    try {
      console.log(`[TTSController] 删除服务商配置: ${id}`);

      const ttsSettings = Settings.getTTSSettings();
      delete ttsSettings[id];
      Settings.saveTTSSettings(ttsSettings);

      return success(true);
    } catch (err) {
      console.error(`[TTSController] 删除服务商配置失败:`, err);
      return error(err.message);
    }
  });

  // 测试服务商连接
  ipcMain.handle("service-provider:test-connection", async (_, id) => {
    try {
      console.log(`[TTSController] 测试服务商连接: ${id}`);

      // 获取TTS设置
      const ttsSettings = Settings.getTTSSettings();
      const providerConfig = ttsSettings[id];

      if (!providerConfig) {
        return error(`服务商 ${id} 未配置`);
      }

      // 调用内部测试函数
      const result = await testTTSProvider(id, { text: "这是一个测试文本" }, providerConfig);

      if (result.success) {
        // 更新状态
        ttsSettings[id].status = "success";
        Settings.saveTTSSettings(ttsSettings);
        return success({
          status: 'success',
          message: result.message || `${id} 连接测试成功`
        });
      } else {
        ttsSettings[id].status = "failure";
        Settings.saveTTSSettings(ttsSettings);
        return error(result.message || `${id} 连接测试失败`);
      }
    } catch (err) {
      console.error(`[TTSController] 测试服务商连接失败:`, err);
      return error(err.message);
    }
  });
}

/**
 * 获取服务商名称
 */
function getProviderName(id) {
  const names = {
    'azure': 'Azure TTS',
    'aliyun': '阿里云TTS',
    'alibaba': '阿里巴巴TTS',
    'tencent': '腾讯云TTS',
    'baidu': '百度TTS',
    'local': '本地TTS',
    'sovits': 'SoVITS'
  };
  return names[id] || id;
}

module.exports = {
  init,
};
