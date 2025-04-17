/**
 * 数据存储工具，用于项目和章节数据的持久化
 */
const fs = require("fs-extra");
const path = require("path");
const { app } = require("electron");

// 基础目录，会在handler.js中通过setBaseDir设置
let baseDir = "";
// 配置文件夹路径
let configDir = "";
// 是否是生产环境
const isProduction = process.env.NODE_ENV === "production";

/**
 * 获取应用程序安装目录
 * 在生产环境中，应用程序安装目录是打包后的安装路径
 * 在开发环境中，应用程序安装目录就是项目根目录
 * @returns {string} 应用程序安装目录
 */
function getAppInstallPath() {
  if (isProduction) {
    // 获取应用程序路径 (Electron app.getAppPath 返回应用程序所在目录)
    const appPath = app.getAppPath();
    // 如果是打包后的应用，app.getAppPath() 返回的是 app.asar 目录
    // 我们需要获取其上级目录作为应用安装目录
    return path.dirname(
      appPath.includes("app.asar") ? path.dirname(appPath) : appPath
    );
  } else {
    // 开发环境下，返回当前工作目录
    return process.cwd();
  }
}

/**
 * 设置基础存储目录
 * @param {string} dir 目录路径
 */
function setBaseDir(dir) {
  baseDir = dir;

  // 在生产环境中，配置文件夹放在软件安装目录下的config文件夹中
  if (isProduction) {
    const appDir = getAppInstallPath();
    configDir = path.join(appDir, "config");
    console.log(
      `Production: Config directory set to app install directory: ${configDir}`
    );
  } else {
    // 开发环境下，配置文件夹与baseDir保持一致
    configDir = path.join(baseDir, "config");
    console.log(
      `Development: Config directory set to user data directory: ${configDir}`
    );
  }

  // 确保存储目录和配置目录存在
  ensureDirectoryExists(getStoragePath());
  ensureDirectoryExists(configDir);

  console.log(`Storage base directory: ${baseDir}`);
  console.log(`Config directory: ${configDir}`);

  // 如果配置目录不存在，立即初始化配置文件
  const configFilePath = path.join(configDir, "vwordai.json");
  if (!fs.existsSync(configFilePath)) {
    console.log(
      `Config file not found, creating default config file: ${configFilePath}`
    );
    fs.writeFileSync(configFilePath, JSON.stringify({}, null, 2), "utf-8");
  } else {
    console.log(`Config file exists: ${configFilePath}`);
    try {
      const configData = fs.readFileSync(configFilePath, "utf-8");
      const config = JSON.parse(configData);
      console.log(
        `Successfully read config file, content size: ${configData.length} bytes`
      );
    } catch (error) {
      console.error(`Read config file failed:`, error);
      // 如果配置文件损坏，重新创建
      fs.writeFileSync(configFilePath, JSON.stringify({}, null, 2), "utf-8");
      console.log(`Config file has been recreated`);
    }
  }
}

/**
 * 获取存储路径
 * @returns {string} 存储路径
 */
function getStoragePath() {
  return path.join(baseDir, "storage");
}

/**
 * 获取配置目录路径
 * @returns {string} 配置目录路径
 */
function getConfigPath() {
  if (!configDir) {
    console.warn(
      "Warning: Config directory not initialized, using default path"
    );
    // 如果configDir未初始化，使用应用安装目录下的config
    return path.join(getAppInstallPath(), "config");
  }
  return configDir;
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

  config[key] = value;

  // 确保config目录存在
  ensureDirectoryExists(getConfigPath());
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
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
  getAppInstallPath,
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
