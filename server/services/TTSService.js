/**
 * Text-to-Speech Service
 * Responsible for converting text to speech
 */
const path = require("path");
const fs = require("fs-extra");

const Chapter = require("../models/Chapter");
const Settings = require("../models/Settings");
const audioUtils = require("../utils/audioUtils");
const { success, error } = require("../utils/result");
const Project = require("../models/Project");

// Load voice service provider modules
const azureProvider = require("../tts/azure");
// Load other providers based on actual project situation
let aliyunProvider;
let tencentProvider;
let baiduProvider;

try {
  aliyunProvider = require("../tts/aliyun");
} catch (e) {
  console.warn(
    "Aliyun voice service module not found or failed to load",
    e.message
  );
}

try {
  tencentProvider = require("../tts/tencent");
} catch (e) {
  console.warn(
    "Tencent voice service module not found or failed to load",
    e.message
  );
}

try {
  baiduProvider = require("../tts/baidu");
} catch (e) {
  console.warn(
    "Baidu voice service module not found or failed to load",
    e.message
  );
}

// Load voice model data
const MODELS_JSON_PATH = path.join(__dirname, "../assets/models.json");
let voiceModels = [];

try {
  const configDir = path.dirname(MODELS_JSON_PATH);
  fs.ensureDirSync(configDir);
  if (!fs.existsSync(MODELS_JSON_PATH)) {
    fs.writeJsonSync(MODELS_JSON_PATH, [], { spaces: 2 });
    console.log(`Created empty voice model file: ${MODELS_JSON_PATH}`);
  } else {
    voiceModels = fs.readJsonSync(MODELS_JSON_PATH);
    console.log(`Successfully loaded ${voiceModels.length} voice models`);
  }
} catch (err) {
  console.error("Failed to load or create voice model file:", err);
  voiceModels = [];
}

// Text length limits
const TEXT_LENGTH_LIMITS = {
  azure: 2000,
  aliyun: 2000,
  tencent: 2000,
  baidu: 2000,
};

/**
 * Split text into chunks suitable for TTS synthesis
 */
function splitTextIntoChunks(text, maxLength = 5000) {
  if (!text) return [];
  if (text.length <= maxLength)
    return [text.trim()].filter((s) => s.length > 0);

  const segments = [];
  let remainingText = text.trim();
  // Split by common sentence/clause endings first, then paragraphs, then force split
  const splitRegex = new RegExp(
    `([\s\S]{1,${maxLength}})([.。！？?!，；,;\n\r]|$)`,
    "g"
  );

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
  segments.forEach((seg) => {
    if (seg.length > maxLength) {
      for (let i = 0; i < seg.length; i += maxLength) {
        finalSegments.push(seg.substring(i, i + maxLength));
      }
    } else {
      finalSegments.push(seg);
    }
  });

  return finalSegments.filter((s) => s.length > 0);
}

/**
 * Get the corresponding Provider based on provider type
 * @param {string} providerType Provider type
 * @returns {Object|null} Provider object
 */
function getProviderModule(providerType) {
  switch (providerType) {
    case "azure":
      return azureProvider;
    case "aliyun":
      return aliyunProvider;
    case "tencent":
      return tencentProvider;
    case "baidu":
      return baiduProvider;
    default:
      return null;
  }
}

/**
 * Synthesize voice chunks using the corresponding service provider
 * @param {string} chunk Text chunk
 * @param {Object} settings Synthesis settings
 * @param {string} outputPath Output file path
 * @param {Object} providerConfig Provider configuration
 * @param {string} providerType Provider type
 * @returns {Promise<Object>} Synthesis result
 */
