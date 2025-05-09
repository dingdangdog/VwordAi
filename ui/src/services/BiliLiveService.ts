import type { Result } from "@/types";
import { biliLiveApi } from "@/api";

// B站直播配置类型
export interface BiliLiveConfig {
  SESSDATA: string;
  room_ids: Array<{ id: number | string; name: string }>;
  ttsEnabled: boolean;
  readDanmaku: boolean;
  readGift: boolean;
  readEnter: boolean;
  readLike: boolean;
  recordDanmaku: boolean;
  recordGift: boolean;
  recordVisitor: boolean;
  localVoice?: string;
  tts?: {
    mode: string;
    azure?: AzureConfig;
    alibaba?: AlibabaConfig;
    sovits?: SoVITSConfig;
  };
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

/**
 * B站直播服务实现
 */
const biliLiveService = {
  /**
   * 加载配置
   * @returns {Promise<Result<BiliLiveConfig>>} 配置信息
   */
  loadConfig: async (): Promise<Result<BiliLiveConfig>> => {
    return biliLiveApi.getConfig();
  },

  /**
   * 保存B站配置
   * @param {BiliLiveConfig} config 配置数据
   * @returns {Promise<Result<boolean>>} 保存结果
   */
  saveBiliConfig: async (config: BiliLiveConfig): Promise<Result<boolean>> => {
    return biliLiveApi.saveBiliConfig(config);
  },

  /**
   * 保存TTS模式
   * @param {string} mode TTS模式
   * @returns {Promise<Result<boolean>>} 保存结果
   */
  saveTTSMode: async (mode: string): Promise<Result<boolean>> => {
    return biliLiveApi.saveTTSMode(mode);
  },

  /**
   * 保存Azure配置
   * @param {AzureConfig} config 配置数据
   * @returns {Promise<Result<boolean>>} 保存结果
   */
  saveAzureConfig: async (config: AzureConfig): Promise<Result<boolean>> => {
    return biliLiveApi.saveAzureConfig(config);
  },

  /**
   * 保存阿里云配置
   * @param {AlibabaConfig} config 配置数据
   * @returns {Promise<Result<boolean>>} 保存结果
   */
  saveAlibabaConfig: async (
    config: AlibabaConfig
  ): Promise<Result<boolean>> => {
    return biliLiveApi.saveAlibabaConfig(config);
  },

  /**
   * 保存SoVITS配置
   * @param {SoVITSConfig} config 配置数据
   * @returns {Promise<Result<boolean>>} 保存结果
   */
  saveSovitsConfig: async (config: SoVITSConfig): Promise<Result<boolean>> => {
    return biliLiveApi.saveSovitsConfig(config);
  },

  /**
   * 连接到直播间
   * @param {string | number} roomId 房间ID
   * @returns {Promise<Result<boolean>>} 连接结果
   */
  connect: async (roomId: string | number): Promise<Result<boolean>> => {
    return biliLiveApi.connect(roomId);
  },

  /**
   * 断开连接
   * @returns {Promise<Result<boolean>>} 断开连接结果
   */
  disconnect: async (): Promise<Result<boolean>> => {
    return biliLiveApi.disconnect();
  },

  /**
   * 测试TTS
   * @param {string} text 测试文本
   * @returns {Promise<Result<any>>} 测试结果
   */
  testTTS: async (text: string): Promise<Result<{ audioUrl?: string }>> => {
    return biliLiveApi.testTTS(text);
  },

  /**
   * 获取可用的TTS声音
   * @returns {Promise<Result<{ voices: string[] }>>} 声音列表
   */
  getAvailableVoices: async (): Promise<Result<{ voices: string[] }>> => {
    return biliLiveApi.getAvailableVoices();
  },

  /**
   * 保存本地TTS配置
   * @param {string} voice 声音名称
   * @returns {Promise<Result<boolean>>} 保存结果
   */
  saveLocalConfig: async (voice: string): Promise<Result<boolean>> => {
    return biliLiveApi.saveLocalConfig(voice);
  },
};

export default biliLiveService;
