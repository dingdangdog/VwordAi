import type {
  VoiceSettings,
  Result,
  ServiceProviderType,
  Settings,
} from "@/types";
import {
  ttsApi,
  serviceProviderApi,
  chapterApi,
  settingsApi,
} from "@/utils/api";

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

// 支持的服务商列表
export const SUPPORTED_PROVIDERS = [
  { id: "azure", name: "微软 Azure TTS", type: "azure" },
  { id: "aliyun", name: "阿里云语音服务", type: "aliyun" },
  { id: "tencent", name: "腾讯云语音服务", type: "tencent" },
  { id: "baidu", name: "百度智能云", type: "baidu" },
  { id: "openai", name: "OpenAI TTS", type: "openai" },
];

// TTS 服务类
export class TTSService {
  private static instance: TTSService;
  private systemSettings: Settings | null = null;
  private isLoading: boolean = false;

  private constructor() {
    this.loadSettings();
  }

  public static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  // 从后端加载系统设置
  private async loadSettings(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await settingsApi.getAll();
      if (response.success && response.data) {
        this.systemSettings = response.data;
      } else {
        console.error("Failed to load settings:", response.error);
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    } finally {
      this.isLoading = false;
    }
  }

  // 获取支持的服务商列表
  public getSupportedProviders(): { id: string; name: string; type: string }[] {
    return SUPPORTED_PROVIDERS;
  }

  // 获取服务商配置
  public getProviderConfig(type: ServiceProviderType): any {
    if (!this.systemSettings) {
      return null;
    }
    return this.systemSettings[type];
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

      const response = await ttsApi.getVoiceRoles(serviceProviderType);
      return response;
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
  ): Promise<Result<string[]>> {
    try {
      // 检查服务商配置是否存在
      const config = this.getProviderConfig(serviceProviderType);
      if (!config) {
        return { success: false, error: "服务商配置不存在", data: [] };
      }

      const response = await ttsApi.getEmotions(serviceProviderType);
      return response;
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
      const response = await ttsApi.synthesize(tempChapterId);
      return response;
    } catch (error) {
      console.error("TTS synthesis failed:", error);
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
      const response = await ttsApi.synthesizeMultiple(chapterIds);
      return response;
    } catch (error) {
      console.error("Batch TTS synthesis failed:", error);
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
      // 确保配置已加载
      if (!this.systemSettings) {
        await this.loadSettings();
      }

      const config = this.getProviderConfig(type);
      if (!config) {
        return {
          success: false,
          error: `服务商 ${type} 配置不存在或不完整`,
          data: null,
        };
      }

      const response = await ttsApi.testProviderConnection(type);
      return response;
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
      const response = await settingsApi.update(settings);
      if (response.success && response.data) {
        // 更新本地设置
        if (this.systemSettings) {
          this.systemSettings = { ...this.systemSettings, ...settings };
        } else {
          this.systemSettings = response.data;
        }
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "保存设置失败",
        data: {} as Settings,
      };
    }
  }
}

// 导出单例实例
export const ttsService = TTSService.getInstance();
