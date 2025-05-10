/**
 * TTS服务
 * 提供文本转语音功能
 */
import type {
  VoiceSettings,
  Result,
  ServiceProviderType,
  Settings,
} from "@/types";
import { ttsApi, serviceProviderApi, chapterApi } from "@/api";
import { useSettingsStore, SUPPORTED_PROVIDERS } from "@/stores/settings";
import { createErrorHandler } from "@/utils/apiBase";

// TTS 合成请求接口
interface TTSSynthesisRequest {
  text: string;
  settings: VoiceSettings;
  outputPath?: string;
}

// TTS 合成响应接口
interface TTSSynthesisResponse {
  audioUrl?: string;
  audioFilePath?: string;
  duration?: number;
}

// 错误处理工具
const handleTTSError = (error: unknown, defaultMessage: string) => {
  const errorMessage = error instanceof Error ? error.message : defaultMessage;
  console.error(`TTSService Error: ${defaultMessage}`, error);
  return {
    success: false,
    error: errorMessage,
    data: null,
  };
};

// TTS 服务类
export class TTSService {
  private static instance: TTSService;

  private constructor() {}

  public static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  // 获取设置 store
  private getSettingsStore() {
    return useSettingsStore();
  }

  // 获取支持的服务商列表
  public getSupportedProviders(): { id: string; name: string; type: string }[] {
    return SUPPORTED_PROVIDERS;
  }

  // 获取服务商配置
  public getProviderConfig(type: ServiceProviderType): any {
    const settingsStore = this.getSettingsStore();
    const settings = settingsStore.getAllSettings();
    if (!settings) {
      return null;
    }
    return settings[type];
  }

  // 获取特定服务商支持的语音角色
  public async getVoiceRoles(
    serviceProviderType: ServiceProviderType
  ): Promise<Result<any[]>> {
    try {
      // 检查服务商配置是否存在
      const config = this.getProviderConfig(serviceProviderType);
      if (!config) {
        return { success: false, error: "服务商配置不存在", data: [] };
      }

      // Use static data instead of API calls
      const { getVoiceModelsByProvider } = await import('@/utils/voice-utils');
      const models = getVoiceModelsByProvider(serviceProviderType);
      
      // Convert to the expected format for backwards compatibility
      const roles = models.map(model => ({
        id: model.code,
        name: model.name,
        language: model.lang.includes("中") ? "zh-CN" : model.lang.includes("英") ? "en-US" : model.lang,
        gender: model.gender === "0" ? "female" : "male",
        description: model.lang
      }));

      return { success: true, data: roles };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "获取语音角色失败",
        data: [],
      };
    }
  }

  // 获取情感类型列表
  public async getEmotions(
    serviceProviderType: ServiceProviderType
  ): Promise<Result<any[]>> {
    try {
      // 检查服务商配置是否存在
      const config = this.getProviderConfig(serviceProviderType);
      if (!config) {
        return { success: false, error: "服务商配置不存在", data: [] };
      }

      // Use static emotion data from JSON file
      const emotionsData = await import('@/assets/data/emotions.json');
      const emotions = emotionsData[serviceProviderType as keyof typeof emotionsData];
      
      if (!emotions || !Array.isArray(emotions)) {
        return { success: true, data: [] };
      }
      
      // Convert to the expected format
      const formattedEmotions = emotions.map((emotion: { code: string; name: string; desc: string }) => ({
        id: emotion.code,
        name: emotion.name,
        description: emotion.desc
      }));

      return { success: true, data: formattedEmotions };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "获取情感列表失败",
        data: [],
      };
    }
  }

  // 创建临时章节用于语音合成
  private async createTemporaryChapter(
    text: string,
    settings: VoiceSettings
  ): Promise<string | null> {
    try {
      // 创建一个临时章节
      const tempChapterData = {
        projectId: "temp", // 使用临时项目ID
        name: "TTS Preview",
        text: text,
        settings: settings,
        order: 0,
        wordCount: text.length,
      };

      const response = await chapterApi.create(tempChapterData);
      if (response.success && response.data) {
        return response.data.id;
      } else {
        console.error("Failed to create temporary chapter:", response.error);
        return null;
      }
    } catch (error) {
      console.error("Failed to create temporary chapter:", error);
      return null;
    }
  }

  // 文本转语音合成方法
  public async synthesize(
    request: TTSSynthesisRequest
  ): Promise<Result<TTSSynthesisResponse>> {
    const { text, settings } = request;

    if (!text) {
      return { success: false, error: "文本内容不能为空", data: {} };
    }

    if (!settings.serviceProvider) {
      return { success: false, error: "未指定服务商", data: {} };
    }

    if (!settings.voice) {
      return { success: false, error: "未指定语音角色", data: {} };
    }

    try {
      // 创建临时章节用于合成
      const tempChapterId = await this.createTemporaryChapter(text, settings);
      if (!tempChapterId) {
        return {
          success: false,
          error: "创建临时章节失败",
          data: {},
        };
      }

      // 调用后端API进行合成
      return await ttsApi.synthesize(tempChapterId);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "语音合成失败",
        data: {},
      };
    }
  }

  // 批量合成
  public async synthesizeMultiple(chapterIds: string[]): Promise<Result<any>> {
    if (!chapterIds || chapterIds.length === 0) {
      return { success: false, error: "未选择需要合成的章节", data: null };
    }

    try {
      return await ttsApi.synthesizeMultiple(chapterIds);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "批量语音合成失败",
        data: null,
      };
    }
  }

  // 测试服务商配置是否有效
  public async testServiceProvider(
    type: ServiceProviderType
  ): Promise<Result<any>> {
    try {
      const settingsStore = this.getSettingsStore();
      await settingsStore.loadSettings();

      const config = this.getProviderConfig(type);
      if (!config) {
        return {
          success: false,
          error: `服务商 ${type} 配置不存在或不完整`,
          data: null,
        };
      }

      const connectionResult =
        await settingsStore.testServiceProviderConnection(type);

      // Transform ConnectionTestResult to Result<any>
      return {
        success: connectionResult.success,
        error: connectionResult.success ? "" : connectionResult.message,
        data: connectionResult.success
          ? { message: connectionResult.message }
          : null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "API连接测试失败",
        data: null,
      };
    }
  }

  // 保存或更新系统设置
  public async saveSettings(
    settings: Partial<Settings>
  ): Promise<Result<Settings>> {
    try {
      const settingsStore = this.getSettingsStore();
      const updatedSettings = await settingsStore.updateSettings(settings);

      if (updatedSettings) {
        return { success: true, data: updatedSettings };
      }

      return {
        success: false,
        error: "保存设置失败",
        data: {} as Settings,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "保存设置失败",
        data: {} as Settings,
      };
    }
  }
}

// 创建单例实例
const ttsService = TTSService.getInstance();
export default ttsService;
