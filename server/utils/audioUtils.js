/**
 * 音频处理相关工具
 */
const fs = require("fs-extra");
const path = require("path");
const { Readable } = require("stream");
const { execSync } = require("child_process");

// 检查ffmpeg是否可用
function checkFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch (e) {
    console.error("FFmpeg check failed:", e.message);
    return false;
  }
}

/**
 * 将音频数据写入文件
 * @param {Buffer} audioData 音频数据
 * @param {string} outputPath 输出路径
 * @param {string} filename 文件名（不含扩展名）
 * @returns {string} 完整的文件路径
 */
function saveAudioFile(audioData, outputPath, filename) {
  // 确保输出目录存在
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const fullPath = path.join(outputPath, `${filename}.wav`);

  // 写入音频文件
  fs.writeFileSync(fullPath, audioData);

  // 验证文件是否写入成功
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Failed to write audio file: ${fullPath}`);
  }

  const stats = fs.statSync(fullPath);
  if (stats.size === 0) {
    throw new Error(`Written audio file is empty: ${fullPath}`);
  }

  console.log(
    `[Audio] File saved successfully: ${fullPath} (${stats.size} bytes)`
  );
  return fullPath;
}

/**
 * 从Buffer创建可读流
 * @param {Buffer} buffer 音频数据
 * @returns {Readable} 可读流
 */
function createReadableStreamFromBuffer(buffer) {
  const readable = new Readable();
  readable._read = () => {}; // 必需的实现
  readable.push(buffer);
  readable.push(null);
  return readable;
}

/**
 * 合并多个音频文件 (需要ffmpeg)
 * @param {string[]} inputPaths 输入文件路径数组
 * @param {string} outputPath 输出文件路径(含扩展名)
 * @returns {string} 输出文件路径
 */
async function mergeAudioFiles(inputPaths, outputPath) {
  // 检查ffmpeg是否可用
  if (!checkFfmpeg()) {
    throw new Error("FFmpeg is not installed or not in PATH");
  }

  // 规范化输出路径
  outputPath = path.normalize(outputPath);

  // 检查输入文件是否存在和有效
  console.log(`[Audio] Merging ${inputPaths.length} files to ${outputPath}`);
  const validInputPaths = [];

  for (const filePath of inputPaths) {
    const normalizedPath = path.normalize(filePath);

    if (!fs.existsSync(normalizedPath)) {
      console.warn(
        `[Audio] Warning: Input file does not exist, skipping: ${normalizedPath}`
      );
      continue;
    }

    try {
      const stats = fs.statSync(normalizedPath);
      if (stats.size === 0) {
        console.warn(
          `[Audio] Warning: Input file is empty, skipping: ${normalizedPath}`
        );
        continue;
      }

      // 将有效的文件路径添加到列表
      validInputPaths.push(normalizedPath);
      console.log(
        `[Audio] Valid input file: ${normalizedPath} (${stats.size} bytes)`
      );
    } catch (err) {
      console.warn(
        `[Audio] Error checking file: ${normalizedPath}`,
        err.message
      );
    }
  }

  if (validInputPaths.length === 0) {
    throw new Error("No valid input files to merge");
  }

  // 确保输出目录存在
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // 如果只有一个文件，直接复制
    if (validInputPaths.length === 1) {
      console.log(
        `[Audio] Only one valid file, directly copying to ${outputPath}`
      );
      await copyAudioFile(validInputPaths[0], outputPath);
      return outputPath;
    }

    // 创建一个临时文件列表，使用时间戳确保唯一性
    const tempListFile = path.join(
      outputDir,
      `temp_file_list_${Date.now()}_${Math.floor(Math.random() * 10000)}.txt`
    );

    // 准备文件列表内容，注意转义路径中的单引号
    const fileList = validInputPaths
      .map((filePath) => `file '${filePath.replace(/'/g, "'\\''")}'`)
      .join("\n");

    // 写入文件列表
    fs.writeFileSync(tempListFile, fileList, "utf8");
    console.log(`[Audio] Created temp file list: ${tempListFile}`);

    // 包装路径中的引号，使其适用于命令行
    const quotedTempListFile = `"${tempListFile.replace(/"/g, '\\"')}"`;
    const quotedOutputPath = `"${outputPath.replace(/"/g, '\\"')}"`;

    // 使用ffmpeg的concat方法合并文件
    const ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i ${quotedTempListFile} -c copy ${quotedOutputPath}`;
    console.log(`[Audio] Running FFmpeg merge command: ${ffmpegCmd}`);

    try {
      const result = execSync(ffmpegCmd, {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024, // 增加缓冲区大小到10MB
        windowsHide: true,
      });

      console.log(`[Audio] FFmpeg merge succeeded, output: ${result}`);
    } catch (cmdError) {
      console.error(`[Audio] FFmpeg merge failed: ${cmdError.message}`);
      console.error(`[Audio] Command output: ${cmdError.stdout || ""}`);
      console.error(`[Audio] Command error: ${cmdError.stderr || ""}`);
      throw cmdError;
    }

    // 验证输出文件是否成功创建和有效
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Failed to create merged output file: ${outputPath}`);
    }

    const stats = fs.statSync(outputPath);
    if (stats.size === 0) {
      throw new Error(`Merged output file is empty: ${outputPath}`);
    }

    console.log(
      `[Audio] Merge successful: ${outputPath} (${stats.size} bytes)`
    );

    // 删除临时文件
    try {
      fs.removeSync(tempListFile);
      console.log(`[Audio] Removed temp file list: ${tempListFile}`);
    } catch (err) {
      console.warn(
        `[Audio] Warning: Failed to delete temporary file: ${tempListFile}`,
        err.message
      );
    }

    return outputPath;
  } catch (error) {
    console.error("[Audio] Error merging audio files:", error.message);
    if (error.stdout) console.error("  Command output:", error.stdout);
    if (error.stderr) console.error("  Command error:", error.stderr);
    throw new Error(`Audio merge failed: ${error.message}`);
  }
}

