/**
 * 主进程通信API
 * 封装与Electron主进程的通信
 */
import type { Result } from '@/types';

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

/**
 * 通用处理器调用方法
 * @param functionName 处理器函数名
 * @param args 参数
 * @returns 处理结果
 */
export async function invokeHandler<T>(functionName: string, ...args: any[]): Promise<T> {
  try {
    // 将参数转为字符串数组
    const stringArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return arg;
      }
      return JSON.stringify(arg);
    });
    // @ts-ignore - window.api由preload.js提供
    const result = await window.api.invokeHandler(functionName, stringArgs);
    return result;
  } catch (error) {
    console.error(`调用处理器[${functionName}]失败:`, error);
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
  delete: (id: string) => invoke<Result<any>>('delete-project', id),

  /**
   * 通过处理器获取所有项目
   */
  getAllViaHandler: () => invokeHandler<Result<any>>('getProjects'),

  /**
   * 通过处理器获取项目详情
   * @param id 项目ID
   */
  getByIdViaHandler: (id: string) => invokeHandler<Result<any>>('getProject', id),

  /**
   * 通过处理器创建项目
   * @param data 项目数据
   */
  createViaHandler: (data: any) => invokeHandler<Result<any>>('createProject', data),

  /**
   * 通过处理器更新项目
   * @param id 项目ID
   * @param data 更新数据
   */
  updateViaHandler: (id: string, data: any) => invokeHandler<Result<any>>('updateProject', id, data),

  /**
   * 通过处理器删除项目
   * @param id 项目ID
   */
  deleteViaHandler: (id: string) => invokeHandler<Result<any>>('deleteProject', id)
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
  delete: (id: string) => invoke<Result<any>>('delete-chapter', id),
  
  /**
   * 通过处理器获取项目下所有章节
   * @param projectId 项目ID
   */
  getByProjectIdViaHandler: (projectId: string) => invokeHandler<Result<any>>('getChaptersByProjectId', projectId),
  
  /**
   * 通过处理器获取章节详情
   * @param id 章节ID
   */
  getByIdViaHandler: (id: string) => invokeHandler<Result<any>>('getChapter', id),
  
  /**
   * 通过处理器创建章节
   * @param data 章节数据
   */
  createViaHandler: (data: any) => invokeHandler<Result<any>>('createChapter', data),
  
  /**
   * 通过处理器更新章节
   * @param id 章节ID
   * @param data 更新数据
   */
  updateViaHandler: (id: string, data: any) => invokeHandler<Result<any>>('updateChapter', id, data),
  
  /**
   * 通过处理器删除章节
   * @param id 章节ID
   */
  deleteViaHandler: (id: string) => invokeHandler<Result<any>>('deleteChapter', id)
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
  synthesizeMultiple: (chapterIds: string[]) => invoke<Result<any>>('tts:synthesize-multiple', chapterIds),
  
  /**
   * 获取语音角色列表
   * @param providerId 服务商ID
   */
  getVoiceRoles: (providerId: string) => invoke<Result<any>>('tts:get-voice-roles', providerId),
  
  /**
   * 获取情感列表
   * @param providerId 服务商ID
   */
  getEmotions: (providerId: string) => invoke<Result<any>>('tts:get-emotions', providerId),
  
  /**
   * 获取所有语音模型
   * 从models.json文件读取
   */
  getVoiceModels: () => invoke<Result<any>>('get-voice-models'),
  
  /**
   * 通过处理器合成单个章节语音
   * @param chapterId 章节ID
   */
  synthesizeViaHandler: (chapterId: string) => invokeHandler<Result<any>>('synthesizeChapter', chapterId),
  
  /**
   * 通过处理器批量合成多个章节语音
   * @param chapterIds 章节ID数组
   */
  synthesizeMultipleViaHandler: (chapterIds: string[]) => invokeHandler<Result<any>>('synthesizeMultipleChapters', chapterIds)
};

// 服务商配置API
export const serviceProviderApi = {
  /**
   * 获取所有服务商配置
   */
  getAll: () => invoke<Result<any>>('service-provider:get-all'),

  /**
   * 获取特定服务商配置
   * @param id 配置ID
   */
  getById: (id: string) => invoke<Result<any>>('service-provider:get', id),

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
  testConnection: (id: string) => invoke<Result<any>>('service-provider:test-connection', id),
  
  /**
   * 获取服务商支持的声音角色
   * @param id 服务商ID
   */
  getVoiceRoles: (id: string) => invoke<Result<any>>('service-provider:get-voice-roles', id),
  
  /**
   * 通过处理器获取所有服务商配置
   */
  getAllViaHandler: () => invokeHandler<Result<any>>('getServiceProviders'),
  
  /**
   * 通过处理器获取特定服务商配置
   * @param id 配置ID
   */
  getByIdViaHandler: (id: string) => invokeHandler<Result<any>>('getServiceProvider', id),
  
  /**
   * 通过处理器创建服务商配置
   * @param data 服务商配置数据
   */
  createViaHandler: (data: any) => invokeHandler<Result<any>>('createServiceProvider', data),
  
  /**
   * 通过处理器更新服务商配置
   * @param id 配置ID
   * @param data 更新数据
   */
  updateViaHandler: (id: string, data: any) => invokeHandler<Result<any>>('updateServiceProvider', id, data),
  
  /**
   * 通过处理器删除服务商配置
   * @param id 配置ID
   */
  deleteViaHandler: (id: string) => invokeHandler<Result<any>>('deleteServiceProvider', id),
  
  /**
   * 通过处理器测试服务商连接
   * @param id 配置ID
   */
  testConnectionViaHandler: (id: string) => invokeHandler<Result<any>>('testServiceProviderConnection', id)
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
  reset: () => invoke<Result<any>>('reset-settings'),
  
  /**
   * 获取服务商配置
   * @param provider 服务商类型 (azure, aliyun, tencent, baidu)
   */
  getProviderSettings: (provider: string) => invoke<Result<any>>('get-provider-settings', provider),
  
  /**
   * 更新服务商配置
   * @param provider 服务商类型 (azure, aliyun, tencent, baidu)
   * @param data 服务商配置数据
   */
  updateProviderSettings: (provider: string, data: any) => invoke<Result<any>>('update-provider-settings', provider, data),
  
  /**
   * 通过处理器获取所有设置
   */
  getAllViaHandler: () => invokeHandler<Result<any>>('getSettings'),
  
  /**
   * 通过处理器更新设置
   * @param data 设置数据
   */
  updateViaHandler: (data: any) => invokeHandler<Result<any>>('updateSettings', data),
  
  /**
   * 通过处理器重置设置为默认值
   */
  resetViaHandler: () => invokeHandler<Result<any>>('resetSettings')
}; 