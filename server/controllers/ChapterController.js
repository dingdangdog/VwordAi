/**
 * 章节控制器
 */
const { ipcMain } = require('electron');
const Chapter = require('../models/Chapter');
const Project = require('../models/Project');

/**
 * 初始化章节相关的IPC监听器
 */
function initChapterListeners() {
  // 获取项目下的所有章节
  ipcMain.handle('get-chapters-by-project-id', async (event, projectId) => {
    try {
      const chapters = Chapter.getChaptersByProjectId(projectId);
      return { success: true, data: chapters };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 获取单个章节
  ipcMain.handle('get-chapter', async (event, id) => {
    try {
      const chapter = Chapter.getChapterById(id);
      if (!chapter) {
        return { success: false, error: '章节不存在' };
      }
      return { success: true, data: chapter };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 创建章节
  ipcMain.handle('create-chapter', async (event, chapterData) => {
    try {
      const newChapter = Chapter.createChapter(chapterData);
      
      // 更新项目中的章节数量
      const projectChapters = Chapter.getChaptersByProjectId(chapterData.projectId);
      Project.updateProjectChapterCount(chapterData.projectId, projectChapters.length);
      
      return { success: true, data: newChapter };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 更新章节
  ipcMain.handle('update-chapter', async (event, id, chapterData) => {
    try {
      const chapter = Chapter.getChapterById(id);
      if (!chapter) {
        return { success: false, error: '章节不存在' };
      }
      
      const updatedChapter = Chapter.updateChapter(id, chapterData);
      
      // 如果文本内容改变，更新项目字数统计
      if (chapterData.text !== undefined && chapter.projectId) {
        const projectChapters = Chapter.getChaptersByProjectId(chapter.projectId);
        const totalWordCount = projectChapters.reduce((count, ch) => {
          return count + (ch.text ? ch.text.length : 0);
        }, 0);
        
        Project.updateProjectWordCount(chapter.projectId, totalWordCount);
      }
      
      return { success: true, data: updatedChapter };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 删除章节
  ipcMain.handle('delete-chapter', async (event, id) => {
    try {
      const chapter = Chapter.getChapterById(id);
      if (!chapter) {
        return { success: false, error: '章节不存在' };
      }
      
      const projectId = chapter.projectId;
      const result = Chapter.deleteChapter(id);
      
      if (result && projectId) {
        // 更新项目章节数和字数统计
        const projectChapters = Chapter.getChaptersByProjectId(projectId);
        Project.updateProjectChapterCount(projectId, projectChapters.length);
        
        const totalWordCount = projectChapters.reduce((count, ch) => {
          return count + (ch.text ? ch.text.length : 0);
        }, 0);
        
        Project.updateProjectWordCount(projectId, totalWordCount);
      }
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  initChapterListeners
}; 