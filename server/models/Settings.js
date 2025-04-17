/**
 * 设置模型
 * 管理应用的全局设置
 */
const path = require("path");
const os = require("os");
const storage = require("../utils/storage");
const { success, error } = require("../utils/result");

// 设置存储键
const SETTINGS_KEY = "settings";

// 默认设置
const DEFAULT_SETTINGS = {
  theme: "light",
  defaultExportPath: path.join(os.homedir(), "Documents", "vwordai"),
  language: "zh_CN",
  azure: {
    key: "",
    region: "",
    endpoint: "",
  },
  aliyun: {
    appkey: "",
    token: "",
    endpoint: "",
  },
  tencent: {
    secretId: "",
    secretKey: "",
    endpoint: "",
  },
  baidu: {
    apiKey: "",
    secretKey: "",
    endpoint: "",
  },
  openai: {
    apiKey: "",
    endpoint: "https://api.openai.com/v1",
  },
  autoSave: true,
  autoSaveInterval: 5, // 分钟
  maxConcurrentTasks: 2,
  fileNamingRule: "chapter_title",
  customNamingFormat: "{project}-{chapter}",
};

/**
 * 设置类
 */
class Settings {
  /**
   * 获取所有设置
   * @returns {Object} 所有设置
   */
  static getAllSettings() {
    console.log("Reading all settings...");
    const settings = storage.readConfig(SETTINGS_KEY, {});
    console.log("Read settings Successfully");
    const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
    return mergedSettings;
  }

  /**
   * 获取单个设置项
   * @param {string} key 设置键
   * @returns {any} 设置值
   */
  static getSetting(key) {
    const settings = this.getAllSettings();
    const value = settings[key];

    return success({
      key,
      value: value !== undefined ? value : DEFAULT_SETTINGS[key],
    });
  }

  /**
   * 更新设置
   * @param {Object} settingsData 更新的设置数据
   * @returns {Object} 更新后的所有设置
   */
  static updateSettings(settingsData) {
    try {
      console.log("Update Settings:", JSON.stringify(settingsData, null, 2));
      // 获取当前设置并合并新设置
      const currentSettings = this.getAllSettings();
      const updatedSettings = { ...currentSettings, ...settingsData };

      // 保存合并后的设置
      storage.saveConfig(SETTINGS_KEY, updatedSettings);
      console.log("Settings saved");

      return success(updatedSettings);
    } catch (err) {
      console.error("Update settings failed:", err);
      return error(err.message);
    }
  }

  /**
   * 重置所有设置为默认值
   * @returns {Object} 默认设置
   */
  static resetToDefaults() {
    try {
      storage.saveConfig(SETTINGS_KEY, DEFAULT_SETTINGS);
      return success(DEFAULT_SETTINGS);
    } catch (err) {
      console.error("Reset settings failed:", err);
      return error(err.message);
    }
  }

  /**
   * 获取默认导出路径
   * @returns {Object} 包含导出路径的结果对象
   */
  static getDefaultExportPath() {
    const settings = this.getAllSettings();
    return success({ path: settings.defaultExportPath });
  }

  /**
   * 设置默认导出路径
   * @param {string} path 导出路径
   * @returns {Object} 结果对象
   */
  static setDefaultExportPath(path) {
    try {
      const settings = this.getAllSettings();
      settings.defaultExportPath = path;

      storage.saveConfig(SETTINGS_KEY, settings);
      return success({ path });
    } catch (err) {
      console.error("Set export path failed:", err);
      return error(err.message);
    }
  }