async function synthesizeWithProvider(
  chunk,
  settings,
  outputPath,
  providerConfig,
  providerType
) {
  console.log("providerType", providerType);
  const provider = getProviderModule(providerType);
  if (!provider) {
    throw new Error(`Provider module not found: ${providerType}`);
  }

  try {
    console.log(
      `[TTS] Using ${providerType} to synthesize ${chunk.length} characters to ${outputPath}`
    );

    // For Aliyun provider, ensure the voice parameter is set correctly
    if (providerType === "aliyun" && settings.model && !settings.voice) {
      settings.voice = settings.model;
    }

    // Call the corresponding provider's synthesize method
    const result = await provider.synthesize(
      chunk,
      outputPath,
      settings,
      providerConfig
    );

    if (
      !result.success ||
      !result.data ||
      !result.data.filePath ||
      !fs.existsSync(result.data.filePath)
    ) {
      throw new Error(
        `Voice synthesis failed: ${
          result.message || "Unable to generate audio file"
        }`
      );
    }

    return result;
  } catch (err) {
    console.error(`[TTS] ${providerType} synthesis failed:`, err);
    throw new Error(`${providerType} voice synthesis failed: ${err.message}`);
  }
}

/**
 * Synthesize voice for a single chapter
 * @param {string} chapterId Chapter ID
 * @returns {Promise<Object>} Result object { success: boolean, data?: {outputPath, settings}, error?: string }
 */
