/**
 * B站直播相关API模块
 */
import type { Result } from "@/types";
import { invoke } from "@/utils/apiBase";
import type {
  BiliLiveConfig,
  AzureConfig,
  AlibabaConfig,
  SoVITSConfig,
} from "@/services/BiliLiveService";

/**
 * B站直播API
 */
export const biliLiveApi = {
  /**
   * 连接B站直播间
   * @param {string | number} roomId 房间ID
   * @returns {Promise<Result<any>>} 连接结果
   */
  connect: (roomId: string | number): Promise<Result<boolean>> => {
    try {
      return invoke<Result<boolean>>("bililive:connect", roomId);
    } catch (error) {
      console.error("连接B站直播间失败:", error);
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : "连接失败",
        data: false,
      });
    }
  },

  /**
   * 断开与B站直播间的连接
   * @returns {Promise<Result<any>>} 断开连接结果
   */
  disconnect: (): Promise<Result<boolean>> => {
    try {
      return invoke<Result<boolean>>("bililive:disconnect");
    } catch (error) {
      console.error("断开B站直播连接失败:", error);
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : "断开连接失败",
        data: false,
      });
    }
  },

  /**
   * 获取B站直播配置
   * @returns {Promise<Result<any>>} 配置信息
   */
  getConfig: (): Promise<Result<BiliLiveConfig>> => {
    try {
      return invoke<Result<BiliLiveConfig>>("bililive:get-config");
    } catch (error) {
      console.error("获取B站直播配置失败:", error);
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : "获取配置失败",
        data: null as any,
      });
    }
  },

  /**
   * 获取B站默认配置
   * @returns {Promise<Result<any>>} 默认配置信息
   */
  getDefaultConfig: (): Promise<Result<BiliLiveConfig>> => {
    try {
      return invoke<Result<BiliLiveConfig>>("bililive:get-default-config");
    } catch (error) {
      console.error("获取B站默认配置失败:", error);
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : "获取默认配置失败",
        data: null as any,
      });
    }
  },

  /**
   * 保存B站配置
   * @param {any} config 配置数据
   * @returns {Promise<Result<any>>} 保存结果
   */
  saveBiliConfig: (config: BiliLiveConfig): Promise<Result<boolean>> => {
    try {
      return invoke<Result<boolean>>(
        "bililive:save-bili-config",
        JSON.parse(JSON.stringify(config))
      );
    } catch (error) {
      console.error("保存B站配置失败:", error);
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : "保存配置失败",
        data: false,
      });
    }
  },

  /**
   * 保存TTS模式
   * @param {string} mode TTS模式
   * @returns {Promise<Result<any>>} 保存结果
   */
  saveTTSMode: (mode: string): Promise<Result<boolean>> => {
    try {
      return invoke<Result<boolean>>("bililive:save-tts-mode", mode);
    } catch (error) {
      console.error("保存TTS模式失败:", error);
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : "保存TTS模式失败",
        data: false,
      });
    }
  },

  /**
   * 保存Azure配置
   * @param {any} config 配置数据
   * @returns {Promise<Result<any>>} 保存结果
   */
  saveAzureConfig: (config: AzureConfig): Promise<Result<boolean>> => {
    try {
      return invoke<Result<boolean>>("bililive:save-azure-config", {
        ...config,
      });
    } catch (error) {
      console.error("保存Azure配置失败:", error);
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : "保存Azure配置失败",
        data: false,
      });
    }
  },

  /**
   * 保存阿里云配置
   * @param {any} config 配置数据
   * @returns {Promise<Result<any>>} 保存结果
   */
  saveAlibabaConfig: (config: AlibabaConfig): Promise<Result<boolean>> => {
    try {
      return invoke<Result<boolean>>("bililive:save-alibaba-config", {
        ...config,
      });
    } catch (error) {
      console.error("保存阿里云配置失败:", error);
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : "保存阿里云配置失败",
        data: false,
      });
    }
  },

  /**
   * 保存SoVITS配置
   * @param {any} config 配置数据
   * @returns {Promise<Result<any>>} 保存结果
   */
  saveSovitsConfig: (config: SoVITSConfig): Promise<Result<boolean>> => {
    try {
      return invoke<Result<boolean>>("bililive:save-sovits-config", {
        ...config,
      });
    } catch (error) {
      console.error("保存SoVITS配置失败:", error);
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : "保存SoVITS配置失败",
        data: false,
      });
    }
  },

  /**
   * 测试TTS语音
   * @param {string} text 测试文本
   * @returns {Promise<Result<any>>} 测试结果
   */
  testTTS: (text: string): Promise<Result<{ audioUrl?: string }>> => {
    try {
      return invoke<Result<{ audioUrl?: string }>>("bililive:test-tts", text);
    } catch (error) {
      console.error("测试TTS失败:", error);
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : "测试TTS失败",
        data: {},
      });
    }
  },

  /**
   * 获取可用的TTS声音列表
   * @returns {Promise<Result<any>>} 声音列表
   */
  getAvailableVoices: (): Promise<Result<{ voices: string[] }>> => {
    try {
      return invoke<Result<{ voices: string[] }>>(
        "bililive:get-available-voices"
      );
    } catch (error) {
      console.error("获取可用声音列表失败:", error);
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : "获取声音列表失败",
        data: { voices: [] },
      });
    }
  },

  /**
   * 保存本地TTS配置
   * @param {string} voice 声音名称
   * @returns {Promise<Result<any>>} 保存结果
   */
  saveLocalConfig: (voice: string): Promise<Result<boolean>> => {
    try {
      return invoke<Result<boolean>>("bililive:save-local-config", voice);
    } catch (error) {
      console.error("保存本地TTS配置失败:", error);
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : "保存本地TTS配置失败",
        data: false,
      });
    }
  },
};
