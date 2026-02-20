/**
 * 设置相关API模块
 */
import type { Result, Settings, TTSProviderType } from "@/types";
import { invoke } from "@/utils/apiBase";

/**
 * 设置API
 */
export const settingsApi = {
  /**
   * 获取所有设置
   */
  getAll: () => invoke<Result<Settings>>("get-settings"),

  /**
   * 获取TTS设置
   */
  getTTSSettings: () => invoke<Result<any>>("get-tts-settings"),

  /**
   * 获取LLM设置
   */
  getLLMSettings: () => invoke<Result<any>>("get-llm-settings"),

  /**
   * 获取B站直播设置
   */
  getBliveSettings: () => invoke<Result<any>>("get-blive-settings"),

  /**
   * 获取单个设置项
   * @param key 设置键名
   */
  get: (key: string, type: string) =>
    invoke<Result<any>>("get-setting", key, type),

  /**
   * 更新设置
   * @param data 设置数据
   */
  update: (data: Partial<Settings>) =>
    invoke<Result<Settings>>("update-settings", { ...data }),

  /**
   * 更新TTS设置
   * @param data TTS设置数据
   */
  updateTTSSettings: (data: any) =>
    invoke<Result<any>>("update-tts-settings", { ...data }),

  /**
   * 更新LLM设置
   * @param data LLM设置数据
   */
  updateLLMSettings: (data: any) =>
    invoke<Result<any>>("update-llm-settings", { ...data }),

  /**
   * 更新B站直播设置
   * @param data B站直播设置数据
   */
  updateBliveSettings: (data: any) =>
    invoke<Result<any>>("update-blive-settings", { ...data }),

  /**
   * 获取默认导出路径
   */
  getDefaultExportPath: () => invoke<Result<string>>("get-default-export-path"),

  /**
   * 设置默认导出路径
   * @param path 路径
   */
  setDefaultExportPath: (path: string) =>
    invoke<Result<boolean>>("set-default-export-path", path),

  /**
   * 重置设置为默认值
   */
  reset: () => invoke<Result<Settings>>("reset-settings"),

  /**
   * 获取TTS服务商配置
   * @param provider 服务商类型 (azure, aliyun, tencent, baidu)
   */
  getTTSProviderSettings: (provider: TTSProviderType) =>
    invoke<Result<any>>("get-tts-provider-settings", provider),

  /**
   * 更新TTS服务商配置
   * @param provider 服务商类型 (azure, aliyun, tencent, baidu)
   * @param data 服务商配置数据
   */
  updateTTSProviderSettings: (provider: TTSProviderType, data: any) =>
    invoke<Result<any>>("update-tts-provider-settings", provider, { ...data }),

  /**
   * 获取LLM服务商配置
   * @param providerId 服务商ID
   */
  getLLMProviderSettings: (providerId: string) =>
    invoke<Result<any>>("get-llm-provider-settings", providerId),

  /**
   * 更新或新增LLM服务商配置
   * @param providerId 服务商ID（更新时与 data.id 一致）
   * @param data 服务商配置数据（含 id, name, protocol 及协议相关字段）
   */
  updateLLMProviderSettings: (providerId: string, data: any) =>
    invoke<Result<any>>("update-llm-provider-settings", providerId, { ...data }),

  /**
   * 测试TTS服务商连接
   * @param type 服务商类型
   * @param model 测试配置数据
   */
  testTTSProviderConnection: (type: TTSProviderType, model?: any) =>
    invoke<Result<{ message: string; status: string; audioData?: any }>>(
      "tts:test-provider-connection",
      type,
      model
    ),

  /**
   * 测试LLM服务商连接
   * @param providerId 服务商ID
   */
  testLLMProviderConnection: (providerId: string, data?: any) =>
    invoke<Result<{ message: string; status: string }>>(
      "llm:test-provider-connection",
      providerId,
      data
    ),

  /**
   * 删除 LLM 服务商
   */
  deleteLLMProvider: (providerId: string) =>
    invoke<Result<{ deleted: string }>>("delete-llm-provider", providerId),
};
