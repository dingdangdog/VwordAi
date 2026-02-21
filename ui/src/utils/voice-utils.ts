import { SUPPORTED_TTS_PROVIDERS } from "@/stores/settings";
import type { TTSProviderType, VoiceModel } from "@/types";
import modelsData from "@/assets/data/models.json";
import rolesData from "@/assets/data/roles.json";
import emotionsData from "@/assets/data/emotions.json";

/** 按服务商缓存的语音模型（如从 API 同步得到） */
export type VoiceModelsCache = Partial<Record<TTSProviderType, VoiceModel[]>>;

// Cache for processed voice models (static only)
let processedVoiceModels: VoiceModel[] = [];

/**
 * Get the display name of a service provider
 * @param id Provider ID
 * @returns Display name of the provider
 */
export function getProviderName(id: string): string {
  const provider = getTTSProviders().find(p => p.id === id);
  return provider ? provider.name : id;
}

/**
 * Get provider object by ID
 * @param id Provider ID
 * @returns Provider object or undefined
 */
export function getProviderById(id: string) {
  return SUPPORTED_TTS_PROVIDERS.find(p => p.id === id);
}

/**
 * Get all active providers suitable for TTS
 * @returns Array of providers (excluding OpenAI)
 */
export function getTTSProviders() {
  return SUPPORTED_TTS_PROVIDERS.filter(provider => provider.id !== 'openai');
}

/**
 * Check if a provider is supported for TTS
 * @param id Provider ID
 * @returns Boolean indicating if provider is supported
 */
export function isSupportedTTSProvider(id: string): boolean {
  return getTTSProviders().some(p => p.id === id);
}

/**
 * Process the raw models data to include complete emotion and role objects
 */
export function getProcessedVoiceModels(): VoiceModel[] {
  // Return cached result if available
  if (processedVoiceModels.length > 0) {
    return processedVoiceModels;
  }

  const result: VoiceModel[] = [];

  // Process each provider's models
  Object.entries(modelsData).forEach(([provider, models]) => {
    if (!Array.isArray(models)) return;

    // Get provider's available roles and emotions
    const providerRoles = rolesData[provider as keyof typeof rolesData] || [];
    const providerEmotions = emotionsData[provider as keyof typeof emotionsData] || [];

    // Process each model
    models.forEach(model => {
      // Process emotions (convert IDs to full objects)
      const modelEmotions = model.emotions ? model.emotions
        .map(emotionId => {
          const found = providerEmotions.find(e => e.id === emotionId.toString());
          return found ? { code: found.code, name: found.name } : null;
        })
        .filter((e): e is { code: string; name: string } => e !== null) : [];

      // Process roles (convert IDs to full objects)
      const modelRoles = model.roles ? model.roles
        .map(roleId => {
          const found = providerRoles.find(r => r.id === roleId.toString());
          return found ? { code: found.code, name: found.name } : null;
        })
        .filter((r): r is { code: string; name: string } => r !== null) : [];

      // Create the processed model
      result.push({
        ...model,
        provider,
        emotions: modelEmotions,
        roles: modelRoles
      });
    });
  });

  // Cache the result
  processedVoiceModels = result;
  return result;
}

/**
 * 合并静态数据与 API 同步的缓存：按服务商优先使用缓存，无缓存则用静态列表
 */
export function getMergedVoiceModels(cache: VoiceModelsCache | null | undefined): VoiceModel[] {
  const staticList = getProcessedVoiceModels();
  if (!cache || typeof cache !== "object") return staticList;
  const result: VoiceModel[] = [];
  const providers = new Set<string>([
    ...staticList.map((m) => m.provider).filter(Boolean),
    ...Object.keys(cache),
  ]);
  for (const provider of providers) {
    const cached = cache[provider as TTSProviderType];
    if (cached && cached.length > 0) {
      result.push(...cached);
    } else {
      result.push(...staticList.filter((m) => m.provider === provider));
    }
  }
  return result;
}

/**
 * Get voice models for a specific provider
 * @param provider Provider ID
 * @param cache 可选：API 同步的模型缓存，传入时与静态数据合并后按 provider 过滤
 * @returns List of voice models for the provider
 */
export function getVoiceModelsByProvider(
  provider: string,
  cache?: VoiceModelsCache | null
): VoiceModel[] {
  const models = cache != null ? getMergedVoiceModels(cache) : getProcessedVoiceModels();
  return models.filter((model) => model.provider === provider);
}

/**
 * Get a voice model by its code
 * @param code Voice model code
 * @param cache 可选：API 同步的模型缓存，传入时在合并列表中查找
 * @returns Voice model or undefined
 */
export function getVoiceModelByCode(
  code: string,
  cache?: VoiceModelsCache | null
): VoiceModel | undefined {
  const models = cache != null ? getMergedVoiceModels(cache) : getProcessedVoiceModels();
  return models.find((model) => model.code === code);
}

/**
 * Get the display name of a voice model
 * @param roleId Voice model ID
 * @returns Name of the voice model
 */
export function getVoiceRoleName(roleId: string): string {
  if (!roleId) return "";
  
  // First check if this is a voice model code
  const model = getVoiceModelByCode(roleId);
  if (model) {
    return model.name;
  }

  // If not a model code, check all providers' roles
  for (const provider in rolesData) {
    const roles = rolesData[provider as keyof typeof rolesData];
    const role = roles.find(r => r.code === roleId);
    if (role) {
      return role.name;
    }
  }

  return roleId;
}

/**
 * Get the display name of an emotion by code (e.g. from API)
 * 用于本地化显示：优先从 emotions.json 取中文名，否则返回原始 code
 * @param emotionCode Emotion code (e.g. "cheerful", "sad")
 * @returns Localized name of the emotion
 */
export function getEmotionName(emotionCode: string): string {
  if (!emotionCode) return "";
  for (const provider in emotionsData) {
    const emotions = emotionsData[provider as keyof typeof emotionsData];
    const emotion = emotions.find((e) => e.code === emotionCode);
    if (emotion) return emotion.name;
  }
  return emotionCode;
}

/**
 * 情感展示用：对 API 返回的 { code, name } 做本地化，避免只显示英文 code
 * @param emotion { code, name } 如模型 emotions 数组项
 * @returns 本地化名称（有则用 emotions.json，否则用 name 或 code）
 */
export function getEmotionDisplayName(emotion: { code: string; name?: string }): string {
  if (!emotion?.code) return emotion?.name ?? "";
  const localized = getEmotionName(emotion.code);
  return localized !== emotion.code ? localized : (emotion.name || emotion.code);
} 