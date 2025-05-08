/**
 * 服务模块导出入口
 * 集中导出所有服务，方便引用
 */

// B站直播服务
export { default as biliLiveService } from './BiliLiveService';

// TTS服务
export { default as ttsService } from './tts';

// 更新服务
export { default as updateService } from './updateService';

// 公共工具函数，方便服务间复用
export { 
  saveLastUpdateCheck, 
  shouldCheckForUpdates 
} from './updateService'; 