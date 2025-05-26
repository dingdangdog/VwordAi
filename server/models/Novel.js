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
      // 内嵌角色列表
      characters: novelData.characters || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapterCount: 0,
      wordCount: 0,
      // 小说级别配置
      settings: {
        defaultLLMProvider: novelData.settings?.defaultLLMProvider || "volcengine",
        defaultTTSProvider: novelData.settings?.defaultTTSProvider || "azure",
        defaultVoiceSettings: {
          speed: novelData.settings?.defaultVoiceSettings?.speed || 0,
          pitch: novelData.settings?.defaultVoiceSettings?.pitch || 0,
          volume: novelData.settings?.defaultVoiceSettings?.volume || 100,
          emotion: novelData.settings?.defaultVoiceSettings?.emotion || "",
          style: novelData.settings?.defaultVoiceSettings?.style || "",
        }
      }
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

  /**
   * 添加角色到小说
   * @param {string} novelId 小说ID
   * @param {Object} characterData 角色数据
   * @returns {Object} 更新后的小说
   */
  static addCharacter(novelId, characterData) {
    const novel = this.getNovelById(novelId);
    if (!novel) {
      throw new Error("小说不存在");
    }

    const newCharacter = {
      id: uuidv4(),
      name: characterData.name || "未命名角色",
      type: characterData.type || "secondary", // main, secondary, minor
      gender: characterData.gender || "unknown", // male, female, unknown
      age: characterData.age || "unknown", // child, youth, middle, elder, unknown
      description: characterData.description || "",
      voiceModel: characterData.voiceModel || "",
      aliases: characterData.aliases || [],
      createdAt: new Date().toISOString(),
    };

    novel.characters.push(newCharacter);
    return this.updateNovel(novelId, { characters: novel.characters });
  }

  /**
   * 更新小说中的角色
   * @param {string} novelId 小说ID
   * @param {string} characterId 角色ID
   * @param {Object} characterData 角色更新数据
   * @returns {Object} 更新后的小说
   */
  static updateCharacter(novelId, characterId, characterData) {
    const novel = this.getNovelById(novelId);
    if (!novel) {
      throw new Error("小说不存在");
    }

    const characterIndex = novel.characters.findIndex(c => c.id === characterId);
    if (characterIndex === -1) {
      throw new Error("角色不存在");
    }

    novel.characters[characterIndex] = {
      ...novel.characters[characterIndex],
      ...characterData,
      updatedAt: new Date().toISOString(),
    };

    return this.updateNovel(novelId, { characters: novel.characters });
  }

  /**
   * 删除小说中的角色
   * @param {string} novelId 小说ID
   * @param {string} characterId 角色ID
   * @returns {Object} 更新后的小说
   */
  static deleteCharacter(novelId, characterId) {
    const novel = this.getNovelById(novelId);
    if (!novel) {
      throw new Error("小说不存在");
    }

    const filteredCharacters = novel.characters.filter(c => c.id !== characterId);
    if (filteredCharacters.length === novel.characters.length) {
      throw new Error("角色不存在");
    }

    return this.updateNovel(novelId, { characters: filteredCharacters });
  }

  /**
   * 获取小说的所有角色
   * @param {string} novelId 小说ID
   * @returns {Array} 角色列表
   */
  static getCharacters(novelId) {
    const novel = this.getNovelById(novelId);
    if (!novel) {
      throw new Error("小说不存在");
    }
    return novel.characters || [];
  }
}

module.exports = Novel;
