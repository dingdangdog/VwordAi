/**
 * 数据存储工具，用于项目和章节数据的持久化
 */
const fs = require("fs-extra");
const path = require("path");

// 基础目录，会在handler.js中通过setBaseDir设置
let baseDir = "";

/**
 * 设置基础存储目录
 * @param {string} dir 目录路径
 */
function setBaseDir(dir) {
  baseDir = dir;
  // 确保存储目录存在
  ensureDirectoryExists(getStoragePath());
}

/**
 * 获取存储路径
 * @returns {string} 存储路径
 */
function getStoragePath() {
  return path.join(baseDir, "storage");
}

/**
 * 确保目录存在
 * @param {string} dirPath 目录路径
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 保存数据到JSON文件
 * @param {string} filename 文件名
 * @param {any} data 要保存的数据
 */
function saveData(filename, data) {
  const filePath = path.join(getStoragePath(), `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * 从JSON文件读取数据
 * @param {string} filename 文件名
 * @param {any} defaultValue 默认值（如果文件不存在）
 * @returns {any} 读取的数据或默认值
 */
function readData(filename, defaultValue = []) {
  const filePath = path.join(getStoragePath(), `${filename}.json`);

  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }

  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filename}.json:`, error);
    return defaultValue;
  }
}

/**
 * 保存配置数据
 * @param {string} key 配置键名
 * @param {any} value 配置值
 */
function saveConfig(key, value) {
  const configPath = path.join(baseDir, "config", "dotts.json");

  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      const data = fs.readFileSync(configPath, "utf-8");
      config = JSON.parse(data);
    } catch (error) {
      console.error("Error reading config file:", error);
    }
  }

  config[key] = value;

  // 确保config目录存在
  ensureDirectoryExists(path.join(baseDir, "config"));
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * 读取配置数据
 * @param {string} key 配置键名
 * @param {any} defaultValue 默认值
 * @returns {any} 配置值或默认值
 */
function readConfig(key, defaultValue = null) {
  const configPath = path.join(baseDir, "config", "dotts.json");

  if (!fs.existsSync(configPath)) {
    return defaultValue;
  }

  try {
    const data = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(data);
    return config[key] !== undefined ? config[key] : defaultValue;
  } catch (error) {
    console.error("Error reading config file:", error);
    return defaultValue;
  }
}

// 别名，用于兼容性
const save = saveData;
const read = readData;

module.exports = {
  setBaseDir,
  getStoragePath,
  saveData,
  readData,
  saveConfig,
  readConfig,
  ensureDirectoryExists,
  // 别名导出
  save,
  read,
};
