/**
 * 语音合成服务
 * 负责文本到语音的转换处理
 */
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { spawn } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');

const Chapter = require('../models/Chapter');
const ServiceProvider = require('../models/ServiceProvider');
const Settings = require('../models/Settings');
const audioUtils = require('../utils/audioUtils');
const { success, error } = require('../utils/result');

// 文本长度限制（不同的服务商可能有不同的限制）
const TEXT_LENGTH_LIMITS = {
  azure: 10000,
  aliyun: 5000,
  tencent: 5000,
  baidu: 5000
};

/**
 * 获取默认的临时输出目录
 * @returns {string} 输出目录路径
 */
function getDefaultOutputDir() {
  return path.join(os.tmpdir(), 'dotts_output');
}

/**
 * 将文本分割成适合TTS合成的片段
 * @param {string} text 文本内容
 * @param {number} maxLength 最大长度
 * @returns {string[]} 文本片段数组
 */
function splitTextIntoChunks(text, maxLength = 5000) {
  if (!text) return [];
  if (text.length <= maxLength) return [text];

  // 尝试在句号、问号、感叹号等处分割
  const segments = [];
  let remainingText = text;

  while (remainingText.length > 0) {
    if (remainingText.length <= maxLength) {
      segments.push(remainingText);
      break;
    }

    // 在maxLength位置前找最近的句子结束标记
    let endPos = remainingText.substring(0, maxLength).lastIndexOf('。');
    if (endPos === -1) endPos = remainingText.substring(0, maxLength).lastIndexOf('！');
    if (endPos === -1) endPos = remainingText.substring(0, maxLength).lastIndexOf('？');
    if (endPos === -1) endPos = remainingText.substring(0, maxLength).lastIndexOf('.');
    if (endPos === -1) endPos = remainingText.substring(0, maxLength).lastIndexOf('!');
    if (endPos === -1) endPos = remainingText.substring(0, maxLength).lastIndexOf('?');
    
    // 如果没找到句子结束标记，则寻找逗号、分号等
    if (endPos === -1) endPos = remainingText.substring(0, maxLength).lastIndexOf('，');
    if (endPos === -1) endPos = remainingText.substring(0, maxLength).lastIndexOf('；');
    if (endPos === -1) endPos = remainingText.substring(0, maxLength).lastIndexOf(',');
    if (endPos === -1) endPos = remainingText.substring(0, maxLength).lastIndexOf(';');
    
    // 如果还是没找到，就按空格或换行符分割
    if (endPos === -1) endPos = remainingText.substring(0, maxLength).lastIndexOf(' ');
    if (endPos === -1) endPos = remainingText.substring(0, maxLength).lastIndexOf('\n');
    
    // 如果所有分隔符都没找到，就在最大长度处截断
    if (endPos === -1) endPos = maxLength - 1;
    
    // 添加当前段落，并更新剩余文本
    segments.push(remainingText.substring(0, endPos + 1));
    remainingText = remainingText.substring(endPos + 1);
  }

  return segments;
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
    const appSettings = Settings.getAllSettings();
    const outputDir = appSettings.defaultExportPath || getDefaultOutputDir();
    fs.ensureDirSync(outputDir);

    // 5. 确定服务商类型
    const providerType = getProviderType(provider);
    
    // 6. 分割文本（如果需要）
    const maxLength = TEXT_LENGTH_LIMITS[providerType] || 5000;
    const textChunks = splitTextIntoChunks(chapter.text, maxLength);
    
    // 7. 合成每个文本片段
    const audioFilePaths = [];
    let index = 0;
    
    for (const chunk of textChunks) {
      const chunkFilename = textChunks.length > 1 
        ? `${chapter.name.replace(/[^a-zA-Z0-9]/g, '_')}_part${index+1}_${uuidv4().slice(0, 8)}`
        : `${chapter.name.replace(/[^a-zA-Z0-9]/g, '_')}_${uuidv4().slice(0, 8)}`;
      
      const outputPath = path.join(outputDir, chunkFilename + '.mp3');
      
      try {
        // 根据服务商类型调用对应的API
        let chunkResult;
        
        switch (providerType) {
          case 'azure':
            chunkResult = await synthesizeWithAzure(chunk, settings, outputPath, provider);
            break;
          case 'baidu':
            chunkResult = await synthesizeWithBaidu(chunk, settings, outputPath, provider);
            break;
          case 'aliyun':
            chunkResult = await synthesizeWithAliyun(chunk, settings, outputPath, provider);
            break;
          case 'tencent':
            chunkResult = await synthesizeWithTencent(chunk, settings, outputPath, provider);
            break;
          default:
            // 使用模拟数据作为备用
            chunkResult = await synthesizeMock(chunk, settings, outputPath);
        }
        
        if (chunkResult.success) {
          audioFilePaths.push(chunkResult.outputPath);
        } else {
          return error(`语音合成失败: ${chunkResult.message}`);
        }
        
      } catch (err) {
        return error(`语音合成失败: ${err.message}`);
      }
      
      index++;
    }
    
    // 8. 如果有多个文件，合并它们
    let finalOutputPath;
    
    if (audioFilePaths.length > 1) {
      finalOutputPath = path.join(outputDir, `${chapter.name.replace(/[^a-zA-Z0-9]/g, '_')}_${uuidv4().slice(0, 8)}.mp3`);
      await mergeAudioFiles(audioFilePaths, finalOutputPath);
      
      // 可选：删除临时文件
      for (const tempFile of audioFilePaths) {
        fs.removeSync(tempFile);
      }
    } else {
      finalOutputPath = audioFilePaths[0];
    }
    
    return success({
      chapterId: chapter.id,
      outputPath: finalOutputPath,
      settings
    });

  } catch (err) {
    console.error('语音合成失败:', err);
    return error(`语音合成失败: ${err.message}`);
  }
}

