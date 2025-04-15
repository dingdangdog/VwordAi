/**
 * 语音合成服务
 * 负责文本到语音的转换处理
 */
const path = require("path");
const fs = require("fs-extra");
const os = require("os");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { spawn } = require("child_process");
const { promisify } = require("util");
const crypto = require("crypto");

const Chapter = require("../models/Chapter");
const Settings = require("../models/Settings");
const audioUtils = require("../utils/audioUtils");
const { success, error } = require("../utils/result");

// 加载语音模型数据
const MODELS_JSON_PATH = path.join(__dirname, "../../config/models.json");
let voiceModels = [];

try {
  const configDir = path.dirname(MODELS_JSON_PATH);
  fs.ensureDirSync(configDir);
  if (!fs.existsSync(MODELS_JSON_PATH)) {
    fs.writeJsonSync(MODELS_JSON_PATH, [], { spaces: 2 });
    console.log(`创建空的语音模型文件: ${MODELS_JSON_PATH}`);
  } else {
    voiceModels = fs.readJsonSync(MODELS_JSON_PATH);
    console.log(`成功加载 ${voiceModels.length} 个语音模型`);
  }
} catch (err) {
  console.error("加载或创建语音模型文件失败:", err);
  voiceModels = [];
}

// 文本长度限制
const TEXT_LENGTH_LIMITS = {
  azure: 10000,
  aliyun: 5000,
  tencent: 5000,
  baidu: 5000,
};

/**
 * 获取默认的临时输出目录
 */
function getDefaultOutputDir() {
  const dir = path.join(os.tmpdir(), "dotts_output");
  fs.ensureDirSync(dir);
  return dir;
}

/**
 * 将文本分割成适合TTS合成的片段
 */
function splitTextIntoChunks(text, maxLength = 5000) {
  if (!text) return [];
  if (text.length <= maxLength) return [text.trim()].filter(s => s.length > 0);

  const segments = [];
  let remainingText = text.trim();
  // Split by common sentence/clause endings first, then paragraphs, then force split
  const splitRegex = new RegExp(`([\s\S]{1,${maxLength}})([.。！？?!，；,;\n\r]|$)`, 'g');
  
  let match;
  while ((match = splitRegex.exec(remainingText)) !== null) {
    const chunk = match[1].trim();
    if (chunk) {
        segments.push(chunk);
    }
    // Adjust remainingText based on the actual length matched by the regex
    remainingText = remainingText.substring(match[0].length).trim();
    // Reset regex index if we modified remainingText
    splitRegex.lastIndex = 0; 
  }

  // Add any leftover text
  if (remainingText) {
      segments.push(remainingText);
  }

  // Handle cases where a single segment might still exceed the limit (e.g., long unbroken string)
  const finalSegments = [];
  segments.forEach(seg => {
      if (seg.length > maxLength) {
          for (let i = 0; i < seg.length; i += maxLength) {
              finalSegments.push(seg.substring(i, i + maxLength));
          }
      } else {
          finalSegments.push(seg);
      }
  });

  return finalSegments.filter(s => s.length > 0);
}

/**
 * 合成单个章节的语音
 * @param {string} chapterId 章节ID
 * @returns {Promise<Object>} 结果对象 { success: boolean, data?: {outputPath, settings}, error?: string }
 */
