/**
 * LLM控制器
 */
const { ipcMain } = require('electron');
const LLMService = require('../services/LLMService');
const Settings = require('../models/Settings');
const log = require("electron-log");

/**
 * 初始化LLM相关的IPC监听器
 */
function initLLMListeners() {
  // 解析章节
  ipcMain.handle('llm:parse-chapter', async (event, chapterId) => {
    try {
      log.info(`[LLMController] 解析章节: ${chapterId}`);
      return await LLMService.parseChapter(chapterId);
    } catch (error) {
      log.error(`[LLMController] 解析章节失败: ${error.message}`, error);
      return { success: false, error: error.message };
    }
  });

  // 测试LLM服务商连接
  ipcMain.handle('llm:test-provider-connection', async (event, type, data) => {
    try {
      log.info(`[LLMController] 测试LLM服务商连接: ${type}`);

      // 获取LLM设置
      const llmSettings = Settings.getLLMSettings();
      const providerConfig = llmSettings[type];

      if (!providerConfig) {
        return {
          success: false,
          error: `LLM提供商 ${type} 未配置`
        };
      }

      // 调用Settings模型的测试方法
      const result = await Settings.testLLMProviderConnection(type, data, providerConfig);

      if (result.success) {
        return {
          success: true,
          data: {
            status: 'success',
            message: result.message || `${type} 连接测试成功`
          }
        };
      } else {
        return {
          success: false,
          error: result.message || `${type} 连接测试失败`
        };
      }
    } catch (error) {
      log.error(`[LLMController] 测试LLM服务商连接失败: ${error.message}`, error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  initLLMListeners
};
