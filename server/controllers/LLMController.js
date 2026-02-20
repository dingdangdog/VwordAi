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
      console.error("[LLMController] Failed to get LLM config:", err);
      return error('Failed to get LLM config: ' + err.message);
    }
  });

  // 更新LLM配置
  ipcMain.handle("llm:update-config", async (_, configData) => {
    try {
      Settings.saveLLMConfig(configData);
      return success(Settings.getLLMSettings());
    } catch (err) {
      console.error("[LLMController] Failed to update LLM config:", err);
      return error('Failed to update LLM config: ' + err.message);
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
      console.error("[LLMController] Failed to get LLM provider config:", err);
      return error('Failed to get LLM provider config: ' + err.message);
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
      console.error("[LLMController] Failed to update LLM provider config:", err);
      return error('Failed to update LLM provider config: ' + err.message);
    }
  });
}

/**
 * 注册LLM测试相关的IPC处理器
 */
function registerLLMTestHandlers() {
  // 测试LLM提供商连接（provider 为 providerId）
  ipcMain.handle('llm:test-provider-connection', async (_, provider, testData) => {
    try {
      log.info(`[LLMController] Test LLM provider connection: ${provider}`);

      const llmSettings = Settings.getLLMSettings();
      const providers = llmSettings.providers || {};
      const providerConfig = providers[provider];

      if (!providerConfig) {
        return error(`LLM provider ${provider} not configured`);
      }

      // 调用对应的LLM客户端进行测试
      const result = await testLLMProvider(provider, testData, providerConfig);

      if (result.success) {
        if (providers[provider]) {
          providers[provider].status = "success";
          Settings.saveLLMConfig(llmSettings);
        }
        return success({
          status: 'success',
          message: result.message || `${provider} connection test OK`
        });
      } else {
        if (providers[provider]) {
          providers[provider].status = "failure";
          Settings.saveLLMConfig(llmSettings);
        }
        return error(result.message || `${provider} connection test failed`);
      }
    } catch (err) {
      log.error(`[LLMController] Test LLM provider connection failed: ${err.message}`, err);
      return error('Test LLM provider connection failed: ' + err.message);
    }
  });
}

/**
 * 测试LLM提供商连接
 * @param {string} providerId 提供商ID
 * @param {object} testData 测试数据
 * @param {object} providerConfig 提供商配置（含 protocol）
 * @returns {Promise<object>} 测试结果
 */
async function testLLMProvider(providerId, testData, providerConfig) {
  try {
    const testText = testData.text || "LLM connection test, please reply OK.";
    let protocol = providerConfig.protocol || providerId;
    // 兜底：providerId 形如 "openai-xxx" 时视为 openai 协议（兼容未存 protocol 的旧配置）
    if (providerId.startsWith("openai-") && !["openai", "azure", "gemini", "claude", "aliyun", "volcengine"].includes(protocol)) {
      protocol = "openai";
    }

    log.info(`[LLMController] Test connection providerId=${providerId} protocol=${protocol} hasProtocol=${!!providerConfig.protocol}`);

    let llmClient;

    switch (protocol) {
      case 'openai':
      case 'azure':
      case 'gemini':
      case 'claude':
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
        log.warn(`[LLMController] Unsupported protocol: ${protocol}`);
        return {
          success: false,
          message: `Unsupported protocol: ${protocol}`
        };
    }

    const useTestConnection = typeof llmClient.testConnection === 'function';
    log.info(`[LLMController] Using testConnection=${useTestConnection}`);

    if (useTestConnection) {
      const ok = await llmClient.testConnection(testText);
      log.info(`[LLMController] testConnection result ok=${ok}`);
      if (!ok) {
        log.warn(`[LLMController] Test failed: ${providerId} no valid reply; see [OpenAIClient] raw content above`);
      }
      return ok
        ? { success: true, message: `${providerId} LLM connection OK` }
        : { success: false, message: `${providerId} no valid reply` };
    }

    const result = await llmClient.analyzeText(testText);
    const valid = result != null && (Array.isArray(result) ? result.length > 0 : true);
    log.info(`[LLMController] analyzeText result valid=${valid} resultType=${typeof result} isArray=${Array.isArray(result)} len=${Array.isArray(result) ? result.length : 'n/a'}`);
    if (!valid && result != null) {
      log.warn(`[LLMController] analyzeText response:`, JSON.stringify(result).slice(0, 500));
    }
    if (valid) {
      return { success: true, message: `${providerId} LLM connection OK` };
    }
    return { success: false, message: `${providerId} LLM response invalid` };
  } catch (error) {
    log.error(`[LLMController] Test ${providerId} LLM connection failed:`, error);
    return {
      success: false,
      message: error.message || `${providerId} LLM connection failed`
    };
  }
}

module.exports = {
  init
};
