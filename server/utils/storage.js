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
const isProduction = process.env.NODE_ENV === 'production';

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
    return path.dirname(appPath.includes('app.asar') ? path.dirname(appPath) : appPath);
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
    console.log(`生产环境: 配置目录设置为应用安装目录下的config: ${configDir}`);
  } else {
    // 开发环境下，配置文件夹与baseDir保持一致
    configDir = path.join(baseDir, "config");
    console.log(`开发环境: 配置目录设置为用户数据目录下的config: ${configDir}`);
  }
  
  // 确保存储目录和配置目录存在
  ensureDirectoryExists(getStoragePath());
  ensureDirectoryExists(configDir);
  
  console.log(`存储基础目录: ${baseDir}`);
  console.log(`配置目录: ${configDir}`);
  
  // 如果配置目录不存在，立即初始化配置文件
  const configFilePath = path.join(configDir, "vwordai.json");
  if (!fs.existsSync(configFilePath)) {
    console.log(`配置文件不存在，创建默认配置文件: ${configFilePath}`);
    fs.writeFileSync(configFilePath, JSON.stringify({}, null, 2), "utf-8");
  } else {
    console.log(`配置文件已存在: ${configFilePath}`);
    try {
      const configData = fs.readFileSync(configFilePath, "utf-8");
      const config = JSON.parse(configData);
      console.log(`成功读取配置文件，内容大小: ${configData.length} 字节`);
    } catch (error) {
      console.error(`读取配置文件失败:`, error);
      // 如果配置文件损坏，重新创建
      fs.writeFileSync(configFilePath, JSON.stringify({}, null, 2), "utf-8");
      console.log(`已重新创建配置文件`);
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
    console.warn("警告: 配置目录尚未初始化，将使用默认路径");
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
    console.log(`创建目录: ${dirPath}`);
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
  console.log(`保存数据到文件: ${filePath}`);
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
  console.log(`读取文件数据: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.log(`文件不存在，返回默认值: ${filePath}`);
    return defaultValue;
  }

  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`读取文件 ${filename}.json 失败:`, error);
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
  console.log(`保存配置 ${key} 到文件: ${configPath}`);

  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      const data = fs.readFileSync(configPath, "utf-8");
      config = JSON.parse(data);
    } catch (error) {
      console.error("读取配置文件失败:", error);
      // 如果配置文件损坏，重新创建
      config = {};
    }
  }

  config[key] = value;

  // 确保config目录存在
  ensureDirectoryExists(getConfigPath());
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  console.log(`配置 ${key} 已保存`);
}

/**
 * 读取配置数据
 * @param {string} key 配置键名
 * @param {any} defaultValue 默认值
 * @returns {any} 配置值或默认值
 */
function readConfig(key, defaultValue = null) {
  const configPath = path.join(getConfigPath(), "vwordai.json");
  console.log(`读取配置 ${key} 从文件: ${configPath}`);

  if (!fs.existsSync(configPath)) {
    console.log(`配置文件不存在，返回默认值: ${configPath}`);
    return defaultValue;
  }

  try {
    const data = fs.readFileSync(configPath, "utf-8");
    console.log(`成功读取配置文件，大小: ${data.length} 字节`);
    const config = JSON.parse(data);
    const hasKey = config[key] !== undefined;
    console.log(`配置键 ${key} ${hasKey ? '存在' : '不存在'}`);
    return config[key] !== undefined ? config[key] : defaultValue;
  } catch (error) {
    console.error("读取配置文件失败:", error);
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
