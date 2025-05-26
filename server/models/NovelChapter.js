/**
 * 小说章节模型
 */
const { v4: uuidv4 } = require("uuid");
const storage = require("../utils/storage");
const Novel = require("./Novel");

// 存储文件名
const STORAGE_FILE = "novel-chapters";

/**
 * 获取所有小说章节
 * @returns {Array} 章节列表
 */
function getAllNovelChapters() {
  return storage.readData(STORAGE_FILE, []);
}

/**
 * 获取指定小说的所有章节
 * @param {string} novelId 小说ID
 * @returns {Array} 章节列表
 */
function getChaptersByNovelId(novelId) {
  const chapters = getAllNovelChapters();
  return chapters.filter((chapter) => chapter.novelId === novelId);
}

/**
 * 根据ID获取小说章节
 * @param {string} id 章节ID
 * @returns {Object|null} 章节对象或null
 */
function getNovelChapterById(id) {
  const chapters = getAllNovelChapters();
  return chapters.find((chapter) => chapter.id === id) || null;
}

/**
 * 新建小说章节
 * @param {Object} chapterData 章节数据
 * @returns {Object} 创建的章节
 */
function createNovelChapter(chapterData) {
  const chapters = getAllNovelChapters();

  // 检查小说是否存在
  const novel = Novel.getNovelById(chapterData.novelId);
  if (!novel) {
    throw new Error("小说不存在");
  }

  // 检查章节标题在小说中是否唯一
  const novelChapters = getChaptersByNovelId(chapterData.novelId);
  if (novelChapters.some((c) => c.title === chapterData.title)) {
    throw new Error("章节标题在当前小说中已存在");
  }

  // 计算章节顺序
  const maxOrder = novelChapters.length > 0
    ? Math.max(...novelChapters.map(c => c.order || 0))
    : 0;

  const now = new Date().toISOString();
  const newChapter = {
    id: uuidv4(),
    novelId: chapterData.novelId,
    title: chapterData.title,
    content: chapterData.content || "",
    order: chapterData.order || (maxOrder + 1),
    processed: false,
    llmProvider: chapterData.llmProvider || "volcengine",
    createdAt: now,
    updatedAt: now,
    // 内嵌解析结果
    parsedData: chapterData.parsedData || null,
    // 内嵌TTS结果
    ttsResults: chapterData.ttsResults || {
      segments: [],
      audioFiles: [],
      mergedAudioFile: null,
      status: "pending", // pending, processing, completed, failed
      createdAt: null,
      completedAt: null
    }
  };

  chapters.push(newChapter);
  storage.saveData(STORAGE_FILE, chapters);

  // 更新小说的章节数和字数统计
  updateNovelStats(chapterData.novelId);

  return newChapter;
}

/**
 * 更新小说章节
 * @param {string} id 章节ID
 * @param {Object} chapterData 更新的章节数据
 * @returns {Object|null} 更新后的章节或null
 */
function updateNovelChapter(id, chapterData) {
  const chapters = getAllNovelChapters();
  const index = chapters.findIndex((chapter) => chapter.id === id);

  if (index === -1) {
    return null;
  }

  // 如果更改了标题，检查是否在小说中与其他章节重名
  if (chapterData.title && chapterData.title !== chapters[index].title) {
    const novelChapters = getChaptersByNovelId(chapters[index].novelId);
    const titleExists = novelChapters.some(
      (c) => c.id !== id && c.title === chapterData.title
    );
    if (titleExists) {
      throw new Error("章节标题在当前小说中已存在");
    }
  }

  const updatedChapter = {
    ...chapters[index],
    title: chapterData.title !== undefined ? chapterData.title : chapters[index].title,
    content: chapterData.content !== undefined ? chapterData.content : chapters[index].content,
    order: chapterData.order !== undefined ? chapterData.order : chapters[index].order,
    processed: chapterData.processed !== undefined ? chapterData.processed : chapters[index].processed,
    llmProvider: chapterData.llmProvider !== undefined ? chapterData.llmProvider : chapters[index].llmProvider,
    // 更新解析结果
    parsedData: chapterData.parsedData !== undefined ? chapterData.parsedData : chapters[index].parsedData,
    // 更新TTS结果
    ttsResults: chapterData.ttsResults !== undefined ? chapterData.ttsResults : chapters[index].ttsResults,
    updatedAt: new Date().toISOString(),
  };

  chapters[index] = updatedChapter;
  storage.saveData(STORAGE_FILE, chapters);

  // 更新小说的字数统计
  updateNovelStats(chapters[index].novelId);

  return updatedChapter;
}

