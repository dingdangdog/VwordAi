/**
 * 小说服务
 * 处理小说、章节、角色等相关操作
 * 使用专门的小说模型，与项目系统完全分离
 */
const { v4: uuidv4 } = require("uuid");
const storage = require("../utils/storage");
const Novel = require("../models/Novel");
const NovelChapter = require("../models/NovelChapter");
const NovelCharacter = require("../models/NovelCharacter");
const LLMService = require("./LLMService");
const TTSService = require("./TTSService");
const { FileService } = require("./FileService");

// 存储键名，用于解析结果和TTS结果
const PARSED_CHAPTERS_STORAGE_KEY = "novel-parsed-chapters";
const TTS_RESULTS_STORAGE_KEY = "novel-tts-results";

class NovelService {
  constructor() {
    // 初始化其他服务
    this.llmService = LLMService;
    this.ttsService = TTSService;
    this.fileService = new FileService();
  }

  /**
   * 获取所有小说
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 小说列表
   */
  async getAllNovels() {
    try {
      const novels = Novel.getAllNovels();
      return {
        success: true,
        data: novels
      };
    } catch (error) {
      console.error('获取所有小说失败:', error);
      return {
        success: false,
        error: error.message || '获取小说列表失败'
      };
    }
  }

  /**
   * 获取小说详情
   * @param {string} id 小说ID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 小说详情
   */
  async getNovel(id) {
    try {
      const novel = Novel.getNovelById(id);
      if (!novel) {
        return {
          success: false,
          error: '小说不存在'
        };
      }
      return {
        success: true,
        data: novel
      };
    } catch (error) {
      console.error(`获取小说 ${id} 失败:`, error);
      return {
        success: false,
        error: error.message || '获取小说详情失败'
      };
    }
  }

  /**
   * 创建小说
   * @param {object} novelData 小说数据
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 创建结果
   */
  async createNovel(novelData) {
    try {
      const newNovel = Novel.createNovel(novelData);
      return {
        success: true,
        data: newNovel
      };
    } catch (error) {
      console.error('创建小说失败:', error);
      return {
        success: false,
        error: error.message || '创建小说失败'
      };
    }
  }

  /**
   * 更新小说
   * @param {string} id 小说ID
   * @param {object} novelData 小说数据
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 更新结果
   */
  async updateNovel(id, novelData) {
    try {
      const updatedNovel = Novel.updateNovel(id, novelData);
      return {
        success: true,
        data: updatedNovel
      };
    } catch (error) {
      console.error(`更新小说 ${id} 失败:`, error);
      return {
        success: false,
        error: error.message || '更新小说失败'
      };
    }
  }

  /**
   * 删除小说
   * @param {string} id 小说ID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 删除结果
   */
  async deleteNovel(id) {
    try {
      // 删除相关的章节
      NovelChapter.deleteChaptersByNovelId(id);

      // 删除相关的角色
      NovelCharacter.deleteCharactersByNovelId(id);

      // 删除相关的解析结果和TTS结果
      const parsedChapters = storage.readData(PARSED_CHAPTERS_STORAGE_KEY, []);
      const ttsResults = storage.readData(TTS_RESULTS_STORAGE_KEY, []);

      const filteredParsedChapters = parsedChapters.filter(p => p.novelId !== id);
      const filteredTtsResults = ttsResults.filter(t => t.novelId !== id);

      storage.saveData(PARSED_CHAPTERS_STORAGE_KEY, filteredParsedChapters);
      storage.saveData(TTS_RESULTS_STORAGE_KEY, filteredTtsResults);

      // 删除小说
      Novel.deleteNovel(id);

      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error(`删除小说 ${id} 失败:`, error);
      return {
        success: false,
        error: error.message || '删除小说失败'
      };
    }
  }

  /**
   * 获取小说的角色列表
   * @param {string} novelId 小说ID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 角色列表
   */
  async getCharactersByNovel(novelId) {
    try {
      const characters = NovelCharacter.getCharactersByNovelId(novelId);
      return {
        success: true,
        data: characters
      };
    } catch (error) {
      console.error(`获取小说 ${novelId} 角色列表失败:`, error);
      return {
        success: false,
        error: error.message || '获取角色列表失败'
      };
    }
  }

  /**
   * 创建角色
   * @param {object} characterData 角色数据
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 创建结果
   */
  async createCharacter(characterData) {
    try {
      const newCharacter = NovelCharacter.createNovelCharacter(characterData);
      return {
        success: true,
        data: newCharacter
      };
    } catch (error) {
      console.error('创建角色失败:', error);
      return {
        success: false,
        error: error.message || '创建角色失败'
      };
    }
  }

  /**
   * 更新角色
   * @param {string} id 角色ID
   * @param {object} characterData 角色数据
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 更新结果
   */
  async updateCharacter(id, characterData) {
    try {
      const updatedCharacter = NovelCharacter.updateNovelCharacter(id, characterData);

      if (!updatedCharacter) {
        return {
          success: false,
          error: '角色不存在'
        };
      }

      return {
        success: true,
        data: updatedCharacter
      };
    } catch (error) {
      console.error(`更新角色 ${id} 失败:`, error);
      return {
        success: false,
        error: error.message || '更新角色失败'
      };
    }
  }

