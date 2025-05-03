/**
 * 工具函数导出入口
 * 集中导出所有工具函数，方便引用
 */

// 日期格式化工具
export { formatDate } from './common';

// 语音工具函数
export {
  getProviderName,
  getProviderById,
  getTTSProviders,
  isSupportedTTSProvider,
  getVoiceRoleName,
  getEmotionName
} from './voice-utils';

// TTS相关工具函数
export {
  splitTextForTTS,
  estimateTTSDuration,
  concatenateAudioUrls,
  batchSynthesizeChapters,
  base64ToBlob
} from './tts-utils'; 