/**
 * 设置模型
 * 管理应用的全局设置
 */
const path = require("path");
const os = require("os");
const storage = require("../utils/storage");

// 配置保存的单一键名
const SETTINGS_KEY = "vwordai";
const LLM_CONFIG_KEY = "llm";
const TTS_CONFIG_KEY = "tts";
const BLIVE_CONFIG_KEY = "blive";

// 默认设置
const DEFAULT_SETTINGS = {
  theme: "light",
  defaultExportPath: path.join(os.homedir(), "Documents", "vwordai"),
  language: "zh_CN",
  autoSave: true,
  autoSaveInterval: 5, // 分钟
  maxConcurrentTasks: 2,
  fileNamingRule: "chapter_title",
  customNamingFormat: "{project}-{chapter}",
  outputFormat: "mp3",
};

const DEFAULT_LLM_SETTINGS = {
  volcengine: {
    key: "",
    endpoint: "https://ark.cn-beijing.volces.com/api/v3/",
    model: "",
  },
  aliyun: {
    key: "",
    endpoint: "",
    model: "",
  },
  openai: {
    key: "",
    endpoint: "",
    model: "",
  },
  azure: {
    key: "",
    endpoint: "",
    model: "",
  },
};

const DEFAULT_TTS_SETTINGS = {
  azure: {
    key: "",
    region: "",
    endpoint: "",
    status: "untested",
  },
  aliyun: {
    appkey: "",
    token: "",
    endpoint: "",
    status: "untested",
  },
  tencent: {
    secretId: "",
    secretKey: "",
    endpoint: "",
    status: "untested",
  },
  baidu: {
    apiKey: "",
    secretKey: "",
    endpoint: "",
    status: "untested",
  },
  openai: {
    apiKey: "",
    endpoint: "",
    status: "untested",
  },
};

const DEFAULT_BLIVE_SETTINGS = {
  // 基础配置
  platform: "win",
  room_ids: [], // {id, name}
  SESSDATA: "", // B站cookies中的SESSDATA字段值，登录后才有
  bilibili_heart_print: 10,
  continuous_gift_interval: 1, // 礼物合并时间间隔(秒)
  welcome_level: 0, // 欢迎进场的最低粉丝牌等级
  voice_text: {
    enter: "欢迎 {uname} 进入直播间，记得常来玩哦！",
    danmaku: "{uname}说：{msg}",
    gift: "感谢 {uname} 赠送的 {num}个{gift_name}，谢谢老板，老板大气！",
    like: "感谢 {uname} {like_text}",
    like_total: "本次直播点赞数量超过 {limit_num} 次，达到 {click_count} 次",
  },
  like_nums: [66, 188, 300, 500, 666, 888, 999, 1666],
  max_next_interval: 100, // 语音间隔 ms
  black_user: [], // 黑名单用户
  black_text: [], // 黑名单关键词
  ttsEnabled: true, // 是否启用TTS
  readDanmaku: true, // 是否播报弹幕
  readGift: true, // 是否播报礼物
  readEnter: true, // 是否播报进场
  readLike: true, // 是否播报点赞

  // 数据记录配置
  recordDanmaku: true, // 是否记录弹幕
  recordGift: true, // 是否记录礼物
  recordVisitor: true, // 是否记录访客

  // TTS模式
  tts: {
    mode: "local", // 'local', 'azure', 'aliyun', 'sovits'

    // Azure TTS配置
    azure: {
      azure_key: "",
      azure_model: "",
      azure_region: "",
      azure_endpoint: "",
      speed: 1.0,
      pitch: 0,
    },

    // 阿里云 TTS配置
    alibaba: {
      alibaba_appkey: "",
      alibaba_token: "",
      alibaba_model: "xiaoyun",
      alibaba_endpoint: "https://nls-gateway-cn-shanghai.aliyuncs.com",
      speed: 100, // 0-200
    },

    // SoVITS 配置
    sovits: {
      sovits_host: "http://127.0.0.1:5000/tts",
      sovits_model: "",
      sovits_language: "auto",
      sovits_emotion: "",
      sovits_top_k: "",
      sovits_top_p: "",
      sovits_temperature: "",
      sovits_batch_size: "",
      sovits_speed: "1.0",
      sovits_save_temp: "false",
      sovits_stream: "false",
      sovits_format: "wav",
    },
  },
};
/**
 * 设置类
 */
class Settings {
  /**
   * 获取单个设置项
   * @param {string} key 设置键
   * @returns {any} 设置值
   */
  static getSetting(key, type = SETTINGS_KEY) {
    let settings = null;
    switch (type) {
      case SETTINGS_KEY:
        settings = this.getSettings();
        break;
      case LLM_CONFIG_KEY:
        settings = this.getLLMSettings();
        break;
      case TTS_CONFIG_KEY:
        settings = this.getTTSSettings();
        break;
      case BLIVE_CONFIG_KEY:
        settings = this.getBliveSettings();
        break;
      default:
        return null;
    }
    // 从存储的所有设置中获取指定键的值
    return settings[key];
  }

  /**
   * 获取所有设置
   * @returns {Object} 所有设置
   */
  static getSettings() {
    const settings = storage.readConfig(SETTINGS_KEY, DEFAULT_SETTINGS);
    return settings;
  }