async function synthesizeChapter(chapterId) {
  let tempAudioFiles = []; // Store paths of temporary audio files for cleanup
  let mergedFilePath = null;
  const chapterResult = Chapter.getChapterById(chapterId);
  if (!chapterResult.success || !chapterResult.data) {
    return error(chapterResult.error || "获取章节数据失败");
  }
  const chapter = chapterResult.data;

  try {
    if (!chapter.text || chapter.text.trim().length === 0) {
      throw new Error("章节文本为空");
    }

    // 1. Determine Provider and Settings
    const globalSettings = Settings.getAllSettings();
    const chapterSettings = chapter.settings || {};
    const providerType = chapterSettings.serviceProvider || globalSettings.defaultVoiceSettings?.serviceProvider;

    if (!providerType || !['azure', 'aliyun', 'tencent', 'baidu'].includes(providerType)) {
      throw new Error("未指定有效语音服务商");
    }

    // 2. Get Provider Configuration from Settings
    const providerConfig = globalSettings[providerType];
    if (!isProviderConfigValid(providerType, providerConfig)) {
      throw new Error(`服务商 '${providerType}' 配置不完整或无效`);
    }

    // 3. Prepare Output Path and Synthesis Settings
    const outputDir = globalSettings.defaultExportPath || getDefaultOutputDir();
    const finalOutputFileName = `${chapter.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, "_")}_${chapterId.slice(-6)}.mp3`;
    const finalOutputPath = path.join(outputDir, finalOutputFileName);
    
    const synthesisSettings = { // Merge settings, chapter overrides global
      ...globalSettings.defaultVoiceSettings,
      ...chapterSettings,
      serviceProvider: providerType // Ensure correct provider is set
    };

    // 4. Split Text
    const maxLength = TEXT_LENGTH_LIMITS[providerType] || 5000;
    const textChunks = splitTextIntoChunks(chapter.text, maxLength);
    if (textChunks.length === 0) {
      throw new Error("文本分割后为空");
    }

    // 5. Synthesize Chunks Concurrently (if needed, though API calls are sequential here)
    console.log(`[TTS] 开始合成章节 ${chapterId} (${chapter.name}) 使用 ${providerType}, 分为 ${textChunks.length} 块`);
    Chapter.updateChapter(chapterId, { status: 'processing' }); // Update status

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const chunkFilename = `${finalOutputFileName}_part${i + 1}_${uuidv4().slice(0, 4)}.tmp.wav`;
      const tempOutputPath = path.join(getDefaultOutputDir(), chunkFilename); // Use tmp dir for intermediate files
      tempAudioFiles.push(tempOutputPath); // Add to list for cleanup

      console.log(`[TTS] 合成块 ${i + 1}/${textChunks.length} 到 ${tempOutputPath}`);
      let chunkResult;
      switch (providerType) {
        case "azure": chunkResult = await synthesizeWithAzure(chunk, synthesisSettings, tempOutputPath, providerConfig); break;
        case "baidu": chunkResult = await synthesizeWithBaidu(chunk, synthesisSettings, tempOutputPath, providerConfig); break;
        case "aliyun": chunkResult = await synthesizeWithAliyun(chunk, synthesisSettings, tempOutputPath, providerConfig); break;
        case "tencent": chunkResult = await synthesizeWithTencent(chunk, synthesisSettings, tempOutputPath, providerConfig); break;
        default: throw new Error(`不支持的服务商类型: ${providerType}`); // Should not happen due to earlier check
      }

      if (!chunkResult.success || !chunkResult.outputPath || !fs.existsSync(chunkResult.outputPath)) {
        throw new Error(`语音合成失败 (块 ${i + 1}): ${chunkResult.message || '无法生成音频文件'}`);
      }
    }

    // 6. Merge and Convert
    console.log(`[TTS] 合成 ${tempAudioFiles.length} 个音频块`);
    if (tempAudioFiles.length > 1) {
      mergedFilePath = path.join(getDefaultOutputDir(), `${finalOutputFileName}.merged.wav`);
      tempAudioFiles.push(mergedFilePath); // Add merged file to cleanup list
      await audioUtils.mergeAudioFiles(tempAudioFiles.slice(0, -1), mergedFilePath); // Merge original temps
      console.log(`[TTS] 音频块合并到 ${mergedFilePath}`);
    } else if (tempAudioFiles.length === 1) {
      mergedFilePath = tempAudioFiles[0]; // Only one chunk, use it directly
    }

    if (!mergedFilePath || !fs.existsSync(mergedFilePath)) {
        throw new Error("合并或选择音频块失败");
    }

    console.log(`[TTS] 转换音频到 MP3: ${finalOutputPath}`);
    await audioUtils.convertAudioFormat(mergedFilePath, finalOutputPath, 'mp3');
    console.log(`[TTS] 成功生成最终文件: ${finalOutputPath}`);

    // 7. Update Chapter Status and Return Success
    Chapter.updateChapter(chapterId, { audioPath: finalOutputPath, status: 'completed' });
    return success({ chapterId: chapter.id, outputPath: finalOutputPath, settings: synthesisSettings });

  } catch (err) {
    console.error(`[TTS] 章节 ${chapterId} 合成失败:`, err);
    try {
      Chapter.updateChapter(chapterId, { status: 'error' });
    } catch (updateError) {
      console.error(`[TTS] 更新章节 ${chapterId} 错误状态失败:`, updateError);
    }
    return error(`合成失败: ${err.message}`);
  } finally {
    // 8. Cleanup Temporary Files
    console.log(`[TTS] 清理临时文件: ${tempAudioFiles.join(', ')}`);
    tempAudioFiles.forEach(fp => {
        if (fp && fs.existsSync(fp)) {
            try { fs.removeSync(fp); } catch (e) { console.error(`删除临时文件 ${fp} 失败:`, e); }
        }
    });
  }
}

