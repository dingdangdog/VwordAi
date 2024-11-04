const path = require("path");
const fs = require("fs");

const { readJsonFile, success, moveFiles } = require("./util");

const CONFIG_FILE = "config/dotts.json";
const DATA_DIR = "dotts";
let baseDir = "";

const setConfigDir = (dir) => {
  baseDir = dir;

  // 系统初始化检测数据文件夹，如果为空，则设置默认数据文件夹
  let config = getConfig();
  if (!config.dataPath) {
    config.dataPath = path.join(baseDir, DATA_DIR);
    if (!fs.existsSync(config.dataPath)) {
      fs.mkdirSync(config.dataPath, { recursive: true });
    }
    saveConfig(config);
  }
};

const getConfigDir = () => {
  return baseDir;
};

const getConfig = () => {
  const configFile = path.join(baseDir, CONFIG_FILE);
  // console.log(configPath);
  if (!fs.existsSync(configFile)) {
    // 文件不存在，读取默认配置并创建
    const defaultConfigFile = path.join(__dirname, CONFIG_FILE);

    const configDir = path.dirname(configFile);
    const defaultConfigDir = path.dirname(defaultConfigFile);
    copyFiles(defaultConfigDir, configDir);

    // const defaultConfig = readJsonFile(defaultConfigFile);
    // fs.writeFileSync(configPath, JSON.stringify(defaultConfig));
    // return defaultConfig;
  }
  return readJsonFile(configFile);
};

const saveConfig = (config) => {
  const configPath = path.join(baseDir, CONFIG_FILE);
  fs.writeFileSync(configPath, JSON.stringify(config));
};

const getConfigApi = () => {
  const config = getConfig();
  return success(config, "success");
};

const getModels = (code) => {
  const modelsFile = path.join(__dirname, "config", `${code}_models.json`);
  const models = readJsonFile(modelsFile);
  return success(models, "success");
};

const changeDataDir = (dir) => {
  let config = getConfig();
  moveFiles(config.dataPath, dir);
  config.dataPath = dir;
  saveConfig(config);

  return success(config, "success");
};

module.exports = {
  setConfigDir,
  getConfigDir,
  getConfig,
  getConfigApi,
  saveConfig,
  getModels,
  changeDataDir,
};
