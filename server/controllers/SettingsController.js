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
      console.error("[SettingsController] Failed to get settings:", err);
      return error(err.message);
    }
  });

  // 获取TTS设置
  ipcMain.handle("get-tts-settings", async () => {
    try {
      const settings = Settings.getTTSSettings();
      return success(settings);
    } catch (err) {
      console.error("[SettingsController] Failed to get TTS settings:", err);
      return error(err.message);
    }
  });

  // 获取LLM设置
  ipcMain.handle("get-llm-settings", async () => {
    try {
      const settings = Settings.getLLMSettings();
      return success(settings);
    } catch (err) {
      console.error("[SettingsController] Failed to get LLM settings:", err);
      return error(err.message);
    }
  });

  // 获取B站直播设置
  ipcMain.handle("get-blive-settings", async () => {
    try {
      const settings = Settings.getBliveSettings();
      return success(settings);
    } catch (err) {
      console.error("[SettingsController] Failed to get Blive settings:", err);
      return error(err.message);
    }
  });

  // 获取单个设置项
  ipcMain.handle("get-setting", async (event, key, type) => {
    try {
      return success(Settings.getSetting(key, type));
    } catch (err) {
      console.error("[SettingsController] Failed to get setting:", err);
      return error(err.message);
    }
  });

  // 更新设置
  ipcMain.handle("update-settings", async (event, settingsData) => {
    try {
      return success(Settings.updateSettings(settingsData));
    } catch (err) {
      console.error("[SettingsController] Failed to update settings:", err);
      return error(err.message);
    }
  });

  // 更新TTS设置
  ipcMain.handle("update-tts-settings", async (event, settingsData) => {
    try {
      Settings.saveTTSSettings(settingsData);
      return success(Settings.getTTSSettings());
    } catch (err) {
      console.error("[SettingsController] Failed to update TTS settings:", err);
      return error(err.message);
    }
  });

  // 更新LLM设置
  ipcMain.handle("update-llm-settings", async (event, settingsData) => {
    try {
      Settings.saveLLMConfig(settingsData);
      return success(Settings.getLLMSettings());
    } catch (err) {
      console.error("[SettingsController] Failed to update LLM settings:", err);
      return error(err.message);
    }
  });

  // 更新B站直播设置
  ipcMain.handle("update-blive-settings", async (event, settingsData) => {
    try {
      Settings.saveBiliveConfig(settingsData);
      return success(Settings.getBliveSettings());
    } catch (err) {
      console.error("[SettingsController] Failed to update Blive settings:", err);
      return error(err.message);
    }
  });

  // 获取默认导出路径
  ipcMain.handle("get-default-export-path", async () => {
    try {
      return success(Settings.getDefaultExportPath());
    } catch (err) {
      console.error("[SettingsController] Failed to get default export path:", err);
      return error(err.message);
    }
  });

  // 设置默认导出路径
  ipcMain.handle("set-default-export-path", async (event, path) => {
    try {
      Settings.setDefaultExportPath(path);
      return success({ path });
    } catch (err) {
      console.error("[SettingsController] Failed to set default export path:", err);
      return error(err.message);
    }
  });

  // 重置所有设置为默认值
  ipcMain.handle("reset-settings", async () => {
    try {
      return success(Settings.resetToDefaults());
    } catch (err) {
      console.error("[SettingsController] Failed to reset settings:", err);
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
      console.error("[SettingsController] Failed to get TTS provider config:", err);
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
        console.error("[SettingsController] Failed to update TTS provider config:", err);
        return error(err.message);
      }
    }
  );

  // 获取全部 LLM 配置（含 providers 列表）
  // get-llm-settings 已返回完整配置，此处保留兼容

  // 获取服务商配置（LLM）- provider 为 providerId
  ipcMain.handle("get-llm-provider-settings", async (event, provider) => {
    try {
      const llmSettings = Settings.getLLMSettings();
      const prov = llmSettings.providers || {};
      return success({
        provider,
        settings: prov[provider] || {},
      });
    } catch (err) {
      console.error("[SettingsController] Failed to get LLM provider config:", err);
      return error(err.message);
    }
  });

  // 更新或新增服务商配置（LLM）- provider 为 providerId
  ipcMain.handle(
    "update-llm-provider-settings",
    async (event, provider, providerData) => {
      try {
        const llmSettings = Settings.getLLMSettings();
        if (!llmSettings.providers) llmSettings.providers = {};
        const id = providerData.id != null ? providerData.id : provider;
        llmSettings.providers[id] = {
          ...(llmSettings.providers[id] || {}),
          ...providerData,
          id,
        };
        Settings.saveLLMConfig(llmSettings);
        return success({
          provider: id,
          settings: llmSettings.providers[id],
        });
      } catch (err) {
        console.error("[SettingsController] Failed to update LLM provider config:", err);
        return error(err.message);
      }
    }
  );

  // 删除 LLM 服务商
  ipcMain.handle("delete-llm-provider", async (event, providerId) => {
    try {
      const llmSettings = Settings.getLLMSettings();
      if (llmSettings.providers && llmSettings.providers[providerId]) {
        delete llmSettings.providers[providerId];
        Settings.saveLLMConfig(llmSettings);
      }
      return success({ deleted: providerId });
    } catch (err) {
      console.error("[SettingsController] Failed to delete LLM provider:", err);
      return error(err.message);
    }
  });

  // 测试服务商连接（TTS）- 已迁移到TTSController，保留兼容性
  ipcMain.handle(
    "test-tts-provider-connection",
    async (event, provider, test) => {
      console.log(`[SettingsController] TTS test interface deprecated, please use tts:test-provider-connection instead`);
      console.log(`[SettingsController] Attempting legacy TTS test for: ${provider}`);

      try {
        // 执行旧的测试逻辑以保持兼容性
        const ttsSettings = Settings.getTTSSettings();
        const result = await Settings.testProviderConnection(
          provider,
          test,
          ttsSettings[provider]
        );

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
        console.error(`[SettingsController] Legacy TTS test failed for ${provider}:`, err);
        return error(err.message);
      }
    }
  );

  // 通用获取服务商配置
  ipcMain.handle("get-provider-settings", async (event, provider) => {
    try {
      // 先尝试TTS设置
      const ttsSettings = Settings.getTTSSettings();
      if (ttsSettings[provider]) {
        return success({
          provider,
          type: 'tts',
          settings: ttsSettings[provider]
        });
      }

      // 再尝试LLM设置
      const llmSettings = Settings.getLLMSettings();
      if (llmSettings[provider]) {
        return success({
          provider,
          type: 'llm',
          settings: llmSettings[provider]
        });
      }

      return error(`Provider ${provider} not configured`);
    } catch (err) {
      console.error("[SettingsController] Failed to get provider config:", err);
      return error(err.message);
    }
  });

  // 通用更新服务商配置
  ipcMain.handle("update-provider-settings", async (event, provider, data) => {
    try {
      // 先尝试更新TTS设置
      const ttsSettings = Settings.getTTSSettings();
      if (ttsSettings[provider] !== undefined) {
        ttsSettings[provider] = {
          ...(ttsSettings[provider] || {}),
          ...data,
        };
        Settings.saveTTSSettings(ttsSettings);
        return success({
          provider,
          type: 'tts',
          settings: ttsSettings[provider],
        });
      }

      // 再尝试更新LLM设置
      const llmSettings = Settings.getLLMSettings();
      if (llmSettings[provider] !== undefined) {
        llmSettings[provider] = {
          ...(llmSettings[provider] || {}),
          ...data,
        };
        Settings.saveLLMConfig(llmSettings);
        return success({
          provider,
          type: 'llm',
          settings: llmSettings[provider],
        });
      }

      // 如果都没有，默认创建TTS配置
      ttsSettings[provider] = data;
      Settings.saveTTSSettings(ttsSettings);
      return success({
        provider,
        type: 'tts',
        settings: ttsSettings[provider],
      });
    } catch (err) {
      console.error("[SettingsController] Failed to update provider config:", err);
      return error(err.message);
    }
  });

  // 通用测试服务商连接
  ipcMain.handle("test-provider-connection", async (event, type) => {
    try {
      console.log(`[SettingsController] Test provider connection: ${type}`);

      // 先尝试TTS测试
      const ttsSettings = Settings.getTTSSettings();
      if (ttsSettings[type]) {
        const result = await Settings.testProviderConnection(
          type,
          { text: "这是一个测试文本" },
          ttsSettings[type]
        );
        return success(result);
      }

      // 再尝试LLM测试
      const llmSettings = Settings.getLLMSettings();
      if (llmSettings[type]) {
        // 这里应该调用LLM测试逻辑
        return success({
          success: true,
          message: `${type} LLM connection test not implemented`
        });
      }

      return error(`Provider ${type} not configured`);
    } catch (err) {
      console.error("[SettingsController] Test provider connection failed:", err);
      return error(err.message);
    }
  });
}

module.exports = {
  init,
};
