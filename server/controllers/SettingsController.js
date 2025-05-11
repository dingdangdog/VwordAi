/**
 * 设置控制器
 * 处理所有与应用设置相关的IPC通信
 */
const { ipcMain } = require("electron");
const Settings = require("../models/Settings");
const { success, error } = require("../utils/result");

/**
 * 初始化设置控制器
 */
function init() {
  // 获取所有设置
  ipcMain.handle("get-settings", async () => {
    try {
      const settings = Settings.getSettings();
      return success(settings);
    } catch (err) {
      console.error("获取设置失败:", err);
      return error(err.message);
    }
  });

  // 获取TTS设置
  ipcMain.handle("get-tts-settings", async () => {
    try {
      const settings = Settings.getTTSSettings();
      return success(settings);
    } catch (err) {
      console.error("获取TTS设置失败:", err);
      return error(err.message);
    }
  });

  // 获取LLM设置
  ipcMain.handle("get-llm-settings", async () => {
    try {
      const settings = Settings.getLLMSettings();
      return success(settings);
    } catch (err) {
      console.error("获取LLM设置失败:", err);
      return error(err.message);
    }
  });

  // 获取B站直播设置
  ipcMain.handle("get-blive-settings", async () => {
    try {
      const settings = Settings.getBliveSettings();
      return success(settings);
    } catch (err) {
      console.error("获取B站直播设置失败:", err);
      return error(err.message);
    }
  });

  // 获取单个设置项
  ipcMain.handle("get-setting", async (event, key, type) => {
    try {
      return success(Settings.getSetting(key, type));
    } catch (err) {
      console.error("获取设置项失败:", err);
      return error(err.message);
    }
  });

  // 更新设置
  ipcMain.handle("update-settings", async (event, settingsData) => {
    try {
      return success(Settings.updateSettings(settingsData));
    } catch (err) {
      console.error("更新设置失败:", err);
      return error(err.message);
    }
  });

  // 更新TTS设置
  ipcMain.handle("update-tts-settings", async (event, settingsData) => {
    try {
      Settings.saveTTSSettings(settingsData);
      return success(Settings.getTTSSettings());
    } catch (err) {
      console.error("更新TTS设置失败:", err);
      return error(err.message);
    }
  });

  // 更新LLM设置
  ipcMain.handle("update-llm-settings", async (event, settingsData) => {
    try {
      Settings.saveLLMConfig(settingsData);
      return success(Settings.getLLMSettings());
    } catch (err) {
      console.error("更新LLM设置失败:", err);
      return error(err.message);
    }
  });

  // 更新B站直播设置
  ipcMain.handle("update-blive-settings", async (event, settingsData) => {
    try {
      Settings.saveBiliveConfig(settingsData);
      return success(Settings.getBliveSettings());
    } catch (err) {
      console.error("更新B站直播设置失败:", err);
      return error(err.message);
    }
  });

  // 获取默认导出路径
  ipcMain.handle("get-default-export-path", async () => {
    try {
      return success(Settings.getDefaultExportPath());
    } catch (err) {
      console.error("获取默认导出路径失败:", err);
      return error(err.message);
    }
  });

  // 设置默认导出路径
  ipcMain.handle("set-default-export-path", async (event, path) => {
    try {
      Settings.setDefaultExportPath(path);
      return success({ path });
    } catch (err) {
      console.error("设置默认导出路径失败:", err);
      return error(err.message);
    }
  });

  // 重置所有设置为默认值
  ipcMain.handle("reset-settings", async () => {
    try {
      return success(Settings.resetToDefaults());
    } catch (err) {
      console.error("重置设置失败:", err);
      return error(err.message);
    }
  });

  // 获取服务商配置（TTS）
  ipcMain.handle("get-tts-provider-settings", async (event, provider) => {
    try {
      const ttsSettings = Settings.getTTSSettings();
      return success({
        provider,
        settings: ttsSettings[provider] || {},
      });
    } catch (err) {
      console.error("获取TTS服务商配置失败:", err);
      return error(err.message);
    }
  });

  // 更新服务商配置（TTS）
  ipcMain.handle(
    "update-tts-provider-settings",
    async (event, provider, providerData) => {
      try {
        const ttsSettings = Settings.getTTSSettings();
        ttsSettings[provider] = {
          ...(ttsSettings[provider] || {}),
          ...providerData,
        };
        Settings.saveTTSSettings(ttsSettings);
        return success({
          provider,
          settings: ttsSettings[provider],
        });
      } catch (err) {
        console.error("更新TTS服务商配置失败:", err);
        return error(err.message);
      }
    }
  );

  // 获取服务商配置（LLM）
  ipcMain.handle("get-llm-provider-settings", async (event, provider) => {
    try {
      const llmSettings = Settings.getLLMSettings();
      return success({
        provider,
        settings: llmSettings[provider] || {},
      });
    } catch (err) {
      console.error("获取LLM服务商配置失败:", err);
      return error(err.message);
    }
  });

  // 更新服务商配置（LLM）
  ipcMain.handle(
    "update-llm-provider-settings",
    async (event, provider, providerData) => {
      try {
        const llmSettings = Settings.getLLMSettings();
        llmSettings[provider] = {
          ...(llmSettings[provider] || {}),
          ...providerData,
        };
        Settings.saveLLMConfig(llmSettings);
        return success({
          provider,
          settings: llmSettings[provider],
        });
      } catch (err) {
        console.error("更新LLM服务商配置失败:", err);
        return error(err.message);
      }
    }
  );

  // 测试服务商连接（TTS）
  ipcMain.handle(
    "test-tts-provider-connection",
    async (event, provider, config) => {
      try {
        // 更新配置
        const ttsSettings = Settings.getTTSSettings();
        ttsSettings[provider] = { ...(ttsSettings[provider] || {}), ...config };
        Settings.saveTTSSettings(ttsSettings);

        // 执行测试
        const result = await Settings.testProviderConnection(provider, config);
        if (result.success) {
          // 更新状态
          ttsSettings[provider].status = "success";
          Settings.saveTTSSettings(ttsSettings);
        } else {
          ttsSettings[provider].status = "failure";
          Settings.saveTTSSettings(ttsSettings);
        }
        return success(result);
      } catch (err) {
        console.error("测试TTS服务商连接失败:", err);
        return error(err.message);
      }
    }
  );
}

module.exports = {
  init,
};