  static getLLMSettings() {
    const settings = storage.readConfig(LLM_CONFIG_KEY, DEFAULT_LLM_SETTINGS);
    return settings;
  }

  static getTTSSettings() {
    const settings = storage.readConfig(TTS_CONFIG_KEY, DEFAULT_TTS_SETTINGS);
    return settings;
  }

  static getBliveSettings() {
    const settings = storage.readConfig(
      BLIVE_CONFIG_KEY,
      DEFAULT_BLIVE_SETTINGS
    );
    return settings;
  }

  // 保存设置
  static saveSettings(config) {
    storage.saveConfig(SETTINGS_KEY, config);
  }

  static saveLLMConfig(config) {
    storage.saveConfig(LLM_CONFIG_KEY, config);
  }

  static saveTTSSettings(config) {
    storage.saveConfig(TTS_CONFIG_KEY, config);
  }

  static saveBiliveConfig(config) {
    storage.saveConfig(BLIVE_CONFIG_KEY, config);
  }

  /**
   * 更新设置
   * @param {Object} settingsData 更新的设置数据
   * @returns {Object} 更新后的所有设置
   */
  static updateSettings(settingsData) {
    // 获取当前所有设置
    const currentSettings = this.getSettings();

    // 合并新设置
    const updatedSettings = { ...currentSettings, ...settingsData };

    // 保存所有设置到单一键
    storage.saveConfig(SETTINGS_KEY, updatedSettings);

    console.log("Settings saved");

    return updatedSettings;
  }

  /**
   * 重置所有设置为默认值
   * @returns {Object} 默认设置
   */
  static resetToDefaults() {
    storage.saveConfig(SETTINGS_KEY, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }

  /**
   * 获取默认导出路径
   * @returns {Object} 包含导出路径的结果对象
   */
  static getDefaultExportPath() {
    const allSettings = this.getSettings();
    return allSettings.defaultExportPath;
  }

  /**
   * 设置默认导出路径
   * @param {string} path 导出路径
   * @returns {Object} 结果对象
   */
  static setDefaultExportPath(path) {
    const allSettings = this.getSettings();
    allSettings.defaultExportPath = path;
    storage.saveConfig(SETTINGS_KEY, allSettings);
  }

  /**
   * 获取特定服务商配置
   * @param {string} provider 服务商名称 (azure, aliyun, tencent, baidu, openai)
   * @returns {Object} 包含服务商配置的结果对象
   */
  static getProviderSettings(provider) {
    const allSettings = this.getSettings();
    const providerSettings = allSettings[provider];

    console.log(
      `Provider ${provider} settings:`,
      JSON.stringify(providerSettings, null, 2)
    );

    return {
      provider,
      settings: providerSettings,
    };
  }

  /**
   * 更新特定服务商配置
   * @param {string} provider 服务商名称 (azure, aliyun, tencent, baidu, openai)
   * @param {Object} providerData 服务商配置数据
   * @returns {Object} 包含更新后的服务商配置的结果对象
   */
  static updateProviderSettings(provider, providerData) {
    console.log(
      `Update provider ${provider} settings:`,
      JSON.stringify(providerData, null, 2)
    );

    // 获取所有设置
    const allSettings = this.getSettings();

    // 获取当前的服务商设置
    const currentProviderSettings = allSettings[provider] || {};

    // 合并新的设置
    const updatedProviderSettings = {
      ...currentProviderSettings,
      ...providerData,
    };

    // 检测配置是否已完整填写
    const isConfigComplete = this.isProviderConfigComplete(
      provider,
      updatedProviderSettings
    );

    // 如果配置有变更，将状态设置为 untested
    if (
      JSON.stringify(currentProviderSettings) !==
      JSON.stringify(updatedProviderSettings)
    ) {
      // 只有在配置变更时才改变状态，且仅当没有显式传入状态时
      if (!providerData.status) {
        // 仅当配置完整且之前状态不是success或failure时才设置为untested
        if (
          isConfigComplete &&
          currentProviderSettings.status !== "success" &&
          currentProviderSettings.status !== "failure"
        ) {
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

    return {
      provider,
      settings: updatedProviderSettings,
    };
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
  static async testProviderConnection(provider, config) {
    let result;
    if (provider === "azure") {
      result = await this.testAzureTTS(config);
    } else {
      result = await this.testProviderConnection(provider, config);
    }
    if (result.success) {
      // 获取所有设置
      const allSettings = this.getSettings();
      // 更新服务商配置
      const updatedConfig = { ...config, status: "success" };
      allSettings[provider] = updatedConfig;
      // 保存所有设置
      storage.saveConfig(SETTINGS_KEY, allSettings);
    }
    return result;
  }

  /**
   * 测试Azure TTS服务
   * @param {Object} config Azure配置
   * @returns {Object} 测试结果
   */
  static async testAzureTTS(config) {
    const text = "azure配置成功";
    const settings = {
      voice: "zh-CN-XiaoxiaoMultilingualNeural",
      speed: 1.0,
      emotion: "general",
    };

    const azureProvider = require("../provider/azure");
    const result = await azureProvider.play(text, settings, config);

    if (result.success) {
      return {
        ...result.data,
        status: "success",
      };
    } else {
      return result;
    }
  }
}

module.exports = Settings;
