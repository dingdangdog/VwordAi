/**
 * 设置相关API模块
 */
import type { Result, Settings, ServiceProviderType, ConnectionTestResult } from "@/types";
import { invoke, invokeHandler } from "@/utils/apiBase";

/**
 * 设置API
 */
export const settingsApi = {
  /**
   * 获取所有设置
   */
  getAll: () => invoke<Result<Settings>>("get-settings"),

  /**
   * 获取单个设置项
   * @param key 设置键名
   */
  get: (key: string) => invoke<Result<any>>("get-setting", key),

  /**
   * 更新设置
   * @param data 设置数据
   */
  update: (data: Partial<Settings>) => invoke<Result<Settings>>("update-settings", data),

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
   * 获取服务商配置
   * @param provider 服务商类型 (azure, aliyun, tencent, baidu)
   */
  getProviderSettings: (provider: ServiceProviderType) =>
    invoke<Result<any>>("get-provider-settings", provider),

  /**
   * 更新服务商配置
   * @param provider 服务商类型 (azure, aliyun, tencent, baidu)
   * @param data 服务商配置数据
   */
  updateProviderSettings: (provider: ServiceProviderType, data: any) =>
    invoke<Result<any>>("update-provider-settings", provider, data),

  /**
   * 测试服务商连接
   * @param type 服务商类型
   */
  testProviderConnection: (type: ServiceProviderType) =>
    invoke<Result<{message: string, status: string}>>("test-provider-connection", type),

  /**
   * 通过处理器获取所有设置
   */
  getAllViaHandler: () => invokeHandler<Result<Settings>>("getSettings"),

  /**
   * 通过处理器更新设置
   * @param data 设置数据
   */
  updateViaHandler: (data: Partial<Settings>) =>
    invokeHandler<Result<Settings>>("updateSettings", data),

  /**
   * 通过处理器重置设置为默认值
   */
  resetViaHandler: () => invokeHandler<Result<Settings>>("resetSettings"),
}; 