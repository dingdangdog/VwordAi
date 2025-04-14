/**
 * 主进程工具函数
 */
const fs = require('fs-extra');
const path = require('path');

// 从结果工具导入
try {
  const { success, error } = require('./utils/result');
  module.exports = {
    success,
    error,
    ensureDirectoryExists,
    delay,
    safeReadJSON,
    safeWriteJSON
  };
} catch (err) {
  console.error('Failed to load ./utils/result:', err);
  // 如果无法导入，提供备用实现
  const success = (data, message = '操作成功') => {
    return { c: 200, m: message, d: data };
  };
  
  const error = (message = '操作失败', data = null) => {
    return { c: 500, m: message, d: data };
  };
  
  module.exports = {
    success,
    error,
    ensureDirectoryExists,
    delay,
    safeReadJSON,
    safeWriteJSON
  };
}

/**
 * 确保目录存在
 * @param {string} dirPath 目录路径
 */
function ensureDirectoryExists(dirPath) {
  try {
    fs.ensureDirSync(dirPath);
    return true;
  } catch (err) {
    console.error(`确保目录存在失败: ${err.message}`);
    return false;
  }
}

/**
 * 异步延迟函数
 * @param {number} ms 延迟毫秒数
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 安全读取JSON文件
 * @param {string} filePath 文件路径
 * @param {any} defaultValue 默认值
 * @returns {any} 解析后的JSON或默认值
 */
function safeReadJSON(filePath, defaultValue = null) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`读取JSON文件失败 ${filePath}: ${err.message}`);
    return defaultValue;
  }
}

/**
 * 安全写入JSON文件
 * @param {string} filePath 文件路径
 * @param {any} data 要写入的数据
 * @returns {boolean} 是否成功
 */
function safeWriteJSON(filePath, data) {
  try {
    const dirPath = path.dirname(filePath);
    ensureDirectoryExists(dirPath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`写入JSON文件失败 ${filePath}: ${err.message}`);
    return false;
  }
} 