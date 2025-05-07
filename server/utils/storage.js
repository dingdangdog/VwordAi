/**
 * 数据存储工具，用于项目和章节数据的持久化
 */
const fs = require("fs-extra");
const path = require("path");
const electron = require('electron');
const app = electron.app || (electron.remote && electron.remote.app);
const log = require('electron-log');

// 基础目录
let baseDir = "";
// 存储目录路径
let storagePath = "";
// 配置目录路径
let configPath = "";

/**
 * 设置基础存储目录
 * @param {string} dir 目录路径
 */
function setBaseDir(dir) {
  baseDir = dir;

  // 设置存储和配置目录
  storagePath = path.join(baseDir, "storage");
  configPath = path.join(baseDir, "config");

  // 确保存储目录和配置目录存在
  ensureDirectoryExists(storagePath);
  ensureDirectoryExists(configPath);

  console.log(`Storage base directory set to: ${baseDir}`);
  console.log(`Storage path set to: ${storagePath}`);
  console.log(`Config path set to: ${configPath}`);

  // 初始化配置文件
  const configFilePath = path.join(configPath, "vwordai.json");
  if (!fs.existsSync(configFilePath)) {
    fs.writeFileSync(configFilePath, JSON.stringify({}, null, 2), "utf-8");
  } else {
    try {
      // 尝试读取配置文件以验证格式
      const configData = fs.readFileSync(configFilePath, "utf-8");
      JSON.parse(configData);
    } catch (error) {
      console.error(`Config file error:`, error);
      // 如果配置文件损坏，重新创建
      fs.writeFileSync(configFilePath, JSON.stringify({}, null, 2), "utf-8");
    }
  }
}

/**
 * 获取存储路径
 * @returns {string} 存储路径
 */
function getStoragePath() {
  let userDataPath;
  try {
    userDataPath = (app || electron.remote.app).getPath('userData');
    log.info(`(Storage) User data path: ${userDataPath}`);
  } catch (err) {
    log.error(`(Storage) Failed to get user data path:`, err);
    userDataPath = path.join(process.cwd(), 'storage');
    log.info(`(Storage) Using fallback storage path: ${userDataPath}`);
  }
  
  const storagePath = path.join(userDataPath, 'storage');
  
  // Ensure storage directory exists
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
    log.info(`(Storage) Created storage directory: ${storagePath}`);
  }
  
  return storagePath;
}

/**
 * 获取配置目录路径
 * @returns {string} 配置目录路径
 */
function getConfigPath() {
  return configPath;
}

/**
 * 确保目录存在
 * @param {string} dirPath 目录路径
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Create directory: ${dirPath}`);
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
  console.log(`Save data to file: ${filePath}`);
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
    console.error(`Error reading ${filename}.json:`, error);
    return defaultValue;
  }
}

/**
 * 保存配置数据
 * @param {string} key 配置键名
 * @param {any} value 配置值
 */
function saveConfig(key, value) {
  try {
    const storagePath = getStoragePath();
    console.log(`(Storage) Storage path: ${storagePath}`);
    const filePath = path.join(storagePath, `${key}.json`);
    
    log.debug(`(Storage) Saving config ${key}:`, value);
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
    return true;
  } catch (err) {
    log.error(`(Storage) Failed to save config ${key}:`, err);
    return false;
  }
}

/**
 * 读取配置数据
 * @param {string} key 配置键名
 * @param {any} defaultValue 默认值
 * @returns {any} 配置值或默认值
 */
function readConfig(key, defaultValue = {}) {
  try {
    const storagePath = getStoragePath();
    const filePath = path.join(storagePath, `${key}.json`);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(data);
      log.debug(`(Storage) Successfully read config ${key}`);
      return config;
    } else {
      log.debug(`(Storage) Config ${key} does not exist, using default value`);
      return defaultValue;
    }
  } catch (err) {
    log.error(`(Storage) Failed to read config ${key}:`, err);
    return defaultValue;
  }
}

// 别名，用于兼容性
const save = saveData;
const read = readData;

module.exports = {
  setBaseDir,
  getStoragePath,
  getConfigPath,
  saveData,
  readData,
  saveConfig,
  readConfig,
  ensureDirectoryExists,
  // 别名导出
  save,
  read,
};
