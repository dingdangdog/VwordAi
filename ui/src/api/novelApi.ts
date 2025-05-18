import { v4 as uuidv4 } from 'uuid';
import type { Novel, Character, Chapter, ParsedChapter, TtsResult } from '@/types/ReadNovels';

// Mock data for testing
const mockNovels: Novel[] = [
  {
    id: '1',
    title: '白雪公主',
    author: '安徒生',
    description: '一个关于白雪公主的童话故事',
    characters: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: '三体',
    author: '刘慈欣',
    description: '科幻小说，描述了地球文明与三体文明的交流、冲突、战争的故事',
    characters: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockCharacters: Character[] = [
  {
    id: '1',
    novelId: '1',
    name: '白雪公主',
    type: 'main',
    gender: 'female',
    age: 'youth',
    description: '美丽的公主',
    voiceModel: 'female-1'
  },
  {
    id: '2',
    novelId: '1',
    name: '王后',
    type: 'main',
    gender: 'female',
    age: 'middle',
    description: '邪恶的后母',
    voiceModel: 'female-2'
  },
  {
    id: '3',
    novelId: '1',
    name: '猎人',
    type: 'secondary',
    gender: 'male',
    age: 'middle',
    description: '负责捕猎的猎人',
    voiceModel: 'male-1'
  }
];

const mockChapters: Chapter[] = [
  {
    id: '1',
    novelId: '1',
    title: '第一章：美丽的公主',
    content: '从前有一个美丽的公主，名叫白雪公主。她有一个邪恶的后母，后母嫉妒她的美貌。\n"魔镜魔镜，谁是世界上最美的女人？"王后问道。\n"是白雪公主。"魔镜回答道。',
    order: 1,
    processed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    llmProvider: 'openai'
  },
  {
    id: '2',
    novelId: '1',
    title: '第二章：逃离城堡',
    content: '王后命令猎人把白雪公主带到森林里杀死。\n"请把白雪公主带到森林里，然后杀了她。"王后命令道。\n猎人点了点头，但他无法下手杀死这个美丽善良的公主。\n"公主，您必须逃走，永远不要回来。"猎人对白雪公主说。',
    order: 2,
    processed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    llmProvider: 'volcengine'
  }
];

const mockParsedChapters: ParsedChapter[] = [
  {
    id: '1',
    chapterId: '1',
    title: '第一章：美丽的公主',
    segments: [
      {
        text: '从前有一个美丽的公主，名叫白雪公主。她有一个邪恶的后母，后母嫉妒她的美貌。',
        voice: 'narrator-1'
      },
      {
        text: '魔镜魔镜，谁是世界上最美的女人？',
        character: '王后',
        tone: '傲慢',
        voice: 'female-2'
      },
      {
        text: '是白雪公主。',
        character: '魔镜',
        tone: '平静',
        voice: 'male-3'
      }
    ],
    processedAt: new Date().toISOString()
  }
];

const mockTtsResults: TtsResult[] = [
  {
    id: '1',
    chapterId: '1',
    audioUrl: 'https://example.com/audio/chapter1.mp3',
    duration: 120,
    createdAt: new Date().toISOString()
  }
];

// API response type
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

// Novel API module
export const novelApi = {
  // Get all novels
  getAllNovels: async (): Promise<ApiResponse<Novel[]>> => {
    return {
      success: true,
      data: mockNovels
    };
  },

  // Get a novel by ID
  getNovel: async (id: string): Promise<ApiResponse<Novel>> => {
    const novel = mockNovels.find(n => n.id === id);
    if (novel) {
      return {
        success: true,
        data: novel
      };
    }
    return {
      success: false,
      message: 'Novel not found'
    };
  },

  // Create a new novel
  createNovel: async (novelData: Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Novel>> => {
    const now = new Date().toISOString();
    const newNovel: Novel = {
      id: uuidv4(),
      ...novelData,
      createdAt: now,
      updatedAt: now
    };

    // In a real implementation, this would save to a backend
    // For mock purposes, we'll just add it to our array
    mockNovels.push(newNovel);

    return {
      success: true,
      data: newNovel
    };
  },

  // Update a novel
  updateNovel: async (id: string, novelData: Partial<Novel>): Promise<ApiResponse<Novel>> => {
    const novelIndex = mockNovels.findIndex(n => n.id === id);
    if (novelIndex === -1) {
      return {
        success: false,
        message: 'Novel not found'
      };
    }

    const updatedNovel = {
      ...mockNovels[novelIndex],
      ...novelData,
      updatedAt: new Date().toISOString()
    };

    mockNovels[novelIndex] = updatedNovel;

    return {
      success: true,
      data: updatedNovel
    };
  },

  // Delete a novel
  deleteNovel: async (id: string): Promise<ApiResponse<boolean>> => {
    const novelIndex = mockNovels.findIndex(n => n.id === id);
    if (novelIndex === -1) {
      return {
        success: false,
        message: 'Novel not found'
      };
    }

    mockNovels.splice(novelIndex, 1);

    return {
      success: true,
      data: true
    };
  },

  // Get characters for a novel
  getCharacters: async (novelId: string): Promise<ApiResponse<Character[]>> => {
    const characters = mockCharacters.filter(c => c.novelId === novelId);
    return {
      success: true,
      data: characters
    };
  },

  // Create a character
  createCharacter: async (characterData: Omit<Character, 'id'>): Promise<ApiResponse<Character>> => {
    const newCharacter: Character = {
      id: uuidv4(),
      ...characterData
    };

    mockCharacters.push(newCharacter);

    return {
      success: true,
      data: newCharacter
    };
  },

  // Update a character
  updateCharacter: async (id: string, characterData: Partial<Character>): Promise<ApiResponse<Character>> => {
    const characterIndex = mockCharacters.findIndex(c => c.id === id);
    if (characterIndex === -1) {
      return {
        success: false,
        message: 'Character not found'
      };
    }

    const updatedCharacter = {
      ...mockCharacters[characterIndex],
      ...characterData
    };

    mockCharacters[characterIndex] = updatedCharacter;

    return {
      success: true,
      data: updatedCharacter
    };
  },

  // Delete a character
  deleteCharacter: async (id: string): Promise<ApiResponse<boolean>> => {
    const characterIndex = mockCharacters.findIndex(c => c.id === id);
    if (characterIndex === -1) {
      return {
        success: false,
        message: 'Character not found'
      };
    }

    mockCharacters.splice(characterIndex, 1);

    return {
      success: true,
      data: true
    };
  },

  // Get chapters for a novel
  getChapters: async (novelId: string): Promise<ApiResponse<Chapter[]>> => {
    const chapters = mockChapters.filter(c => c.novelId === novelId);
    return {
      success: true,
      data: chapters
    };
  },

  // Create a chapter
  createChapter: async (chapterData: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Chapter>> => {
    const now = new Date().toISOString();
    const newChapter: Chapter = {
      id: uuidv4(),
      ...chapterData,
      llmProvider: chapterData.llmProvider || 'openai', // Default to OpenAI if not specified
      createdAt: now,
      updatedAt: now
    };

    mockChapters.push(newChapter);

    return {
      success: true,
      data: newChapter
    };
  },

  // Update a chapter
  updateChapter: async (id: string, chapterData: Partial<Chapter>): Promise<ApiResponse<Chapter>> => {
    const chapterIndex = mockChapters.findIndex(c => c.id === id);
    if (chapterIndex === -1) {
      return {
        success: false,
        message: 'Chapter not found'
      };
    }

    const updatedChapter = {
      ...mockChapters[chapterIndex],
      ...chapterData,
      updatedAt: new Date().toISOString()
    };

    mockChapters[chapterIndex] = updatedChapter;

    return {
      success: true,
      data: updatedChapter
    };
  },

  // Delete a chapter
  deleteChapter: async (id: string): Promise<ApiResponse<boolean>> => {
    const chapterIndex = mockChapters.findIndex(c => c.id === id);
    if (chapterIndex === -1) {
      return {
        success: false,
        message: 'Chapter not found'
      };
    }

    mockChapters.splice(chapterIndex, 1);

    return {
      success: true,
      data: true
    };
  },

  // Get parsed chapter data
  getParsedChapter: async (chapterId: string): Promise<ApiResponse<ParsedChapter>> => {
    const parsedChapter = mockParsedChapters.find(p => p.chapterId === chapterId);
    if (parsedChapter) {
      return {
        success: true,
        data: parsedChapter
      };
    }
    return {
      success: false,
      message: 'Parsed chapter data not found'
    };
  },

  // Parse chapter with LLM
  parseChapter: async (chapterId: string): Promise<ApiResponse<ParsedChapter>> => {
    const chapter = mockChapters.find(c => c.id === chapterId);
    if (!chapter) {
      return {
        success: false,
        message: 'Chapter not found'
      };
    }

    // In a real implementation, this would call an LLM service based on the provider
    // Log the LLM provider being used
    console.log(`Using LLM provider: ${chapter.llmProvider || 'default'}`);

    // For mock purposes, we'll create a simple parsed structure
    const parsedChapter: ParsedChapter = {
      id: uuidv4(),
      chapterId: chapter.id,
      title: chapter.title,
      segments: [],
      processedAt: new Date().toISOString()
    };

    // Add first line as narration
    parsedChapter.segments.push({
      text: chapter.content.split('\n')[0],
      voice: 'narrator-1'
    });

    // Simple parsing logic for dialogues - find lines with quotes
    const lines = chapter.content.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('"') && line.includes('。"')) {
        const parts = line.split('"');
        if (parts.length >= 3) {
          // Find character
          let character = 'Unknown';
          if (line.includes('说道')) {
            character = line.split('说道')[0].split('"').pop() || 'Unknown';
          }

          // Different LLM providers might have different tone detection capabilities
          // Here we simulate different behaviors based on the provider
          let tone;
          switch(chapter.llmProvider) {
            case 'openai':
              tone = Math.random() > 0.3 ? '平静' : Math.random() > 0.5 ? '激动' : '愤怒';
              break;
            case 'volcengine':
              tone = Math.random() > 0.4 ? '平静' : Math.random() > 0.5 ? '欢快' : '悲伤';
              break;
            case 'aliyun':
              tone = Math.random() > 0.5 ? '平静' : '激动';
              break;
            default:
              tone = Math.random() > 0.5 ? '平静' : '激动';
          }

          parsedChapter.segments.push({
            text: parts[1],
            character: character,
            tone: tone,
            voice: character === '王后' ? 'female-2' : undefined
          });
        }
      }
    }

    // Update the mock data
    const existingIndex = mockParsedChapters.findIndex(p => p.chapterId === chapterId);
    if (existingIndex !== -1) {
      mockParsedChapters[existingIndex] = parsedChapter;
    } else {
      mockParsedChapters.push(parsedChapter);
    }

    // Update chapter processed status
    const chapterIndex = mockChapters.findIndex(c => c.id === chapterId);
    if (chapterIndex !== -1) {
      mockChapters[chapterIndex].processed = true;
    }

    return {
      success: true,
      data: parsedChapter
    };
  },

  // Get TTS results for a chapter
  getTtsResults: async (chapterId: string): Promise<ApiResponse<TtsResult[]>> => {
    const results = mockTtsResults.filter(t => t.chapterId === chapterId);
    return {
      success: true,
      data: results
    };
  },

  // Generate TTS for a single segment
  generateSegmentTts: async (chapterId: string, segmentData: { text: string, voice: string, tone?: string }): Promise<ApiResponse<{ audioUrl: string }>> => {
    try {
      // Call the real TTS API
      const response = await window.api.tts.synthesizeSegment(chapterId, segmentData);

      if (response.success && response.data) {
        return {
          success: true,
          data: { audioUrl: response.data.audioUrl }
        };
      } else {
        return {
          success: false,
          message: response.error || 'Failed to generate segment TTS'
        };
      }
    } catch (error) {
      console.error('Error generating segment TTS:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Generate TTS for a full chapter by combining segment audios
  generateFullChapterTts: async (chapterId: string, parsedChapterId: string, audioUrls: string[]): Promise<ApiResponse<TtsResult[]>> => {
    try {
      // Call the real TTS API to combine audio files
      const response = await window.api.tts.synthesizeFullChapter(chapterId, parsedChapterId, audioUrls);

      if (response.success && response.data) {
        // Update the mock data for backward compatibility
        const ttsResult = response.data[0];
        const existingIndex = mockTtsResults.findIndex(t => t.chapterId === chapterId);
        if (existingIndex !== -1) {
          mockTtsResults[existingIndex] = ttsResult;
        } else {
          mockTtsResults.push(ttsResult);
        }

        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          message: response.error || 'Failed to generate full chapter TTS'
        };
      }
    } catch (error) {
      console.error('Error generating full chapter TTS:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Legacy method for backward compatibility
  generateTts: async (parsedChapterId: string): Promise<ApiResponse<TtsResult[]>> => {
    const parsedChapter = mockParsedChapters.find(p => p.id === parsedChapterId);
    if (!parsedChapter) {
      return {
        success: false,
        message: 'Parsed chapter not found'
      };
    }

    // In a real implementation, this would call a TTS service
    // For mock purposes, we'll create a dummy TTS result
    const ttsResult: TtsResult = {
      id: uuidv4(),
      chapterId: parsedChapter.chapterId,
      audioUrl: `https://example.com/audio/chapter_${parsedChapter.chapterId}_${Date.now()}.mp3`,
      duration: Math.floor(Math.random() * 300) + 60, // Random duration between 60-360 seconds
      createdAt: new Date().toISOString()
    };

    // Update the mock data
    const existingIndex = mockTtsResults.findIndex(t => t.chapterId === parsedChapter.chapterId);
    if (existingIndex !== -1) {
      mockTtsResults[existingIndex] = ttsResult;
    } else {
      mockTtsResults.push(ttsResult);
    }

    return {
      success: true,
      data: [ttsResult]
    };
  },

  // Get a chapter by ID
  getChapter: async (id: string): Promise<ApiResponse<Chapter>> => {
    const chapter = mockChapters.find(c => c.id === id);
    if (chapter) {
      return {
        success: true,
        data: chapter
      };
    }
    return {
      success: false,
      message: 'Chapter not found'
    };
  }
};