import type {
  ChapterSettings,
  Result,
  ServiceProvider,
  VoiceRole,
} from "@/types";
import { ttsApi, serviceProviderApi, chapterApi } from "@/utils/api";

// TTS 合成请求接口
interface TTSSynthesisRequest {
  text: string;
  settings: ChapterSettings;
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
  { id: "azure", name: "微软 Azure TTS" },
  { id: "aliyun", name: "阿里云语音服务" },
  { id: "tencent", name: "腾讯云语音服务" },
  { id: "baidu", name: "百度智能云" },
];

// TTS 服务类
export class TTSService {
  private static instance: TTSService;
  private serviceProviders: ServiceProvider[] = [];
  private isLoading: boolean = false;

  private constructor() {
    this.loadServiceProviders();
  }

  public static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  // 从后端加载服务商配置
  private async loadServiceProviders(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await serviceProviderApi.getAll();
      if (response.success && response.data) {
        this.serviceProviders = response.data;
      } else {
        console.error("Failed to load service providers:", response.error);
      }
    } catch (e) {
      console.error("Failed to load service providers", e);
    } finally {
      this.isLoading = false;
    }
  }

  // 获取所有配置的服务商
  public getServiceProviders(): ServiceProvider[] {
    return this.serviceProviders;
  }

  // 获取特定服务商支持的语音角色
  public async getVoiceRoles(
    serviceProviderId: string
  ): Promise<Result<VoiceRole[]>> {
    try {
      const provider = this.serviceProviders.find(
        (p) => p.id === serviceProviderId
      );
      if (!provider) {
        return { success: false, error: "服务商配置不存在", data: [] };
      }

      const response = await ttsApi.getVoiceRoles(serviceProviderId);
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
    serviceProviderId: string
  ): Promise<Result<string[]>> {
    try {
      const provider = this.serviceProviders.find(
        (p) => p.id === serviceProviderId
      );
      if (!provider) {
        return { success: false, error: "服务商配置不存在", data: [] };
      }

      const response = await ttsApi.getEmotions(serviceProviderId);
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
    settings: ChapterSettings
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
  public async testServiceProvider(id: string): Promise<Result<any>> {
    try {
      const response = await serviceProviderApi.testConnection(id);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "API连接测试失败",
        data: null,
      };
    }
  }
}

// 导出单例实例
export const ttsService = TTSService.getInstance();
