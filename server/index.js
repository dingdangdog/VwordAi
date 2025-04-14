/**
 * 主进程服务入口
 * 初始化所有控制器和服务
 */
const { app } = require('electron');
const path = require('path');
const fs = require('fs-extra');

// 导入控制器
const ProjectController = require('./controllers/ProjectController');
const ChapterController = require('./controllers/ChapterController');
const SettingsController = require('./controllers/SettingsController');
const ServiceProviderController = require('./controllers/ServiceProviderController');
const TTSController = require('./controllers/TTSController');

// 导入工具
const storage = require('./utils/storage');

/**
 * 初始化存储目录
 */
function initStorageDirs() {
  // 获取应用数据目录
  const userDataPath = app.getPath('userData');
  
  // 设置基础存储目录
  storage.setBaseDir(userDataPath);
  
  // 确保必要的目录存在
  const configDir = path.join(userDataPath, 'config');
  const storageDir = path.join(userDataPath, 'storage');
  const outputDir = path.join(userDataPath, 'output');
  
  fs.ensureDirSync(configDir);
  fs.ensureDirSync(storageDir);
  fs.ensureDirSync(outputDir);
  
  console.log('存储目录初始化完成');
}

/**
 * 初始化所有控制器
 */
function initControllers() {
  // 初始化项目控制器
  ProjectController.initProjectListeners();
  console.log('项目控制器初始化完成');
  
  // 初始化章节控制器
  ChapterController.initChapterListeners();
  console.log('章节控制器初始化完成');
  
  // 初始化设置控制器
  SettingsController.init();
  console.log('设置控制器初始化完成');
  
  // 初始化服务商控制器
  ServiceProviderController.init();
  console.log('服务商控制器初始化完成');
  
  // 初始化语音合成控制器
  TTSController.init();
  console.log('语音合成控制器初始化完成');
}

/**
 * 初始化主进程服务
 */
function init() {
  // 初始化存储目录
  initStorageDirs();
  
  // 初始化控制器
  initControllers();
  
  console.log('主进程服务初始化完成');
}

module.exports = {
  init
}; 