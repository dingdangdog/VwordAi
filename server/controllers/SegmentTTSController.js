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
const NovelChapter = require("../models/NovelChapter");
const Novel = require("../models/Novel");
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
 * @param {Object} segmentData 段落数据 { text, voice, tone, ttsConfig }
 * @returns {Promise<Object>} 合成结果
 */
async function synthesizeSegment(chapterId, segmentData) {
  try {
    console.log(`[SegmentTTS] Starting segment synthesis for chapter ID: ${chapterId}`);
    console.log(`[SegmentTTS] Segment data:`, JSON.stringify(segmentData, null, 2));

    // Get chapter information
    const chapter = NovelChapter.getNovelChapterById(chapterId);
    if (!chapter) {
      return error("Chapter not found");
    }

    // Get TTS settings
    const ttsSettings = Settings.getTTSSettings();

    // Priority: segment TTS config > default config
    let providerType = "azure"; // Default to Azure

    if (segmentData.ttsConfig && segmentData.ttsConfig.provider) {
      providerType = segmentData.ttsConfig.provider;
    }

    console.log(`[SegmentTTS] Using TTS provider: ${providerType}`);

    // Get provider configuration
    const providerConfig = ttsSettings[providerType];
    if (!providerConfig) {
      return error(`TTS provider ${providerType} not configured`);
    }

    // Validate provider configuration completeness
    if (providerType === "azure" && (!providerConfig.key || !providerConfig.region)) {
      return error(`Azure TTS configuration incomplete, requires key and region`);
    }
    if (providerType === "aliyun" && (!providerConfig.appkey || !providerConfig.token)) {
      return error(`Aliyun TTS configuration incomplete, requires appkey and token`);
    }

    // Create temporary file path
    const tempDir = path.join(os.tmpdir(), `segment_tts_${chapterId}`);
    fs.ensureDirSync(tempDir);
    const tempFilePath = path.join(tempDir, `segment_${Date.now()}_${uuidv4()}.wav`);

    // Prepare synthesis settings - use segment TTS configuration
    const synthesisSettings = {
      voice: segmentData.voice || "zh-CN-XiaoxiaoNeural",
      tone: segmentData.tone || "平静",
      volume: segmentData.ttsConfig?.volume || 100,
      speed: segmentData.ttsConfig?.speed || 0,
      pitch: segmentData.ttsConfig?.pitch || 0,
      emotion: segmentData.ttsConfig?.emotion || "",
      style: segmentData.ttsConfig?.style || "",
      model: segmentData.ttsConfig?.model || segmentData.voice || "zh-CN-XiaoxiaoNeural"
    };

    console.log(`[SegmentTTS] Synthesis settings:`, JSON.stringify(synthesisSettings, null, 2));

    // Call corresponding TTS provider for synthesis
    const result = await TTSService.synthesizeWithProvider(
      segmentData.text,
      synthesisSettings,
      tempFilePath,
      providerConfig,
      providerType
    );

    if (!result.success || !result.data || !result.data.filePath || !fs.existsSync(result.data.filePath)) {
      console.error(`[SegmentTTS] Speech synthesis failed:`, result);
      return error(`Speech synthesis failed: ${result.message || "Unable to generate audio file"}`);
    }

    // Validate generated audio file
    const stats = fs.statSync(result.data.filePath);
    if (stats.size === 0) {
      return error(`Generated audio file is empty: ${result.data.filePath}`);
    }

    console.log(`[SegmentTTS] Speech synthesis successful, file size: ${stats.size} bytes`);

    // Create audio URL
    const audioUrl = `file://${result.data.filePath
      .replace(/\\/g, "/")
      .replace(/#/g, "%23")
      .replace(/\?/g, "%3F")}`;

    return success({
      audioUrl: audioUrl,
      audioPath: result.data.filePath,
      filePath: result.data.filePath
    });
  } catch (err) {
    console.error(`[SegmentTTS] Segment speech synthesis failed:`, err);
    return error(`Segment speech synthesis failed: ${err.message}`);
  }
}

/**
 * 合成整章语音（合并多个段落音频）
 * @param {string} chapterId 章节ID
 * @param {string[]} audioUrls 段落音频URL数组
 * @returns {Promise<Object>} 合成结果
 */
