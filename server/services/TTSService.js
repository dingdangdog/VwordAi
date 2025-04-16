/**
 * Text-to-Speech Service
 * Responsible for converting text to speech
 */
const path = require("path");
const fs = require("fs-extra");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

const Chapter = require("../models/Chapter");
const Settings = require("../models/Settings");
const audioUtils = require("../utils/audioUtils");
const { success, error } = require("../utils/result");

// Load voice service provider modules
const azureProvider = require("../provider/azure");
// Load other providers based on actual project situation
let aliyunProvider;
let tencentProvider;
let baiduProvider;

try {
  aliyunProvider = require("../provider/aliyun");
} catch (e) {
  console.warn(
    "Aliyun voice service module not found or failed to load",
    e.message
  );
}

try {
  tencentProvider = require("../provider/tencent");
} catch (e) {
  console.warn(
    "Tencent voice service module not found or failed to load",
    e.message
  );
}

try {
  baiduProvider = require("../provider/baidu");
} catch (e) {
  console.warn(
    "Baidu voice service module not found or failed to load",
    e.message
  );
}

// Load voice model data
const MODELS_JSON_PATH = path.join(__dirname, "../../config/models.json");
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

    // Call the corresponding provider's synthesize method
    const result = await provider.synthesize(
      chunk,
      outputPath,
      settings,
      providerConfig
    );
    console.log(result);
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
  let tempAudioFiles = []; // Store paths of temporary audio files for cleanup
  let mergedFilePath = null;

  try {
    const chapter = Chapter.getChapterById(chapterId);
    if (!chapter) {
      return error("Failed to retrieve chapter data");
    }

    if (!chapter.text || chapter.text.trim().length === 0) {
      throw new Error("Chapter text is empty");
    }

    // 1. Determine Provider and Settings
    const globalSettings = Settings.getAllSettings();
    const chapterSettings = chapter.settings || {};
    const providerType =
      chapterSettings.serviceProvider ||
      globalSettings.defaultVoiceSettings?.serviceProvider;

    if (
      !providerType ||
      !["azure", "aliyun", "tencent", "baidu"].includes(providerType)
    ) {
      throw new Error("No valid voice service provider specified");
    }

    // 2. Get Provider Configuration from Settings
    const providerConfig = globalSettings[providerType];
    if (!isProviderConfigValid(providerType, providerConfig)) {
      throw new Error(
        `Provider '${providerType}' configuration is incomplete or invalid`
      );
    }

    // Generate a safe filename with timestamp to avoid conflicts and special character issues
    const timestamp = Date.now();
    const safeChapterName = chapter.name
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, "_")
      .substring(0, 50); // Limit length

    const finalOutputFileName = `${safeChapterName}_${chapterId.slice(
      -6
    )}_${timestamp}`;
    console.log(`[TTS] Output filename: ${finalOutputFileName}`);

    // 3. Prepare Output Path and Synthesis Settings
    let outputDir = globalSettings.defaultExportPath;

    // Check if the configured export path is valid and writable
    try {
      if (outputDir) {
        // Test if we can write to this directory
        const testFile = path.join(outputDir, `.test_${timestamp}.tmp`);
        fs.writeFileSync(testFile, "test", { encoding: "utf8" });
        fs.unlinkSync(testFile);
        console.log(
          `[TTS] Verified write access to output directory: ${outputDir}`
        );
      }
    } catch (error) {
      console.error(`[TTS] Error accessing output directory: ${error.message}`);
      outputDir = null;
    }

    // If the configured directory is invalid, use a default
    if (!outputDir) {
      outputDir = path.join(process.cwd(), "audio_output");
      console.log(`[TTS] Using fallback output directory: ${outputDir}`);
    }

    // Ensure output directory exists
    fs.ensureDirSync(outputDir);

    const finalOutputPath = path.join(
      outputDir,
      `${finalOutputFileName}.wav`
    );
    console.log(`[TTS] Final output path: ${finalOutputPath}`);

    const synthesisSettings = {
      // Merge settings, chapter overrides global
      ...globalSettings.defaultVoiceSettings,
      ...chapterSettings,
      serviceProvider: providerType, // Ensure correct provider is set
    };

    // 4. Split Text
    const maxLength = TEXT_LENGTH_LIMITS[providerType] || 5000;
    const textChunks = splitTextIntoChunks(chapter.text, maxLength);
    if (textChunks.length === 0) {
      throw new Error("Text split resulted in empty chunks");
    }

    // 5. Synthesize Chunks
    console.log(
      `[TTS] Starting synthesis for chapter ${chapterId} (${chapter.name}) using ${providerType}, split into ${textChunks.length} chunks`
    );
    Chapter.updateChapter(chapterId, { status: "processing" }); // Update status

    // Create a unique temp directory for this synthesis job
    const tempDirName = `${chapterId}_${timestamp}`;
    const tempDir = path.join(outputDir, tempDirName);

    // Ensure temp directory exists
    fs.ensureDirSync(tempDir);
    console.log(`[TTS] Created temp directory: ${tempDir}`);

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const chunkTimestamp = Date.now();
      const chunkFilename = `part${i + 1}_${chunkTimestamp}.wav`;
      const tempOutputPath = path.join(tempDir, chunkFilename);

      console.log(
        `[TTS] Synthesizing chunk ${i + 1}/${
          textChunks.length
        } to ${tempOutputPath}`
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

        // Verify the file is valid before adding to the list
        const stats = fs.statSync(chunkResult.data.filePath);
        if (stats.size === 0) {
          throw new Error(
            `Generated audio file is empty: ${chunkResult.data.filePath}`
          );
        }

        console.log(
          `[TTS] Chunk ${i + 1} synthesized successfully: ${
            chunkResult.data.filePath
          } (${stats.size} bytes)`
        );
        tempAudioFiles.push(chunkResult.data.filePath);
      } catch (chunkError) {
        console.error(
          `[TTS] Error synthesizing chunk ${i + 1}:`,
          chunkError.message
        );
        throw new Error(
          `Failed to synthesize chunk ${i + 1}: ${chunkError.message}`
        );
      }
    }

    // 6. Process final output
    console.log(`[TTS] Processing ${tempAudioFiles.length} audio chunks`);

    try {
      if (tempAudioFiles.length > 1) {
        const mergedFileName = `${finalOutputFileName}.wav`;
        mergedFilePath = path.join(tempDir, mergedFileName);

        console.log(`[TTS] Merging audio chunks into ${mergedFilePath}`);
        await audioUtils.mergeAudioFiles(tempAudioFiles, mergedFilePath);

        // Verify merged file exists and is valid
        if (!fs.existsSync(mergedFilePath)) {
          throw new Error("Failed to create merged audio file");
        }

        const mergedStats = fs.statSync(mergedFilePath);
        if (mergedStats.size === 0) {
          throw new Error("Merged audio file is empty");
        }

        console.log(
          `[TTS] Merged file created: ${mergedFilePath} (${mergedStats.size} bytes)`
        );
        
        // Copy the merged file to the final output location
        fs.copyFileSync(mergedFilePath, finalOutputPath);
        console.log(`[TTS] Copied merged file to final output path: ${finalOutputPath}`);
        
        tempAudioFiles.push(mergedFilePath); // Add merged file to cleanup list
      } else if (tempAudioFiles.length === 1) {
        // Only one chunk, copy it directly to final path
        fs.copyFileSync(tempAudioFiles[0], finalOutputPath);
        console.log(`[TTS] Copied single audio chunk to ${finalOutputPath}`);
      } else {
        throw new Error("No audio files were generated");
      }

      // Verify the output file exists
      if (!fs.existsSync(finalOutputPath)) {
        throw new Error(`Final output file does not exist`);
      }

      const outputStats = fs.statSync(finalOutputPath);
      console.log(
        `[TTS] Successfully generated final file: ${finalOutputPath} (${outputStats.size} bytes)`
      );

      // 7. Update Chapter Status and Return Success
      Chapter.updateChapter(chapterId, {
        audioPath: finalOutputPath,
        status: "completed",
      });

      // Create an audio URL for preview using proper URI encoding for special characters
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
    } catch (processingError) {
      console.error(`[TTS] Audio processing failed:`, processingError);
      throw new Error(
        `Audio processing failed: ${processingError.message}. Please check the input files for validity.`
      );
    }
  } catch (err) {
    console.error(`[TTS] Chapter ${chapterId} synthesis failed:`, err);
    try {
      Chapter.updateChapter(chapterId, { status: "error" });
    } catch (updateError) {
      console.error(
        `[TTS] Failed to update chapter ${chapterId} error status:`,
        updateError
      );
    }
    return error(`Synthesis failed: ${err.message}`);
  } finally {
    // 8. Cleanup Temporary Files - Uncomment to enable cleanup when needed
    console.log(`[TTS] Cleaning up temporary files`);
    // tempAudioFiles.forEach((fp) => {
    //   if (fp && fs.existsSync(fp)) {
    //     try {
    //       fs.removeSync(fp);
    //       console.log(`[TTS] Removed temp file: ${fp}`);
    //     } catch (e) {
    //       console.error(`[TTS] Failed to delete temporary file ${fp}:`, e);
    //     }
    //   }
    // });
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
  const globalSettings = Settings.getAllSettings();
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

/**
 * Get the list of voice roles from models.json data
 */
function getVoiceRolesFromModels(providerType) {
  if (!voiceModels || voiceModels.length === 0) return [];
  const lowerProviderType = providerType.toLowerCase();

  return voiceModels
    .filter(
      (model) =>
        model.provider && model.provider.toLowerCase() === lowerProviderType
    )
    .map((model) => ({
      id: model.code,
      name: model.name,
      language: model.lang.includes("中")
        ? "zh-CN"
        : model.lang.includes("英")
        ? "en-US"
        : model.lang,
      gender: model.gender === "0" ? "female" : "male",
      description: model.lang,
      options: model.options || [],
      emotions: model.emotions || [],
    }));
}

/**
 * Get the list of voice roles supported by a specific service provider
 */
async function getVoiceRoles(providerType) {
  try {
    if (
      !providerType ||
      !["azure", "aliyun", "tencent", "baidu"].includes(
        providerType.toLowerCase()
      )
    ) {
      return error("Invalid service provider type");
    }
    const roles = getVoiceRolesFromModels(providerType);
    if (roles.length === 0) {
      console.warn(`No voice models found for provider '${providerType}'`);
    }
    return success(roles);
  } catch (err) {
    return error(`Failed to get voice roles: ${err.message}`);
  }
}

/**
 * Get the list of emotions for a specific voice model from models.json data
 */
function getEmotionsFromModels(providerType, voiceId) {
  if (!voiceModels || voiceModels.length === 0) return [];
  const lowerProviderType = providerType.toLowerCase();

  const model = voiceModels.find(
    (m) =>
      m.provider &&
      m.provider.toLowerCase() === lowerProviderType &&
      m.code === voiceId
  );

  if (model && model.emotions && Array.isArray(model.emotions)) {
    return model.emotions.map((e) => ({
      id: e.code,
      name: e.name,
      description: e.desc,
    }));
  }
  return [];
}

/**
 * Get the list of emotions supported by a specific service provider and voice
 */
async function getEmotions(providerType, voiceId) {
  try {
    if (
      !providerType ||
      !["azure", "aliyun", "tencent", "baidu"].includes(
        providerType.toLowerCase()
      )
    ) {
      return error("Invalid service provider type");
    }
    if (!voiceId) {
      return error("No voice ID specified");
    }
    const emotions = getEmotionsFromModels(providerType, voiceId);
    return success(emotions);
  } catch (err) {
    return error(`Failed to get emotions list: ${err.message}`);
  }
}

module.exports = {
  synthesizeChapter,
  synthesizeMultipleChapters,
  getVoiceRoles,
  getEmotions,
};