/**
 * 使用流安全地复制音频文件
 * @param {string} sourcePath 源文件路径
 * @param {string} destPath 目标文件路径
 * @returns {Promise<string>} 目标文件路径
 */
async function copyAudioFile(sourcePath, destPath) {
  // 规范化路径
  sourcePath = path.normalize(sourcePath);
  destPath = path.normalize(destPath);

  console.log(`[Audio] Copying audio file from ${sourcePath} to ${destPath}`);

  // 检查源文件是否存在且有效
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source audio file does not exist: ${sourcePath}`);
  }

  const stats = fs.statSync(sourcePath);
  if (stats.size === 0) {
    throw new Error(`Source audio file is empty: ${sourcePath}`);
  }

  // 确保目标目录存在
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // 使用流复制确保数据完整性
  const readStream = fs.createReadStream(sourcePath);
  const writeStream = fs.createWriteStream(destPath);

  await new Promise((resolve, reject) => {
    readStream.pipe(writeStream);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  // 验证目标文件
  if (!fs.existsSync(destPath)) {
    throw new Error(`Failed to create destination file: ${destPath}`);
  }

  const destStats = fs.statSync(destPath);
  if (destStats.size === 0) {
    throw new Error(`Destination audio file is empty: ${destPath}`);
  }

  console.log(
    `[Audio] File copied successfully: ${destPath} (${destStats.size} bytes)`
  );
  return destPath;
}

/**
 * 获取音频文件的时长（秒）
 * @param {string} filePath 音频文件路径
 * @returns {Promise<number>} 音频时长（秒）
 */
async function getAudioDuration(filePath) {
  // 检查ffmpeg是否可用
  if (!checkFfmpeg()) {
    throw new Error("FFmpeg is not installed or not in PATH");
  }

  // 规范化路径
  filePath = path.normalize(filePath);

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    throw new Error(`Audio file does not exist: ${filePath}`);
  }

  try {
    // 使用ffprobe获取音频时长
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath.replace(/"/g, '\\"')}"`;
    console.log(`[Audio] Running FFprobe command: ${cmd}`);

    const output = execSync(cmd, {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    }).trim();

    // 解析输出为浮点数
    const duration = parseFloat(output);
    console.log(`[Audio] Audio duration: ${duration} seconds`);

    return duration;
  } catch (error) {
    console.error("[Audio] Error getting audio duration:", error.message);
    if (error.stdout) console.error("  Command output:", error.stdout);
    if (error.stderr) console.error("  Command error:", error.stderr);

    // 返回默认值
    return 0;
  }
}

module.exports = {
  saveAudioFile,
  createReadableStreamFromBuffer,
  checkFfmpeg,
  mergeAudioFiles,
  copyAudioFile,
  getAudioDuration,
};
