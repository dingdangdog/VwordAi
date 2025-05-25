/**
 * 小说服务
 * 处理小说、章节、角色等相关操作
 * 使用专门的小说模型，与项目系统完全分离
 * 使用普通function而不是class语法
 */
const { v4: uuidv4 } = require("uuid");
const storage = require("../utils/storage");
const Novel = require("../models/Novel");
const NovelChapter = require("../models/NovelChapter");
const NovelCharacter = require("../models/NovelCharacter");
const { success, error } = require("../utils/result");

// 存储键名，用于解析结果和TTS结果
const PARSED_CHAPTERS_STORAGE_KEY = "novel-parsed-chapters";
const TTS_RESULTS_STORAGE_KEY = "novel-tts-results";

/**
 * 获取所有小说
 */
async function getAllNovels() {
  try {
    const novels = Novel.getAllNovels();
    return success(novels);
  } catch (err) {
    console.error("[NovelService] 获取所有小说失败:", err);
    return error("获取小说列表失败: " + err.message);
  }
}

/**
 * 获取小说详情
 */
async function getNovel(id) {
  try {
    const novel = Novel.getNovelById(id);
    if (!novel) {
      return error("小说不存在");
    }
    return success(novel);
  } catch (err) {
    console.error(`[NovelService] 获取小说 ${id} 失败:`, err);
    return error("获取小说详情失败: " + err.message);
  }
}

/**
 * 创建小说
 */
async function createNovel(novelData) {
  try {
    const newNovel = Novel.createNovel(novelData);
    return success(newNovel);
  } catch (err) {
    console.error("[NovelService] 创建小说失败:", err);
    return error("创建小说失败: " + err.message);
  }
}

/**
 * 更新小说
 */
async function updateNovel(id, novelData) {
  try {
    const updatedNovel = Novel.updateNovel(id, novelData);
    return success(updatedNovel);
  } catch (err) {
    console.error(`[NovelService] 更新小说 ${id} 失败:`, err);
    return error("更新小说失败: " + err.message);
  }
}

/**
 * 删除小说
 */
async function deleteNovel(id) {
  try {
    NovelChapter.deleteChaptersByNovelId(id);
    NovelCharacter.deleteCharactersByNovelId(id);

    const parsedChapters = storage.readData(PARSED_CHAPTERS_STORAGE_KEY, []);
    const ttsResults = storage.readData(TTS_RESULTS_STORAGE_KEY, []);

    const filteredParsedChapters = parsedChapters.filter(
      (p) => p.novelId !== id
    );
    const filteredTtsResults = ttsResults.filter((t) => t.novelId !== id);

    storage.saveData(PARSED_CHAPTERS_STORAGE_KEY, filteredParsedChapters);
    storage.saveData(TTS_RESULTS_STORAGE_KEY, filteredTtsResults);

    Novel.deleteNovel(id);
    return success({ message: "小说删除成功" });
  } catch (err) {
    console.error(`[NovelService] 删除小说 ${id} 失败:`, err);
    return error("删除小说失败: " + err.message);
  }
}

/**
 * 获取小说的角色列表
 */
async function getCharactersByNovel(novelId) {
  try {
    const characters = NovelCharacter.getCharactersByNovelId(novelId);
    return success(characters);
  } catch (err) {
    console.error(`[NovelService] 获取小说 ${novelId} 角色列表失败:`, err);
    return error("获取角色列表失败: " + err.message);
  }
}

/**
 * 创建角色
 */
async function createCharacter(characterData) {
  try {
    const newCharacter = NovelCharacter.createNovelCharacter(characterData);
    return success(newCharacter);
  } catch (err) {
    console.error("[NovelService] 创建角色失败:", err);
    return error("创建角色失败: " + err.message);
  }
}

/**
 * 更新角色
 */
async function updateCharacter(id, characterData) {
  try {
    const updatedCharacter = NovelCharacter.updateNovelCharacter(
      id,
      characterData
    );
    if (!updatedCharacter) {
      return error("角色不存在");
    }
    return success(updatedCharacter);
  } catch (err) {
    console.error(`[NovelService] 更新角色 ${id} 失败:`, err);
    return error("更新角色失败: " + err.message);
  }
}

/**
 * 删除角色
 */
async function deleteCharacter(id) {
  try {
    const result = NovelCharacter.deleteNovelCharacter(id);
    if (!result) {
      return error("角色不存在");
    }
    return success({ message: "角色删除成功" });
  } catch (err) {
    console.error(`[NovelService] 删除角色 ${id} 失败:`, err);
    return error("删除角色失败: " + err.message);
  }
}

