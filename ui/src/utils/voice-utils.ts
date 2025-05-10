import { SUPPORTED_PROVIDERS } from "@/stores/settings";
import type { ServiceProviderType, VoiceModel } from "@/types";
import { useProjectsStore } from "@/stores/projects";
import modelsData from '@/assets/data/models.json';
import rolesData from '@/assets/data/roles.json';
import emotionsData from '@/assets/data/emotions.json';

// Cache for processed voice models
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
  return SUPPORTED_PROVIDERS.find(p => p.id === id);
}

/**
 * Get all active providers suitable for TTS
 * @returns Array of providers (excluding OpenAI)
 */
export function getTTSProviders() {
  return SUPPORTED_PROVIDERS.filter(provider => provider.id !== 'openai');
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
 * Get voice models for a specific provider
 * @param provider Provider ID
 * @returns List of voice models for the provider
 */
export function getVoiceModelsByProvider(provider: string): VoiceModel[] {
  const models = getProcessedVoiceModels();
  return models.filter(model => model.provider === provider);
}

/**
 * Get a voice model by its code
 * @param code Voice model code
 * @returns Voice model or undefined
 */
export function getVoiceModelByCode(code: string): VoiceModel | undefined {
  const models = getProcessedVoiceModels();
  return models.find(model => model.code === code);
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
 * Get the display name of an emotion
 * @param emotionId Emotion ID
 * @returns Name of the emotion
 */
export function getEmotionName(emotionId: string): string {
  if (!emotionId) return "";
  
  // Check all providers' emotions
  for (const provider in emotionsData) {
    const emotions = emotionsData[provider as keyof typeof emotionsData];
    const emotion = emotions.find(e => e.code === emotionId);
    if (emotion) {
      return emotion.name;
    }
  }
  
  return emotionId;
} 