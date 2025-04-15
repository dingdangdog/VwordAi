/**
 * 服务商配置和信息控制器
 * 处理与服务商配置获取、更新以及声音/情感列表相关的IPC通信。
 * 配置本身存储在 Settings (dotts.json) 中。
 */
const { ipcMain } = require("electron");
const Settings = require("../models/Settings");
const TTSService = require("../services/TTSService"); // 用于获取声音和情感列表
const { success, error } = require("../utils/result");

const VALID_PROVIDER_TYPES = ["azure", "aliyun", "tencent", "baidu"];

/**
 * 初始化服务商相关IPC处理器
 */
function init() {
  // 获取所有服务商的配置概览
  ipcMain.handle("service-provider:get-all", async () => {
    try {
      const settings = Settings.getAllSettings();
      const providers = VALID_PROVIDER_TYPES.map((type) => {
        const config = settings[type] || getEmptyProviderConfig(type);
        return {
          id: type,
          name: getProviderName(type),
          type: type,
          // 只返回基本信息和是否已配置，不暴露敏感密钥
          region: config.region || "",
          endpoint: config.endpoint || "",
          enabled: isProviderConfigured(type, config), // 是否配置了必要的密钥
          updateAt: new Date().toISOString(), // 模拟时间戳
        };
      });
      return success(providers);
    } catch (err) {
      console.error("获取所有服务商概览失败:", err);
      return error(`获取服务商概览失败: ${err.message}`);
    }
  });

  // 获取单个服务商的详细配置 (用于设置页面)
  ipcMain.handle("service-provider:get", async (event, providerType) => {
    if (!VALID_PROVIDER_TYPES.includes(providerType)) {
      return error(`无效的服务商类型: ${providerType}`);
    }
    try {
      const result = Settings.getProviderSettings(providerType);
      if (!result.success) {
        return error(
          `获取 ${providerType} 配置失败: ${result.error || "未知错误"}`
        );
      }
      const config =
        result.data.settings || getEmptyProviderConfig(providerType);

      // 返回前端需要的结构，包含API Key/Secret等用于显示
      return success({
        id: providerType,
        name: getProviderName(providerType),
        type: providerType,
        apiKey:
          config.key || config.apiKey || config.secretId || config.appkey || "", // 根据类型映射
        secretKey: config.secretKey || config.token || "", // 根据类型映射
        region: config.region || "",
        endpoint: config.endpoint || "",
        // Aliyun specific fields (if needed by form)
        accessKeyId: providerType === "aliyun" ? config.appkey : undefined,
        accessKeySecret: providerType === "aliyun" ? config.token : undefined,
        // Tencent specific fields
        secretId: providerType === "tencent" ? config.secretId : undefined,
        // Baidu specific fields are already covered by apiKey/secretKey
        enabled: isProviderConfigured(providerType, config),
        config: config, // Optionally include raw config if needed
      });
    } catch (err) {
      console.error(`获取 ${providerType} 配置失败:`, err);
      return error(`获取 ${providerType} 配置失败: ${err.message}`);
    }
  });

  // 更新单个服务商的配置
  ipcMain.handle(
    "service-provider:update",
    async (event, providerType, providerData) => {
      if (!VALID_PROVIDER_TYPES.includes(providerType)) {
        return error(`无效的服务商类型: ${providerType}`);
      }
      try {
        // 将前端传入的数据转换为后端存储结构
        const configData = prepareProviderConfigForStorage(
          providerType,
          providerData
        );

        // 使用Settings模型更新配置
        const result = Settings.updateProviderSettings(
          providerType,
          configData
        );
        if (!result.success) {
          return error(
            `更新 ${providerType} 配置失败: ${result.error || "未知错误"}`
          );
        }

        // 返回更新后的、适合前端显示的结构
        const updatedConfig = result.data.settings;
        return success({
          id: providerType,
          name: getProviderName(providerType),
          type: providerType,
          apiKey:
            updatedConfig.key ||
            updatedConfig.apiKey ||
            updatedConfig.secretId ||
            updatedConfig.appkey ||
            "",
          secretKey: updatedConfig.secretKey || updatedConfig.token || "",
          region: updatedConfig.region || "",
          endpoint: updatedConfig.endpoint || "",
          accessKeyId:
            providerType === "aliyun" ? updatedConfig.appkey : undefined,
          accessKeySecret:
            providerType === "aliyun" ? updatedConfig.token : undefined,
          secretId:
            providerType === "tencent" ? updatedConfig.secretId : undefined,
          enabled: isProviderConfigured(providerType, updatedConfig),
          config: updatedConfig,
        });
      } catch (err) {
        console.error(`更新 ${providerType} 配置失败:`, err);
        return error(`更新 ${providerType} 配置失败: ${err.message}`);
      }
    }
  );

  // 重置服务商配置 (设置为默认空值)
  ipcMain.handle("service-provider:delete", async (event, providerType) => {
    if (!VALID_PROVIDER_TYPES.includes(providerType)) {
      return error(`无效的服务商类型: ${providerType}`);
    }
    try {
      const emptyConfig = getEmptyProviderConfig(providerType);
      const result = Settings.updateProviderSettings(providerType, emptyConfig);
      if (!result.success) {
        return error(
          `重置 ${providerType} 配置失败: ${result.error || "未知错误"}`
        );
      }
      return success(null, `${providerType} 配置已重置`);
    } catch (err) {
      console.error(`重置 ${providerType} 配置失败:`, err);
      return error(`重置 ${providerType} 配置失败: ${err.message}`);
    }
  });

  // 测试服务商连接 (仅检查配置有效性)
  ipcMain.handle(
    "service-provider:test-connection",
    async (event, providerType) => {
      if (!VALID_PROVIDER_TYPES.includes(providerType)) {
        return error(`无效的服务商类型: ${providerType}`);
      }
      try {
        const result = Settings.getProviderSettings(providerType);
        if (!result.success) {
          return error(
            `获取 ${providerType} 配置失败: ${result.error || "无法读取配置"}`
          );
        }
        const config = result.data.settings;
        const isValid = isProviderConfigured(providerType, config);

        if (isValid) {
          // TODO: Implement actual API ping tests here later if desired
          return success({
            success: true,
            message: "配置有效 (连接未实际测试)",
          });
        } else {
          return error(`配置不完整或无效`);
        }
      } catch (err) {
        console.error(`测试 ${providerType} 连接失败:`, err);
        return error(`测试连接失败: ${err.message}`);
      }
    }
  );

  // 获取服务商支持的声音角色 (调用TTSService)
  ipcMain.handle(
    "service-provider:get-voice-roles",
    async (event, providerType) => {
      if (!VALID_PROVIDER_TYPES.includes(providerType)) {
        return error(`无效的服务商类型: ${providerType}`);
      }
      try {
        // 直接调用 TTSService 获取角色
        const result = await TTSService.getVoiceRoles(providerType);
        return result; // TTSService 返回 { success: boolean, data?: [], error?: string }
      } catch (err) {
        console.error(`获取 ${providerType} 声音角色失败:`, err);
        return error(`获取声音角色失败: ${err.message}`);
      }
    }
  );

  // 获取特定声音的情感列表 (调用TTSService)
  ipcMain.handle(
    "service-provider:get-emotions",
    async (event, providerType, voiceId) => {
      if (!VALID_PROVIDER_TYPES.includes(providerType)) {
        return error(`无效的服务商类型: ${providerType}`);
      }
      if (!voiceId) {
        return error("未提供声音ID");
      }
      try {
        // 直接调用 TTSService 获取情感
        const result = await TTSService.getEmotions(providerType, voiceId);
        return result; // TTSService 返回 { success: boolean, data?: [], error?: string }
      } catch (err) {
        console.error(
          `获取 ${providerType} (声音 ${voiceId}) 情感列表失败:`,
          err
        );
        return error(`获取情感列表失败: ${err.message}`);
      }
    }
  );
}

