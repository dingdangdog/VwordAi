import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Novel, Character, Chapter, ParsedChapter, TtsResult } from '@/types/ReadNovels';
import { novelApi } from '@/api';

export const useNovelsStore = defineStore('novels', () => {
  const novels = ref<Novel[]>([]);
  const currentNovel = ref<Novel | null>(null);
  const characters = ref<Character[]>([]);
  const chapters = ref<Chapter[]>([]);
  const currentChapter = ref<Chapter | null>(null);
  const parsedChapter = ref<ParsedChapter | null>(null);
  const ttsResults = ref<TtsResult[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Load all novels
  async function loadNovels() {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await novelApi.getAllNovels();
      if (response.success && response.data) {
        novels.value = response.data;
      } else {
        throw new Error(response.message || 'Failed to load novels');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      isLoading.value = false;
    }
  }

  // Set current novel and load its characters and chapters
  async function setCurrentNovel(novelId: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const novel = novels.value.find(n => n.id === novelId);
      if (!novel) {
        throw new Error('Novel not found');
      }

      currentNovel.value = novel;

      // Load characters
      const charResponse = await novelApi.getCharacters(novelId);
      if (charResponse.success && charResponse.data) {
        characters.value = charResponse.data;
      } else {
        throw new Error(charResponse.message || 'Failed to load characters');
      }

      // Load chapters
      const chapterResponse = await novelApi.getChapters(novelId);
      if (chapterResponse.success && chapterResponse.data) {
        chapters.value = chapterResponse.data;
      } else {
        throw new Error(chapterResponse.message || 'Failed to load chapters');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      isLoading.value = false;
    }
  }

  // Set current chapter and load its parsed data if available
  async function setCurrentChapter(chapterId: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const chapter = chapters.value.find(c => c.id === chapterId);
      if (!chapter) {
        throw new Error('Chapter not found');
      }

      currentChapter.value = chapter;

      // Load parsed chapter data if processed
      if (chapter.processed) {
        const parsedResponse = await novelApi.getParsedChapter(chapterId);
        if (parsedResponse.success && parsedResponse.data) {
          parsedChapter.value = parsedResponse.data;
        } else {
          parsedChapter.value = null;
        }

        // Load TTS results
        const ttsResponse = await novelApi.getTtsResults(chapterId);
        if (ttsResponse.success && ttsResponse.data) {
          ttsResults.value = ttsResponse.data;
        } else {
          ttsResults.value = [];
        }
      } else {
        parsedChapter.value = null;
        ttsResults.value = [];
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      isLoading.value = false;
    }
  }

  // Create a new novel
  async function createNovel(novelData: Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await novelApi.createNovel(novelData);
      if (response.success && response.data) {
        novels.value.push(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create novel');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // Create a new character
  async function createCharacter(characterData: Omit<Character, 'id'>) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await novelApi.createCharacter(characterData);
      if (response.success && response.data) {
        characters.value.push(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create character');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // Create a new chapter
  async function createChapter(chapterData: Omit<Chapter, 'id' | 'processed' | 'createdAt' | 'updatedAt'>) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await novelApi.createChapter({
        ...chapterData,
        processed: false
      });

      if (response.success && response.data) {
        chapters.value.push(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create chapter');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // Parse chapter with LLM
  async function parseChapter(chapterId: string) {
    isLoading.value = true;
    error.value = null;

    try {
      // Get the chapter to access its LLM provider
      const chapter = chapters.value.find(c => c.id === chapterId);
      if (!chapter) {
        throw new Error('Chapter not found');
      }

      // Call the API with the chapter's LLM provider
      const response = await novelApi.parseChapter(chapterId);
      if (response.success && response.data) {
        parsedChapter.value = response.data;

        // Update chapter processed status
        chapter.processed = true;

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to parse chapter');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // Generate TTS for parsed chapter
  async function generateTts(parsedChapterId: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await novelApi.generateTts(parsedChapterId);
      if (response.success && response.data) {
        ttsResults.value = response.data;
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to generate TTS');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // Clear current selections
  function clearCurrentSelections() {
    currentNovel.value = null;
    currentChapter.value = null;
    parsedChapter.value = null;
    characters.value = [];
    chapters.value = [];
    ttsResults.value = [];
  }

  // Update a novel
  async function updateNovel(id: string, novelData: Partial<Novel>) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await novelApi.updateNovel(id, novelData);
      if (response.success && response.data) {
        // Update the novel in the novels array
        const index = novels.value.findIndex(n => n.id === id);
        if (index !== -1) {
          novels.value[index] = response.data;
        }

        // Update currentNovel if it's the one being edited
        if (currentNovel.value && currentNovel.value.id === id) {
          currentNovel.value = response.data;
        }

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update novel');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // Update a chapter
  async function updateChapter(id: string, chapterData: Partial<Chapter>) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await novelApi.updateChapter(id, chapterData);
      if (response.success && response.data) {
        // Update the chapter in the chapters array
        const index = chapters.value.findIndex(c => c.id === id);
        if (index !== -1) {
          chapters.value[index] = {
            ...chapters.value[index],
            ...response.data
          };
        }

        // Update currentChapter if it's the one being edited
        if (currentChapter.value && currentChapter.value.id === id) {
          currentChapter.value = {
            ...currentChapter.value,
            ...response.data
          };
        }

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update chapter');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    novels,
    currentNovel,
    characters,
    chapters,
    currentChapter,
    parsedChapter,
    ttsResults,
    isLoading,
    error,
    loadNovels,
    setCurrentNovel,
    setCurrentChapter,
    createNovel,
    updateNovel,
    updateChapter,
    createCharacter,
    createChapter,
    parseChapter,
    generateTts,
    clearCurrentSelections
  };
});