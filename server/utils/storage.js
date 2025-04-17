/**
 * 数据存储工具，用于项目和章节数据的持久化
 */
const fs = require("fs-extra");
const path = require("path");

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
  const configPath = path.join(getConfigPath(), "vwordai.json");

  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      const data = fs.readFileSync(configPath, "utf-8");
      config = JSON.parse(data);
    } catch (error) {
      console.error("Read config file failed:", error);
      // 如果配置文件损坏，重新创建
      config = {};
    }
  }

  // 统一使用扁平结构，不再使用嵌套的settings对象
  config[key] = value;

  // 确保config目录存在
  ensureDirectoryExists(getConfigPath());
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  console.log(`Config saved to: ${configPath}`);
}

/**
 * 读取配置数据
 * @param {string} key 配置键名
 * @param {any} defaultValue 默认值
 * @returns {any} 配置值或默认值
 */
function readConfig(key, defaultValue = null) {
  const configPath = path.join(getConfigPath(), "vwordai.json");
  if (!fs.existsSync(configPath)) {
    console.log(`Config file not found: ${configPath}`);
    return defaultValue;
  }

  try {
    const data = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(data);

    // 直接从顶层读取，不再检查旧结构
    return config[key] !== undefined ? config[key] : defaultValue;
  } catch (error) {
    console.error("Read config file failed:", error);
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
