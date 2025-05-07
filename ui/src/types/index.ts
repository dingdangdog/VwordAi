/**
 * 应用通用类型定义
 * 导出所有类型以便统一引用
 */

// 导出API相关类型
export * from './api';

// 服务商配置状态
export type ServiceProviderStatus = "unconfigured" | "untested" | "success" | "failure";

// 文件名规则类型
export type FileNamingRule = "default" | "custom" | "chapter_name" | "chapter_index";

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
export type ServiceProviderType = "azure" | "aliyun" | "tencent" | "baidu" | "openai";

// 连接测试结果
export interface ConnectionTestResult {
  success: boolean;
  message: string;
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