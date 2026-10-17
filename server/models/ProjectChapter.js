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
function getAllChaptersRaw() {
  return storage.readData(STORAGE_FILE, []);
}

function getAllChapters() {
  return getAllChaptersRaw().filter((chapter) => !chapter.deletedAt);
}

/**
 * 获取指定项目的所有章节
 * @param {string} projectId 项目ID
 * @returns {Array} 章节列表
 */
function getChaptersByProjectId(projectId) {
  const chapters = getAllChaptersRaw();
  return chapters.filter((chapter) => chapter.projectId === projectId && !chapter.deletedAt);
}

/**
 * 根据ID获取章节
 * @param {string} id 章节ID
 * @returns {Object|null} 章节对象或null
 */
function getChapterById(id) {
  const chapters = getAllChaptersRaw();
  return chapters.find((chapter) => chapter.id === id) || null;
}

/**
 * 新建章节
 * @param {Object} chapterData 章节数据
 * @returns {Object} 创建的章节
 */
function createChapter(chapterData) {
  const chapters = getAllChaptersRaw();

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
    audioPath: chapterData.audioPath || "",
    status: chapterData.status || "idle",
    createAt: now,
    updateAt: now,
    revision: 0,
    dirty: true,
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
  const chapters = getAllChaptersRaw();
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
    audioPath:
      chapterData.audioPath !== undefined
        ? chapterData.audioPath
        : chapters[index].audioPath || "",
    status:
      chapterData.status !== undefined
        ? chapterData.status
        : chapters[index].status || "idle",
    llmProvider: undefined,
    revision: chapters[index].revision || 0,
    dirty: chapterData.dirty === false ? false : true,
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
  const chapters = getAllChaptersRaw();
  const chapter = chapters.find((item) => item.id === id);
  if (!chapter) return false;
  chapter.deletedAt = new Date().toISOString();
  chapter.dirty = true;
  storage.saveData(STORAGE_FILE, chapters);
  return true;
}

/**
 * 删除项目下的所有章节
 * @param {string} projectId 项目ID
 * @returns {number} 删除的章节数量
 */
function deleteChaptersByProjectId(projectId) {
  const chapters = getAllChaptersRaw();
  let deletedCount = 0;
  for (const chapter of chapters) {
    if (chapter.projectId === projectId && !chapter.deletedAt) {
      chapter.deletedAt = new Date().toISOString();
      chapter.dirty = true;
      deletedCount += 1;
    }
  }
  if (deletedCount > 0) storage.saveData(STORAGE_FILE, chapters);
  return deletedCount;
}

/**
 * 检查章节是否已经合成过语音
 * @param {string} id 章节ID
 * @returns {boolean} 是否有合成过的语音
 */
function hasAudio(id) {
  const chapter = getChapterById(id);
  return chapter && chapter.audioPath && chapter.status === "completed";
}

module.exports = {
  getAllChapters,
  getChaptersByProjectId,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
  deleteChaptersByProjectId,
  hasAudio,
};