async function synthesizeChapter(chapterId) {
  let tempAudioFiles = [];
  let mergedFilePath = null;

  try {
    const chapter = Chapter.getChapterById(chapterId);
    if (!chapter) {
      return error("Failed to retrieve chapter data");
    }

    if (!chapter.text || chapter.text.trim().length === 0) {
      throw new Error("Chapter text is empty");
    }

    // Get project to use in file path
    const project = Project.getProjectById(chapter.projectId);
    if (!project) {
      throw new Error("Project not found for this chapter");
    }

    // 1. Determine Provider and Settings
    const globalSettings = Settings.getSettings();
    const ttsSettings = Settings.getTTSSettings(); // 获取TTS专用配置
    const chapterSettings = chapter.settings || {};

    // If chapter has no service provider, check project settings
    if (!chapterSettings.serviceProvider) {
      if (
        project &&
        project.defaultVoiceSettings &&
        project.defaultVoiceSettings.serviceProvider
      ) {
        Object.assign(chapterSettings, project.defaultVoiceSettings);
      }
    }

    const providerType = chapterSettings.serviceProvider;

    if (
      !providerType ||
      !["azure", "aliyun", "tencent", "baidu"].includes(providerType)
    ) {
      throw new Error(
        "No valid voice service provider specified in chapter or project settings"
      );
    }

    // 2. Get Provider Configuration - 从TTS配置中获取服务商设置
    const providerConfig = ttsSettings[providerType];
    if (!isProviderConfigValid(providerType, providerConfig)) {
      throw new Error(
        `Provider '${providerType}' configuration is incomplete or invalid`
      );
    }

    // 3. Generate filename and prepare output path
    const timestamp = Date.now();
    const safeChapterName = chapter.name
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, "_")
      .substring(0, 50);
    const finalOutputFileName = `${safeChapterName}_${chapterId.slice(
      -6
    )}_${timestamp}`;

    // Verify and prepare output directory
    let outputDir = globalSettings.defaultExportPath;
    // 检查输出目录是否存在且可写，不存在则设为null
    if (outputDir) {
      try {
        fs.ensureDirSync(outputDir);
      } catch (error) {
        console.error(
          `[TTS] Error accessing output directory: ${error.message}`
        );
        outputDir = null;
      }
    } else {
      outputDir = path.join(process.cwd(), "audio_output");
    }

    // 添加项目ID到输出路径，便于分类查看
    const projectDir = path.join(outputDir, project.id);
    fs.ensureDirSync(projectDir);
    const finalOutputPath = path.join(projectDir, `${finalOutputFileName}.wav`);

    // 4. Prepare synthesis settings - Use only chapter settings or defaults from project
    // Do not use globalSettings.defaultVoiceSettings
    const synthesisSettings = {
      ...chapterSettings,
      serviceProvider: providerType,
    };

    // 5. Split text into chunks
    const maxLength = TEXT_LENGTH_LIMITS[providerType] || 5000;
    const textChunks = splitTextIntoChunks(chapter.text, maxLength);
    if (textChunks.length === 0) {
      throw new Error("Text split resulted in empty chunks");
    }

    // 6. Update chapter status
    Chapter.updateChapter(chapterId, { status: "processing" });

    // 7. Create temp directory
    const tempDir = path.join(outputDir, `temp`, `${chapterId}`);
    fs.ensureDirSync(tempDir);

    // 8. Synthesize each chunk
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      // 使用字母数字的文件名，避免中文或特殊字符导致的路径问题
      const tempOutputPath = path.join(
        tempDir,
        `chunk_${i + 1}_${Date.now()}.wav`
      );

      try {
        const chunkResult = await synthesizeWithProvider(
          chunk,
          synthesisSettings,
          tempOutputPath,
          providerConfig,
          providerType
        );

        if (
          !chunkResult.success ||
          !chunkResult.data.filePath ||
          !fs.existsSync(chunkResult.data.filePath)
        ) {
          throw new Error(
            `Voice synthesis failed (chunk ${i + 1}): ${
              chunkResult.message || "Unable to generate audio file"
            }`
          );
        }

        const stats = fs.statSync(chunkResult.data.filePath);
        if (stats.size === 0) {
          throw new Error(
            `Generated audio file is empty: ${chunkResult.data.filePath}`
          );
        }

        // 记录添加到临时文件列表
        console.log(
          `[TTS] Adding chunk file to merge list: ${chunkResult.data.filePath}`
        );
        tempAudioFiles.push(chunkResult.data.filePath);
      } catch (chunkError) {
        throw new Error(
          `Failed to synthesize chunk ${i + 1}: ${chunkError.message}`
        );
      }
    }

    console.log(
      `[TTS] Generated ${tempAudioFiles.length} audio chunks to process`
    );

    // 9. Process final output
    if (tempAudioFiles.length > 1) {
      mergedFilePath = path.join(tempDir, `${finalOutputFileName}.wav`);
      console.log(`[TTS] Starting audio merge to: ${mergedFilePath}`);

      try {
        // 验证所有源文件确实存在并可访问
        let allFilesValid = true;
        for (const file of tempAudioFiles) {
          if (!fs.existsSync(file)) {
            console.error(`[TTS] ERROR: Source file does not exist: ${file}`);
            allFilesValid = false;
          }
        }

        if (!allFilesValid) {
          throw new Error("One or more source audio files cannot be accessed");
        }

        // 对于只有两个文件的简单情况，我们直接读取并拼接二进制数据
        if (tempAudioFiles.length === 2) {
          console.log(`[TTS] Using direct binary concatenation for two files`);

          try {
            // 读取两个文件
            const file1Data = fs.readFileSync(tempAudioFiles[0]);
            const file2Data = fs.readFileSync(tempAudioFiles[1]);

            // 提取WAV头部信息
            const headerLength = 44; // 标准WAV头部长度
            const header = file1Data.slice(0, headerLength);
            const audio1 = file1Data.slice(headerLength);
            const audio2 = file2Data.slice(headerLength);

            // 创建新的合并数据
            const combinedAudio = Buffer.concat([audio1, audio2]);

            // 写入新的头部 (这里需要更新文件大小信息)
            const size = combinedAudio.length;
            // 更新头部中的数据大小 (4字节，位置40)
            header.writeUInt32LE(size, 40);
            // 更新头部中的总文件大小 (4字节，位置4)
            header.writeUInt32LE(size + 36, 4);

            // 合并头部和音频数据
            const finalData = Buffer.concat([header, combinedAudio]);

            // 写入到合并文件
            fs.writeFileSync(mergedFilePath, finalData);
            console.log(`[TTS] Direct binary audio merge completed`);
          } catch (binaryMergeError) {
            console.error(
              `[TTS] Direct binary merge failed: ${binaryMergeError.message}`
            );
            // 如果二进制合并失败，继续尝试FFmpeg方式
          }
        }

        // 如果二进制合并失败或者有超过2个文件，使用FFmpeg
        if (!fs.existsSync(mergedFilePath)) {
          // 合并文件前确保文件路径是绝对路径
          const normalizedTempFiles = tempAudioFiles.map((filePath) =>
            path.isAbsolute(filePath)
              ? filePath
              : path.resolve(process.cwd(), filePath)
          );

          // 尝试使用audioUtils进行合并
          await audioUtils.mergeAudioFiles(normalizedTempFiles, mergedFilePath);
        }

        // 验证合并后的文件
        if (!fs.existsSync(mergedFilePath)) {
          throw new Error(`Merged file was not created: ${mergedFilePath}`);
        }

        const mergedStats = fs.statSync(mergedFilePath);
        if (mergedStats.size === 0) {
          throw new Error(`Merged file is empty: ${mergedFilePath}`);
        }

        // 验证合并文件大小至少应大于等于最大的单个文件
        const largestInputSize = Math.max(
          ...tempAudioFiles.map((file) =>
            fs.existsSync(file) ? fs.statSync(file).size : 0
          )
        );

        if (mergedStats.size <= largestInputSize) {
          console.warn(
            `[TTS] Warning: Merged file size (${mergedStats.size}) is not larger than the largest input file (${largestInputSize})`
          );

          // 如果合并结果不正确，使用第一个有效文件作为后备方案
          console.log(`[TTS] Using first valid file as fallback`);

          // 查找第一个有效文件
          for (const file of tempAudioFiles) {
            if (fs.existsSync(file) && fs.statSync(file).size > 0) {
              await fs.copyFile(file, mergedFilePath);
              console.log(`[TTS] Copied ${file} to merged file as fallback`);
              break;
            }
          }
        }

        console.log(
          `[TTS] Successfully merged audio to: ${mergedFilePath} (${
            fs.statSync(mergedFilePath).size
          } bytes)`
        );

        // 使用新的copyAudioFile工具替代直接复制
        await audioUtils.copyAudioFile(mergedFilePath, finalOutputPath);
        console.log(
          `[TTS] Copied merged file to final output: ${finalOutputPath}`
        );
      } catch (mergeError) {
        console.error(`[TTS] Audio merge failed: ${mergeError.message}`);

        // 如果合并失败，使用第一个有效文件
        console.log(`[TTS] Using first valid file due to merge failure`);
        for (const file of tempAudioFiles) {
          if (fs.existsSync(file) && fs.statSync(file).size > 0) {
            await audioUtils.copyAudioFile(file, finalOutputPath);
            console.log(`[TTS] Copied ${file} to final output as fallback`);
            break;
          }
        }

        // 检查是否有有效的最终输出
        if (!fs.existsSync(finalOutputPath)) {
          throw new Error("Failed to create audio output file");
        }
      }
    } else if (tempAudioFiles.length === 1) {
      console.log(
        `[TTS] Single audio file, copying from ${tempAudioFiles[0]} to ${finalOutputPath}`
      );
      // 使用新的copyAudioFile工具
      await audioUtils.copyAudioFile(tempAudioFiles[0], finalOutputPath);
    } else {
      throw new Error("No audio files were generated");
    }

    // 10. Update chapter status and return success
    Chapter.updateChapter(chapterId, {
      audioPath: finalOutputPath,
      status: "completed",
    });

    const audioUrl = `file://${finalOutputPath
      .replace(/\\/g, "/")
      .replace(/#/g, "%23")
      .replace(/\?/g, "%3F")}`;

    return success({
      chapterId: chapter.id,
      outputPath: finalOutputPath,
      audioUrl: audioUrl,
      settings: synthesisSettings,
    });
  } catch (err) {
    console.error(`[TTS] Chapter ${chapterId} synthesis failed:`, err);
    try {
      Chapter.updateChapter(chapterId, { status: "error" });
    } catch (updateError) {
      console.error(
        `[TTS] Failed to update chapter error status:`,
        updateError
      );
    }
    return error(`Synthesis failed: ${err.message}`);
  } finally {
    // Cleanup code is commented out in the original
    console.log(`[TTS] Cleaning up temporary files`);
    tempAudioFiles.forEach((fp) => {
      if (fp && fs.existsSync(fp)) {
        try {
          fs.removeSync(fp);
        } catch (e) {
          console.error(`[TTS] Failed to delete temporary file ${fp}:`, e);
        }
      }
    });
  }
}

