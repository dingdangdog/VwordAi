/**
 * 主进程通信API
 * 封装与Electron主进程的通信
 */
import { Result } from '@/types';

/**
 * 通用请求方法
 * @param channel IPC通道名称
 * @param args 参数
 * @returns 处理结果
 */
export async function invoke<T>(channel: string, ...args: any[]): Promise<T> {
  try {
    // @ts-ignore - window.electron由preload.js提供
    const result = await window.electron.invoke(channel, ...args);
    return result;
  } catch (error) {
    console.error(`调用[${channel}]失败:`, error);
    throw error;
  }
}

// 项目相关API
export const projectApi = {
  /**
   * 获取所有项目
   */
  getAll: () => invoke<Result<any>>('get-projects'),

  /**
   * 获取项目详情
   * @param id 项目ID
   */
  getById: (id: string) => invoke<Result<any>>('get-project', id),

  /**
   * 创建项目
   * @param data 项目数据
   */
  create: (data: any) => invoke<Result<any>>('create-project', data),

  /**
   * 更新项目
   * @param id 项目ID
   * @param data 更新数据
   */
  update: (id: string, data: any) => invoke<Result<any>>('update-project', id, data),

  /**
   * 删除项目
   * @param id 项目ID
   */
  delete: (id: string) => invoke<Result<any>>('delete-project', id)
};

// 章节相关API
export const chapterApi = {
  /**
   * 获取项目下所有章节
   * @param projectId 项目ID
   */
  getByProjectId: (projectId: string) => invoke<Result<any>>('get-chapters-by-project-id', projectId),

  /**
   * 获取章节详情
   * @param id 章节ID
   */
  getById: (id: string) => invoke<Result<any>>('get-chapter', id),

  /**
   * 创建章节
   * @param data 章节数据
   */
  create: (data: any) => invoke<Result<any>>('create-chapter', data),

  /**
   * 更新章节
   * @param id 章节ID
   * @param data 更新数据
   */
  update: (id: string, data: any) => invoke<Result<any>>('update-chapter', id, data),

  /**
   * 删除章节
   * @param id 章节ID
   */
  delete: (id: string) => invoke<Result<any>>('delete-chapter', id)
};

// 语音合成API
export const ttsApi = {
  /**
   * 合成单个章节语音
   * @param chapterId 章节ID
   */
  synthesize: (chapterId: string) => invoke<Result<any>>('tts:synthesize', chapterId),

  /**
   * 批量合成多个章节语音
   * @param chapterIds 章节ID数组
   */
  synthesizeMultiple: (chapterIds: string[]) => invoke<Result<any>>('tts:synthesize-multiple', chapterIds)
};

// 服务商配置API
export const serviceProviderApi = {
  /**
   * 获取所有服务商配置
   */
  getAll: () => invoke<Result<any>>('service-provider:get-all'),

  /**
   * 创建服务商配置
   * @param data 服务商配置数据
   */
  create: (data: any) => invoke<Result<any>>('service-provider:create', data),

  /**
   * 更新服务商配置
   * @param id 配置ID
   * @param data 更新数据
   */
  update: (id: string, data: any) => invoke<Result<any>>('service-provider:update', id, data),

  /**
   * 删除服务商配置
   * @param id 配置ID
   */
  delete: (id: string) => invoke<Result<any>>('service-provider:delete', id),

  /**
   * 测试服务商连接
   * @param id 配置ID
   */
  testConnection: (id: string) => invoke<Result<any>>('service-provider:test-connection', id)
};

// 设置API
export const settingsApi = {
  /**
   * 获取所有设置
   */
  getAll: () => invoke<Result<any>>('get-settings'),

  /**
   * 获取单个设置项
   * @param key 设置键名
   */
  get: (key: string) => invoke<Result<any>>('get-setting', key),

  /**
   * 更新设置
   * @param data 设置数据
   */
  update: (data: any) => invoke<Result<any>>('update-settings', data),

  /**
   * 获取默认导出路径
   */
  getDefaultExportPath: () => invoke<Result<any>>('get-default-export-path'),

  /**
   * 设置默认导出路径
   * @param path 路径
   */
  setDefaultExportPath: (path: string) => invoke<Result<any>>('set-default-export-path', path),

  /**
   * 重置设置为默认值
   */
  reset: () => invoke<Result<any>>('reset-settings')
}; 