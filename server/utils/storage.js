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
// 用于存储用户数据的目录路径，与应用程序更新无关
let userDataDir = "";

/**
 * 设置基础存储目录
 * @param {string} dir 目录路径
 */
function setBaseDir(dir) {
  baseDir = dir;

  // 设置用户数据目录（保证在应用更新后数据不会丢失）
  try {
    userDataDir = app.getPath("userData");
  } catch (e) {
    // 如果在非Electron环境下运行，使用baseDir作为备选
    userDataDir = dir;
  }

  // 配置文件夹目录，使用用户数据目录，确保数据不会因为应用更新而丢失
  configDir = path.join(userDataDir, "config");

  // 确保存储目录和配置目录存在
  ensureDirectoryExists(getStoragePath());
  ensureDirectoryExists(configDir);

  console.log(`Storage base directory set to: ${baseDir}`);
  console.log(`Configuration directory set to: ${configDir}`);

  // 如果配置目录不存在，立即初始化配置文件
  const configFilePath = path.join(configDir, "vwordai.json");
  if (!fs.existsSync(configFilePath)) {
    fs.writeFileSync(configFilePath, JSON.stringify({}, null, 2), "utf-8");
  } else {
    try {
      const configData = fs.readFileSync(configFilePath, "utf-8");
      // 尝试解析配置文件内容
      const configObj = JSON.parse(configData);

      // 处理旧版本配置格式：如果存在settings顶级键，则将其内容提取到顶层
      if (configObj.settings && typeof configObj.settings === "object") {
        const updatedConfig = { ...configObj, ...configObj.settings };
        delete updatedConfig.settings; // 删除settings顶层键
        fs.writeFileSync(
          configFilePath,
          JSON.stringify(updatedConfig, null, 2),
          "utf-8"
        );
        console.log("Updated configuration format from old structure");
      }
    } catch (error) {
      console.error(`Config file error:`, error);
      // 如果配置文件损坏，重新创建
      fs.writeFileSync(configFilePath, JSON.stringify({}, null, 2), "utf-8");
    }
  }

  // 检查是否存在旧配置文件并迁移到新位置
  const oldConfigPath = path.join(baseDir, "config", "vwordai.json");
  if (baseDir !== userDataDir && fs.existsSync(oldConfigPath)) {
    try {
      const oldConfigData = fs.readFileSync(oldConfigPath, "utf-8");
      const oldConfig = JSON.parse(oldConfigData);

      // 读取现有新位置配置
      let newConfig = {};
      if (fs.existsSync(configFilePath)) {
        const newConfigData = fs.readFileSync(configFilePath, "utf-8");
        newConfig = JSON.parse(newConfigData);
      }

      // 合并配置，优先使用旧配置
      let mergedConfig;
      if (oldConfig.settings) {
        // 如果旧版本有settings顶级键
        mergedConfig = { ...newConfig, ...oldConfig.settings };
      } else {
        mergedConfig = { ...newConfig, ...oldConfig };
      }

      // 保存合并后的配置到新位置
      fs.writeFileSync(
        configFilePath,
        JSON.stringify(mergedConfig, null, 2),
        "utf-8"
      );
      console.log(
        "Migrated configuration from old location to user data directory"
      );
    } catch (err) {
      console.error("Error migrating configuration:", err);
    }
  }
}

/**
 * 获取存储路径
 * @returns {string} 存储路径
 */
function getStoragePath() {
  // 使用用户数据目录保存存储数据
  return path.join(userDataDir || baseDir, "storage");
}

/**
 * 获取配置目录路径
 * @returns {string} 配置目录路径
 */
function getConfigPath() {
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

    // 向后兼容：检查是否使用旧结构（含settings顶层键）
    if (
      config.settings &&
      typeof config.settings === "object" &&
      config.settings[key] !== undefined
    ) {
      console.log(`Using setting from legacy structure: ${key}`);
      return config.settings[key];
    }

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
