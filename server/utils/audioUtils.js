/**
 * 音频处理相关工具
 */
const fs = require('fs-extra');
const path = require('path');
const { Readable } = require('stream');
const { execSync } = require('child_process');

// 检查ffmpeg是否可用
function checkFfmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 将音频数据写入文件
 * @param {Buffer} audioData 音频数据
 * @param {string} outputPath 输出路径
 * @param {string} filename 文件名（不含扩展名）
 * @param {string} format 音频格式 (mp3, wav)
 * @returns {string} 完整的文件路径
 */
function saveAudioFile(audioData, outputPath, filename, format = 'mp3') {
  // 确保输出目录存在
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  
  const fullPath = path.join(outputPath, `${filename}.${format}`);
  
  // 写入音频文件
  fs.writeFileSync(fullPath, audioData);
  
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
 * 将音频格式转换为另一种格式 (需要ffmpeg)
 * @param {string} inputPath 输入文件路径
 * @param {string} outputPath 输出文件路径
 * @param {string} outputFormat 输出格式
 * @returns {boolean} 是否转换成功
 */
function convertAudioFormat(inputPath, outputPath, outputFormat) {
  // 检查ffmpeg是否可用  
  if (!checkFfmpeg()) {
    throw new Error('FFmpeg is not installed or not in PATH');
  }
  
  try {
    execSync(`ffmpeg -i "${inputPath}" "${outputPath}.${outputFormat}"`, { 
      stdio: 'ignore' 
    });
    return true;
  } catch (error) {
    console.error('Error converting audio format:', error);
    return false;
  }
}

module.exports = {
  saveAudioFile,
  createReadableStreamFromBuffer,
  convertAudioFormat,
  checkFfmpeg
}; 