/**
 * 删除小说章节
 * @param {string} id 章节ID
 * @returns {boolean} 是否删除成功
 */
function deleteNovelChapter(id) {
  const chapters = getAllNovelChapters();
  const chapter = chapters.find(c => c.id === id);

  if (!chapter) {
    return false;
  }

  const novelId = chapter.novelId;
  const filteredChapters = chapters.filter((chapter) => chapter.id !== id);

  storage.saveData(STORAGE_FILE, filteredChapters);

  // 更新小说的章节数和字数统计
  updateNovelStats(novelId);

  return true;
}

/**
 * 删除小说下的所有章节
 * @param {string} novelId 小说ID
 * @returns {number} 删除的章节数量
 */
function deleteChaptersByNovelId(novelId) {
  const chapters = getAllNovelChapters();
  const initialLength = chapters.length;

  const filteredChapters = chapters.filter(
    (chapter) => chapter.novelId !== novelId
  );

  const deletedCount = initialLength - filteredChapters.length;

  if (deletedCount > 0) {
    storage.saveData(STORAGE_FILE, filteredChapters);
  }

  return deletedCount;
}

/**
 * 更新小说的统计信息
 * @param {string} novelId 小说ID
 */
function updateNovelStats(novelId) {
  const novelChapters = getChaptersByNovelId(novelId);
  const chapterCount = novelChapters.length;
  const wordCount = novelChapters.reduce((count, chapter) => {
    return count + (chapter.content ? chapter.content.length : 0);
  }, 0);

  Novel.updateNovelChapterCount(novelId, chapterCount);
  Novel.updateNovelWordCount(novelId, wordCount);
}

/**
 * 更新章节的解析结果
 * @param {string} chapterId 章节ID
 * @param {Object} parsedData 解析结果数据
 * @returns {Object|null} 更新后的章节或null
 */
function updateChapterParsedData(chapterId, parsedData) {
  return updateNovelChapter(chapterId, {
    parsedData,
    processed: true,
    updatedAt: new Date().toISOString()
  });
}

/**
 * 更新章节的TTS结果
 * @param {string} chapterId 章节ID
 * @param {Object} ttsResults TTS结果数据
 * @returns {Object|null} 更新后的章节或null
 */
function updateChapterTTSResults(chapterId, ttsResults) {
  return updateNovelChapter(chapterId, {
    ttsResults: {
      ...ttsResults,
      updatedAt: new Date().toISOString()
    }
  });
}

/**
 * 获取章节的解析结果
 * @param {string} chapterId 章节ID
 * @returns {Object|null} 解析结果或null
 */
function getChapterParsedData(chapterId) {
  const chapter = getNovelChapterById(chapterId);
  return chapter ? chapter.parsedData : null;
}

/**
 * 获取章节的TTS结果
 * @param {string} chapterId 章节ID
 * @returns {Object|null} TTS结果或null
 */
function getChapterTTSResults(chapterId) {
  const chapter = getNovelChapterById(chapterId);
  return chapter ? chapter.ttsResults : null;
}

module.exports = {
  getAllNovelChapters,
  getChaptersByNovelId,
  getNovelChapterById,
  createNovelChapter,
  updateNovelChapter,
  deleteNovelChapter,
  deleteChaptersByNovelId,
  updateNovelStats,
  // 新增的解析结果和TTS结果管理方法
  updateChapterParsedData,
  updateChapterTTSResults,
  getChapterParsedData,
  getChapterTTSResults,
};
