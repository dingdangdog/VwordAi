/**
 * 语音合成API模块
 */
import type { Result, TTSSynthesisResponse, TTSProviderType } from "@/types";
import { invoke } from "@/utils/apiBase";

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
   * 测试服务商配置连接
   * @param providerType 服务商类型
   */
  testProviderConnection: (providerType: string) =>
    invoke<Result<{message: string}>>("tts:test-provider-connection", providerType),


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


};