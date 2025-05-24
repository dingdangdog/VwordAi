/**
 * 小说相关API模块
 * 提供与小说、章节、角色等相关的API调用
 */
import type { Result } from "@/types";
import { invoke } from "@/utils/apiBase";
import type {
  Novel,
  Character,
  Chapter,
  ParsedChapter,
  TtsResult,
  ParsedSegment,
  SegmentTtsConfig
} from '@/types/ReadNovels';

/**
 * 深度克隆对象并确保可序列化
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
function safeClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// API response type - 保持与现有代码兼容
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

/**
 * 小说相关API模块
 */
export const novelApi = {
  /**
   * 获取所有小说
   * @returns {Promise<ApiResponse<Novel[]>>} 小说列表
   */
  getAllNovels: async (): Promise<ApiResponse<Novel[]>> => {
    try {
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.getAllNovels();
      return {
        success: result.success,
        data: result.data || [],
        message: result.error
      };
    } catch (error) {
      console.error("获取小说列表失败:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "获取小说列表失败",
        data: []
      };
    }
  },

  /**
   * 获取小说详情
   * @param {string} id 小说ID
   * @returns {Promise<ApiResponse<Novel>>} 小说详情
   */
  getNovel: async (id: string): Promise<ApiResponse<Novel>> => {
    try {
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.getNovel(id);
      return {
        success: result.success,
        data: result.data,
        message: result.error
      };
    } catch (error) {
      console.error(`获取小说[${id}]详情失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "获取小说详情失败",
        data: undefined
      };
    }
  },

  /**
   * 创建小说
   * @param {Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>} novelData 小说数据
   * @returns {Promise<ApiResponse<Novel>>} 创建结果
   */
  createNovel: async (novelData: Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Novel>> => {
    try {
      const safeData = safeClone(novelData);
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.createNovel(safeData);
      return {
        success: result.success,
        data: result.data,
        message: result.error
      };
    } catch (error) {
      console.error("创建小说失败:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "创建小说失败",
        data: undefined
      };
    }
  },

  /**
   * 更新小说
   * @param {string} id 小说ID
   * @param {Partial<Novel>} novelData 小说数据
   * @returns {Promise<ApiResponse<Novel>>} 更新结果
   */
  updateNovel: async (id: string, novelData: Partial<Novel>): Promise<ApiResponse<Novel>> => {
    try {
      const safeData = safeClone(novelData);
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.updateNovel(id, safeData);
      return {
        success: result.success,
        data: result.data,
        message: result.error
      };
    } catch (error) {
      console.error(`更新小说[${id}]失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "更新小说失败",
        data: undefined
      };
    }
  },

  /**
   * 删除小说
   * @param {string} id 小说ID
   * @returns {Promise<ApiResponse<boolean>>} 删除结果
   */
  deleteNovel: async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.deleteNovel(id);
      return {
        success: result.success,
        data: result.data,
        message: result.error
      };
    } catch (error) {
      console.error(`删除小说[${id}]失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "删除小说失败",
        data: false
      };
    }
  },

  /**
   * 获取小说角色列表
   * @param {string} novelId 小说ID
   * @returns {Promise<ApiResponse<Character[]>>} 角色列表
   */
  getCharacters: async (novelId: string): Promise<ApiResponse<Character[]>> => {
    try {
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.getCharactersByNovel(novelId);
      return {
        success: result.success,
        data: result.data || [],
        message: result.error
      };
    } catch (error) {
      console.error(`获取小说[${novelId}]角色列表失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "获取角色列表失败",
        data: []
      };
    }
  },

  /**
   * 创建角色
   * @param {Omit<Character, 'id'>} characterData 角色数据
   * @returns {Promise<ApiResponse<Character>>} 创建结果
   */
  createCharacter: async (characterData: Omit<Character, 'id'>): Promise<ApiResponse<Character>> => {
    try {
      const safeData = safeClone(characterData);
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.createCharacter(safeData);
      return {
        success: result.success,
        data: result.data,
        message: result.error
      };
    } catch (error) {
      console.error("创建角色失败:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "创建角色失败",
        data: undefined
      };
    }
  },

  /**
   * 更新角色
   * @param {string} id 角色ID
   * @param {Partial<Character>} characterData 角色数据
   * @returns {Promise<ApiResponse<Character>>} 更新结果
   */
  updateCharacter: async (id: string, characterData: Partial<Character>): Promise<ApiResponse<Character>> => {
    try {
      const safeData = safeClone(characterData);
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.updateCharacter(id, safeData);
      return {
        success: result.success,
        data: result.data,
        message: result.error
      };
    } catch (error) {
      console.error(`更新角色[${id}]失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "更新角色失败",
        data: undefined
      };
    }
  },

  /**
   * 删除角色
   * @param {string} id 角色ID
   * @returns {Promise<ApiResponse<boolean>>} 删除结果
   */
  deleteCharacter: async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.deleteCharacter(id);
      return {
        success: result.success,
        data: result.data,
        message: result.error
      };
    } catch (error) {
      console.error(`删除角色[${id}]失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "删除角色失败",
        data: false
      };
    }
  },

  /**
   * 获取小说章节列表
   * @param {string} novelId 小说ID
   * @returns {Promise<ApiResponse<Chapter[]>>} 章节列表
   */
  getChapters: async (novelId: string): Promise<ApiResponse<Chapter[]>> => {
    try {
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.getChaptersByNovel(novelId);
      return {
        success: result.success,
        data: result.data || [],
        message: result.error
      };
    } catch (error) {
      console.error(`获取小说[${novelId}]章节列表失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "获取章节列表失败",
        data: []
      };
    }
  },

  /**
   * 创建章节
   * @param {Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>} chapterData 章节数据
   * @returns {Promise<ApiResponse<Chapter>>} 创建结果
   */
  createChapter: async (chapterData: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Chapter>> => {
    try {
      const safeData = safeClone(chapterData);
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.createChapter(safeData);
      return {
        success: result.success,
        data: result.data,
        message: result.error
      };
    } catch (error) {
      console.error("创建章节失败:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "创建章节失败",
        data: undefined
      };
    }
  },

  /**
   * 更新章节
   * @param {string} id 章节ID
   * @param {Partial<Chapter>} chapterData 章节数据
   * @returns {Promise<ApiResponse<Chapter>>} 更新结果
   */
  updateChapter: async (id: string, chapterData: Partial<Chapter>): Promise<ApiResponse<Chapter>> => {
    try {
      const safeData = safeClone(chapterData);
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.updateChapter(id, safeData);
      return {
        success: result.success,
        data: result.data,
        message: result.error
      };
    } catch (error) {
      console.error(`更新章节[${id}]失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "更新章节失败",
        data: undefined
      };
    }
  },

  /**
   * 删除章节
   * @param {string} id 章节ID
   * @returns {Promise<ApiResponse<boolean>>} 删除结果
   */
  deleteChapter: async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.deleteChapter(id);
      return {
        success: result.success,
        data: result.data,
        message: result.error
      };
    } catch (error) {
      console.error(`删除章节[${id}]失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "删除章节失败",
        data: false
      };
    }
  },

  /**
   * 获取解析后的章节数据
   * @param {string} chapterId 章节ID
   * @returns {Promise<ApiResponse<ParsedChapter>>} 解析结果
   */
  getParsedChapter: async (chapterId: string): Promise<ApiResponse<ParsedChapter>> => {
    try {
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.getParsedChapter(chapterId);
      return {
        success: result.success,
        data: result.data,
        message: result.error
      };
    } catch (error) {
      console.error(`获取章节[${chapterId}]解析数据失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "获取解析数据失败",
        data: undefined
      };
    }
  },

  /**
   * 使用LLM解析章节
   * @param {string} chapterId 章节ID
   * @returns {Promise<ApiResponse<ParsedChapter>>} 解析结果
   */
  parseChapter: async (chapterId: string): Promise<ApiResponse<ParsedChapter>> => {
    try {
      // 调用LLM服务解析章节
      // @ts-ignore - window.api.llm由preload.js提供
      const result = await window.api.llm.parseChapter(chapterId);

      if (result.success && result.data) {
        // 如果解析成功，更新章节的处理状态
        // @ts-ignore - window.api.novel由preload.js提供
        await window.api.novel.updateChapter(chapterId, { processed: true });
      }

      return {
        success: result.success,
        data: result.data,
        message: result.error
      };
    } catch (error) {
      console.error(`解析章节[${chapterId}]失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "解析章节失败",
        data: undefined
      };
    }
  },

  /**
   * 获取章节的TTS结果
   * @param {string} chapterId 章节ID
   * @returns {Promise<ApiResponse<TtsResult[]>>} TTS结果列表
   */
  getTtsResults: async (chapterId: string): Promise<ApiResponse<TtsResult[]>> => {
    try {
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.getTtsResults(chapterId);
      return {
        success: result.success,
        data: result.data || [],
        message: result.error
      };
    } catch (error) {
      console.error(`获取章节[${chapterId}]TTS结果失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "获取TTS结果失败",
        data: []
      };
    }
  },

  /**
   * 为单个段落生成TTS
   * @param {string} chapterId 章节ID
   * @param {object} segmentData 段落数据
   * @returns {Promise<ApiResponse<{audioUrl: string, audioPath?: string}>>} 生成结果
   */
  generateSegmentTts: async (chapterId: string, segmentData: {
    text: string,
    voice: string,
    tone?: string,
    ttsConfig?: SegmentTtsConfig
  }): Promise<ApiResponse<{ audioUrl: string, audioPath?: string }>> => {
    try {
      // 调用真实的TTS API
      const safeData = safeClone(segmentData);
      // @ts-ignore - window.api.tts由preload.js提供
      const response = await window.api.tts.synthesizeSegment(chapterId, safeData);

      return {
        success: response.success,
        data: response.data,
        message: response.error
      };
    } catch (error) {
      console.error('生成段落TTS失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误',
        data: undefined
      };
    }
  },

  /**
   * 通过合并段落音频生成整章TTS
   * @param {string} chapterId 章节ID
   * @param {string} parsedChapterId 解析章节ID
   * @param {string[]} audioUrls 音频URL列表
   * @returns {Promise<ApiResponse<TtsResult[]>>} 生成结果
   */
  generateFullChapterTts: async (chapterId: string, parsedChapterId: string, audioUrls: string[]): Promise<ApiResponse<TtsResult[]>> => {
    try {
      // 调用真实的TTS API合并音频文件
      // @ts-ignore - window.api.tts由preload.js提供
      const response = await window.api.tts.synthesizeFullChapter(
        chapterId,
        parsedChapterId,
        audioUrls
      );

      return {
        success: response.success,
        data: response.data,
        message: response.error
      };
    } catch (error) {
      console.error('生成整章TTS失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误',
        data: undefined
      };
    }
  },

  /**
   * 生成整章TTS（旧方法，为了向后兼容）
   * @param {string} parsedChapterId 解析章节ID
   * @returns {Promise<ApiResponse<TtsResult[]>>} 生成结果
   */
  generateTts: async (parsedChapterId: string): Promise<ApiResponse<TtsResult[]>> => {
    try {
      // 调用真实的TTS API
      // @ts-ignore - window.api.tts由preload.js提供
      const response = await window.api.tts.synthesize(parsedChapterId);

      return {
        success: response.success,
        data: response.data,
        message: response.error
      };
    } catch (error) {
      console.error(`生成章节[${parsedChapterId}]TTS失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "生成TTS失败",
        data: undefined
      };
    }
  },

  /**
   * 获取章节详情
   * @param {string} id 章节ID
   * @returns {Promise<ApiResponse<Chapter>>} 章节详情
   */
  getChapter: async (id: string): Promise<ApiResponse<Chapter>> => {
    try {
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.getChapter(id);
      return {
        success: result.success,
        data: result.data,
        message: result.error
      };
    } catch (error) {
      console.error(`获取章节[${id}]详情失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "获取章节详情失败",
        data: undefined
      };
    }
  },

  /**
   * 更新解析后的章节
   * @param {string} id 解析章节ID
   * @param {ParsedChapter} parsedChapterData 解析章节数据
   * @returns {Promise<ApiResponse<ParsedChapter>>} 更新结果
   */
  updateParsedChapter: async (id: string, parsedChapterData: ParsedChapter): Promise<ApiResponse<ParsedChapter>> => {
    try {
      const safeData = safeClone(parsedChapterData);
      // @ts-ignore - window.api.novel由preload.js提供
      const result = await window.api.novel.updateParsedChapter(id, safeData);
      return {
        success: result.success,
        data: result.data,
        message: result.error
      };
    } catch (error) {
      console.error(`更新解析章节[${id}]失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "更新解析章节失败",
        data: undefined
      };
    }
  }
};