/**
 * 应用通用类型定义
 * 导出所有类型以便统一引用
 */

// 导出API相关类型
export * from "./api";

// 服务商配置状态
export type ServiceProviderStatus =
  | "unconfigured"
  | "untested"
  | "success"
  | "failure";

// 文件名规则类型
export type FileNamingRule =
  | "default"
  | "custom"
  | "chapter_name"
  | "chapter_index";

// 语音合成结果类型
export interface SynthesisResult {
  chapterId: string;
  outputPath: string;
  audioUrl?: string;
  settings: any;
}

// 应用配置类型
export interface AppConfig {
  name: string;
  version: string;
  releaseDate: string;
  copyright: string;
  description: string;
  website: string;
  github: string;
  updateURL: string;
  enableAutoUpdate: boolean;
  updateCheckInterval: number;
}

// 服务商配置类型
export interface ServiceProviderConfig {
  status?: ServiceProviderStatus;
  [key: string]: any;
}

// 服务商类型
export type ServiceProviderType =
  | "azure"
  | "aliyun"
  | "tencent"
  | "baidu"
  | "openai"
  | "blive";

// 连接测试结果
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// 设置类型
export interface Settings {
  theme: "light" | "dark";
  defaultExportPath: string;
  language: string;
  azure: ServiceProviderConfig;
  aliyun: ServiceProviderConfig;
  tencent: ServiceProviderConfig;
  baidu: ServiceProviderConfig;
  openai: ServiceProviderConfig;
  autoSave: boolean;
  autoSaveInterval: number;
  maxConcurrentTasks: number;
  fileNamingRule: FileNamingRule;
  customNamingFormat: string;
  outputFormat: string;
  [key: string]: any;
}

// {
//   "id": "9fe5c794-73db-467e-84c7-21fc80e8720f",
//   "title": "中年危机观察：失意的一代",
//   "description": "",
//   "author": "",
//   "createAt": "2025-04-17T10:04:32.223Z",
//   "updateAt": "2025-04-17T10:05:23.539Z",
//   "coverImage": null,
//   "tags": [],
//   "wordCount": 1785,
//   "chapterCount": 1,
//   "defaultVoiceSettings": {
//     "serviceProvider": "azure",
//     "voice": "zh-CN-YunyangNeural",
//     "speed": 1,
//     "pitch": 0,
//     "volume": 100,
//     "emotion": "narration-professional"
//   }
// },

export interface Project {
  id: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
  createAt: string;
  updateAt: string;
  coverImage: string | null;
  wordCount: number;
  chapterCount: number;
  defaultVoiceSettings: any;
}

// {
//   "id": "30242dac-bbcb-4fd4-a28b-1ab6a03f0b85",
//   "projectId": "2df59cf4-c3a1-4416-893b-1b05e91c8e99",
//   "name": "章节1123",
//   "text": "12312412",
//   "settings": {
//     "serviceProvider": "azure",
//     "voice": "zh-CN-YunxiNeural",
//     "speed": 1,
//     "pitch": 1,
//     "volume": 1,
//     "emotion": "advertisement_upbeat"
//   },
//   "createAt": "2025-04-15T10:37:41.429Z",
//   "updateAt": "2025-04-16T10:06:47.548Z",
//   "audioPath": "E:\\A_output\\2df59cf4-c3a1-4416-893b-1b05e91c8e99\\章节1123_3f0b85_1744798006872.wav",
//   "status": "completed"
// },

export interface Chapter {
  id: string;
  projectId: string;
  name: string;
  text: string;
  settings: any;
  createAt: string;
  updateAt: string;
  audioPath: string;
  status: string;
  order: number;
}
