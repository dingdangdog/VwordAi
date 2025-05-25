/**
 * Handler模块
 * 处理主进程和渲染进程之间的通信
 * 整合了原server/index.js的功能
 */
const path = require("path");
const fs = require("fs-extra");
const storage = require("./server/utils/storage");

const { ipcMain } = require("electron");

// 导入控制器和服务
const BiliLiveController = require("./server/controllers/BiliLiveController");



/**
 * 设置基础目录 (整合了server/index.js的initStorageDirs功能)
 * @param {string} dir 目录路径
 */
function setBaseDir(dir) {
  storage.setBaseDir(dir);
  console.log(`Base Directory set to: ${dir}`);

  // 获取应用配置路径
  const defaultStoragePath = storage.getConfigPath();
  console.log("Application installation path:", defaultStoragePath);

  // 确保必要的目录存在 - 用户数据目录
  const storageDir = path.join(dir, "storage");
  const outputDir = path.join(dir, "output");
  const localConfigDir = path.join(dir, "config");

  // 确保必要的目录存在 - 应用安装目录
  const appConfigDir = path.join(defaultStoragePath, "config");

  // 创建所有必要的目录
  fs.ensureDirSync(storageDir);
  fs.ensureDirSync(outputDir);
  fs.ensureDirSync(localConfigDir);
  fs.ensureDirSync(appConfigDir);

  console.log("Storage directories initialized:");
  console.log("- Storage dir:", storageDir);
  console.log("- Output dir:", outputDir);
  console.log("- Local config dir:", localConfigDir);
  console.log("- App config dir:", appConfigDir);
}

/**
 * 初始化所有控制器 (整合了server/index.js的initControllers功能)
 */
function init() {
  console.log("Starting handler initialization...");
  console.log("Environment:", process.env.NODE_ENV || "development");

  // 初始化项目控制器
  ProjectController.initProjectListeners();
  console.log("Project controller initialized");

  // 初始化章节控制器
  ChapterController.initChapterListeners();
  console.log("Chapter controller initialized");

  // 初始化设置控制器
  SettingsController.init();
  console.log("Settings controller initialized");

  // 初始化语音合成控制器
  TTSController.init();
  console.log("TTS controller initialized");

  // 初始化段落语音合成控制器
  SegmentTTSController.init();
  console.log("Segment TTS controller initialized");

  // 初始化LLM控制器
  LLMController.initLLMListeners();
  console.log("LLM controller initialized");

  // 设置业务数据接口的IPC处理器
  setupProjectHandlers();
  setupNovelHandlers();
  setupBiliLiveHandlers();

  console.log("All controllers initialized successfully");
}