/**
 * 使用Azure TTS服务合成语音
 * @param {string} text 文本内容
 * @param {Object} settings 语音设置
 * @param {string} outputPath 输出路径
 * @param {Object} provider 服务商配置
 * @returns {Promise<Object>} 结果对象
 */
async function synthesizeWithAzure(text, settings, outputPath, provider) {
  try {
    // 注意：这里是模拟实现
    // 在实际应用中，应该使用Azure Speech SDK或REST API
    
    console.log('使用Azure TTS服务合成语音:', text.substring(0, 50) + '...');
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 创建一个示例音频文件
    fs.writeFileSync(outputPath, Buffer.from('Azure TTS audio file simulation'));
    
    return { success: true, outputPath };
  } catch (err) {
    console.error('Azure TTS合成失败:', err);
    return { success: false, message: err.message };
  }
}

/**
 * 使用百度TTS服务合成语音
 * @param {string} text 文本内容
 * @param {Object} settings 语音设置
 * @param {string} outputPath 输出路径
 * @param {Object} provider 服务商配置
 * @returns {Promise<Object>} 结果对象
 */
async function synthesizeWithBaidu(text, settings, outputPath, provider) {
  try {
    // 注意：这里是模拟实现
    // 在实际应用中，应该使用百度TTS API
    
    console.log('使用百度TTS服务合成语音:', text.substring(0, 50) + '...');
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 创建一个示例音频文件
    fs.writeFileSync(outputPath, Buffer.from('Baidu TTS audio file simulation'));
    
    return { success: true, outputPath };
  } catch (err) {
    console.error('百度TTS合成失败:', err);
    return { success: false, message: err.message };
  }
}

/**
 * 使用阿里云TTS服务合成语音
 * @param {string} text 文本内容
 * @param {Object} settings 语音设置
 * @param {string} outputPath 输出路径
 * @param {Object} provider 服务商配置
 * @returns {Promise<Object>} 结果对象
 */
async function synthesizeWithAliyun(text, settings, outputPath, provider) {
  try {
    // 注意：这里是模拟实现
    // 在实际应用中，应该使用阿里云TTS API
    
    console.log('使用阿里云TTS服务合成语音:', text.substring(0, 50) + '...');
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 创建一个示例音频文件
    fs.writeFileSync(outputPath, Buffer.from('Aliyun TTS audio file simulation'));
    
    return { success: true, outputPath };
  } catch (err) {
    console.error('阿里云TTS合成失败:', err);
    return { success: false, message: err.message };
  }
}

/**
 * 使用腾讯云TTS服务合成语音
 * @param {string} text 文本内容
 * @param {Object} settings 语音设置
 * @param {string} outputPath 输出路径
 * @param {Object} provider 服务商配置
 * @returns {Promise<Object>} 结果对象
 */
