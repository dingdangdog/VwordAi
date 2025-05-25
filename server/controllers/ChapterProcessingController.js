/**
 * 章节处理控制器
 * 负责章节的LLM解析和TTS合成等业务逻辑
 * 与TTSController和LLMController分离，专注于业务流程
 */
const { ipcMain } = require("electron");
const { success, error } = require("../utils/result");
const log = require("electron-log");

/**
 * 初始化章节处理控制器
 */
function init() {
  // 注册LLM解析相关的业务处理器
  registerLLMProcessingHandlers();

  // 注册TTS合成相关的业务处理器
  registerTTSProcessingHandlers();

  console.log(
    "Chapter processing controller initialized - business logic only"
  );
}

/**
 * 注册LLM解析相关的业务处理器
 */
function registerLLMProcessingHandlers() {
  // 解析章节 - 业务逻辑
  ipcMain.handle("llm:parse-chapter", async (_, chapterId) => {
    try {
      log.info(
        `[ChapterProcessingController] Processing chapter: ${chapterId}`
      );

      // 获取章节数据
      const NovelService = require("../services/NovelService");
      const chapterResult = await NovelService.getChapter(chapterId);

      if (!chapterResult.success) {
        return error("Failed to retrieve chapter data");
      }

      const chapter = chapterResult.data;

      // 调用LLM服务进行文本解析
      const LLMService = require("../services/LLMService");
      const Settings = require("../models/Settings");

      // 获取LLM设置
      const llmSettings = Settings.getLLMSettings();
      const providerType = chapter.llmProvider || "volcengine"; // 默认使用火山引擎
      const providerConfig = llmSettings[providerType];

      if (!providerConfig || !providerConfig.key) {
        return error(
          `LLM provider ${providerType} not configured or missing key`
        );
      }

      // 解析章节文本
      const parseResult = await LLMService.parseText(
        chapter.content,
        providerType,
        providerConfig
      );

      if (parseResult.success) {
        // 保存解析结果
        const parsedData = {
          chapterId,
          title: chapter.title || chapter.name,
          ...parseResult.data,
        };

        // 更新章节状态
        await NovelService.updateChapter(chapterId, { processed: true });

        return success(parsedData);
      } else {
        return error(parseResult.error);
      }
    } catch (err) {
      log.error(
        `[ChapterProcessingController] Failed to parse chapter: ${err.message}`,
        err
      );
      return error(err.message);
    }
  });

  // 批量解析章节
  ipcMain.handle("llm:parse-chapters-batch", async (_, chapterIds) => {
    try {
      log.info(
        `[ChapterProcessingController] Parsing ${chapterIds.length} chapters`
      );

      const LLMService = require("../services/LLMService");
      const results = [];

      for (const chapterId of chapterIds) {
        try {
          const result = await LLMService.parseChapter(chapterId);
          results.push({
            chapterId,
            success: result.success,
            data: result.data,
            error: result.error,
          });
        } catch (err) {
          results.push({
            chapterId,
            success: false,
            error: err.message,
          });
        }
      }

      return success(results);
    } catch (err) {
      log.error(
        `[ChapterProcessingController] Failed to parse chapters: ${err.message}`,
        err
      );
      return error(err.message);
    }
  });
}

/**
 * 注册TTS合成相关的业务处理器
 */
function registerTTSProcessingHandlers() {
  // 合成单个章节的语音 - 业务逻辑
  ipcMain.handle("tts:synthesize-chapter", async (_, chapterId) => {
    try {
      log.info(
        `[ChapterProcessingController] Synthesizing chapter audio: ${chapterId}`
      );

      // 调用TTS服务进行章节合成
      const TTSService = require("../services/TTSService");
      const result = await TTSService.synthesizeChapter(chapterId);

      return result;
    } catch (err) {
      log.error(
        `[ChapterProcessingController] Synthesizing chapter audio failed: ${err.message}`,
        err
      );
      return error(err.message);
    }
  });

  // 批量合成多个章节的语音 - 业务逻辑
  ipcMain.handle("tts:synthesize-chapters-batch", async (_, chapterIds) => {
    try {
      log.info(
        `[ChapterProcessingController] Synthesizing ${chapterIds.length} chapters`
      );

      const TTSService = require("../services/TTSService");
      const result = await TTSService.synthesizeMultipleChapters(chapterIds);

      return result;
    } catch (err) {
      log.error(
        `[ChapterProcessingController] Synthesizing chapters failed: ${err.message}`,
        err
      );
      return error(err.message);
    }
  });

  // 合成解析后的章节段落语音
  ipcMain.handle(
    "tts:synthesize-parsed-chapter",
    async (_, chapterId, parsedData) => {
      try {
        log.info(
          `[ChapterProcessingController] Synthesizing parsed chapter audio: ${chapterId}`
        );

        // 这里可以调用专门的解析章节TTS服务
        // 或者使用现有的SegmentTTSController的功能
        const results = [];

        if (parsedData && parsedData.segments) {
          for (const segment of parsedData.segments) {
            // 调用段落TTS合成
            // 这里应该调用底层的TTS客户端，而不是控制器
            const segmentResult = await synthesizeSegmentText(
              segment,
              chapterId
            );
            results.push(segmentResult);
          }
        }

        return success({
          chapterId,
          segments: results,
          totalSegments: results.length,
          successCount: results.filter((r) => r.success).length,
        });
      } catch (err) {
        log.error(
          `[ChapterProcessingController] Synthesizing parsed chapter audio failed: ${err.message}`,
          err
        );
        return error(err.message);
      }
    }
  );
}

/**
 * 合成单个段落文本
 * @param {object} segment 段落数据
 * @param {string} chapterId 章节ID
 * @returns {Promise<object>} 合成结果
 */
async function synthesizeSegmentText(segment, chapterId) {
  try {
    // 这里应该直接调用TTS客户端，而不是通过控制器
    const Settings = require("../models/Settings");
    const ttsSettings = Settings.getTTSSettings();
    const providerType = ttsSettings.mode || "local";

    // 根据提供商类型加载对应的客户端
    let ttsClient;
    switch (providerType) {
      case "azure":
        ttsClient = require("../tts/azure");
        break;
      case "aliyun":
      case "alibaba":
        ttsClient = require("../tts/aliyun");
        break;
      case "sovits":
        ttsClient = require("../tts/sovits");
        break;
      case "local":
        ttsClient = require("../tts/local");
        break;
      default:
        throw new Error(`不支持的TTS提供商: ${providerType}`);
    }

    // 准备输出路径
    const path = require("path");
    const os = require("os");
    const outputPath = path.join(
      os.tmpdir(),
      `segment_${chapterId}_${segment.index || Date.now()}.wav`
    );

    // 准备合成设置
    const settings = {
      voice: segment.voice || ttsSettings[providerType]?.voice || "default",
      speed: segment.speed || ttsSettings[providerType]?.speed || 1.0,
      pitch: segment.pitch || ttsSettings[providerType]?.pitch || 0,
      volume: segment.volume || ttsSettings[providerType]?.volume || 50,
    };

    // 执行合成
    const result = await ttsClient.synthesize(
      segment.text,
      outputPath,
      settings,
      ttsSettings[providerType]
    );

    return {
      success: result.success,
      segmentIndex: segment.index,
      text: segment.text,
      outputPath: result.success ? outputPath : null,
      error: result.success ? null : result.message,
    };
  } catch (err) {
    return {
      success: false,
      segmentIndex: segment.index,
      text: segment.text,
      outputPath: null,
      error: err.message,
    };
  }
}

module.exports = {
  init,
};
