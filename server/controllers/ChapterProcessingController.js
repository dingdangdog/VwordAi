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

      // ---------- LLM 请求前日志（含 ASCII 汇总，避免终端编码导致中文乱码） ----------
      const contentLen = (chapter.content || "").length;
      const contentPreview = (chapter.content || "").slice(0, 400);
      log.info(
        `[ChapterProcessingController] Before LLM: chapterId=${chapterId} contentLength=${contentLen}`
      );
      log.info(
        `[ChapterProcessingController] llm:parse-chapter Before chapterId=${chapterId} title=${chapter.title || chapter.name} contentLength=${contentLen}`
      );
      log.info(
        `[ChapterProcessingController] Content preview (first 400 chars): ${contentPreview}${contentLen > 400 ? "..." : ""}`
      );

      // 调用LLM服务进行文本解析
      const LLMService = require("../services/LLMService");
      const Settings = require("../models/Settings");

      const llmSettings = Settings.getLLMSettings();
      const providers = llmSettings.providers || {};
      const providerId = chapter.llmProvider || Object.keys(providers)[0] || "volcengine";
      const providerConfig = providers[providerId];

      if (!providerConfig) {
        return error(
          `LLM provider ${providerId} not configured`
        );
      }
      const hasKey = providerConfig.key || providerConfig.appkey;
      if (!hasKey) {
        return error(
          `LLM provider ${providerId} missing key/appkey`
        );
      }

      log.info(
        `[ChapterProcessingController] Call LLM provider=${providerId} protocol=${providerConfig.protocol || "openai"}`
      );

      const parseResult = await LLMService.parseText(
        chapter.content,
        providerId,
        providerConfig
      );

      // ---------- LLM 响应后日志（首行 ASCII 汇总，避免终端乱码） ----------
      const rawSegments = parseResult.success ? (parseResult.data.segments || []) : [];
      log.info(
        `[ChapterProcessingController] After LLM: success=${parseResult.success} segmentsCount=${rawSegments.length} contentLength=${contentLen}`
      );
      log.info(
        `[ChapterProcessingController] llm:parse-chapter After success=${parseResult.success} segmentsCount=${rawSegments.length}`
      );
      if (parseResult.success && rawSegments.length > 0) {
        const firstT = (rawSegments[0] && (rawSegments[0].t ?? rawSegments[0].text)) || "";
        const lastT = (rawSegments[rawSegments.length - 1] && (rawSegments[rawSegments.length - 1].t ?? rawSegments[rawSegments.length - 1].text)) || "";
        log.info(
          `[ChapterProcessingController] firstSegmentLen=${firstT.length} lastSegmentLen=${lastT.length}`
        );
        log.info(
          `[ChapterProcessingController] First segment preview: ${String(firstT).slice(0, 80)}${firstT.length > 80 ? "..." : ""}`
        );
        log.info(
          `[ChapterProcessingController] Last segment preview: ${String(lastT).slice(0, 80)}${lastT.length > 80 ? "..." : ""}`
        );
      }
      if (parseResult.success && rawSegments.length <= 1 && contentLen > 100) {
        log.warn(
          `[ChapterProcessingController] Possible incomplete parse: contentLength=${contentLen} but segmentsCount=${rawSegments.length}. Check LLM prompt or max_tokens.`
        );
      }
      if (!parseResult.success) {
        log.error(
          `[ChapterProcessingController] Parse failed: ${parseResult.error}`
        );
      }

      if (parseResult.success) {
        // 规范为中间通用数据（剧本）格式并写入章节
        const segments = rawSegments.map((seg, i) => ({
          index: i,
          text: seg.text || "",
          character: seg.character || "旁白",
          emotion: seg.tone,
          tone: seg.tone,
          speed: typeof seg.speed === "number" ? seg.speed : 0,
          mimicry: seg.mimicry || (seg.voice && seg.voice !== "narrator-1" ? seg.voice : undefined),
          voice: seg.voice,
          ttsConfig: {
            provider: "",
            model: "",
            speed: 0,
            pitch: 0,
            volume: 100,
            emotion: "",
            style: "",
          },
          synthesisStatus: "unsynthesized",
        }));

        const parsedData = {
          title: chapter.title || chapter.name,
          segments,
          processedAt: parseResult.data.processedAt,
          provider: parseResult.data.provider,
          llmProvider: providerId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // 更新章节的解析结果和状态
        const updateResult = await NovelService.updateParsedChapter(chapterId, parsedData);

        if (updateResult.success) {
          return success(updateResult.data);
        } else {
          return error("Failed to save parsed data: " + updateResult.error);
        }
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
        throw new Error(`Unsupported TTS provider: ${providerType}`);
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
