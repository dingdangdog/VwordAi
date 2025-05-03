import type { Result } from "@/types";
import { biliLiveApi } from "@/api";
import { createErrorHandler } from "@/utils/apiBase";

// B站直播配置类型
export interface BiliLiveConfig {
  SESSDATA: string;
  room_ids: Array<{id: number | string, name: string}>;
  ttsEnabled: boolean;
  readDanmaku: boolean;
  readGift: boolean;
  readEnter: boolean;
  readLike: boolean;
  [key: string]: any;
}

// TTS配置类型
export interface TTSConfig {
  mode: string;
  [key: string]: any;
}

// Azure TTS配置类型
export interface AzureConfig {
  azure_key: string;
  azure_region: string;
  azure_model: string;
  speed: number;
  pitch: number;
  [key: string]: any;
}

// 阿里云TTS配置类型
export interface AlibabaConfig {
  alibaba_appkey: string;
  alibaba_token: string;
  alibaba_model: string;
  speed: number;
  [key: string]: any;
}

// SoVITS TTS配置类型
export interface SoVITSConfig {
  sovits_host: string;
  sovits_model: string;
  sovits_language: string;
  sovits_speed: string;
  [key: string]: any;
}

// 错误处理工具
const handleError = createErrorHandler("BiliLiveService");

/**
 * B站直播服务类
 * 单例模式实现，提供与B站直播相关的所有服务
 */
export class BiliLiveService {
  private static instance: BiliLiveService;
  private config: BiliLiveConfig | null = null;
  private ttsConfig: TTSConfig | null = null;
  private azureConfig: AzureConfig | null = null;
  private alibabaConfig: AlibabaConfig | null = null;
  private sovitsConfig: SoVITSConfig | null = null;

  /**
   * 私有构造函数，强制使用单例模式
   */
  private constructor() {
    console.log("BiliLiveService 实例已创建");
  }

  /**
   * 获取实例（单例模式）
   * @returns BiliLiveService实例
   */
  public static getInstance(): BiliLiveService {
    if (!BiliLiveService.instance) {
      BiliLiveService.instance = new BiliLiveService();
    }
    return BiliLiveService.instance;
  }

  /**
   * 加载配置
   * @returns 配置数据
   */
  public async loadConfig(): Promise<Result<any>> {
    try {
      console.log("正在加载B站直播配置...");
      const response = await biliLiveApi.getConfig();
      
      if (response.success && response.data) {
        this.config = response.data;
        console.log("B站直播配置加载成功");
        
        // 记录SESSDATA长度，不记录具体内容
        const sessdataLength = this.config?.SESSDATA ? this.config.SESSDATA.length : 0;
        console.log(`SESSDATA长度: ${sessdataLength}`);
      } else {
        console.warn("B站直播配置加载失败:", response.error);
      }
      
      return response;
    } catch (error) {
      return handleError(error, "加载配置失败");
    }
  }

  /**
   * 获取默认配置
   * @returns 默认配置数据
   */
  public async getDefaultConfig(): Promise<Result<any>> {
    try {
      console.log("正在获取B站直播默认配置...");
      return biliLiveApi.getDefaultConfig();
    } catch (error) {
      return handleError(error, "获取默认配置失败");
    }
  }

  /**
   * 保存B站配置
   * @param config B站配置
   * @returns 保存结果
   */
  public async saveBiliConfig(config: BiliLiveConfig): Promise<Result<any>> {
    try {
      console.log("正在保存B站配置...");
      // 记录SESSDATA长度，不记录具体内容
      const sessdataLength = config.SESSDATA ? config.SESSDATA.length : 0;
      console.log(`将要保存的SESSDATA长度: ${sessdataLength}`);
      
      const response = await biliLiveApi.saveBiliConfig(config);
      
      if (response.success) {
        this.config = { ...this.config, ...config };
        console.log("B站配置保存成功");
      } else {
        console.warn("B站配置保存失败:", response.error);
      }
      
      return response;
    } catch (error) {
      return handleError(error, "保存B站配置失败");
    }
  }

