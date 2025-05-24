/**
 * API类型定义文件
 * 定义API请求和响应的接口类型
 */

// 通用结果类型
export interface Result<T> {
  success: boolean;
  error?: string;
  data: T;
}

// 语音设置类型
export interface VoiceSettings {
  serviceProvider: string | null;
  voice: string | null;
  speed: number;
  pitch: number;
  volume: number;
  emotion?: string;
  style?: string;
  [key: string]: any;
}

// 语音模型类型
export interface VoiceModel {
  code: string;
  name: string;
  provider: string;
  lang: string;
  gender?: string;
  description?: string;
  emotions?: Array<{
    code: string;
    name: string;
  }>;
  styles?: Array<{
    code: string;
    name: string;
  }>;
  roles?: Array<{
    code: string;
    name: string;
  }>;
}

// TTS合成响应
export interface TTSSynthesisResponse {
  chapterId?: string;
  audioUrl?: string;
  outputPath?: string;
  settings?: string;
}

// 应用设置类型
export interface Settings {
  theme: "light" | "dark";
  defaultExportPath: string;
  azure?: AzureProviderSettings;
  aliyun?: AliyunProviderSettings;
  tencent?: TencentProviderSettings;
  baidu?: BaiduProviderSettings;
  openai?: OpenAIProviderSettings;
  [key: string]: any;
}

// Azure服务商设置
export interface AzureProviderSettings {
  key: string;
  region: string;
  [key: string]: any;
}

// 阿里云服务商设置
export interface AliyunProviderSettings {
  appKey: string;
  accessToken: string;
  [key: string]: any;
}

// 腾讯云服务商设置
export interface TencentProviderSettings {
  secretId: string;
  secretKey: string;
  [key: string]: any;
}

// 百度云服务商设置
export interface BaiduProviderSettings {
  apiKey: string;
  secretKey: string;
  [key: string]: any;
}

// OpenAI服务商设置
export interface OpenAIProviderSettings {
  apiKey: string;
  [key: string]: any;
}

// 连接测试结果
export interface ConnectionTestResult {
  success: boolean;
  message: string;
}