  /**
   * 获取特定服务商配置
   * @param {string} provider 服务商名称 (azure, aliyun, tencent, baidu, openai)
   * @returns {Object} 包含服务商配置的结果对象
   */
  static getProviderSettings(provider) {
    try {
      console.log(`Get provider ${provider} settings`);
      const settings = this.getAllSettings();

      // 确保provider字段存在
      if (!settings[provider] && DEFAULT_SETTINGS[provider]) {
        console.log(`Provider ${provider} settings not found, using default`);
        return success({
          provider,
          settings: DEFAULT_SETTINGS[provider],
        });
      }

      const providerSettings = settings[provider] || {};
      console.log(
        `Provider ${provider} settings:`,
        JSON.stringify(providerSettings, null, 2)
      );

      return success({
        provider,
        settings: providerSettings,
      });
    } catch (err) {
      console.error(`Get ${provider} settings failed:`, err);
      return error(err.message);
    }
  }

  /**
   * 更新特定服务商配置
   * @param {string} provider 服务商名称 (azure, aliyun, tencent, baidu, openai)
   * @param {Object} providerData 服务商配置数据
   * @returns {Object} 包含更新后的服务商配置的结果对象
   */
  static updateProviderSettings(provider, providerData) {
    try {
      console.log(
        `Update provider ${provider} settings:`,
        JSON.stringify(providerData, null, 2)
      );
      const settings = this.getAllSettings();

      // 确保provider字段存在
      if (!settings[provider]) {
        console.log(`Provider ${provider} settings not found, creating new`);
        settings[provider] = DEFAULT_SETTINGS[provider] || {};
      }

      // 合并新的配置数据
      settings[provider] = { ...settings[provider], ...providerData };

      // 保存并记录配置
      console.log(
        `Save provider ${provider} settings:`,
        JSON.stringify(settings[provider], null, 2)
      );
      storage.saveConfig(SETTINGS_KEY, settings);

      return success({
        provider,
        settings: settings[provider],
      });
    } catch (err) {
      console.error(`Update ${provider} settings failed:`, err);
      return error(err.message);
    }
  }

  /**
   * 测试服务商连接
   * @param {string} provider 服务商名称 (azure, aliyun, tencent, baidu, openai)
   * @returns {Object} 测试结果
   */
  static testProviderConnection(provider) {
    try {
      console.log(`Test provider ${provider} connection`);

      // 读取设置
      const settings = this.getAllSettings();

      // 检查服务商配置
      const providerSettings = settings[provider];

      if (!providerSettings) {
        console.error(`Provider ${provider} not found`);
        return error(`服务商 ${provider} 配置不存在`);
      }

      // 此处只检查配置是否存在基本字段，实际API连接测试可以在TTSService中实现
      let isValid = false;
      let missingFields = [];

      switch (provider) {
        case "azure":
          isValid = providerSettings.key && providerSettings.region;
          if (!providerSettings.key) missingFields.push("key");
          if (!providerSettings.region) missingFields.push("region");
          break;
        case "aliyun":
          isValid = providerSettings.appkey && providerSettings.token;
          if (!providerSettings.appkey) missingFields.push("appkey");
          if (!providerSettings.token) missingFields.push("token");
          break;
        case "tencent":
          isValid = providerSettings.secretId && providerSettings.secretKey;
          if (!providerSettings.secretId) missingFields.push("secretId");
          if (!providerSettings.secretKey) missingFields.push("secretKey");
          break;
        case "baidu":
          isValid = providerSettings.apiKey && providerSettings.secretKey;
          if (!providerSettings.apiKey) missingFields.push("apiKey");
          if (!providerSettings.secretKey) missingFields.push("secretKey");
          break;
        case "openai":
          isValid = providerSettings.apiKey;
          if (!providerSettings.apiKey) missingFields.push("apiKey");
          break;
        default:
          return error(`不支持的服务商: ${provider}`);
      }

      if (!isValid) {
        console.log(
          `Provider ${provider} settings incomplete, missing: ${missingFields.join(
            ", "
          )}`
        );
        return error(`服务商配置不完整，缺少: ${missingFields.join(", ")}`);
      }

      // 如果配置有效，返回成功
      console.log(`Provider ${provider} settings valid`);
      return success({
        message: `${provider} 配置有效`,
      });
    } catch (err) {
      console.error(`Test ${provider} connection failed:`, err);
      return error(err.message);
    }
  }
}

module.exports = Settings;
