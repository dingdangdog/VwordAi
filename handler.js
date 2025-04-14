/**
 * Handler模块
 * 处理主进程和渲染进程之间的通信
 */
const path = require('path');
const fs = require('fs-extra');
const storage = require('./server/utils/storage');
const { success, error } = require('./server/utils/result');

// 导入控制器和服务
const ProjectController = require('./server/controllers/ProjectController');
const ChapterController = require('./server/controllers/ChapterController');
const SettingsController = require('./server/controllers/SettingsController');
const ServiceProviderController = require('./server/controllers/ServiceProviderController');
const TTSController = require('./server/controllers/TTSController');
const TTSService = require('./server/services/TTSService');

// 设置基础目录
let baseDir = '';

/**
 * 设置基础目录
 * @param {string} dir 目录路径
 */
function setBaseDir(dir) {
  baseDir = dir;
  storage.setBaseDir(dir);
  console.log(`基础目录设置为: ${dir}`);
  
  // 确保必要的目录存在
  const configDir = path.join(dir, 'config');
  const storageDir = path.join(dir, 'storage');
  const outputDir = path.join(dir, 'output');
  
  fs.ensureDirSync(configDir);
  fs.ensureDirSync(storageDir);
  fs.ensureDirSync(outputDir);
}

/**
 * 初始化所有控制器
 */
function init() {
  // 初始化项目控制器
  ProjectController.initProjectListeners();
  
  // 初始化章节控制器
  ChapterController.initChapterListeners();
  
  // 初始化设置控制器
  SettingsController.init();
  
  // 初始化服务商控制器
  ServiceProviderController.init();
  
  // 初始化语音合成控制器
  TTSController.init();
  
  console.log('所有控制器初始化完成');
}

// 项目相关处理函数
const getProjects = async () => {
  try {
    const projects = await ProjectController.getAllProjects();
    return success(projects);
  } catch (err) {
    return error(err.message);
  }
};

const getProject = async (id) => {
  try {
    const project = await ProjectController.getProjectById(id);
    if (!project) {
      return error('项目不存在');
    }
    return success(project);
  } catch (err) {
    return error(err.message);
  }
};

const createProject = async (projectData) => {
  try {
    const newProject = await ProjectController.createProject(projectData);
    return success(newProject);
  } catch (err) {
    return error(err.message);
  }
};

const updateProject = async (id, projectData) => {
  try {
    const updatedProject = await ProjectController.updateProject(id, projectData);
    return success(updatedProject);
  } catch (err) {
    return error(err.message);
  }
};

const deleteProject = async (id) => {
  try {
    await ProjectController.deleteProject(id);
    return success(null, '项目已删除');
  } catch (err) {
    return error(err.message);
  }
};

// 章节相关处理函数
const getChaptersByProjectId = async (projectId) => {
  try {
    const chapters = await ChapterController.getChaptersByProjectId(projectId);
    return success(chapters);
  } catch (err) {
    return error(err.message);
  }
};

const getChapter = async (id) => {
  try {
    const chapter = await ChapterController.getChapterById(id);
    if (!chapter) {
      return error('章节不存在');
    }
    return success(chapter);
  } catch (err) {
    return error(err.message);
  }
};

const createChapter = async (chapterData) => {
  try {
    const newChapter = await ChapterController.createChapter(chapterData);
    return success(newChapter);
  } catch (err) {
    return error(err.message);
  }
};

const updateChapter = async (id, chapterData) => {
  try {
    const updatedChapter = await ChapterController.updateChapter(id, chapterData);
    return success(updatedChapter);
  } catch (err) {
    return error(err.message);
  }
};

const deleteChapter = async (id) => {
  try {
    await ChapterController.deleteChapter(id);
    return success(null, '章节已删除');
  } catch (err) {
    return error(err.message);
  }
};

// 语音合成相关处理函数
const synthesizeChapter = async (chapterId) => {
  return await TTSService.synthesizeChapter(chapterId);
};

const synthesizeMultipleChapters = async (chapterIds) => {
  return await TTSService.synthesizeMultipleChapters(chapterIds);
};

// 初始化
init();

module.exports = {
  setBaseDir,
  // 项目API
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  // 章节API
  getChaptersByProjectId,
  getChapter,
  createChapter,
  updateChapter,
  deleteChapter,
  // 语音合成API
  synthesizeChapter,
  synthesizeMultipleChapters
};
