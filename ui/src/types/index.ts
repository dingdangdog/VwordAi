/**
 * 应用通用类型定义
 */

// 项目数据结构
export interface Project {
  id: string;
  title: string;
  description: string;
  author: string;
  createAt: string;
  updateAt: string;
  coverImage: string | null;
  tags: string[];
  wordCount: number;
  chapterCount: number;
  defaultVoiceSettings?: VoiceSettings;
}

// 章节数据结构
export interface Chapter {
  id: string;
  projectId: string;
  name: string;
  order: number;
  text: string;
  wordCount: number;
  createAt: string;
  updateAt: string;
  settings: VoiceSettings;
  audioPath?: string;
  status?: ChapterStatus;
}

// 语音合成参数设置
// export interface VoiceSettings {
//   serviceProvider?: string;
//   voice?: string;
//   speed?: number; // 语速
//   pitch?: number; // 音调
//   volume?: number; // 音量
//   emotion?: string; // 情感 (可选)
//   [key: string]: any; // 其他服务商特定的参数
// }

// 服务商类型
export type ServiceProviderType =
  | "azure"
  | "aliyun"
  | "tencent"
  | "baidu"
  | "openai";

// 配置文件中的服务商配置
export interface AzureConfig {
  key: string;
  region: string;
  endpoint: string;
}

export interface AliyunConfig {
  appkey: string;
  token: string;
  endpoint: string;
}

export interface TencentConfig {
  secretId: string;
  secretKey: string;
  endpoint: string;
}

export interface BaiduConfig {
  apiKey: string;
  secretKey: string;
  endpoint: string;
}

export interface OpenaiConfig {
  apiKey: string;
  endpoint: string;
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
  theme: "light" | "dark"; // 主题
  defaultExportPath?: string; // 默认导出路径
  // 其他应用设置
  [key: string]: any;
}

/**
 * 章节状态
 */
export enum ChapterStatus {
  DRAFT = "draft",
  READY = "ready",
  PROCESSING = "processing",
  COMPLETED = "completed",
  ERROR = "error",
}

/**
 * 章节语音合成设置
 */
export interface VoiceSettings {
  serviceProvider: string | null;
  voice: string | null;
  speed: number;
  emotion?: string;
  pitch: number;
  volume: number;
  style?: string;
}

/**
 * 语音模型接口，用于从models.json中获取模型数据
 */
export interface VoiceModel {
  provider: ServiceProviderType; // 服务提供商
  lang: string; // 语言
  gender: string; // 性别：0-女性，1-男性
  name: string; // 名称
  code: string; // 唯一代码
  level?: string; // 级别，可选
  emotions?: Array<VoiceOption>;
  options?: Array<VoiceOption>;
}

interface VoiceOption {
  name: string;
  code: string;
  desc: string;
}

/**
 * 全局设置接口
 */
export interface Settings {
  theme: "light" | "dark";
  language: string;
  defaultExportPath: string;
  outputFormat: "mp3" | "wav";
  azure: AzureConfig;
  aliyun: AliyunConfig;
  tencent: TencentConfig;
  baidu: BaiduConfig;
  openai: OpenaiConfig;
  defaultVoiceSettings: VoiceSettings;
  autoSave: boolean;
  autoSaveInterval: number;
  maxConcurrentTasks: number;
  fileNamingRule: string;
  customNamingFormat: string;
}

/**
 * 语音合成结果接口
 */
export interface SynthesisResult {
  chapterId: string;
  outputPath: string;
  settings: VoiceSettings;
}

/**
 * 连接测试结果接口
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
}