/**
 * 检查服务商配置是否包含必需的字段
 */
function isProviderConfigValid(providerType, config) {
    if (!config) return false;
    switch(providerType) {
        case 'azure': return !!config.key && !!config.region;
        case 'aliyun': return !!config.appkey && !!config.token;
        case 'tencent': return !!config.secretId && !!config.secretKey;
        case 'baidu': return !!config.apiKey && !!config.secretKey;
        default: return false;
    }
}

// --- Individual Provider Synthesis Functions (MOCK IMPLEMENTATIONS) ---
// These should be replaced with actual SDK/API calls.
// They now receive `config` directly from Settings.

async function synthesizeWithAzure(text, settings, outputPath, config) {
  console.log(`[Azure MOCK] 合成 ${text.length} 字符, Voice: ${settings.voice}, Speed: ${settings.speed}`);
  if (!isProviderConfigValid('azure', config)) return { success: false, message: 'Azure配置无效' };
  try {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300)); // Simulate API call
    const mockWavHeader = Buffer.from('RIFF....WAVEfmt ....', 'ascii');
    fs.ensureDirSync(path.dirname(outputPath));
    fs.writeFileSync(outputPath, Buffer.concat([mockWavHeader, Buffer.from(`Azure:${text}`)]));
    return { success: true, outputPath };
  } catch (err) { return { success: false, message: `Azure模拟失败: ${err.message}` }; }
}

async function synthesizeWithBaidu(text, settings, outputPath, config) {
  console.log(`[Baidu MOCK] 合成 ${text.length} 字符, Voice: ${settings.voice}, Speed: ${settings.speed}`);
  if (!isProviderConfigValid('baidu', config)) return { success: false, message: 'Baidu配置无效' };
  try {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));
    const mockWavHeader = Buffer.from('RIFF....WAVEfmt ....', 'ascii');
    fs.ensureDirSync(path.dirname(outputPath));
    fs.writeFileSync(outputPath, Buffer.concat([mockWavHeader, Buffer.from(`Baidu:${text}`)]));
    return { success: true, outputPath };
  } catch (err) { return { success: false, message: `Baidu模拟失败: ${err.message}` }; }
}

async function synthesizeWithAliyun(text, settings, outputPath, config) {
  console.log(`[Aliyun MOCK] 合成 ${text.length} 字符, Voice: ${settings.voice}, Speed: ${settings.speed}`);
  if (!isProviderConfigValid('aliyun', config)) return { success: false, message: 'Aliyun配置无效' };
  try {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));
    const mockWavHeader = Buffer.from('RIFF....WAVEfmt ....', 'ascii');
    fs.ensureDirSync(path.dirname(outputPath));
    fs.writeFileSync(outputPath, Buffer.concat([mockWavHeader, Buffer.from(`Aliyun:${text}`)]));
    return { success: true, outputPath };
  } catch (err) { return { success: false, message: `Aliyun模拟失败: ${err.message}` }; }
}

async function synthesizeWithTencent(text, settings, outputPath, config) {
  console.log(`[Tencent MOCK] 合成 ${text.length} 字符, Voice: ${settings.voice}, Speed: ${settings.speed}`);
  if (!isProviderConfigValid('tencent', config)) return { success: false, message: 'Tencent配置无效' };
  try {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));
    const mockWavHeader = Buffer.from('RIFF....WAVEfmt ....', 'ascii');
    fs.ensureDirSync(path.dirname(outputPath));
    fs.writeFileSync(outputPath, Buffer.concat([mockWavHeader, Buffer.from(`Tencent:${text}`)]));
    return { success: true, outputPath };
  } catch (err) { return { success: false, message: `Tencent模拟失败: ${err.message}` }; }
}

// --- End of Mock Implementations ---


/**
 * 批量合成多个章节的语音 (并发控制)
 */
