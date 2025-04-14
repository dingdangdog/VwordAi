/**
 * 项目控制器
 */
const { ipcMain } = require('electron');
const Project = require('../models/Project');
const Chapter = require('../models/Chapter');

/**
 * 初始化项目相关的IPC监听器
 */
function initProjectListeners() {
  // 获取所有项目
  ipcMain.handle('get-projects', async () => {
    try {
      const projects = Project.getAllProjects();
      return { success: true, data: projects };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 获取单个项目
  ipcMain.handle('get-project', async (event, id) => {
    try {
      const project = Project.getProjectById(id);
      if (!project) {
        return { success: false, error: '项目不存在' };
      }
      return { success: true, data: project };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 创建项目
  ipcMain.handle('create-project', async (event, projectData) => {
    try {
      const newProject = Project.createProject(projectData);
      return { success: true, data: newProject };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 更新项目
  ipcMain.handle('update-project', async (event, id, projectData) => {
    try {
      const updatedProject = Project.updateProject(id, projectData);
      return { success: true, data: updatedProject };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 删除项目
  ipcMain.handle('delete-project', async (event, id) => {
    try {
      Project.deleteProject(id);
      // 删除项目时，同时删除该项目下的所有章节
      Chapter.deleteChaptersByProjectId(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  initProjectListeners
}; 