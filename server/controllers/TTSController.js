/**
 * 语音合成控制器
 * 处理所有与语音合成相关的IPC通信
 */
const { ipcMain } = require('electron');
const TTSService = require('../services/TTSService');

/**
 * 初始化语音合成控制器
 */
function init() {
  // 合成单个章节的语音
  ipcMain.handle('tts:synthesize', async (event, chapterId) => {
    return await TTSService.synthesizeChapter(chapterId);
  });

  // 批量合成多个章节的语音
  ipcMain.handle('tts:synthesize-multiple', async (event, chapterIds) => {
    return await TTSService.synthesizeMultipleChapters(chapterIds);
  });

  // 获取特定服务商支持的声音角色列表
  ipcMain.handle('tts:get-voice-roles', async (event, providerId) => {
    return await TTSService.getVoiceRoles(providerId);
  });

  // 获取特定服务商支持的情感列表
  ipcMain.handle('tts:get-emotions', async (event, providerId) => {
    return await TTSService.getEmotions(providerId);
  });
}

module.exports = {
  init
}; 