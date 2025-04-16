/**
 * 章节模型
 */
const { v4: uuidv4 } = require("uuid");
const storage = require("../utils/storage");
const Project = require("./Project");

// 存储文件名
const STORAGE_FILE = "chapters";

/**
 * 获取所有章节
 * @returns {Array} 章节列表
 */
function getAllChapters() {
  return storage.readData(STORAGE_FILE, []);
}

/**
 * 获取指定项目的所有章节
 * @param {string} projectId 项目ID
 * @returns {Array} 章节列表
 */
function getChaptersByProjectId(projectId) {
  const chapters = getAllChapters();
  return chapters.filter((chapter) => chapter.projectId === projectId);
}

/**
 * 根据ID获取章节
 * @param {string} id 章节ID
 * @returns {Object|null} 章节对象或null
 */
function getChapterById(id) {
  const chapters = getAllChapters();
  return chapters.find((chapter) => chapter.id === id) || null;
}

/**
 * 新建章节
 * @param {Object} chapterData 章节数据
 * @returns {Object} 创建的章节
 */
function createChapter(chapterData) {
  const chapters = getAllChapters();

  // 检查项目是否存在
  const project = Project.getProjectById(chapterData.projectId);
  if (!project) {
    throw new Error("项目不存在");
  }

  // 检查章节名称在项目中是否唯一
  const projectChapters = getChaptersByProjectId(chapterData.projectId);
  if (projectChapters.some((c) => c.name === chapterData.name)) {
    throw new Error("章节名称在当前项目中已存在");
  }

  const now = new Date();
  const newChapter = {
    id: uuidv4(),
    projectId: chapterData.projectId,
    name: chapterData.name,
    text: chapterData.text || "",
    settings: chapterData.settings || { ...project.defaultVoiceSettings },
    createAt: now,
    updateAt: now,
  };

  chapters.push(newChapter);
  storage.saveData(STORAGE_FILE, chapters);

  return newChapter;
}

/**
 * 更新章节
 * @param {string} id 章节ID
 * @param {Object} chapterData 更新的章节数据
 * @returns {Object|null} 更新后的章节或null
 */
function updateChapter(id, chapterData) {
  const chapters = getAllChapters();
  const index = chapters.findIndex((chapter) => chapter.id === id);

  if (index === -1) {
    return null;
  }

  // 如果更改了名称，检查是否在项目中与其他章节重名
  if (chapterData.name && chapterData.name !== chapters[index].name) {
    const projectChapters = getChaptersByProjectId(chapters[index].projectId);
    const nameExists = projectChapters.some(
      (c) => c.id !== id && c.name === chapterData.name
    );
    if (nameExists) {
      throw new Error("章节名称在当前项目中已存在");
    }
  }

  const updatedChapter = {
    ...chapters[index],
    name:
      chapterData.name !== undefined ? chapterData.name : chapters[index].name,
    text:
      chapterData.text !== undefined ? chapterData.text : chapters[index].text,
    settings:
      chapterData.settings !== undefined
        ? chapterData.settings
        : chapters[index].settings,
    updateAt: new Date(),
  };

  chapters[index] = updatedChapter;
  storage.saveData(STORAGE_FILE, chapters);

  return updatedChapter;
}

/**
 * 删除章节
 * @param {string} id 章节ID
 * @returns {boolean} 是否删除成功
 */
function deleteChapter(id) {
  const chapters = getAllChapters();
  const initialLength = chapters.length;

  const filteredChapters = chapters.filter((chapter) => chapter.id !== id);

  if (filteredChapters.length === initialLength) {
    return false; // 没有删除任何章节
  }

  storage.saveData(STORAGE_FILE, filteredChapters);
  return true;
}

/**
 * 删除项目下的所有章节
 * @param {string} projectId 项目ID
 * @returns {number} 删除的章节数量
 */
function deleteChaptersByProjectId(projectId) {
  const chapters = getAllChapters();
  const initialLength = chapters.length;

  const filteredChapters = chapters.filter(
    (chapter) => chapter.projectId !== projectId
  );

  const deletedCount = initialLength - filteredChapters.length;

  if (deletedCount > 0) {
    storage.saveData(STORAGE_FILE, filteredChapters);
  }

  return deletedCount;
}

module.exports = {
  getAllChapters,
  getChaptersByProjectId,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
  deleteChaptersByProjectId,
};