// 设置项目相关的IPC处理器
function setupProjectHandlers() {
  try {
    // 导入Project和Chapter模型
    const Project = require("./server/models/Project");
    const Chapter = require("./server/models/Chapter");

    // 项目相关API
    ipcMain.handle("project:get-all", async () => {
      console.log("Handling project:get-all");
      try {
        const projects = Project.getAllProjects();
        return { success: true, data: projects };
      } catch (error) {
        console.error("Error in project:get-all:", error);
        return { success: false, error: error.message || "获取项目列表失败" };
      }
    });

    ipcMain.handle("project:get", async (_, id) => {
      console.log(`Handling project:get for id: ${id}`);
      try {
        const project = Project.getProjectById(id);
        if (!project) {
          return { success: false, error: "项目不存在" };
        }
        return { success: true, data: project };
      } catch (error) {
        console.error(`Error in project:get for id ${id}:`, error);
        return { success: false, error: error.message || "获取项目详情失败" };
      }
    });

    ipcMain.handle("project:create", async (_, data) => {
      console.log("Handling project:create with data:", data);
      try {
        const newProject = Project.createProject(data);
        return { success: true, data: newProject };
      } catch (error) {
        console.error("Error in project:create:", error);
        return { success: false, error: error.message || "创建项目失败" };
      }
    });

    ipcMain.handle("project:update", async (_, id, data) => {
      console.log(`Handling project:update for id: ${id}`);
      try {
        const updatedProject = Project.updateProject(id, data);
        return { success: true, data: updatedProject };
      } catch (error) {
        console.error(`Error in project:update for id ${id}:`, error);
        return { success: false, error: error.message || "更新项目失败" };
      }
    });

    ipcMain.handle("project:delete", async (_, id) => {
      console.log(`Handling project:delete for id: ${id}`);
      try {
        Project.deleteProject(id);
        // 删除项目时，同时删除该项目下的所有章节
        Chapter.deleteChaptersByProjectId(id);
        return { success: true };
      } catch (error) {
        console.error(`Error in project:delete for id ${id}:`, error);
        return { success: false, error: error.message || "删除项目失败" };
      }
    });

    // 章节相关API
    ipcMain.handle("project-chapter:get-by-project", async (_, projectId) => {
      console.log(`Handling project-chapter:get-by-project for projectId: ${projectId}`);
      try {
        const chapters = Chapter.getChaptersByProjectId(projectId);
        return { success: true, data: chapters };
      } catch (error) {
        console.error(
          `Error in project-chapter:get-by-project for projectId ${projectId}:`,
          error
        );
        return { success: false, error: error.message || "获取章节列表失败" };
      }
    });

    ipcMain.handle("project-chapter:get", async (_, id) => {
      console.log(`Handling project-chapter:get for id: ${id}`);
      try {
        const chapter = Chapter.getChapterById(id);
        if (!chapter) {
          return { success: false, error: "章节不存在" };
        }
        return { success: true, data: chapter };
      } catch (error) {
        console.error(`Error in project-chapter:get for id ${id}:`, error);
        return { success: false, error: error.message || "获取章节详情失败" };
      }
    });

    ipcMain.handle("project-chapter:create", async (_, data) => {
      console.log("Handling project-chapter:create");
      try {
        const newChapter = Chapter.createChapter(data);

        // 更新项目中的章节数量
        const projectChapters = Chapter.getChaptersByProjectId(data.projectId);
        Project.updateProjectChapterCount(data.projectId, projectChapters.length);

        return { success: true, data: newChapter };
      } catch (error) {
        console.error("Error in project-chapter:create:", error);
        return { success: false, error: error.message || "创建章节失败" };
      }
    });

    ipcMain.handle("project-chapter:update", async (_, id, data) => {
      console.log(`Handling project-chapter:update for id: ${id}`);
      try {
        const updatedChapter = Chapter.updateChapter(id, data);
        return { success: true, data: updatedChapter };
      } catch (error) {
        console.error(`Error in project-chapter:update for id ${id}:`, error);
        return { success: false, error: error.message || "更新章节失败" };
      }
    });

    ipcMain.handle("project-chapter:delete", async (_, id) => {
      console.log(`Handling project-chapter:delete for id: ${id}`);
      try {
        const chapter = Chapter.getChapterById(id);
        if (chapter) {
          Chapter.deleteChapter(id);

          // 更新项目中的章节数量
          const projectChapters = Chapter.getChaptersByProjectId(chapter.projectId);
          Project.updateProjectChapterCount(chapter.projectId, projectChapters.length);
        }
        return { success: true };
      } catch (error) {
        console.error(`Error in project-chapter:delete for id ${id}:`, error);
        return { success: false, error: error.message || "删除章节失败" };
      }
    });

    console.log("All project handlers registered successfully");
  } catch (error) {
    console.error("Error setting up project handlers:", error);
  }
}

