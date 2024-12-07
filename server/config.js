const path = require("path");
const fs = require("fs");

const { readJsonFile, success, moveFiles, copyFiles } = require("./util");

const CONFIG_FILE = "dotts.json";
const DATA_DIR = "data";
const CONFIG_DIR = "config";
let baseDir = "";

const setBaseDir = (dir) => {
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
  return path.join(baseDir, CONFIG_DIR);
};

// 获取配置信息
const getConfig = () => {
  const configFile = path.join(getConfigDir(), CONFIG_FILE);
  // console.log(configPath);
  if (!fs.existsSync(configFile)) {
    // 文件不存在，读取默认配置并创建
    const defaultConfigDir = path.join(__dirname, CONFIG_DIR);
    copyFiles(defaultConfigDir, getConfigDir());
  }
  return readJsonFile(configFile);
};
// 获取配置信息【前端使用，需要包装一层】
const getConfigApi = () => {
  const config = getConfig();
  return success(config, "success");
};

const saveConfig = (config) => {
  const configFile = path.join(getConfigDir(), CONFIG_FILE);
  fs.writeFileSync(configFile, JSON.stringify(config));
  return success(config, "success");
};

const changeDataDir = (newdir) => {
  let config = getConfig();
  moveFiles(config.dataPath, newdir);
  config.dataPath = newdir;
  saveConfig(config);

  return success(config, "success");
};

const saveAccount = (account, password, token, saveFlag) => {
  // console.log(account, password, token, saveFlag);
  let config = getConfig();
  config.account.data.account = account;
  config.account.data.password = password;
  config.account.data.token = token;
  config.account.save = saveFlag.save;
  config.account.autoLogin = saveFlag.autoLogin;
  // console.log(config);
  saveConfig(config);
};

module.exports = {
  setBaseDir,
  getConfigDir,
  getConfig,
  getConfigApi,
  saveConfig,
  changeDataDir,
  saveAccount,
};
