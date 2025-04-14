/**
 * 项目模型
 */
const { v4: uuidv4 } = require('uuid');
const storage = require('../utils/storage');
const path = require('path');

const PROJECT_STORAGE_KEY = 'projects';

/**
 * 项目类模型
 */
class Project {
  /**
   * 获取所有项目
   * @returns {Array} 项目列表
   */
  static getAllProjects() {
    return storage.read(PROJECT_STORAGE_KEY, []);
  }

  /**
   * 通过ID获取项目
   * @param {string} id 项目ID
   * @returns {Object|null} 项目对象或null
   */
  static getProjectById(id) {
    const projects = this.getAllProjects();
    return projects.find(project => project.id === id) || null;
  }

  /**
   * 创建新项目
   * @param {Object} projectData 项目数据
   * @returns {Object} 新创建的项目
   */
  static createProject(projectData) {
    const projects = this.getAllProjects();
    
    const newProject = {
      id: uuidv4(),
      title: projectData.title || '未命名项目',
      description: projectData.description || '',
      author: projectData.author || '',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      coverImage: projectData.coverImage || null,
      tags: projectData.tags || [],
      wordCount: 0,
      chapterCount: 0
    };
    
    projects.push(newProject);
    storage.save(PROJECT_STORAGE_KEY, projects);
    
    return newProject;
  }

  /**
   * 更新项目
   * @param {string} id 项目ID
   * @param {Object} projectData 项目更新数据
   * @returns {Object} 更新后的项目
   */
  static updateProject(id, projectData) {
    const projects = this.getAllProjects();
    const index = projects.findIndex(project => project.id === id);
    
    if (index === -1) {
      throw new Error('项目不存在');
    }
    
    const updatedProject = {
      ...projects[index],
      ...projectData,
      updateTime: new Date().toISOString()
    };
    
    projects[index] = updatedProject;
    storage.save(PROJECT_STORAGE_KEY, projects);
    
    return updatedProject;
  }

  /**
   * 删除项目
   * @param {string} id 项目ID
   * @returns {boolean} 是否成功删除
   */
  static deleteProject(id) {
    const projects = this.getAllProjects();
    const filteredProjects = projects.filter(project => project.id !== id);
    
    if (filteredProjects.length === projects.length) {
      throw new Error('项目不存在');
    }
    
    storage.save(PROJECT_STORAGE_KEY, filteredProjects);
    return true;
  }

  /**
   * 更新项目字数统计
   * @param {string} id 项目ID
   * @param {number} wordCount 字数
   * @returns {Object} 更新后的项目
   */
  static updateProjectWordCount(id, wordCount) {
    return this.updateProject(id, { wordCount });
  }

  /**
   * 更新项目章节数
   * @param {string} id 项目ID
   * @param {number} chapterCount 章节数
   * @returns {Object} 更新后的项目
   */
  static updateProjectChapterCount(id, chapterCount) {
    return this.updateProject(id, { chapterCount });
  }
}

module.exports = Project; 