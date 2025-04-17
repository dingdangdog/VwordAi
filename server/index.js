/**
 * Main process service entry
 * Initializes all controllers and services
 */
const { app } = require("electron");
const path = require("path");
const fs = require("fs-extra");

// Import controllers
const ProjectController = require("./controllers/ProjectController");
const ChapterController = require("./controllers/ChapterController");
const SettingsController = require("./controllers/SettingsController");
const ServiceProviderController = require("./controllers/ServiceProviderController");
const TTSController = require("./controllers/TTSController");

// Import utilities
const storage = require("./utils/storage");

/**
 * 获取应用程序安装目录
 * @returns {string} 应用程序安装目录
 */
function getAppInstallPath() {
  const isProduction = process.env.NODE_ENV === 'production';
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
 * Initialize storage directories
 */
function initStorageDirs() {
  // Get application data directory for user data
  const userDataPath = app.getPath("userData");
  console.log("User data path:", userDataPath);
  
  // Get application installation directory for configs
  const appInstallPath = getAppInstallPath();
  console.log("Application installation path:", appInstallPath);
  
  // Set base storage directory
  storage.setBaseDir(userDataPath);
  
  // Ensure necessary directories exist in user data
  const storageDir = path.join(userDataPath, "storage");
  const outputDir = path.join(userDataPath, "output");
  const localConfigDir = path.join(userDataPath, "config");
  
  // Ensure necessary directories exist in app installation directory
  const appConfigDir = path.join(appInstallPath, "config");
  
  // 创建所有必要的目录
  fs.ensureDirSync(storageDir);
  fs.ensureDirSync(outputDir);
  fs.ensureDirSync(localConfigDir);
  fs.ensureDirSync(appConfigDir);
  
  console.log("Storage directories initialized:");
  console.log("- Storage dir:", storageDir);
  console.log("- Output dir:", outputDir);
  console.log("- Local config dir:", localConfigDir);
  console.log("- App config dir:", appConfigDir);
}

/**
 * Initialize all controllers
 */
function initControllers() {
  // Initialize project controller
  ProjectController.initProjectListeners();
  console.log("Project controller initialized");

  // Initialize chapter controller
  ChapterController.initChapterListeners();
  console.log("Chapter controller initialized");

  // Initialize settings controller
  SettingsController.init();
  console.log("Settings controller initialized");

  // Initialize service provider controller
  ServiceProviderController.init();
  console.log("Service provider controller initialized");

  // Initialize TTS controller
  TTSController.init();
  console.log("TTS controller initialized");
}

/**
 * Initialize main process service
 */
function init() {
  console.log("开始初始化主进程服务");
  console.log("应用环境:", process.env.NODE_ENV || "development");

  // Initialize storage directories
  initStorageDirs();

  // Initialize controllers
  initControllers();

  console.log("主进程服务初始化完成");
}

module.exports = {
  init,
};
