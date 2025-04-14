import axios from 'axios';
import type { TTSSettings, ServiceProviderConfig, Result } from '@/types';

// TTS 合成请求接口
interface TTSSynthesisRequest {
  text: string;
  settings: TTSSettings;
  outputPath?: string;
}

// TTS 合成响应接口
interface TTSSynthesisResponse {
  audioUrl?: string;
  audioFilePath?: string;
  duration?: number;
}

// 服务商支持的语音角色
export interface VoiceRole {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
}

// 支持的服务商列表
export const SUPPORTED_PROVIDERS = [
  { id: 'azure', name: '微软 Azure TTS' },
  { id: 'aliyun', name: '阿里云语音服务' },
  { id: 'tencent', name: '腾讯云语音服务' },
  { id: 'baidu', name: '百度智能云' }
];

// TTS 服务类
export class TTSService {
  private static instance: TTSService;
  private serviceProviders: ServiceProviderConfig[] = [];

  private constructor() {
    this.loadServiceProviders();
  }

  public static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  // 从本地存储加载服务商配置
  private loadServiceProviders(): void {
    const providers = localStorage.getItem('serviceProviders');
    if (providers) {
      try {
        this.serviceProviders = JSON.parse(providers).map((provider: any) => ({
          ...provider,
          createdAt: new Date(provider.createdAt),
          updatedAt: new Date(provider.updatedAt)
        }));
      } catch (e) {
        console.error('Failed to parse service providers from localStorage', e);
      }
    }
  }

  // 保存服务商配置到本地存储
  private saveServiceProviders(): void {
    localStorage.setItem('serviceProviders', JSON.stringify(this.serviceProviders));
  }

  // 获取所有配置的服务商
  public getServiceProviders(): ServiceProviderConfig[] {
    return this.serviceProviders;
  }

  // 添加新的服务商配置
  public addServiceProvider(config: { name: string; apiKey: string; secretKey?: string; [key: string]: any }): ServiceProviderConfig {
    const newProvider: ServiceProviderConfig = {
      id: crypto.randomUUID(),
      ...config,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.serviceProviders.push(newProvider);
    this.saveServiceProviders();
    return newProvider;
  }

  // 更新服务商配置
  public updateServiceProvider(id: string, config: Partial<ServiceProviderConfig>): ServiceProviderConfig | null {
    const index = this.serviceProviders.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    const updatedProvider = {
      ...this.serviceProviders[index],
      ...config,
      updatedAt: new Date()
    };
    
    this.serviceProviders[index] = updatedProvider;
    this.saveServiceProviders();
    return updatedProvider;
  }

  // 删除服务商配置
  public deleteServiceProvider(id: string): boolean {
    const index = this.serviceProviders.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.serviceProviders.splice(index, 1);
    this.saveServiceProviders();
    return true;
  }

  // 获取特定服务商支持的语音角色
  public async getVoiceRoles(serviceProviderId: string): Promise<Result<VoiceRole[]>> {
    // 这里通常会调用服务商API获取可用的语音角色
    // 但由于是演示，我们返回一些模拟数据
    
    const provider = this.serviceProviders.find(p => p.id === serviceProviderId);
    if (!provider) {
      return { success: false, error: '服务商配置不存在' };
    }
    
    // 根据不同服务商返回不同的模拟语音角色
    let voiceRoles: VoiceRole[] = [];
    
    switch (provider.name) {
      case '微软 Azure TTS':
        voiceRoles = [
          { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓', language: 'zh-CN', gender: 'female' },
          { id: 'zh-CN-YunxiNeural', name: '云希', language: 'zh-CN', gender: 'male' },
          { id: 'zh-CN-YunyangNeural', name: '云扬', language: 'zh-CN', gender: 'male' }
        ];
        break;
      case '阿里云语音服务':
        voiceRoles = [
          { id: 'siqi', name: '思琪', language: 'zh-CN', gender: 'female' },
          { id: 'sijia', name: '思佳', language: 'zh-CN', gender: 'female' },
          { id: 'sicheng', name: '思诚', language: 'zh-CN', gender: 'male' }
        ];
        break;
      case '腾讯云语音服务':
        voiceRoles = [
          { id: '0', name: '云小宁', language: 'zh-CN', gender: 'female' },
          { id: '1', name: '云小奇', language: 'zh-CN', gender: 'male' },
          { id: '2', name: '云小晚', language: 'zh-CN', gender: 'female' }
        ];
        break;
      case '百度智能云':
        voiceRoles = [
          { id: '0', name: '度小宇', language: 'zh-CN', gender: 'male' },
          { id: '1', name: '度小美', language: 'zh-CN', gender: 'female' },
          { id: '2', name: '度逍遥', language: 'zh-CN', gender: 'male' }
        ];
        break;
      default:
        return { success: false, error: '不支持的服务商' };
    }
    
    return { success: true, data: voiceRoles };
  }

  // 文本转语音合成方法
  public async synthesize(request: TTSSynthesisRequest): Promise<Result<TTSSynthesisResponse>> {
    const { text, settings } = request;
    
    if (!text) {
      return { success: false, error: '文本内容不能为空' };
    }
    
    if (!settings.serviceProvider) {
      return { success: false, error: '未指定服务商' };
    }
    
    const provider = this.serviceProviders.find(p => p.id === settings.serviceProvider);
    if (!provider) {
      return { success: false, error: '服务商配置不存在' };
    }
    
    try {
      // 在实际应用中，这里应该根据不同的服务商调用不同的API
      // 由于这是一个前端演示项目，我们模拟API调用的过程
      
      // 模拟服务器响应延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 返回模拟的合成结果
      return {
        success: true,
        data: {
          audioUrl: 'data:audio/mp3;base64,MOCK_AUDIO_DATA', // 实际项目中应返回真实的音频数据
          audioFilePath: request.outputPath || `tts_output_${Date.now()}.mp3`,
          duration: Math.floor(text.length / 5) // 简单估算音频时长（秒）
        }
      };
    } catch (error) {
      console.error('TTS synthesis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '语音合成失败'
      };
    }
  }

  // 测试服务商配置是否有效
  public async testServiceProvider(id: string): Promise<Result<boolean>> {
    const provider = this.serviceProviders.find(p => p.id === id);
    if (!provider) {
      return { success: false, error: '服务商配置不存在' };
    }
    
    try {
      // 在实际应用中，这里应该调用相应服务商的API进行验证
      // 由于这是演示，我们假设API验证通过
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API连接测试失败'
      };
    }
  }
}

// 导出单例实例
export const ttsService = TTSService.getInstance(); 