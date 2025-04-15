/**
 * 应用通用类型定义
 */

// 项目数据结构
export interface Project {
  id: string; // 项目ID (可以使用 UUID)
  name: string; // 项目名称
  description?: string; // 项目描述 (可选)
  defaultSettings: TTSSettings;
  createdAt: Date;
  updatedAt: Date;
}

// 章节数据结构
export interface Chapter {
  id: string; // 章节ID (可以使用 UUID)
  projectId: string; // 所属项目ID
  name: string; // 章节名称
  text: string; // 章节文本内容
  settings: TTSSettings;
  createdAt: Date;
  updatedAt: Date;
}

// 语音合成参数设置
export interface TTSSettings {
  serviceProvider?: string;
  voiceRole?: string;
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
  createdAt: Date;
  updatedAt: Date;
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
  data?: T;
  error?: string;
}

// 应用设置
export interface AppSettings {
  theme: 'light' | 'dark'; // 主题
  defaultExportPath?: string; // 默认导出路径
  // 其他应用设置
  [key: string]: any;
} 