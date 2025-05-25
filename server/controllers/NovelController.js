/**
 * Novel Controller
 * 处理与小说相关的业务逻辑
 * 统一小说、章节、角色等相关操作的IPC处理
 */
const { ipcMain } = require("electron");
const NovelService = require("../services/NovelService");
/**
 * 初始化小说控制器
 */
function init() {
  try {
    // 注册小说相关API
    registerNovelHandlers();

    // 注册角色相关API
    registerCharacterHandlers();

    // 注册章节相关API
    registerChapterHandlers();

    // 注册解析相关API
    registerParsingHandlers();

    // 注册TTS相关API
    registerTTSHandlers();

    console.log("Novel controller IPC handlers registered successfully");
  } catch (error) {
    console.error("Error setting up novel controller:", error);
  }
}

/**
 * 注册小说相关的IPC处理器
 */
function registerNovelHandlers() {
  // 小说相关API
  ipcMain.handle("novel:get-all", async () => {
    console.log("Handling novel:get-all");
    return await NovelService.getAllNovels();
  });

  ipcMain.handle("novel:get", async (_, id) => {
    console.log(`Handling novel:get for id: ${id}`);
    return await NovelService.getNovel(id);
  });

  ipcMain.handle("novel:create", async (_, data) => {
    console.log("Handling novel:create with data:", data);
    return await NovelService.createNovel(data);
  });

  ipcMain.handle("novel:update", async (_, id, data) => {
    console.log(`Handling novel:update for id: ${id}`);
    return await NovelService.updateNovel(id, data);
  });

  ipcMain.handle("novel:delete", async (_, id) => {
    console.log(`Handling novel:delete for id: ${id}`);
    return await NovelService.deleteNovel(id);
  });
}

/**
 * 注册角色相关的IPC处理器
 */
function registerCharacterHandlers() {
  // 角色相关API
  ipcMain.handle("character:get-by-novel", async (_, novelId) => {
    console.log(`Handling character:get-by-novel for novelId: ${novelId}`);
    return await NovelService.getCharactersByNovel(novelId);
  });

  ipcMain.handle("character:create", async (_, data) => {
    console.log("Handling character:create");
    return await NovelService.createCharacter(data);
  });

  ipcMain.handle("character:update", async (_, id, data) => {
    console.log(`Handling character:update for id: ${id}`);
    return await NovelService.updateCharacter(id, data);
  });

  ipcMain.handle("character:delete", async (_, id) => {
    console.log(`Handling character:delete for id: ${id}`);
    return await NovelService.deleteCharacter(id);
  });
}

/**
 * 注册章节相关的IPC处理器
 */
function registerChapterHandlers() {
  // 章节相关API
  ipcMain.handle("chapter:get-by-novel", async (_, novelId) => {
    console.log(`Handling chapter:get-by-novel for novelId: ${novelId}`);
    return await NovelService.getChaptersByNovel(novelId);
  });

  ipcMain.handle("chapter:get", async (_, id) => {
    console.log(`Handling chapter:get for id: ${id}`);
    return await NovelService.getChapter(id);
  });

  ipcMain.handle("chapter:create", async (_, data) => {
    console.log("Handling chapter:create");
    return await NovelService.createChapter(data);
  });

  ipcMain.handle("chapter:update", async (_, id, data) => {
    console.log(`Handling chapter:update for id: ${id}`);
    return await NovelService.updateChapter(id, data);
  });

  ipcMain.handle("chapter:delete", async (_, id) => {
    console.log(`Handling chapter:delete for id: ${id}`);
    return await NovelService.deleteChapter(id);
  });
}

/**
 * 注册解析相关的IPC处理器
 */
function registerParsingHandlers() {
  // 解析章节相关API
  ipcMain.handle("parsed-chapter:get-by-chapter", async (_, chapterId) => {
    return await NovelService.getParsedChapterByChapterId(chapterId);
  });

  ipcMain.handle("parsed-chapter:update", async (_, id, data) => {
    return await NovelService.updateParsedChapter(id, data);
  });

  // 注意：LLM解析相关API已移至专门的业务控制器中处理
}

/**
 * 注册TTS相关的IPC处理器
 */
function registerTTSHandlers() {
  // TTS相关API
  ipcMain.handle("tts:get-results", async (_, chapterId) => {
    return await NovelService.getTtsResultsByChapterId(chapterId);
  });

  // 注意：tts:synthesize-segment 和 tts:synthesize-full-chapter
  // 已在 SegmentTTSController.js 中注册
}

module.exports = {
  init,
};
