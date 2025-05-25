/**
 * Project Controller
 * 处理与项目相关的业务逻辑
 * 参考 BiliLiveController 的架构模式
 */
const Project = require("../models/Project");
const Chapter = require("../models/Chapter");
const { success, error } = require("../utils/result");

/**
 * 获取所有项目
 */
async function getAllProjects() {
  try {
    const projects = Project.getAllProjects();
    return success(projects);
  } catch (err) {
    console.error("[ProjectController] Get all projects error:", err);
    return error("获取项目列表失败: " + err.message);
  }
}

/**
 * 根据ID获取项目
 * @param {string} id 项目ID
 */
async function getProjectById(id) {
  try {
    const project = Project.getProjectById(id);
    if (!project) {
      return error("项目不存在");
    }
    return success(project);
  } catch (err) {
    console.error("[ProjectController] Get project by id error:", err);
    return error("获取项目详情失败: " + err.message);
  }
}

/**
 * 创建新项目
 * @param {object} projectData 项目数据
 */
async function createProject(projectData) {
  try {
    const newProject = Project.createProject(projectData);
    return success(newProject);
  } catch (err) {
    console.error("[ProjectController] Create project error:", err);
    return error("创建项目失败: " + err.message);
  }
}

/**
 * 更新项目
 * @param {string} id 项目ID
 * @param {object} projectData 项目更新数据
 */
async function updateProject(id, projectData) {
  try {
    const updatedProject = Project.updateProject(id, projectData);
    return success(updatedProject);
  } catch (err) {
    console.error("[ProjectController] Update project error:", err);
    return error("更新项目失败: " + err.message);
  }
}

/**
 * 删除项目
 * @param {string} id 项目ID
 */
async function deleteProject(id) {
  try {
    Project.deleteProject(id);
    // 删除项目时，同时删除该项目下的所有章节
    Chapter.deleteChaptersByProjectId(id);
    return success({ message: "项目删除成功" });
  } catch (err) {
    console.error("[ProjectController] Delete project error:", err);
    return error("删除项目失败: " + err.message);
  }
}

/**
 * 获取项目下的所有章节
 * @param {string} projectId 项目ID
 */
async function getChaptersByProjectId(projectId) {
  try {
    const chapters = Chapter.getChaptersByProjectId(projectId);
    return success(chapters);
  } catch (err) {
    console.error("[ProjectController] Get chapters by project id error:", err);
    return error("获取章节列表失败: " + err.message);
  }
}

/**
 * 根据ID获取章节
 * @param {string} id 章节ID
 */
async function getChapterById(id) {
  try {
    const chapter = Chapter.getChapterById(id);
    if (!chapter) {
      return error("章节不存在");
    }
    return success(chapter);
  } catch (err) {
    console.error("[ProjectController] Get chapter by id error:", err);
    return error("获取章节详情失败: " + err.message);
  }
}

/**
 * 创建新章节
 * @param {object} chapterData 章节数据
 */
async function createChapter(chapterData) {
  try {
    const newChapter = Chapter.createChapter(chapterData);

    // 更新项目中的章节数量
    const projectChapters = Chapter.getChaptersByProjectId(
      chapterData.projectId
    );
    Project.updateProjectChapterCount(
      chapterData.projectId,
      projectChapters.length
    );

    return success(newChapter);
  } catch (err) {
    console.error("[ProjectController] Create chapter error:", err);
    return error("创建章节失败: " + err.message);
  }
}

/**
 * 更新章节
 * @param {string} id 章节ID
 * @param {object} chapterData 章节更新数据
 */
async function updateChapter(id, chapterData) {
  try {
    const chapter = Chapter.getChapterById(id);
    if (!chapter) {
      return error("章节不存在");
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

    return success(updatedChapter);
  } catch (err) {
    console.error("[ProjectController] Update chapter error:", err);
    return error("更新章节失败: " + err.message);
  }
}

/**
 * 删除章节
 * @param {string} id 章节ID
 */
async function deleteChapter(id) {
  try {
    const chapter = Chapter.getChapterById(id);
    if (!chapter) {
      return error("章节不存在");
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

    return success({ message: "章节删除成功" });
  } catch (err) {
    console.error("[ProjectController] Delete chapter error:", err);
    return error("删除章节失败: " + err.message);
  }
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getChaptersByProjectId,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
};