async function synthesizeWithTencent(text, settings, outputPath, provider) {
  try {
    // 注意：这里是模拟实现
    // 在实际应用中，应该使用腾讯云TTS API
    
    console.log('使用腾讯云TTS服务合成语音:', text.substring(0, 50) + '...');
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 创建一个示例音频文件
    fs.writeFileSync(outputPath, Buffer.from('Tencent TTS audio file simulation'));
    
    return { success: true, outputPath };
  } catch (err) {
    console.error('腾讯云TTS合成失败:', err);
    return { success: false, message: err.message };
  }
}

/**
 * 使用模拟数据合成语音（备用方案）
 * @param {string} text 文本内容
 * @param {Object} settings 语音设置
 * @param {string} outputPath 输出路径
 * @returns {Promise<Object>} 结果对象
 */
async function synthesizeMock(text, settings, outputPath) {
  try {
    console.log('使用模拟数据合成语音:', text.substring(0, 50) + '...');
    
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 创建一个示例音频文件
    fs.writeFileSync(outputPath, Buffer.from('Mock TTS audio file simulation'));
    
    return { success: true, outputPath };
  } catch (err) {
    console.error('模拟TTS合成失败:', err);
    return { success: false, message: err.message };
  }
}

/**
 * 合并多个音频文件
 * @param {string[]} inputFiles 输入文件路径数组
 * @param {string} outputFile 输出文件路径
 */