/**
 * 获取小说的章节列表
 */
async function getChaptersByNovel(novelId) {
  try {
    const chapters = NovelChapter.getChaptersByNovelId(novelId);
    return success(chapters);
  } catch (err) {
    console.error(`[NovelService] 获取小说 ${novelId} 章节列表失败:`, err);
    return error("获取章节列表失败: " + err.message);
  }
}

/**
 * 获取章节详情
 */
async function getChapter(id) {
  try {
    const chapter = NovelChapter.getNovelChapterById(id);
    if (!chapter) {
      return error("章节不存在");
    }
    return success(chapter);
  } catch (err) {
    console.error(`[NovelService] 获取章节 ${id} 失败:`, err);
    return error("获取章节详情失败: " + err.message);
  }
}

/**
 * 创建章节
 */
async function createChapter(chapterData) {
  try {
    const newChapter = NovelChapter.createNovelChapter(chapterData);
    return success(newChapter);
  } catch (err) {
    console.error("[NovelService] 创建章节失败:", err);
    return error("创建章节失败: " + err.message);
  }
}

/**
 * 更新章节
 */
async function updateChapter(id, chapterData) {
  try {
    const updatedChapter = NovelChapter.updateNovelChapter(id, chapterData);
    if (!updatedChapter) {
      return error("章节不存在");
    }
    return success(updatedChapter);
  } catch (err) {
    console.error(`[NovelService] 更新章节 ${id} 失败:`, err);
    return error("更新章节失败: " + err.message);
  }
}

/**
 * 删除章节
 */
async function deleteChapter(id) {
  try {
    const result = NovelChapter.deleteNovelChapter(id);
    if (!result) {
      return error("章节不存在");
    }
    return success({ message: "章节删除成功" });
  } catch (err) {
    console.error(`[NovelService] 删除章节 ${id} 失败:`, err);
    return error("删除章节失败: " + err.message);
  }
}

/**
 * 根据章节ID获取解析结果
 */
async function getParsedChapterByChapterId(chapterId) {
  try {
    const parsedChapters = storage.readData(PARSED_CHAPTERS_STORAGE_KEY, []);
    const parsedChapter = parsedChapters.find((p) => p.chapterId === chapterId);
    return success(parsedChapter || null);
  } catch (err) {
    console.error(`[NovelService] 获取章节 ${chapterId} 解析结果失败:`, err);
    return error("获取解析结果失败: " + err.message);
  }
}

/**
 * 更新解析结果
 */
async function updateParsedChapter(id, parsedChapterData) {
  try {
    const parsedChapters = storage.readData(PARSED_CHAPTERS_STORAGE_KEY, []);
    let index = parsedChapters.findIndex((p) => p.id === id);
    let parsedChapter;

    if (index === -1) {
      parsedChapter = {
        id: id || uuidv4(),
        ...parsedChapterData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      parsedChapters.push(parsedChapter);
    } else {
      parsedChapter = {
        ...parsedChapters[index],
        ...parsedChapterData,
        updatedAt: new Date().toISOString(),
      };
      parsedChapters[index] = parsedChapter;
    }

    storage.saveData(PARSED_CHAPTERS_STORAGE_KEY, parsedChapters);
    return success(parsedChapter);
  } catch (err) {
    console.error(`[NovelService] 更新解析结果 ${id} 失败:`, err);
    return error("更新解析结果失败: " + err.message);
  }
}

/**
 * 根据章节ID获取TTS结果
 */
async function getTtsResultsByChapterId(chapterId) {
  try {
    const ttsResults = storage.readData(TTS_RESULTS_STORAGE_KEY, []);
    const chapterTtsResults = ttsResults.filter(
      (t) => t.chapterId === chapterId
    );
    return success(chapterTtsResults || []);
  } catch (err) {
    console.error(`[NovelService] 获取章节 ${chapterId} TTS结果失败:`, err);
    return error("获取TTS结果失败: " + err.message);
  }
}

module.exports = {
  getAllNovels,
  getNovel,
  createNovel,
  updateNovel,
  deleteNovel,
  getCharactersByNovel,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getChaptersByNovel,
  getChapter,
  createChapter,
  updateChapter,
  deleteChapter,
  getParsedChapterByChapterId,
  updateParsedChapter,
  getTtsResultsByChapterId,
};