async function synthesizeMultipleChapters(chapterIds) {
  if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
    return error("未指定要合成的章节ID");
  }

  const results = [];
  const errors = [];
  const globalSettings = Settings.getAllSettings();
  const maxConcurrentTasks = globalSettings.maxConcurrentTasks > 0 ? globalSettings.maxConcurrentTasks : 1; // Ensure at least 1

  console.log(`[TTS Batch] 开始批量合成 ${chapterIds.length} 个章节，最大并发数: ${maxConcurrentTasks}`);

  // Initial status update
  chapterIds.forEach(id => {
    try { Chapter.updateChapter(id, { status: 'processing' }); }
    catch(e) { console.error(`[TTS Batch] 更新章节 ${id} 初始状态失败:`, e); }
  });

  const taskQueue = [...chapterIds];
  let runningTasks = 0;

  return new Promise((resolve) => {
    function runNextTask() {
      while (runningTasks < maxConcurrentTasks && taskQueue.length > 0) {
        runningTasks++;
        const chapterId = taskQueue.shift();
        console.log(`[TTS Batch] 启动任务: ${chapterId} (队列剩余: ${taskQueue.length}, 运行中: ${runningTasks})`);
        
        synthesizeChapter(chapterId)
          .then(result => {
            if (result.success) {
              results.push(result.data);
              console.log(`[TTS Batch] 任务成功: ${chapterId}`);
            } else {
              errors.push({ chapterId, error: result.error });
              console.error(`[TTS Batch] 任务失败: ${chapterId} - ${result.error}`);
              // Status already set to 'error' by synthesizeChapter on failure
            }
          })
          .catch(err => {
            errors.push({ chapterId, error: err.message });
            console.error(`[TTS Batch] 任务异常: ${chapterId} - ${err.message}`);
            // Ensure status is error if an exception occurred
            try { Chapter.updateChapter(chapterId, { status: 'error' }); } catch (e) {}
          })
          .finally(() => {
            runningTasks--;
            console.log(`[TTS Batch] 任务完成: ${chapterId} (队列剩余: ${taskQueue.length}, 运行中: ${runningTasks})`);
            if (taskQueue.length === 0 && runningTasks === 0) {
              // All tasks finished
              console.log(`[TTS Batch] 所有任务完成. 成功: ${results.length}, 失败: ${errors.length}`);
              resolve(success({
                successful: results,
                failed: errors,
                total: chapterIds.length,
                successCount: results.length,
                failureCount: errors.length,
              }));
            } else {
              // Run next task if possible
              runNextTask(); 
            }
          });
      }
    }
    // Start initial tasks
    runNextTask(); 
  });
}

/**
 * 从models.json数据中获取声音角色列表
 */
function getVoiceRolesFromModels(providerType) {
  if (!voiceModels || voiceModels.length === 0) return [];
  const lowerProviderType = providerType.toLowerCase();
  
  return voiceModels
    .filter(model => model.provider && model.provider.toLowerCase() === lowerProviderType)
    .map(model => ({
      id: model.code,
      name: model.name,
      language: model.lang.includes("中") ? "zh-CN" : (model.lang.includes("英") ? "en-US" : model.lang),
      gender: model.gender === "0" ? "female" : "male",
      description: model.lang,
      options: model.options || [],
      emotions: model.emotions || []
    }));
}

/**
 * 获取特定服务商支持的声音角色列表
 */
async function getVoiceRoles(providerType) {
  try {
    if (!providerType || !['azure', 'aliyun', 'tencent', 'baidu'].includes(providerType.toLowerCase())) {
        return error("无效的服务商类型");
    }
    const roles = getVoiceRolesFromModels(providerType);
    if (roles.length === 0) {
      console.warn(`未找到服务商 '${providerType}' 的语音模型`);
    }
    return success(roles);
  } catch (err) {
    return error(`获取声音角色失败: ${err.message}`);
  }
}

/**
 * 从models.json数据中获取特定声音模型的情感列表
 */
function getEmotionsFromModels(providerType, voiceId) {
  if (!voiceModels || voiceModels.length === 0) return [];
  const lowerProviderType = providerType.toLowerCase();

  const model = voiceModels.find(
    m => m.provider && m.provider.toLowerCase() === lowerProviderType && m.code === voiceId
  );

  if (model && model.emotions && Array.isArray(model.emotions)) {
    return model.emotions.map(e => ({ id: e.code, name: e.name, description: e.desc }));
  }
  return [];
}

/**
 * 获取特定服务商和声音支持的情感列表
 */
async function getEmotions(providerType, voiceId) {
  try {
    if (!providerType || !['azure', 'aliyun', 'tencent', 'baidu'].includes(providerType.toLowerCase())) {
      return error("无效的服务商类型");
    }
    if (!voiceId) {
      return error("未指定声音ID");
    }
    const emotions = getEmotionsFromModels(providerType, voiceId);
    return success(emotions);
  } catch (err) {
    return error(`获取情感列表失败: ${err.message}`);
  }
}

module.exports = {
  synthesizeChapter,
  synthesizeMultipleChapters,
  getVoiceRoles,
  getEmotions,
};