// 设置BiliLive相关的IPC处理器
function setupBiliLiveHandlers() {
  // BiliLive连接
  ipcMain.handle("bililive:connect", async (_, roomId) => {
    return await BiliLiveController.connect(roomId);
  });

  // BiliLive断开连接
  ipcMain.handle("bililive:disconnect", async () => {
    return await BiliLiveController.disconnect();
  });

  // 获取B站配置
  ipcMain.handle("bililive:get-config", async () => {
    return await BiliLiveController.getAllConfig();
  });

  // 保存B站配置
  ipcMain.handle("bililive:save-bili-config", async (_, data) => {
    return await BiliLiveController.saveBiliConfig(data);
  });

  // 保存TTS模式
  ipcMain.handle("bililive:save-tts-mode", async (_, mode) => {
    return await BiliLiveController.saveTTSMode(mode);
  });

  // 保存Azure配置
  ipcMain.handle("bililive:save-azure-config", async (_, data) => {
    return await BiliLiveController.saveAzureConfig(data);
  });

  // 保存阿里云配置
  ipcMain.handle("bililive:save-alibaba-config", async (_, data) => {
    return await BiliLiveController.saveAlibabaConfig(data);
  });

  // 保存SoVITS配置
  ipcMain.handle("bililive:save-sovits-config", async (_, data) => {
    return await BiliLiveController.saveSovitsConfig(data);
  });

  // 测试TTS
  ipcMain.handle("bililive:test-tts", async (_, text) => {
    return await BiliLiveController.testTTS(text);
  });

  // 获取可用的TTS声音列表
  ipcMain.handle("bililive:get-available-voices", async () => {
    return await BiliLiveController.getAvailableVoices();
  });

  // 保存本地TTS配置
  ipcMain.handle("bililive:save-local-config", async (_, voice) => {
    return await BiliLiveController.saveLocalConfig(voice);
  });
}

