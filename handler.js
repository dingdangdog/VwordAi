/**
 * Handler模块
 * 处理主进程和渲染进程之间的通信
 * 整合了原server/index.js的功能
 */
const path = require("path");
const fs = require("fs-extra");
const storage = require("./server/utils/storage");

// 导入控制器和服务
const BiliLiveController = require("./server/controllers/BiliLiveController");
const ProjectController = require("./server/controllers/ProjectController");
const SettingsController = require("./server/controllers/SettingsController");
const TTSController = require("./server/controllers/TTSController");
const SegmentTTSController = require("./server/controllers/SegmentTTSController");

const LLMController = require("./server/controllers/LLMController");
const NovelController = require("./server/controllers/NovelController");
const ChapterProcessingController = require("./server/controllers/ChapterProcessingController");

/**
 * 设置基础目录 (整合了server/index.js的initStorageDirs功能)
 * @param {string} dir 目录路径
 */
function setBaseDir(dir) {
  storage.setBaseDir(dir);
  console.log(`Base Directory set to: ${dir}`);

  // 确保必要的目录存在 - 用户数据目录
  const storageDir = path.join(dir, "storage");
  const outputDir = path.join(dir, "output");
  const localConfigDir = path.join(dir, "config");

  // 创建所有必要的目录
  fs.ensureDirSync(storageDir);
  fs.ensureDirSync(outputDir);
  fs.ensureDirSync(localConfigDir);
  console.log("Storage directories initialized:");
  console.log("- Storage dir:", storageDir);
  console.log("- Output dir:", outputDir);
  console.log("- Local config dir:", localConfigDir);
}

/**
 * 初始化所有控制器 (整合了server/index.js的initControllers功能)
 */
function init() {
  console.log("Starting handler initialization...");
  console.log("Environment:", process.env.NODE_ENV || "development");

  // 统一使用 init() 方法初始化所有控制器
  try {
    // 初始化设置控制器
    SettingsController.init();
    console.log("Settings controller initialized");

    // 初始化语音合成控制器
    TTSController.init();
    console.log("TTS controller initialized");

    // 初始化段落语音合成控制器
    SegmentTTSController.init();
    console.log("Segment TTS controller initialized");



    // 初始化LLM控制器
    LLMController.init();
    console.log("LLM controller initialized");

    // 初始化项目控制器
    ProjectController.init();
    console.log("Project controller initialized");

    // 初始化BiliLive控制器
    BiliLiveController.init();
    console.log("BiliLive controller initialized");

    // 初始化小说控制器
    NovelController.init();
    console.log("Novel controller initialized");

    // 初始化章节处理控制器
    ChapterProcessingController.init();
    console.log("Chapter processing controller initialized");

    console.log("All controllers initialized successfully");
  } catch (error) {
    console.error("Error during controller initialization:", error);
    throw error;
  }
}

// 初始化
init();

module.exports = {
  setBaseDir,
};
