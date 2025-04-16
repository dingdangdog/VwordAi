import { SUPPORTED_PROVIDERS } from "@/stores/settings";
import type { ServiceProviderType } from "@/types";
import { useProjectsStore } from "@/stores/projects";

/**
 * Get the display name of a service provider
 * @param id Provider ID
 * @returns Display name of the provider
 */
export function getProviderName(id: string): string {
  const provider = SUPPORTED_PROVIDERS.find(p => p.id === id);
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
 * Get the display name of a voice model
 * @param roleId Voice model ID
 * @returns Name of the voice model
 */
export function getVoiceRoleName(roleId: string): string {
  if (!roleId) return "";
  
  const projectsStore = useProjectsStore();
  const model = projectsStore.getVoiceModelByCode(roleId);
  return model ? model.name : roleId;
}

/**
 * Get the display name of an emotion
 * @param emotionId Emotion ID
 * @returns Name of the emotion
 */
export function getEmotionName(emotionId: string): string {
  if (!emotionId) return "";
  
  const projectsStore = useProjectsStore();
  
  // Search for the emotion in all voice models
  for (const model of projectsStore.voiceModels) {
    if (model.emotions) {
      const emotion = model.emotions.find(e => e.code === emotionId);
      if (emotion) {
        return emotion.name;
      }
    }
  }
  
  return emotionId;
} 