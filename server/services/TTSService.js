/**
 * 语音合成服务
 * 负责文本到语音的转换处理
 */
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const Chapter = require('../models/Chapter');
const ServiceProvider = require('../models/ServiceProvider');
const Settings = require('../models/Settings');
const audioUtils = require('../utils/audioUtils');
const { success, error } = require('../utils/result');

/**
 * 获取默认的临时输出目录
 * @returns {string} 输出目录路径
 */
function getDefaultOutputDir() {
  return path.join(os.tmpdir(), 'dotts_output');
}

/**
 * 合成单个章节的语音
 * @param {string} chapterId 章节ID
 * @returns {Promise<Object>} 结果对象
 */
async function synthesizeChapter(chapterId) {
  try {
    // 1. 获取章节数据
    const chapter = Chapter.getChapterById(chapterId);
    if (!chapter) {
      return error('章节不存在');
    }

    if (!chapter.text || chapter.text.trim().length === 0) {
      return error('章节文本为空，无法合成语音');
    }

    // 2. 检查章节的语音设置
    const settings = chapter.settings;
    if (!settings || !settings.serviceProvider) {
      return error('未设置语音服务商，请先配置服务商');
    }

    // 3. 获取服务商配置
    const provider = ServiceProvider.getServiceProviderById(settings.serviceProvider);
    if (!provider) {
      return error('无法找到配置的语音服务商');
    }

    // 4. 获取输出目录
    const outputDir = Settings.getDefaultExportPath() || getDefaultOutputDir();
    fs.ensureDirSync(outputDir);

    // 5. 根据服务商类型调用对应的API
    // TODO: 根据不同的服务商类型，调用不同的API
    // 这里仅作为演示，实际应根据provider.name或type调用不同的API

    // 模拟语音合成过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 这只是一个演示：实际中应使用真实的API调用获取音频数据
    // 例如: const audioData = await callExternalTTSAPI(provider, chapter.text, settings);
    
    // 模拟生成的语音文件路径
    const filename = `${chapter.name.replace(/[^a-zA-Z0-9]/g, '_')}_${uuidv4().slice(0, 8)}`;
    const outputPath = path.join(outputDir, filename + '.mp3');
    
    // 写入一个示例文件（实际应用中，这里应该写入真正的合成音频）
    fs.writeFileSync(outputPath, Buffer.from('This is a mock audio file'));

    return success({
      chapterId: chapter.id,
      outputPath,
      settings
    });

  } catch (err) {
    console.error('语音合成失败:', err);
    return error(`语音合成失败: ${err.message}`);
  }
}

/**
 * 批量合成多个章节的语音
 * @param {string[]} chapterIds 章节ID数组
 * @returns {Promise<Object>} 结果对象
 */
async function synthesizeMultipleChapters(chapterIds) {
  if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
    return error('请指定要合成的章节');
  }

  const results = [];
  const errors = [];

  // 串行处理，避免并发请求API可能导致的限流问题
  for (const chapterId of chapterIds) {
    const result = await synthesizeChapter(chapterId);
    if (result.c === 200) {
      results.push(result.d);
    } else {
      errors.push({
        chapterId,
        error: result.m
      });
    }
  }

  return success({
    successful: results,
    failed: errors,
    total: chapterIds.length,
    successCount: results.length,
    failureCount: errors.length
  });
}

/**
 * 获取特定服务商支持的声音角色列表
 * @param {string} providerId 服务商ID
 * @returns {Promise<Object>} 结果对象
 */
async function getVoiceRoles(providerId) {
  try {
    const provider = ServiceProvider.getServiceProviderById(providerId);
    if (!provider) {
      return error('服务商不存在');
    }

    // TODO: 根据不同的服务商类型，获取对应的声音角色列表
    // 这里返回模拟数据
    const mockRoles = [
      { id: 'male_1', name: '男声1', gender: 'male' },
      { id: 'male_2', name: '男声2', gender: 'male' },
      { id: 'female_1', name: '女声1', gender: 'female' },
      { id: 'female_2', name: '女声2', gender: 'female' }
    ];

    return success(mockRoles);
  } catch (err) {
    return error(`获取声音角色失败: ${err.message}`);
  }
}

/**
 * 获取特定服务商支持的情感列表
 * @param {string} providerId 服务商ID
 * @returns {Promise<Object>} 结果对象
 */
async function getEmotions(providerId) {
  try {
    const provider = ServiceProvider.getServiceProviderById(providerId);
    if (!provider) {
      return error('服务商不存在');
    }

    // TODO: 根据不同的服务商类型，获取对应的情感列表
    // 这里返回模拟数据
    const mockEmotions = [
      { id: 'neutral', name: '中性' },
      { id: 'happy', name: '开心' },
      { id: 'angry', name: '生气' },
      { id: 'sad', name: '悲伤' }
    ];

    return success(mockEmotions);
  } catch (err) {
    return error(`获取情感列表失败: ${err.message}`);
  }
}

module.exports = {
  synthesizeChapter,
  synthesizeMultipleChapters,
  getVoiceRoles,
  getEmotions
}; 