  /**
   * 保存TTS模式
   * @param mode TTS模式
   * @returns 保存结果
   */
  public async saveTTSMode(mode: string): Promise<Result<any>> {
    try {
      console.log(`正在保存TTS模式: ${mode}`);
      const response = await biliLiveApi.saveTTSMode(mode);
      
      if (response.success) {
        if (this.ttsConfig) {
          this.ttsConfig.mode = mode;
        } else {
          this.ttsConfig = { mode };
        }
        console.log(`TTS模式已更新为: ${mode}`);
      } else {
        console.warn("TTS模式保存失败:", response.error);
      }
      
      return response;
    } catch (error) {
      return handleError(error, "保存TTS模式失败");
    }
  }

  /**
   * 保存Azure配置
   * @param config Azure配置
   * @returns 保存结果
   */
  public async saveAzureConfig(config: AzureConfig): Promise<Result<any>> {
    try {
      console.log("正在保存Azure TTS配置...");
      const response = await biliLiveApi.saveAzureConfig(config);
      
      if (response.success) {
        this.azureConfig = config;
        console.log("Azure TTS配置保存成功");
      } else {
        console.warn("Azure TTS配置保存失败:", response.error);
      }
      
      return response;
    } catch (error) {
      return handleError(error, "保存Azure配置失败");
    }
  }

  /**
   * 保存阿里云配置
   * @param config 阿里云配置
   * @returns 保存结果
   */
  public async saveAlibabaConfig(config: AlibabaConfig): Promise<Result<any>> {
    try {
      console.log("正在保存阿里云 TTS配置...");
      const response = await biliLiveApi.saveAlibabaConfig(config);
      
      if (response.success) {
        this.alibabaConfig = config;
        console.log("阿里云 TTS配置保存成功");
      } else {
        console.warn("阿里云 TTS配置保存失败:", response.error);
      }
      
      return response;
    } catch (error) {
      return handleError(error, "保存阿里云配置失败");
    }
  }

  /**
   * 保存SoVITS配置
   * @param config SoVITS配置
   * @returns 保存结果
   */
  public async saveSovitsConfig(config: SoVITSConfig): Promise<Result<any>> {
    try {
      console.log("正在保存SoVITS TTS配置...");
      const response = await biliLiveApi.saveSovitsConfig(config);
      
      if (response.success) {
        this.sovitsConfig = config;
        console.log("SoVITS TTS配置保存成功");
      } else {
        console.warn("SoVITS TTS配置保存失败:", response.error);
      }
      
      return response;
    } catch (error) {
      return handleError(error, "保存SoVITS配置失败");
    }
  }

  /**
   * 连接B站直播间
   * @param roomId 房间ID
   * @returns 连接结果
   */
  public async connect(roomId: string | number): Promise<Result<any>> {
    try {
      console.log(`正在连接B站直播间 ${roomId}...`);
      return biliLiveApi.connect(roomId);
    } catch (error) {
      return handleError(error, "连接B站直播间失败");
    }
  }

  /**
   * 断开B站直播连接
   * @returns 断开结果
   */
  public async disconnect(): Promise<Result<any>> {
    try {
      console.log("正在断开B站直播连接...");
      return biliLiveApi.disconnect();
    } catch (error) {
      return handleError(error, "断开B站直播连接失败");
    }
  }

  /**
   * 测试TTS语音
   * @param text 测试文本
   * @returns 测试结果
   */
  public async testTTS(text: string): Promise<Result<any>> {
    try {
      console.log(`正在测试TTS, 文本: "${text}"`);
      return biliLiveApi.testTTS(text);
    } catch (error) {
      return handleError(error, "测试TTS失败");
    }
  }
  
  /**
   * 获取当前配置
   * @returns 配置对象
   */
  public getConfig(): BiliLiveConfig | null {
    return this.config;
  }
}

// 创建单例实例
const biliLiveService = BiliLiveService.getInstance();
export default biliLiveService; 