// --- Helper Functions ---

/**
 * 获取服务商的本地化显示名称
 */
function getProviderName(type) {
  const nameMap = {
    azure: "微软 Azure",
    aliyun: "阿里云",
    tencent: "腾讯云",
    baidu: "百度智能云",
  };
  return nameMap[type] || type.toUpperCase();
}

/**
 * 将前端表单数据转换为后端存储所需的配置结构
 */
function prepareProviderConfigForStorage(type, formData) {
  switch (type) {
    case "azure":
      return {
        key: formData.apiKey || "",
        region: formData.region || "",
        endpoint: formData.endpoint || "",
      };
    case "aliyun":
      // 前端使用 accessKeyId, accessKeySecret
      return {
        appkey: formData.accessKeyId || "",
        token: formData.accessKeySecret || "",
        endpoint: formData.endpoint || "",
      };
    case "tencent":
      // 前端使用 secretId, secretKey
      return {
        secretId: formData.secretId || "",
        secretKey: formData.secretKey || "",
        endpoint: formData.endpoint || "",
      };
    case "baidu":
      // 前端使用 apiKey, secretKey
      return {
        apiKey: formData.apiKey || "",
        secretKey: formData.secretKey || "",
        endpoint: formData.endpoint || "",
      };
    default:
      console.warn(`prepareProviderConfigForStorage: 未知服务商类型 ${type}`);
      return {};
  }
}

/**
 * 获取指定服务商类型的默认空配置结构
 */
function getEmptyProviderConfig(type) {
  switch (type) {
    case "azure":
      return { key: "", region: "", endpoint: "" };
    case "aliyun":
      return { appkey: "", token: "", endpoint: "" };
    case "tencent":
      return { secretId: "", secretKey: "", endpoint: "" };
    case "baidu":
      return { apiKey: "", secretKey: "", endpoint: "" };
    default:
      return {};
  }
}

/**
 * 检查服务商配置是否包含必要的密钥/ID信息
 */
function isProviderConfigured(providerType, config) {
  if (!config) return false;
  switch (providerType) {
    case "azure":
      return !!config.key && !!config.region;
    case "aliyun":
      return !!config.appkey && !!config.token;
    case "tencent":
      return !!config.secretId && !!config.secretKey;
    case "baidu":
      return !!config.apiKey && !!config.secretKey;
    default:
      return false;
  }
}

module.exports = {
  init,
};
