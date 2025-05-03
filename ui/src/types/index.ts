/**
 * 应用通用类型定义
 * 导出所有类型以便统一引用
 */

// 导出API相关类型
export * from './api';

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