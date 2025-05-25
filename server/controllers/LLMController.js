/**
 * LLM控制器
 * 只负责LLM配置管理和连接测试，不涉及具体业务逻辑
 */
const { ipcMain } = require('electron');
const Settings = require('../models/Settings');
const { success, error } = require('../utils/result');
const log = require("electron-log");

/**
 * 初始化LLM控制器
 */
function init() {
  // 注册LLM配置和测试相关的IPC处理器
  registerLLMConfigHandlers();
  registerLLMTestHandlers();

  console.log("LLM controller initialized - configuration and testing only");
}

/**
 * 注册LLM配置相关的IPC处理器
 */
function registerLLMConfigHandlers() {
  // 获取LLM配置
  ipcMain.handle("llm:get-config", async () => {
    try {
      const llmSettings = Settings.getLLMSettings();
      return success(llmSettings);
    } catch (err) {
      console.error("[LLMController] 获取LLM配置失败:", err);
      return error('获取LLM配置失败: ' + err.message);
    }
  });

  // 更新LLM配置
  ipcMain.handle("llm:update-config", async (_, configData) => {
    try {
      Settings.saveLLMConfig(configData);
      return success(Settings.getLLMSettings());
    } catch (err) {
      console.error("[LLMController] 更新LLM配置失败:", err);
      return error('更新LLM配置失败: ' + err.message);
    }
  });

  // 获取LLM提供商配置
  ipcMain.handle("llm:get-provider-config", async (_, provider) => {
    try {
      const llmSettings = Settings.getLLMSettings();
      return success({
        provider,
        config: llmSettings[provider] || {},
      });
    } catch (err) {
      console.error("[LLMController] 获取LLM提供商配置失败:", err);
      return error('获取LLM提供商配置失败: ' + err.message);
    }
  });

  // 更新LLM提供商配置
  ipcMain.handle("llm:update-provider-config", async (_, provider, providerData) => {
    try {
      const llmSettings = Settings.getLLMSettings();
      llmSettings[provider] = {
        ...(llmSettings[provider] || {}),
        ...providerData,
      };
      Settings.saveLLMConfig(llmSettings);
      return success({
        provider,
        config: llmSettings[provider],
      });
    } catch (err) {
      console.error("[LLMController] 更新LLM提供商配置失败:", err);
      return error('更新LLM提供商配置失败: ' + err.message);
    }
  });
}

/**
 * 注册LLM测试相关的IPC处理器
 */
function registerLLMTestHandlers() {
  // 测试LLM提供商连接
  ipcMain.handle('llm:test-provider-connection', async (_, provider, testData) => {
    try {
      log.info(`[LLMController] 测试LLM服务商连接: ${provider}`);

      // 获取LLM设置
      const llmSettings = Settings.getLLMSettings();
      const providerConfig = llmSettings[provider];

      if (!providerConfig) {
        return error(`LLM提供商 ${provider} 未配置`);
      }

      // 调用对应的LLM客户端进行测试
      const result = await testLLMProvider(provider, testData, providerConfig);

      if (result.success) {
        // 更新状态
        llmSettings[provider].status = "success";
        Settings.saveLLMConfig(llmSettings);
        return success({
          status: 'success',
          message: result.message || `${provider} 连接测试成功`
        });
      } else {
        llmSettings[provider].status = "failure";
        Settings.saveLLMConfig(llmSettings);
        return error(result.message || `${provider} 连接测试失败`);
      }
    } catch (err) {
      log.error(`[LLMController] 测试LLM服务商连接失败: ${err.message}`, err);
      return error('测试LLM服务商连接失败: ' + err.message);
    }
  });
}

/**
 * 测试LLM提供商连接
 * @param {string} provider 提供商名称
 * @param {object} testData 测试数据
 * @param {object} providerConfig 提供商配置
 * @returns {Promise<object>} 测试结果
 */
async function testLLMProvider(provider, testData, providerConfig) {
  try {
    const testText = testData.text || "这是一个LLM连接测试，请简单回复确认收到。";

    let llmClient;

    // 根据提供商类型加载对应的客户端
    switch (provider) {
      case 'openai':
        const OpenAIClient = require("../llm/openai");
        llmClient = new OpenAIClient(providerConfig);
        break;
      case 'aliyun':
        const AliyunClient = require("../llm/aliyun");
        llmClient = new AliyunClient(providerConfig);
        break;
      case 'volcengine':
        const VolcengineClient = require("../llm/volcengine");
        llmClient = new VolcengineClient(providerConfig);
        break;
      default:
        return {
          success: false,
          message: `不支持的LLM提供商: ${provider}`
        };
    }

    // 执行简单的测试请求
    const result = await llmClient.analyzeText(testText);

    if (result && result.length > 0) {
      return {
        success: true,
        message: `${provider} LLM服务连接成功`
      };
    } else {
      return {
        success: false,
        message: `${provider} LLM服务返回结果异常`
      };
    }
  } catch (error) {
    log.error(`测试${provider} LLM服务连接失败:`, error);
    return {
      success: false,
      message: error.message || `${provider} LLM服务连接失败`
    };
  }
}

module.exports = {
  init
};
