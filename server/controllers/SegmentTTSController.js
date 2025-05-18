/**
 * 段落语音合成控制器
 * 处理所有与段落语音合成相关的IPC通信
 */
const { ipcMain } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const { success, error } = require("../utils/result");
const TTSService = require("../services/TTSService");
const audioUtils = require("../utils/audioUtils");
const Chapter = require("../models/Chapter");
const Settings = require("../models/Settings");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

/**
 * 注册所有段落语音合成相关的IPC事件处理程序
 */
function init() {
  // 合成单个段落的语音
  ipcMain.handle("tts:synthesize-segment", async (event, chapterId, segmentData) => {
    return await synthesizeSegment(chapterId, segmentData);
  });

  // 合成整章语音（合并多个段落音频）
  ipcMain.handle("tts:synthesize-full-chapter", async (event, chapterId, parsedChapterId, audioUrls) => {
    return await synthesizeFullChapter(chapterId, parsedChapterId, audioUrls);
  });
}

/**
 * 合成单个段落的语音
 * @param {string} chapterId 章节ID
 * @param {Object} segmentData 段落数据 { text, voice, tone }
 * @returns {Promise<Object>} 合成结果
 */
async function synthesizeSegment(chapterId, segmentData) {
  try {
    // 获取章节信息
    const chapter = Chapter.getChapterById(chapterId);
    if (!chapter) {
      return error("章节不存在");
    }

    // 获取TTS设置
    const ttsSettings = Settings.getTTSSettings();
    
    // 使用章节中指定的TTS提供商
    const providerType = chapter.ttsProvider || "azure"; // 默认使用Azure
    
    // 获取对应提供商的配置
    const providerConfig = ttsSettings[providerType];
    if (!providerConfig || !providerConfig.key) {
      return error(`TTS提供商 ${providerType} 未配置或密钥缺失`);
    }

    // 创建临时文件路径
    const tempDir = path.join(os.tmpdir(), `segment_tts_${chapterId}`);
    fs.ensureDirSync(tempDir);
    const tempFilePath = path.join(tempDir, `segment_${Date.now()}_${uuidv4()}.wav`);

    // 准备合成设置
    const synthesisSettings = {
      voice: segmentData.voice || "default",
      tone: segmentData.tone || "平静",
      volume: 100,
      speed: 0,
      pitch: 0
    };

    // 调用对应的TTS提供商进行合成
    const result = await TTSService.synthesizeWithProvider(
      segmentData.text,
      synthesisSettings,
      tempFilePath,
      providerConfig,
      providerType
    );

    if (!result.success || !result.data || !result.data.filePath || !fs.existsSync(result.data.filePath)) {
      return error(`语音合成失败: ${result.message || "无法生成音频文件"}`);
    }

    // 创建音频URL
    const audioUrl = `file://${result.data.filePath
      .replace(/\\/g, "/")
      .replace(/#/g, "%23")
      .replace(/\?/g, "%3F")}`;

    return success({
      audioUrl: audioUrl,
      filePath: result.data.filePath
    });
  } catch (err) {
    console.error(`[SegmentTTS] 合成段落语音失败:`, err);
    return error(`合成段落语音失败: ${err.message}`);
  }
}

/**
 * 合成整章语音（合并多个段落音频）
 * @param {string} chapterId 章节ID
 * @param {string} parsedChapterId 解析后的章节ID
 * @param {string[]} audioUrls 段落音频URL数组
 * @returns {Promise<Object>} 合成结果
 */
async function synthesizeFullChapter(chapterId, parsedChapterId, audioUrls) {
  try {
    // 获取章节信息
    const chapter = Chapter.getChapterById(chapterId);
    if (!chapter) {
      return error("章节不存在");
    }

    // 创建输出目录
    const outputDir = path.join(process.cwd(), "output", "audio");
    fs.ensureDirSync(outputDir);
    
    // 创建临时目录
    const tempDir = path.join(outputDir, `temp`, `${chapterId}`);
    fs.ensureDirSync(tempDir);

    // 准备音频文件路径
    const audioFiles = [];
    for (let i = 0; i < audioUrls.length; i++) {
      const url = audioUrls[i];
      // 从URL中提取文件路径
      const filePath = url.replace(/^file:\/\//, "")
                          .replace(/%23/g, "#")
                          .replace(/%3F/g, "?");
      
      if (fs.existsSync(filePath)) {
        audioFiles.push(filePath);
      } else {
        console.warn(`[SegmentTTS] 音频文件不存在: ${filePath}`);
      }
    }

    if (audioFiles.length === 0) {
      return error("没有有效的音频文件可合并");
    }

    // 合并音频文件
    const finalOutputFileName = `chapter_${chapterId}_${Date.now()}`;
    const mergedFilePath = path.join(tempDir, `${finalOutputFileName}.wav`);
    
    // 使用audioUtils合并音频文件
    await audioUtils.mergeAudioFiles(audioFiles, mergedFilePath);
    
    // 验证合并后的文件
    if (!fs.existsSync(mergedFilePath)) {
      return error(`合并后的文件未创建: ${mergedFilePath}`);
    }

    // 创建最终输出路径
    const finalOutputPath = path.join(outputDir, `${finalOutputFileName}.wav`);
    
    // 复制合并后的文件到最终输出路径
    await audioUtils.copyAudioFile(mergedFilePath, finalOutputPath);
    
    // 更新章节状态
    Chapter.updateChapter(chapterId, {
      audioPath: finalOutputPath,
      status: "completed",
    });

    // 创建音频URL
    const audioUrl = `file://${finalOutputPath
      .replace(/\\/g, "/")
      .replace(/#/g, "%23")
      .replace(/\?/g, "%3F")}`;

    // 获取音频时长
    const duration = await audioUtils.getAudioDuration(finalOutputPath);

    return success([{
      id: uuidv4(),
      chapterId: chapterId,
      audioUrl: audioUrl,
      duration: duration || 0,
      createdAt: new Date().toISOString()
    }]);
  } catch (err) {
    console.error(`[SegmentTTS] 合成整章语音失败:`, err);
    return error(`合成整章语音失败: ${err.message}`);
  }
}

module.exports = {
  init
};