/**
 * Check if the provider configuration contains required fields
 */
function isProviderConfigValid(providerType, config) {
  if (!config) return false;
  switch (providerType) {
    case "azure":
      return !!config.key && !!config.region;
    case "aliyun":
      return !!config.appkey && !!config.token;
    case "tencent":
      return !!config.secretId && !!config.secretKey;
    case "baidu":
      return !!config.apiKey && !!config.secretKey;
    default:
      return false;
  }
}

/**
 * Batch synthesize voice for multiple chapters (concurrency control)
 */
async function synthesizeMultipleChapters(chapterIds) {
  if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
    return error("No chapter IDs specified for synthesis");
  }

  const results = [];
  const errors = [];
  const globalSettings = Settings.getSettings();
  const maxConcurrentTasks =
    globalSettings.maxConcurrentTasks > 0
      ? globalSettings.maxConcurrentTasks
      : 1; // Ensure at least 1

  console.log(
    `[TTS Batch] Starting batch synthesis for ${chapterIds.length} chapters, max concurrency: ${maxConcurrentTasks}`
  );

  // Initial status update
  chapterIds.forEach((id) => {
    try {
      Chapter.updateChapter(id, { status: "processing" });
    } catch (e) {
      console.error(
        `[TTS Batch] Failed to update initial status for chapter ${id}:`,
        e
      );
    }
  });

  const taskQueue = [...chapterIds];
  let runningTasks = 0;

  return new Promise((resolve) => {
    function runNextTask() {
      while (runningTasks < maxConcurrentTasks && taskQueue.length > 0) {
        runningTasks++;
        const chapterId = taskQueue.shift();
        console.log(
          `[TTS Batch] Starting task: ${chapterId} (remaining in queue: ${taskQueue.length}, running: ${runningTasks})`
        );

        synthesizeChapter(chapterId)
          .then((result) => {
            if (result.success) {
              results.push(result.data);
              console.log(`[TTS Batch] Task succeeded: ${chapterId}`);
            } else {
              errors.push({ chapterId, error: result.error });
              console.error(
                `[TTS Batch] Task failed: ${chapterId} - ${result.error}`
              );
              // Status already set to 'error' by synthesizeChapter on failure
            }
          })
          .catch((err) => {
            errors.push({ chapterId, error: err.message });
            console.error(
              `[TTS Batch] Task exception: ${chapterId} - ${err.message}`
            );
            // Ensure status is error if an exception occurred
            try {
              Chapter.updateChapter(chapterId, { status: "error" });
            } catch (e) {}
          })
          .finally(() => {
            runningTasks--;
            console.log(
              `[TTS Batch] Task completed: ${chapterId} (remaining in queue: ${taskQueue.length}, running: ${runningTasks})`
            );
            if (taskQueue.length === 0 && runningTasks === 0) {
              // All tasks finished
              console.log(
                `[TTS Batch] All tasks completed. Success: ${results.length}, Failure: ${errors.length}`
              );
              resolve(
                success({
                  successful: results,
                  failed: errors,
                  total: chapterIds.length,
                  successCount: results.length,
                  failureCount: errors.length,
                })
              );
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

module.exports = {
  synthesizeChapter,
  synthesizeMultipleChapters,
};