  /**
   * 删除角色
   * @param {string} id 角色ID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 删除结果
   */
  async deleteCharacter(id) {
    try {
      const result = NovelCharacter.deleteNovelCharacter(id);

      if (!result) {
        return {
          success: false,
          error: '角色不存在'
        };
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error(`删除角色 ${id} 失败:`, error);
      return {
        success: false,
        error: error.message || '删除角色失败'
      };
    }
  }

  /**
   * 获取小说的章节列表
   * @param {string} novelId 小说ID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 章节列表
   */
  async getChaptersByNovel(novelId) {
    try {
      const chapters = NovelChapter.getChaptersByNovelId(novelId);
      return {
        success: true,
        data: chapters
      };
    } catch (error) {
      console.error(`获取小说 ${novelId} 章节列表失败:`, error);
      return {
        success: false,
        error: error.message || '获取章节列表失败'
      };
    }
  }

  /**
   * 获取章节详情
   * @param {string} id 章节ID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 章节详情
   */
  async getChapter(id) {
    try {
      const chapter = NovelChapter.getNovelChapterById(id);

      if (!chapter) {
        return {
          success: false,
          error: '章节不存在'
        };
      }

      return {
        success: true,
        data: chapter
      };
    } catch (error) {
      console.error(`获取章节 ${id} 失败:`, error);
      return {
        success: false,
        error: error.message || '获取章节详情失败'
      };
    }
  }

  /**
   * 创建章节
   * @param {object} chapterData 章节数据
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 创建结果
   */
  async createChapter(chapterData) {
    try {
      const newChapter = NovelChapter.createNovelChapter(chapterData);
      return {
        success: true,
        data: newChapter
      };
    } catch (error) {
      console.error('创建章节失败:', error);
      return {
        success: false,
        error: error.message || '创建章节失败'
      };
    }
  }

  /**
   * 更新章节
   * @param {string} id 章节ID
   * @param {object} chapterData 章节数据
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 更新结果
   */
  async updateChapter(id, chapterData) {
    try {
      const updatedChapter = NovelChapter.updateNovelChapter(id, chapterData);

      if (!updatedChapter) {
        return {
          success: false,
          error: '章节不存在'
        };
      }

      return {
        success: true,
        data: updatedChapter
      };
    } catch (error) {
      console.error(`更新章节 ${id} 失败:`, error);
      return {
        success: false,
        error: error.message || '更新章节失败'
      };
    }
  }

  /**
   * 删除章节
   * @param {string} id 章节ID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 删除结果
   */
  async deleteChapter(id) {
    try {
      const result = NovelChapter.deleteNovelChapter(id);

      if (!result) {
        return {
          success: false,
          error: '章节不存在'
        };
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error(`删除章节 ${id} 失败:`, error);
      return {
        success: false,
        error: error.message || '删除章节失败'
      };
    }
  }

  /**
   * 根据章节ID获取解析结果
   * @param {string} chapterId 章节ID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 解析结果
   */
  async getParsedChapterByChapterId(chapterId) {
    try {
      const parsedChapters = storage.readData(PARSED_CHAPTERS_STORAGE_KEY, []);
      const parsedChapter = parsedChapters.find(p => p.chapterId === chapterId);
      return {
        success: true,
        data: parsedChapter || null
      };
    } catch (error) {
      console.error(`获取章节 ${chapterId} 解析结果失败:`, error);
      return {
        success: false,
        error: error.message || '获取解析结果失败'
      };
    }
  }

  /**
   * 更新解析结果
   * @param {string} id 解析结果ID
   * @param {object} parsedChapterData 解析结果数据
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 更新结果
   */
  async updateParsedChapter(id, parsedChapterData) {
    try {
      const parsedChapters = storage.readData(PARSED_CHAPTERS_STORAGE_KEY, []);
      let index = parsedChapters.findIndex(p => p.id === id);
      let parsedChapter;

      if (index === -1) {
        // 如果不存在，创建新的解析结果
        parsedChapter = {
          id: id || uuidv4(),
          ...parsedChapterData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        parsedChapters.push(parsedChapter);
      } else {
        // 如果存在，更新解析结果
        parsedChapter = {
          ...parsedChapters[index],
          ...parsedChapterData,
          updatedAt: new Date().toISOString()
        };
        parsedChapters[index] = parsedChapter;
      }

      storage.saveData(PARSED_CHAPTERS_STORAGE_KEY, parsedChapters);

      return {
        success: true,
        data: parsedChapter
      };
    } catch (error) {
      console.error(`更新解析结果 ${id} 失败:`, error);
      return {
        success: false,
        error: error.message || '更新解析结果失败'
      };
    }
  }

  /**
   * 根据章节ID获取TTS结果
   * @param {string} chapterId 章节ID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} TTS结果
   */
  async getTtsResultsByChapterId(chapterId) {
    try {
      const ttsResults = storage.readData(TTS_RESULTS_STORAGE_KEY, []);
      const chapterTtsResults = ttsResults.filter(t => t.chapterId === chapterId);
      return {
        success: true,
        data: chapterTtsResults || []
      };
    } catch (error) {
      console.error(`获取章节 ${chapterId} TTS结果失败:`, error);
      return {
        success: false,
        error: error.message || '获取TTS结果失败'
      };
    }
  }
}

// 导出NovelService类
module.exports = { NovelService };