async function mergeAudioFiles(inputFiles, outputFile) {
  if (inputFiles.length === 0) {
    throw new Error('没有要合并的音频文件');
  }
  
  if (inputFiles.length === 1) {
    // 如果只有一个文件，直接复制它
    fs.copyFileSync(inputFiles[0], outputFile);
    return;
  }
  
  // TODO: 实现音频文件合并
  // 这需要使用ffmpeg或其他音频处理库
  // 临时使用简单的文件连接作为示例
  const writeStream = fs.createWriteStream(outputFile);
  
  for (const inputFile of inputFiles) {
    const content = fs.readFileSync(inputFile);
    writeStream.write(content);
  }
  
  writeStream.end();
  
  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
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
 * 获取服务商类型
 * @param {Object} provider 服务商配置对象
 * @returns {string} 服务商类型
 */
function getProviderType(provider) {
  const name = provider.name.toLowerCase();
  
  if (name.includes('azure') || name.includes('microsoft')) {
    return 'azure';
  }
  
  if (name.includes('baidu') || name.includes('百度')) {
    return 'baidu';
  }
  
  if (name.includes('aliyun') || name.includes('alibaba') || name.includes('阿里')) {
    return 'aliyun';
  }
  
  if (name.includes('tencent') || name.includes('腾讯')) {
    return 'tencent';
  }
  
  return 'unknown';
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

    const providerType = getProviderType(provider);
    let voiceRoles = [];
    
    // 根据服务商类型返回对应的声音角色列表
    switch (providerType) {
      case 'azure':
        voiceRoles = [
          { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓', language: 'zh-CN', gender: 'female' },
          { id: 'zh-CN-YunxiNeural', name: '云希', language: 'zh-CN', gender: 'male' },
          { id: 'zh-CN-YunyangNeural', name: '云扬', language: 'zh-CN', gender: 'male' },
          { id: 'zh-CN-XiaochenNeural', name: '晓辰', language: 'zh-CN', gender: 'female' },
          { id: 'zh-CN-XiaohanNeural', name: '晓涵', language: 'zh-CN', gender: 'female' },
          { id: 'zh-CN-XiaomoNeural', name: '晓墨', language: 'zh-CN', gender: 'female' },
          { id: 'zh-CN-XiaoruiNeural', name: '晓睿', language: 'zh-CN', gender: 'female' },
          { id: 'zh-CN-XiaoxuanNeural', name: '晓轩', language: 'zh-CN', gender: 'female' },
          { id: 'zh-CN-YunfengNeural', name: '云枫', language: 'zh-CN', gender: 'male' },
          { id: 'zh-CN-YunhaoNeural', name: '云浩', language: 'zh-CN', gender: 'male' },
          { id: 'zh-CN-YunjianNeural', name: '云健', language: 'zh-CN', gender: 'male' },
          { id: 'zh-CN-YunxiaNeural', name: '云夏', language: 'zh-CN', gender: 'male' },
          { id: 'zh-CN-YunzeNeural', name: '云泽', language: 'zh-CN', gender: 'male' }
        ];
        break;
      case 'baidu':
        voiceRoles = [
          { id: '0', name: '度小宇', language: 'zh', gender: 'male' },
          { id: '1', name: '度小美', language: 'zh', gender: 'female' },
          { id: '2', name: '度逍遥', language: 'zh', gender: 'male' },
          { id: '3', name: '度丫丫', language: 'zh', gender: 'female' },
          { id: '4', name: '度小娇', language: 'zh', gender: 'female' },
          { id: '5', name: '度米朵', language: 'zh', gender: 'female' },
          { id: '106', name: '度博文', language: 'zh', gender: 'male' },
          { id: '110', name: '度小童', language: 'zh', gender: 'neutral' },
          { id: '111', name: '度小萌', language: 'zh', gender: 'female' }
        ];
        break;
      case 'aliyun':
        voiceRoles = [
          { id: 'xiaoyun', name: '小云', language: 'zh', gender: 'female' },
          { id: 'xiaogang', name: '小刚', language: 'zh', gender: 'male' },
          { id: 'ruoxi', name: '若兮', language: 'zh', gender: 'female' },
          { id: 'siqi', name: '思琪', language: 'zh', gender: 'female' },
          { id: 'sijia', name: '思佳', language: 'zh', gender: 'female' },
          { id: 'sicheng', name: '思诚', language: 'zh', gender: 'male' },
          { id: 'aixia', name: '艾夏', language: 'zh', gender: 'female' },
          { id: 'aijia', name: '艾佳', language: 'zh', gender: 'female' },
          { id: 'aicheng', name: '艾诚', language: 'zh', gender: 'male' },
          { id: 'aida', name: '艾达', language: 'zh', gender: 'male' }
        ];
        break;
      case 'tencent':
        voiceRoles = [
          { id: '0', name: '云小宁', language: 'zh', gender: 'female' },
          { id: '1', name: '云小奇', language: 'zh', gender: 'male' },
          { id: '2', name: '云小晚', language: 'zh', gender: 'female' },
          { id: '4', name: '云小叶', language: 'zh', gender: 'female' },
          { id: '5', name: '云小欣', language: 'zh', gender: 'female' },
          { id: '6', name: '云小龙', language: 'zh', gender: 'male' },
          { id: '7', name: '云小曼', language: 'zh', gender: 'female' },
          { id: '1001', name: '智瑜', language: 'zh', gender: 'female' },
          { id: '1002', name: '智聆', language: 'zh', gender: 'female' },
          { id: '1003', name: '智美', language: 'zh', gender: 'female' }
        ];
        break;
      default:
        voiceRoles = [
          { id: 'default_male', name: '默认男声', language: 'zh', gender: 'male' },
          { id: 'default_female', name: '默认女声', language: 'zh', gender: 'female' }
        ];
    }

    return success(voiceRoles);
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

    const providerType = getProviderType(provider);
    let emotions = [];
    
    // 根据服务商类型返回对应的情感列表
    switch (providerType) {
      case 'azure':
        emotions = [
          { id: 'neutral', name: '中性' },
          { id: 'happy', name: '开心' },
          { id: 'sad', name: '悲伤' },
          { id: 'angry', name: '生气' },
          { id: 'fearful', name: '恐惧' },
          { id: 'disgruntled', name: '不满' },
          { id: 'serious', name: '严肃' },
          { id: 'affectionate', name: '深情' },
          { id: 'gentle', name: '温柔' },
          { id: 'embarrassed', name: '尴尬' }
        ];
        break;
      case 'baidu':
        // 百度语音不支持情感参数，返回空数组
        emotions = [];
        break;
      case 'aliyun':
        emotions = [
          { id: 'neutral', name: '中性' },
          { id: 'happy', name: '开心' },
          { id: 'sad', name: '悲伤' },
          { id: 'angry', name: '生气' }
        ];
        break;
      case 'tencent':
        // 腾讯云语音不支持情感参数，返回空数组
        emotions = [];
        break;
      default:
        emotions = [
          { id: 'neutral', name: '中性' },
          { id: 'happy', name: '开心' },
          { id: 'sad', name: '悲伤' }
        ];
    }

    return success(emotions);
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