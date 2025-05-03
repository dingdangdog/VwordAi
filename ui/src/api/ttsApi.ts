/**
 * 语音合成API模块
 */
import type { Result, TTSSynthesisResponse, VoiceModel, ServiceProviderType } from "@/types";
import { invoke, invokeHandler } from "@/utils/apiBase";

/**
 * 语音合成API
 */
export const ttsApi = {
  /**
   * 合成单个章节语音
   * @param chapterId 章节ID
   */
  synthesize: (chapterId: string) =>
    invoke<Result<TTSSynthesisResponse>>("tts:synthesize", chapterId),

  /**
   * 批量合成多个章节语音
   * @param chapterIds 章节ID数组
   */
  synthesizeMultiple: (chapterIds: string[]) =>
    invoke<Result<Record<string, TTSSynthesisResponse>>>("tts:synthesize-multiple", chapterIds),

  /**
   * 获取语音角色列表
   * @param providerId 服务商ID
   */
  getVoiceRoles: (providerId: string) =>
    invoke<Result<any[]>>("tts:get-voice-roles", providerId),

  /**
   * 获取情感列表
   * @param providerId 服务商ID
   */
  getEmotions: (providerId: string) =>
    invoke<Result<string[]>>("tts:get-emotions", providerId),

  /**
   * 获取所有语音模型
   * 从models.json文件读取
   */
  getVoiceModels: () => invoke<Result<VoiceModel[]>>("get-voice-models"),

  /**
   * 测试服务商配置连接
   * @param providerType 服务商类型
   */
  testProviderConnection: (providerType: string) =>
    invoke<Result<{message: string}>>("tts:test-provider-connection", providerType),

  /**
   * 通过处理器合成单个章节语音
   * @param chapterId 章节ID
   */
  synthesizeViaHandler: (chapterId: string) =>
    invokeHandler<Result<TTSSynthesisResponse>>("synthesizeChapter", chapterId),

  /**
   * 通过处理器批量合成多个章节语音
   * @param chapterIds 章节ID数组
   */
  synthesizeMultipleViaHandler: (chapterIds: string[]) =>
    invokeHandler<Result<Record<string, TTSSynthesisResponse>>>("synthesizeMultipleChapters", chapterIds),
};

/**
 * 服务商配置API
 */
export const serviceProviderApi = {
  /**
   * 获取所有服务商配置
   */
  getAll: () => invoke<Result<any[]>>("service-provider:get-all"),

  /**
   * 获取特定服务商配置
   * @param id 配置ID
   */
  getById: (id: string) => invoke<Result<any>>("service-provider:get", id),

  /**
   * 创建服务商配置
   * @param data 服务商配置数据
   */
  create: (data: any) => invoke<Result<any>>("service-provider:create", data),

  /**
   * 更新服务商配置
   * @param id 配置ID
   * @param data 更新数据
   */
  update: (id: string, data: any) =>
    invoke<Result<any>>("service-provider:update", id, data),

  /**
   * 删除服务商配置
   * @param id 配置ID
   */
  delete: (id: string) => invoke<Result<boolean>>("service-provider:delete", id),

  /**
   * 测试服务商连接
   * @param id 配置ID
   */
  testConnection: (id: string) =>
    invoke<Result<{message: string}>>("service-provider:test-connection", id),

  /**
   * 获取服务商支持的声音角色
   * @param id 服务商ID
   */
  getVoiceRoles: (id: string) =>
    invoke<Result<any[]>>("service-provider:get-voice-roles", id),

  /**
   * 通过处理器获取所有服务商配置
   */
  getAllViaHandler: () => invokeHandler<Result<any[]>>("getServiceProviders"),

  /**
   * 通过处理器获取特定服务商配置
   * @param id 配置ID
   */
  getByIdViaHandler: (id: string) =>
    invokeHandler<Result<any>>("getServiceProvider", id),

  /**
   * 通过处理器创建服务商配置
   * @param data 服务商配置数据
   */
  createViaHandler: (data: any) =>
    invokeHandler<Result<any>>("createServiceProvider", data),

  /**
   * 通过处理器更新服务商配置
   * @param id 配置ID
   * @param data 更新数据
   */
  updateViaHandler: (id: string, data: any) =>
    invokeHandler<Result<any>>("updateServiceProvider", id, data),

  /**
   * 通过处理器删除服务商配置
   * @param id 配置ID
   */
  deleteViaHandler: (id: string) =>
    invokeHandler<Result<boolean>>("deleteServiceProvider", id),

  /**
   * 通过处理器测试服务商连接
   * @param id 配置ID
   */
  testConnectionViaHandler: (id: string) =>
    invokeHandler<Result<{message: string}>>("testServiceProviderConnection", id),
}; 