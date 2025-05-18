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
const LLMController = require("./controllers/LLMController");

// Import utilities
const storage = require("./utils/storage");

/**
 * Initialize storage directories
 */
function initStorageDirs() {
  // Get application data directory for user data
  const userDataPath = app.getPath("userData");
  console.log("User data path:", userDataPath);

  // Get application installation directory for configs
  const defaultStoragePath = storage.getConfigPath();
  console.log("Application installation path:", defaultStoragePath);

  // Set base storage directory
  storage.setBaseDir(userDataPath);

  // Ensure necessary directories exist in user data
  const storageDir = path.join(userDataPath, "storage");
  const outputDir = path.join(userDataPath, "output");
  const localConfigDir = path.join(userDataPath, "config");

  // Ensure necessary directories exist in app installation directory
  const appConfigDir = path.join(defaultStoragePath, "config");

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

  // Initialize LLM controller
  LLMController.initLLMListeners();
  console.log("LLM controller initialized");
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
