/**
 * 设置模型
 * 管理应用的全局设置
 */
const path = require("path");
const os = require("os");
const storage = require("../utils/storage");
const { success, error } = require("../utils/result");

// 配置保存的单一键名
const SETTINGS_KEY = "vwordai";

// 默认设置
const DEFAULT_SETTINGS = {
  theme: "light",
  defaultExportPath: path.join(os.homedir(), "Documents", "vwordai"),
  language: "zh_CN",
  azure: {
    key: "",
    region: "",
    endpoint: "",
    status: "untested"
  },
  aliyun: {
    appkey: "",
    token: "",
    endpoint: "",
    status: "untested"
  },
  tencent: {
    secretId: "",
    secretKey: "",
    endpoint: "",
    status: "untested"
  },
  baidu: {
    apiKey: "",
    secretKey: "",
    endpoint: "",
    status: "untested"
  },
  openai: {
    apiKey: "",
    endpoint: "https://api.openai.com/v1",
    status: "untested"
  },
  autoSave: true,
  autoSaveInterval: 5, // 分钟
  maxConcurrentTasks: 2,
  fileNamingRule: "chapter_title",
  customNamingFormat: "{project}-{chapter}",
  outputFormat: "mp3",
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
    // 使用单一键从存储中读取所有设置
    const settings = storage.readConfig(SETTINGS_KEY, DEFAULT_SETTINGS);
    
    console.log("Read settings Successfully");
    return settings;
  }

  /**
   * 获取单个设置项
   * @param {string} key 设置键
   * @returns {any} 设置值
   */
  static getSetting(key) {
    // 从存储的所有设置中获取指定键的值
    const allSettings = this.getAllSettings();
    const value = allSettings[key];

    return success({
      key,
      value,
    });
  }

  /**
   * 更新设置
   * @param {Object} settingsData 更新的设置数据
   * @returns {Object} 更新后的所有设置
   */
  static updateSettings(settingsData) {
    try {
      // console.log("Update Settings:", JSON.stringify(settingsData, null, 2));
      
      // 获取当前所有设置
      const currentSettings = this.getAllSettings();
      
      // 合并新设置
      const updatedSettings = { ...currentSettings, ...settingsData };
      
      // 保存所有设置到单一键
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
      // 保存默认设置到单一键
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
    const allSettings = this.getAllSettings();
    const exportPath = allSettings.defaultExportPath;
    return success({ path: exportPath });
  }

  /**
   * 设置默认导出路径
   * @param {string} path 导出路径
   * @returns {Object} 结果对象
   */
  static setDefaultExportPath(path) {
    try {
      const allSettings = this.getAllSettings();
      allSettings.defaultExportPath = path;
      storage.saveConfig(SETTINGS_KEY, allSettings);
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
      const allSettings = this.getAllSettings();
      const providerSettings = allSettings[provider];
      
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
      
      // 获取所有设置
      const allSettings = this.getAllSettings();
      
      // 获取当前的服务商设置
      const currentProviderSettings = allSettings[provider] || {};
      
      // 合并新的设置
      const updatedProviderSettings = { ...currentProviderSettings, ...providerData };
      
      // 检测配置是否已完整填写
      const isConfigComplete = this.isProviderConfigComplete(provider, updatedProviderSettings);
      
      // 如果配置有变更，将状态设置为 untested
      if (JSON.stringify(currentProviderSettings) !== JSON.stringify(updatedProviderSettings)) {
        // 只有在配置变更时才改变状态，且仅当没有显式传入状态时
        if (!providerData.status) {
          // 仅当配置完整且之前状态不是success或failure时才设置为untested
          if (isConfigComplete && currentProviderSettings.status !== "success" && currentProviderSettings.status !== "failure") {
            updatedProviderSettings.status = "untested";
          }
        }
      }
      
      // 更新设置中的服务商配置
      allSettings[provider] = updatedProviderSettings;
      
      // 保存所有设置
      storage.saveConfig(SETTINGS_KEY, allSettings);
      
      console.log(
        `Save provider ${provider} settings:`,
        JSON.stringify(updatedProviderSettings, null, 2)
      );

      return success({
        provider,
        settings: updatedProviderSettings,
      });
    } catch (err) {
      console.error(`Update ${provider} settings failed:`, err);
      return error(err.message);
    }
  }

  /**
   * 检查服务商配置是否完整
   * @param {string} provider 服务商名称
   * @param {Object} settings 服务商配置
   * @returns {boolean} 配置是否完整
   */
  static isProviderConfigComplete(provider, providerSettings) {
    let isComplete = false;

    switch (provider) {
      case "azure":
        isComplete = providerSettings.key && providerSettings.region;
        break;
      case "aliyun":
        isComplete = providerSettings.appkey && providerSettings.token;
        break;
      case "tencent":
        isComplete = providerSettings.secretId && providerSettings.secretKey;
        break;
      case "baidu":
        isComplete = providerSettings.apiKey && providerSettings.secretKey;
        break;
      case "openai":
        isComplete = providerSettings.apiKey;
        break;
      default:
        isComplete = false;
    }

    return isComplete;
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
      const allSettings = this.getAllSettings();
      const providerSettings = allSettings[provider];

      if (!providerSettings) {
        console.error(`Provider ${provider} not found`);
        return error(`服务商 ${provider} 配置不存在`);
      }

      // Azure TTS服务需要特殊处理，使用实际的TTS测试
      if (provider === "azure") {
        return this.testAzureTTS(providerSettings);
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
        
        // 更新状态为 untested
        providerSettings.status = "untested";
        
        // 更新设置
        allSettings[provider] = providerSettings;
        storage.saveConfig(SETTINGS_KEY, allSettings);
        
        return error(`服务商配置不完整，缺少: ${missingFields.join(", ")}`);
      }

      // 如果配置有效，返回成功并更新状态
      console.log(`Provider ${provider} settings valid`);
      
      // 更新状态为 success
      providerSettings.status = "success";
      
      // 更新设置
      allSettings[provider] = providerSettings;
      storage.saveConfig(SETTINGS_KEY, allSettings);
      
      return success({
        message: `${provider} 配置有效`,
        status: "success"
      });
    } catch (err) {
      console.error(`Test ${provider} connection failed:`, err);
      
      // 读取并更新状态为 failure
      const allSettings = this.getAllSettings();
      const providerSettings = allSettings[provider];
      
      if (providerSettings) {
        providerSettings.status = "failure";
        allSettings[provider] = providerSettings;
        storage.saveConfig(SETTINGS_KEY, allSettings);
      }
      
      return error(err.message);
    }
  }

  /**
   * 测试Azure TTS服务
   * @param {Object} config Azure配置
   * @returns {Object} 测试结果
   */
  static async testAzureTTS(config) {
    try {
      if (!config || !config.key || !config.region) {
        // 更新状态为 untested
        if (config) {
          const allSettings = this.getAllSettings();
          
          config.status = "untested";
          allSettings.azure = config;
          
          storage.saveConfig(SETTINGS_KEY, allSettings);
        }
        return error("Azure配置不完整");
      }

      const text = "azure配置成功";
      // 设置测试参数
      const settings = {
        voice: "zh-CN-XiaoxiaoMultilingualNeural",
        speed: 1.0,
        emotion: "general",
      };

      // 使用Azure Provider调用play方法（直接播放不保存）
      const azureProvider = require("../provider/azure");
      const result = await azureProvider.play(text, settings, config);

      if (result.success) {
        // 添加日志
        console.log("测试成功，更新Azure状态为: success");
        
        // 获取所有设置
        const allSettings = this.getAllSettings();
        
        // 更新Azure配置
        const updatedConfig = {...config, status: "success"};
        allSettings.azure = updatedConfig;
        
        // 保存所有设置
        storage.saveConfig(SETTINGS_KEY, allSettings);
        
        // 验证保存是否成功
        const savedSettings = this.getAllSettings();
        console.log("保存后的Azure配置状态:", savedSettings.azure.status);
        
        return success({
          ...result.data,
          status: "success"
        });
      } else {
        // 更新状态为 failure
        console.log("测试失败，更新Azure状态为: failure");
        
        // 获取所有设置
        const allSettings = this.getAllSettings();
        
        // 更新Azure配置
        config.status = "failure";
        allSettings.azure = config;
        
        // 保存所有设置
        storage.saveConfig(SETTINGS_KEY, allSettings);
        
        return result;
      }
    } catch (error) {
      console.error("测试Azure TTS出错:", error);
      
      // 更新状态为 failure
      if (config) {
        // 获取所有设置
        const allSettings = this.getAllSettings();
        
        // 更新Azure配置
        config.status = "failure";
        allSettings.azure = config;
        
        // 保存所有设置
        storage.saveConfig(SETTINGS_KEY, allSettings);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "测试时发生未知错误",
      };
    }
  }
}

module.exports = Settings;