// 设置小说相关的IPC处理器
function setupNovelHandlers() {
  try {
    // 初始化小说服务
    const { NovelService } = require("./server/services/NovelService");

    // 确保NovelService类存在
    if (!NovelService) {
      console.error("NovelService class not found in module");
      return;
    }

    // 创建NovelService实例
    let novelService;
    try {
      novelService = new NovelService();
      console.log("NovelService initialized successfully");
    } catch (initError) {
      console.error("Failed to initialize NovelService:", initError);
      return;
    }

    // 小说相关API
    ipcMain.handle("novel:get-all", async () => {
      console.log("Handling novel:get-all");
      try {
        return await novelService.getAllNovels();
      } catch (error) {
        console.error("Error in novel:get-all:", error);
        return { success: false, error: error.message || "获取小说列表失败" };
      }
    });

    ipcMain.handle("novel:get", async (_, id) => {
      console.log(`Handling novel:get for id: ${id}`);
      try {
        return await novelService.getNovel(id);
      } catch (error) {
        console.error(`Error in novel:get for id ${id}:`, error);
        return { success: false, error: error.message || "获取小说详情失败" };
      }
    });

    ipcMain.handle("novel:create", async (_, data) => {
      console.log("Handling novel:create with data:", data);
      try {
        return await novelService.createNovel(data);
      } catch (error) {
        console.error("Error in novel:create:", error);
        return { success: false, error: error.message || "创建小说失败" };
      }
    });

    ipcMain.handle("novel:update", async (_, id, data) => {
      console.log(`Handling novel:update for id: ${id}`);
      try {
        return await novelService.updateNovel(id, data);
      } catch (error) {
        console.error(`Error in novel:update for id ${id}:`, error);
        return { success: false, error: error.message || "更新小说失败" };
      }
    });

    ipcMain.handle("novel:delete", async (_, id) => {
      console.log(`Handling novel:delete for id: ${id}`);
      try {
        return await novelService.deleteNovel(id);
      } catch (error) {
        console.error(`Error in novel:delete for id ${id}:`, error);
        return { success: false, error: error.message || "删除小说失败" };
      }
    });

    // 角色相关API
    ipcMain.handle("character:get-by-novel", async (_, novelId) => {
      console.log(`Handling character:get-by-novel for novelId: ${novelId}`);
      try {
        return await novelService.getCharactersByNovel(novelId);
      } catch (error) {
        console.error(
          `Error in character:get-by-novel for novelId ${novelId}:`,
          error
        );
        return { success: false, error: error.message || "获取角色列表失败" };
      }
    });

    ipcMain.handle("character:create", async (_, data) => {
      console.log("Handling character:create");
      try {
        return await novelService.createCharacter(data);
      } catch (error) {
        console.error("Error in character:create:", error);
        return { success: false, error: error.message || "创建角色失败" };
      }
    });

    ipcMain.handle("character:update", async (_, id, data) => {
      console.log(`Handling character:update for id: ${id}`);
      try {
        return await novelService.updateCharacter(id, data);
      } catch (error) {
        console.error(`Error in character:update for id ${id}:`, error);
        return { success: false, error: error.message || "更新角色失败" };
      }
    });

    ipcMain.handle("character:delete", async (_, id) => {
      console.log(`Handling character:delete for id: ${id}`);
      try {
        return await novelService.deleteCharacter(id);
      } catch (error) {
        console.error(`Error in character:delete for id ${id}:`, error);
        return { success: false, error: error.message || "删除角色失败" };
      }
    });

    // 章节相关API
    ipcMain.handle("chapter:get-by-novel", async (_, novelId) => {
      console.log(`Handling chapter:get-by-novel for novelId: ${novelId}`);
      try {
        return await novelService.getChaptersByNovel(novelId);
      } catch (error) {
        console.error(
          `Error in chapter:get-by-novel for novelId ${novelId}:`,
          error
        );
        return { success: false, error: error.message || "获取章节列表失败" };
      }
    });

    ipcMain.handle("chapter:get", async (_, id) => {
      console.log(`Handling chapter:get for id: ${id}`);
      try {
        return await novelService.getChapter(id);
      } catch (error) {
        console.error(`Error in chapter:get for id ${id}:`, error);
        return { success: false, error: error.message || "获取章节详情失败" };
      }
    });

    ipcMain.handle("chapter:create", async (_, data) => {
      console.log("Handling chapter:create");
      try {
        return await novelService.createChapter(data);
      } catch (error) {
        console.error("Error in chapter:create:", error);
        return { success: false, error: error.message || "创建章节失败" };
      }
    });

    ipcMain.handle("chapter:update", async (_, id, data) => {
      console.log(`Handling chapter:update for id: ${id}`);
      try {
        return await novelService.updateChapter(id, data);
      } catch (error) {
        console.error(`Error in chapter:update for id ${id}:`, error);
        return { success: false, error: error.message || "更新章节失败" };
      }
    });

    ipcMain.handle("chapter:delete", async (_, id) => {
      console.log(`Handling chapter:delete for id: ${id}`);
      try {
        return await novelService.deleteChapter(id);
      } catch (error) {
        console.error(`Error in chapter:delete for id ${id}:`, error);
        return { success: false, error: error.message || "删除章节失败" };
      }
    });

    // 解析章节相关API
    ipcMain.handle("parsed-chapter:get-by-chapter", async (_, chapterId) => {
      return await novelService.getParsedChapterByChapterId(chapterId);
    });

    ipcMain.handle("parsed-chapter:update", async (_, id, data) => {
      return await novelService.updateParsedChapter(id, data);
    });

    // LLM解析相关API
    ipcMain.handle("llm:parse-chapter", async (_, chapterId) => {
      const { parseChapter } = require("./server/services/LLMService");
      return await parseChapter(chapterId);
    });

    // TTS相关API
    ipcMain.handle("tts:get-results", async (_, chapterId) => {
      return await novelService.getTtsResultsByChapterId(chapterId);
    });

    // tts:synthesize-segment handler is already registered in SegmentTTSController.js
    // tts:synthesize-full-chapter handler is already registered in SegmentTTSController.js

    console.log("All novel handlers registered successfully");
  } catch (error) {
    console.error("Error setting up novel handlers:", error);
  }
}

// 初始化
init();

module.exports = {
  setBaseDir,
};