async function synthesizeFullChapter(chapterId, audioUrls) {
  try {
    console.log(`[SegmentTTS] Starting full chapter synthesis for chapter ID: ${chapterId}`);
    console.log(`[SegmentTTS] Number of audio URLs: ${audioUrls.length}`);

    // Get chapter information
    const chapter = NovelChapter.getNovelChapterById(chapterId);
    if (!chapter) {
      return error("Chapter not found");
    }

    // Validate input parameters
    if (!audioUrls || audioUrls.length === 0) {
      return error("No audio URLs provided");
    }

    // Get novel information for proper directory structure
    const novel = Novel.getNovelById(chapter.novelId);
    if (!novel) {
      return error("Novel not found");
    }

    // Use the same output directory structure as TTSService
    const globalSettings = Settings.getSettings();

    // Verify and prepare output directory
    let outputDir = globalSettings.defaultExportPath;
    // 检查输出目录是否存在且可写，不存在则设为null
    if (outputDir) {
      try {
        fs.ensureDirSync(outputDir);
      } catch (error) {
        console.error(
          `[SegmentTTS] Error accessing output directory: ${error.message}`
        );
        outputDir = null;
      }
    } else {
      outputDir = path.join(process.cwd(), "audio_output");
    }

    // 添加小说ID到输出路径，便于分类查看
    const novelDir = path.join(outputDir, novel.id);
    fs.ensureDirSync(novelDir);

    // 使用小说目录作为最终输出目录
    const finalOutputDir = novelDir;

    // Create temporary directory
    const tempDir = path.join(finalOutputDir, `temp`, `${chapterId}`);
    fs.ensureDirSync(tempDir);

    // Prepare audio file paths
    const audioFiles = [];
    for (let i = 0; i < audioUrls.length; i++) {
      const url = audioUrls[i];
      if (!url || url.trim() === "") {
        console.warn(`[SegmentTTS] Audio URL for segment ${i + 1} is empty, skipping`);
        continue;
      }

      // Extract file path from URL
      let filePath = url.replace(/^file:\/\//, "")
                        .replace(/%23/g, "#")
                        .replace(/%3F/g, "?")
                        .replace(/%20/g, " ");

      // Normalize path
      filePath = path.normalize(filePath);

      console.log(`[SegmentTTS] Checking audio file: ${filePath}`);

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > 0) {
          audioFiles.push(filePath);
          console.log(`[SegmentTTS] Valid audio file: ${filePath} (${stats.size} bytes)`);
        } else {
          console.warn(`[SegmentTTS] Audio file is empty: ${filePath}`);
        }
      } else {
        console.warn(`[SegmentTTS] Audio file does not exist: ${filePath}`);
      }
    }

    if (audioFiles.length === 0) {
      return error("No valid audio files to merge");
    }

    console.log(`[SegmentTTS] Found ${audioFiles.length} valid audio files, starting merge`);

    // Merge audio files
    const finalOutputFileName = `chapter_${chapterId}_${Date.now()}`;
    const mergedFilePath = path.join(tempDir, `${finalOutputFileName}.wav`);

    // Use audioUtils to merge audio files
    const mergedPath = await audioUtils.mergeAudioFiles(audioFiles, mergedFilePath);

    // Validate merged file
    if (!fs.existsSync(mergedPath)) {
      return error(`Merged file not created: ${mergedPath}`);
    }

    const mergedStats = fs.statSync(mergedPath);
    if (mergedStats.size === 0) {
      return error(`Merged file is empty: ${mergedPath}`);
    }

    console.log(`[SegmentTTS] Audio merge successful, file size: ${mergedStats.size} bytes`);

    // Create final output path
    const finalOutputPath = path.join(finalOutputDir, `${finalOutputFileName}.wav`);

    // Copy merged file to final output path
    await audioUtils.copyAudioFile(mergedPath, finalOutputPath);

    // Create audio URL
    const audioUrl = `file://${finalOutputPath
      .replace(/\\/g, "/")
      .replace(/#/g, "%23")
      .replace(/\?/g, "%3F")}`;

    // Get audio duration
    const duration = await audioUtils.getAudioDuration(finalOutputPath);

    console.log(`[SegmentTTS] Full chapter speech synthesis completed, duration: ${duration} seconds`);

    // Create TTS result data
    const ttsResult = {
      id: uuidv4(),
      chapterId: chapterId,
      audioUrl: audioUrl,
      audioPath: finalOutputPath,
      duration: duration || 0,
      createdAt: new Date().toISOString()
    };

    // Update chapter with TTS results
    const currentChapter = NovelChapter.getNovelChapterById(chapterId);
    if (currentChapter) {
      // 获取现有的TTS结果结构
      const existingTtsResults = currentChapter.ttsResults || {
        segments: [],
        audioFiles: [],
        mergedAudioFile: null,
        status: "pending",
        createdAt: null,
        completedAt: null
      };

      // 更新TTS结果结构
      const updatedTtsResults = {
        ...existingTtsResults,
        mergedAudioFile: ttsResult,
        status: "completed",
        completedAt: new Date().toISOString()
      };

      // Update chapter status and TTS results
      NovelChapter.updateNovelChapter(chapterId, {
        audioPath: finalOutputPath,
        status: "completed",
        ttsResults: updatedTtsResults
      });
    }

    return success([ttsResult]);
  } catch (err) {
    console.error(`[SegmentTTS] Full chapter speech synthesis failed:`, err);
    return error(`Full chapter speech synthesis failed: ${err.message}`);
  }
}

module.exports = {
  init
};
