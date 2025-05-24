/**
 * 小说模型
 */
const { v4: uuidv4 } = require("uuid");
const storage = require("../utils/storage");

const NOVELS_STORAGE_KEY = "novels";

/**
 * 小说类模型
 */
class Novel {
  /**
   * 获取所有小说
   * @returns {Array} 小说列表
   */
  static getAllNovels() {
    return storage.readData(NOVELS_STORAGE_KEY, []);
  }

  /**
   * 通过ID获取小说
   * @param {string} id 小说ID
   * @returns {Object|null} 小说对象或null
   */
  static getNovelById(id) {
    const novels = this.getAllNovels();
    return novels.find((novel) => novel.id === id) || null;
  }

  /**
   * 创建新小说
   * @param {Object} novelData 小说数据
   * @returns {Object} 新创建的小说
   */
  static createNovel(novelData) {
    const novels = this.getAllNovels();

    const newNovel = {
      id: uuidv4(),
      title: novelData.title || "未命名小说",
      description: novelData.description || "",
      author: novelData.author || "",
      cover: novelData.cover || null,
      characters: novelData.characters || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapterCount: 0,
      wordCount: 0,
    };

    novels.push(newNovel);
    storage.saveData(NOVELS_STORAGE_KEY, novels);

    return newNovel;
  }

  /**
   * 更新小说
   * @param {string} id 小说ID
   * @param {Object} novelData 小说更新数据
   * @returns {Object} 更新后的小说
   */
  static updateNovel(id, novelData) {
    const novels = this.getAllNovels();
    const index = novels.findIndex((novel) => novel.id === id);

    if (index === -1) {
      throw new Error("小说不存在");
    }

    const updatedNovel = {
      ...novels[index],
      ...novelData,
      updatedAt: new Date().toISOString(),
    };

    novels[index] = updatedNovel;
    storage.saveData(NOVELS_STORAGE_KEY, novels);

    return updatedNovel;
  }

  /**
   * 删除小说
   * @param {string} id 小说ID
   * @returns {boolean} 是否成功删除
   */
  static deleteNovel(id) {
    const novels = this.getAllNovels();
    const filteredNovels = novels.filter((novel) => novel.id !== id);

    if (filteredNovels.length === novels.length) {
      throw new Error("小说不存在");
    }

    storage.saveData(NOVELS_STORAGE_KEY, filteredNovels);
    return true;
  }

  /**
   * 更新小说字数统计
   * @param {string} id 小说ID
   * @param {number} wordCount 字数
   * @returns {Object} 更新后的小说
   */
  static updateNovelWordCount(id, wordCount) {
    return this.updateNovel(id, { wordCount });
  }

  /**
   * 更新小说章节数
   * @param {string} id 小说ID
   * @param {number} chapterCount 章节数
   * @returns {Object} 更新后的小说
   */
  static updateNovelChapterCount(id, chapterCount) {
    return this.updateNovel(id, { chapterCount });
  }
}

module.exports = Novel;
