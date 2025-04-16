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
 * Initialize storage directories
 */
function initStorageDirs() {
  // Get application data directory
  const userDataPath = app.getPath("userData");

  // Set base storage directory
  storage.setBaseDir(userDataPath);

  // Ensure necessary directories exist
  const configDir = path.join(userDataPath, "config");
  const storageDir = path.join(userDataPath, "storage");
  const outputDir = path.join(userDataPath, "output");

  fs.ensureDirSync(configDir);
  fs.ensureDirSync(storageDir);
  fs.ensureDirSync(outputDir);

  console.log("Storage directories initialized");
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
  // Initialize storage directories
  initStorageDirs();

  // Initialize controllers
  initControllers();

  console.log("Main process service initialized");
}

module.exports = {
  init,
};
