/**
 * 应用通用类型定义
 */

// 项目数据结构
export interface Project {
  id: string;
  title: string;
  description: string;
  author: string;
  createBy: string;
  updateBy: string;
  coverImage: string | null;
  tags: string[];
  wordCount: number;
  chapterCount: number;
  defaultVoiceSettings?: ChapterSettings;
}

// 章节数据结构
export interface Chapter {
  id: string;
  projectId: string;
  name: string;
  order: number;
  text: string;
  wordCount: number;
  createBy: string;
  updateBy: string;
  settings: ChapterSettings;
  audioPath?: string;
  status?: ChapterStatus;
}

// 语音合成参数设置
export interface TTSSettings {
  serviceProvider?: string;
  voice?: string;
  speed?: number; // 语速
  pitch?: number; // 音调
  volume?: number; // 音量
  emotion?: string; // 情感 (可选)
  [key: string]: any; // 其他服务商特定的参数
}

// 服务商配置基类
export interface ServiceProviderConfig {
  id: string; // 服务商配置ID (可以使用 UUID)
  name: string; // 服务商名称 (例如：阿里云)
  apiKey: string; // API 密钥
  secretKey?: string; // Secret 密钥 (可选)
  createAt: Date;
  updateAt: Date;
  // 其他服务商需要的密钥字段
  [key: string]: string | Date | undefined;
}

// 服务商类型
export type ServiceProviderType = 'azure' | 'aliyun' | 'tencent' | 'baidu';

// 微软 Azure TTS 服务商配置
export interface AzureServiceProviderConfig extends ServiceProviderConfig {
  region: string; // Azure 区域
  endpoint?: string; // 自定义终端节点 (可选)
}

// 阿里云 TTS 服务商配置
export interface AliyunServiceProviderConfig extends ServiceProviderConfig {
  regionId: string; // 地域ID
  accessKeyId: string; // Access Key ID (apiKey 映射至此字段)
  accessKeySecret: string; // Access Key Secret (secretKey 映射至此字段)
  appKey?: string; // 应用 ID (可选，某些服务需要)
}

// 腾讯云 TTS 服务商配置
export interface TencentServiceProviderConfig extends ServiceProviderConfig {
  region: string; // 地域
  secretId: string; // Secret ID (apiKey 映射至此字段)
  secretKey: string; // Secret Key
  appId: string; // 应用 ID
}

// 百度智能云 TTS 服务商配置
export interface BaiduServiceProviderConfig extends ServiceProviderConfig {
  appId: string; // 应用 ID
  apiKey: string; // API Key
  secretKey: string; // Secret Key
  token?: string; // 访问令牌 (可选，有些接口需要)
}

// API响应结果
export interface Result<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: number;
}

// 应用设置
export interface AppSettings {
  theme: 'light' | 'dark'; // 主题
  defaultExportPath?: string; // 默认导出路径
  // 其他应用设置
  [key: string]: any;
}

/**
 * 章节状态
 */
export enum ChapterStatus {
  DRAFT = 'draft',
  READY = 'ready',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * 章节语音合成设置
 */
export interface ChapterSettings {
  serviceProvider: string | null;
  voice: string | null;
  speed: number;
  pitch: number;
  volume: number;
  emotion?: string;
  style?: string;
}

/**
 * 服务商配置接口
 */
export interface ServiceProvider {
  id: string;
  name: string;
  type: string;
  apiKey: string;
  apiSecret: string;
  region?: string;
  endpoint?: string;
  enabled: boolean;
  createBy: string;
  updateBy: string;
  config: Record<string, any>;
}

/**
 * 语音角色接口
 */
export interface VoiceRole {
  id: string;
  name: string;
  gender: 'male' | 'female';
  language: string;
  description?: string;
}

/**
 * 全局设置接口
 */
export interface Settings {
  theme: 'light' | 'dark';
  language: string;
  defaultExportPath: string;
  outputFormat: 'mp3' | 'wav';
  defaultVoiceSettings: ChapterSettings;
  autoSave: boolean;
  autoSaveInterval: number;
  maxConcurrentTasks: number;
}

/**
 * 语音合成结果接口
 */
export interface SynthesisResult {
  chapterId: string;
  outputPath: string;
  settings: ChapterSettings;
}

/**
 * 连接测试结果接口
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
} 