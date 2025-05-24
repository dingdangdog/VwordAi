/**
 * 小说服务
 * 处理小说、章节、角色等相关操作
 */
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { app } = require('electron');
const LLMService = require('./LLMService');
const TTSService = require('./TTSService');
const { FileService } = require('./FileService');

class NovelService {
  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'novels');
    this.ensureDirectories();

    // 初始化其他服务
    this.llmService = LLMService;
    this.ttsService = TTSService; // 直接使用TTSService对象，不需要实例化
    this.fileService = new FileService();

    // 加载数据
    this.novels = this.loadData('novels.json', []);
    this.characters = this.loadData('characters.json', []);
    this.chapters = this.loadData('chapters.json', []);
    this.parsedChapters = this.loadData('parsed-chapters.json', []);
    this.ttsResults = this.loadData('tts-results.json', []);
  }

  /**
   * 确保必要的目录存在
   */
  ensureDirectories() {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'audio'),
      path.join(this.dataDir, 'covers'),
      path.join(this.dataDir, 'temp')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 加载数据文件
   * @param {string} filename 文件名
   * @param {any} defaultValue 默认值
   * @returns {any} 加载的数据
   */
  loadData(filename, defaultValue) {
    const filePath = path.join(this.dataDir, filename);
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`加载数据文件 ${filename} 失败:`, error);
    }
    return defaultValue;
  }

  /**
   * 保存数据到文件
   * @param {string} filename 文件名
   * @param {any} data 要保存的数据
   */
  saveData(filename, data) {
    const filePath = path.join(this.dataDir, filename);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`保存数据文件 ${filename} 失败:`, error);
      throw error;
    }
  }

  /**
   * 获取所有小说
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} 小说列表
   */
  async getAllNovels() {
    try {
      return {
        success: true,
        data: this.novels
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
      const novel = this.novels.find(n => n.id === id);
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
      const now = new Date().toISOString();
      const newNovel = {
        id: uuidv4(),
        ...novelData,
        characters: novelData.characters || [],
        createdAt: now,
        updatedAt: now
      };

      this.novels.push(newNovel);
      this.saveData('novels.json', this.novels);

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
      const index = this.novels.findIndex(n => n.id === id);
      if (index === -1) {
        return {
          success: false,
          error: '小说不存在'
        };
      }

      const updatedNovel = {
        ...this.novels[index],
        ...novelData,
        updatedAt: new Date().toISOString()
      };

      this.novels[index] = updatedNovel;
      this.saveData('novels.json', this.novels);

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
      const index = this.novels.findIndex(n => n.id === id);
      if (index === -1) {
        return {
          success: false,
          error: '小说不存在'
        };
      }

      // 删除相关的章节和角色
      this.chapters = this.chapters.filter(c => c.novelId !== id);
      this.characters = this.characters.filter(c => c.novelId !== id);

      // 删除相关的解析结果和TTS结果
      const chapterIds = this.chapters.filter(c => c.novelId === id).map(c => c.id);
      this.parsedChapters = this.parsedChapters.filter(p => !chapterIds.includes(p.chapterId));
      this.ttsResults = this.ttsResults.filter(t => !chapterIds.includes(t.chapterId));

      // 删除小说
      this.novels.splice(index, 1);

      // 保存数据
      this.saveData('novels.json', this.novels);
      this.saveData('chapters.json', this.chapters);
      this.saveData('characters.json', this.characters);
      this.saveData('parsed-chapters.json', this.parsedChapters);
      this.saveData('tts-results.json', this.ttsResults);

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
      const characters = this.characters.filter(c => c.novelId === novelId);
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
      const now = new Date().toISOString();
      const newCharacter = {
        id: uuidv4(),
        ...characterData,
        createdAt: now,
        updatedAt: now
      };

      this.characters.push(newCharacter);
      this.saveData('characters.json', this.characters);

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
      const index = this.characters.findIndex(c => c.id === id);
      if (index === -1) {
        return {
          success: false,
          error: '角色不存在'
        };
      }

      const updatedCharacter = {
        ...this.characters[index],
        ...characterData,
        updatedAt: new Date().toISOString()
      };

      this.characters[index] = updatedCharacter;
      this.saveData('characters.json', this.characters);

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
      const index = this.characters.findIndex(c => c.id === id);
      if (index === -1) {
        return {
          success: false,
          error: '角色不存在'
        };
      }

      this.characters.splice(index, 1);
      this.saveData('characters.json', this.characters);

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
      const chapters = this.chapters.filter(c => c.novelId === novelId);
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
      const chapter = this.chapters.find(c => c.id === id);
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
      const now = new Date().toISOString();
      const newChapter = {
        id: uuidv4(),
        ...chapterData,
        createdAt: now,
        updatedAt: now
      };

      this.chapters.push(newChapter);
      this.saveData('chapters.json', this.chapters);

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
      const index = this.chapters.findIndex(c => c.id === id);
      if (index === -1) {
        return {
          success: false,
          error: '章节不存在'
        };
      }

      const updatedChapter = {
        ...this.chapters[index],
        ...chapterData,
        updatedAt: new Date().toISOString()
      };

      this.chapters[index] = updatedChapter;
      this.saveData('chapters.json', this.chapters);

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
      const index = this.chapters.findIndex(c => c.id === id);
      if (index === -1) {
        return {
          success: false,
          error: '章节不存在'
        };
      }

      // 删除相关的解析结果和TTS结果
      this.parsedChapters = this.parsedChapters.filter(p => p.chapterId !== id);
      this.ttsResults = this.ttsResults.filter(t => t.chapterId !== id);

      this.chapters.splice(index, 1);
      this.saveData('chapters.json', this.chapters);
      this.saveData('parsed-chapters.json', this.parsedChapters);
      this.saveData('tts-results.json', this.ttsResults);

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
      const parsedChapter = this.parsedChapters.find(p => p.chapterId === chapterId);
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
      let index = this.parsedChapters.findIndex(p => p.id === id);
      let parsedChapter;

      if (index === -1) {
        // 如果不存在，创建新的解析结果
        parsedChapter = {
          id: id || uuidv4(),
          ...parsedChapterData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.parsedChapters.push(parsedChapter);
      } else {
        // 如果存在，更新解析结果
        parsedChapter = {
          ...this.parsedChapters[index],
          ...parsedChapterData,
          updatedAt: new Date().toISOString()
        };
        this.parsedChapters[index] = parsedChapter;
      }

      this.saveData('parsed-chapters.json', this.parsedChapters);

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
      const ttsResults = this.ttsResults.filter(t => t.chapterId === chapterId);
      return {
        success: true,
        data: ttsResults || []
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
