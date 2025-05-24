const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const handler = require("./handler.js"); // 函数封装在handler.js中
const chardet = require("chardet");
const iconv = require("iconv-lite");
const fs = require("fs");
const { error, success } = require("./server/utils/result");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const os = require("os");
const storage = require("./server/utils/storage");

// 配置日志
log.transports.file.level = "info";
autoUpdater.logger = log;

// 设置自动更新配置
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// 主窗口
let mainWindow;

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    frame: false, // 无边框窗口
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // 允许加载本地资源
    },
  });

  // 加载前端页面
  if (app.isPackaged) {
    // 生产环境加载打包后的页面
    mainWindow.loadFile(path.join(__dirname, "ui/dist/index.html"));
  } else {
    // 开发环境加载开发服务器
    mainWindow.loadURL("http://localhost:5173");
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  }

  // 窗口关闭时触发
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // 设置应用菜单
  setupMenu();

  // 设置IPC处理器
  setupIPCHandlers();

  // 设置小说相关的IPC处理器
  setupNovelHandlers();

  // 设置BiliLive相关的IPC处理器
  setupBiliLiveHandlers();

  // 设置自动更新事件
  setupAutoUpdater();

  // 设置基础目录
  handler.setBaseDir(app.isPackaged ? path.dirname(app.getPath("exe")) : process.cwd());

  // 打印当前工作目录信息
  console.log("Current working directory:", process.cwd());
  console.log("__dirname:", __dirname);
  console.log("app.isPackaged:", app.isPackaged);
  console.log("process.resourcesPath:", process.resourcesPath);
}

// 设置应用菜单
function setupMenu() {
  // 在这里可以设置应用菜单
}

// 设置IPC处理器
function setupIPCHandlers() {
  // 尝试加载server/util.js文件
  try {
    const serverUtil = require("./server/utils/result.js");
    console.log("server/utils/result.js loaded successfully");
  } catch (err) {
    console.error("Failed to load server/utils/result.js:", err);
  }
  // 窗口控制相关处理器
  ipcMain.handle("is-maximized", () => {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    return win ? win.isMaximized() : false;
  });

  // 文件系统相关处理器
  ipcMain.handle("select-folder", async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ["openDirectory"],
        title: "选择文件夹"
      });

      if (result.canceled || !result.filePaths.length) {
        return success(null, "用户取消选择");
      }

      return success({ path: result.filePaths[0] });
    } catch (err) {
      return error(err.message);
    }
  });

  ipcMain.handle("open-file", async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ["openFile"],
        title: "选择文件",
        filters: [
          { name: "文本文件", extensions: ["txt", "md", "json"] },
          { name: "所有文件", extensions: ["*"] }
        ]
      });

      if (result.canceled || !result.filePaths.length) {
        return success(null, "用户取消选择");
      }

      return success({ path: result.filePaths[0] });
    } catch (err) {
      return error(err.message);
    }
  });

  // 调试相关API
  ipcMain.handle("get-app-info", async () => {
    try {
      return success({
        version: app.getVersion(),
        name: app.getName(),
        isPackaged: app.isPackaged,
        platform: process.platform,
        arch: process.arch
      });
    } catch (err) {
      return error(err.message);
    }
  });

  ipcMain.handle("get-storage-paths", async () => {
    try {
      return success({
        userData: app.getPath("userData"),
        appData: app.getPath("appData"),
        temp: app.getPath("temp"),
        documents: app.getPath("documents"),
        downloads: app.getPath("downloads")
      });
    } catch (err) {
      return error(err.message);
    }
  });

  ipcMain.handle("get-system-info", async () => {
    try {
      return success({
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        type: os.type(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus().length
      });
    } catch (err) {
      return error(err.message);
    }
  });

  // 处理文件读取请求
  ipcMain.handle("read-file", async (event, filePath, encoding) => {
    try {
      // 检测文件编码
      const detectedEncoding = await chardet.detectFile(filePath);
      const fileEncoding = encoding || detectedEncoding || "utf8";

      // 读取文件内容
      const buffer = fs.readFileSync(filePath);
      const content = iconv.decode(buffer, fileEncoding);

      return success({ content, encoding: fileEncoding });
    } catch (err) {
      return error(err.message);
    }
  });

  // 处理文件保存请求
  ipcMain.handle("save-file", async (event, filePath, content, encoding = "utf8") => {
    try {
      const buffer = iconv.encode(content, encoding);
      fs.writeFileSync(filePath, buffer);
      return success(null, "文件保存成功");
    } catch (err) {
      return error(err.message);
    }
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();
  console.log("Electron app is ready");

  app.on("activate", () => {
    // 在macOS上，当点击dock图标并且没有其他窗口打开时，通常在应用程序中重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口关闭时退出应用
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("window-control", (event, action) => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;

  switch (action) {
    case "minimize":
      win.minimize();
      break;
    case "maximize":
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
      break;
    case "close":
      win.close();
      break;
  }
});

// 实现data-handler调用
ipcMain.handle("data-handler", async (event, functionName, args) => {
  console.log(`Call handler: ${functionName}, args:`, args);

  // 检查处理器是否存在
  if (typeof handler[functionName] !== "function") {
    return error(`处理器函数 ${functionName} 不存在`);
  }

  try {
    // 调用处理器函数
    if (Array.isArray(args)) {
      return await handler[functionName](...args);
    } else if (args !== undefined) {
      return await handler[functionName](args);
    } else {
      return await handler[functionName]();
    }
  } catch (err) {
    console.error(`处理器函数 ${functionName} 执行失败:`, err);
    return error(err.message);
  }
});

// 处理媒体文件URL请求
ipcMain.handle("get-media-url", async (event, filePath) => {
  try {
    // 验证文件是否存在
    if (!fs.existsSync(filePath)) {
      return error(`文件不存在: ${filePath}`);
    }

    // 创建媒体URL
    const mediaUrl = `file://${filePath
      .replace(/\\/g, "/")
      .replace(/#/g, "%23")
      .replace(/\?/g, "%3F")}`;

    return success({ url: mediaUrl });
  } catch (err) {
    return error(err.message);
  }
});

// 监听渲染进程的事件，弹出选择文件夹对话框
ipcMain.handle("open-folder", (event, dir) => {
  // 打开文件夹
  const dirs = dir.split("/");
  const folder = path.join(...dirs);
  shell.openPath(folder);
  return success(null, "已打开文件夹");
});

// 设置自动更新事件
function setupAutoUpdater() {
  // 检查更新出错
  autoUpdater.on("error", (err) => {
    log.error("Update error:", err);
    if (mainWindow) {
      mainWindow.webContents.send("update-error", err.message);
    }
  });

  // 检查到新版本
  autoUpdater.on("update-available", (info) => {
    log.info("Update available:", info);
    if (mainWindow) {
      mainWindow.webContents.send("update-available", info);
    }
  });

  // 没有新版本
  autoUpdater.on("update-not-available", (info) => {
    log.info("Update not available:", info);
    if (mainWindow) {
      mainWindow.webContents.send("update-not-available", info);
    }
  });

  // 下载进度
  autoUpdater.on("download-progress", (progressObj) => {
    log.info("Download progress:", progressObj);
    if (mainWindow) {
      mainWindow.webContents.send("download-progress", progressObj);
    }
  });

  // 下载完成
  autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded:", info);
    if (mainWindow) {
      mainWindow.webContents.send("update-downloaded", info);
    }
  });

  // 应用启动时检查更新
  app.whenReady().then(() => {
    // 如果是开发环境，只有在强制配置时才检查更新
    if (!app.isPackaged && !process.env.FORCE_UPDATE_CHECK) {
      log.info("Skip checkForUpdates because application is not packed and dev update config is not forced");
      return;
    }

    setTimeout(() => {
      try {
        log.info("Checking for updates...");
        autoUpdater.checkForUpdates();
      } catch (err) {
        log.error("Failed to check for updates:", err);
      }
    }, 3000); // 延迟3秒检查更新
  });
}

// 手动检查更新
ipcMain.handle("check-updates", async () => {
  try {
    log.info("Manually check update");
    const result = await autoUpdater.checkForUpdates();
    return { checking: true };
  } catch (err) {
    log.error("Check update failed:", err);
    return { checking: false, error: err.message };
  }
});

// 下载更新
ipcMain.handle("download-update", async () => {
  try {
    log.info("Start downloading update");
    autoUpdater.downloadUpdate();
    return { downloading: true };
  } catch (err) {
    log.error("Download update failed:", err);
    return { downloading: false, error: err.message };
  }
});

// 安装更新
ipcMain.handle("install-update", async () => {
  try {
    log.info("Install update now");
    autoUpdater.quitAndInstall();
    return { installing: true };
  } catch (err) {
    log.error("Install update failed:", err);
    return { installing: false, error: err.message };
  }
});

// 设置BiliLive相关的IPC处理器
function setupBiliLiveHandlers() {
  // BiliLive连接
  ipcMain.handle("bililive:connect", async (event, roomId) => {
    return await handler.connectBiliLive(roomId);
  });

  // BiliLive断开连接
  ipcMain.handle("bililive:disconnect", async () => {
    return await handler.disconnectBiliLive();
  });

  // 获取B站配置
  ipcMain.handle("bililive:get-config", async () => {
    return await handler.getBiliLiveConfig();
  });

  // 保存B站配置
  ipcMain.handle("bililive:save-bili-config", async (event, data) => {
    return await handler.saveBiliLiveConfig(data);
  });

  // 保存TTS模式
  ipcMain.handle("bililive:save-tts-mode", async (event, mode) => {
    return await handler.saveBiliLiveTTSMode(mode);
  });

  // 保存Azure配置
  ipcMain.handle("bililive:save-azure-config", async (event, data) => {
    return await handler.saveBiliLiveAzureConfig(data);
  });

  // 保存阿里云配置
  ipcMain.handle("bililive:save-alibaba-config", async (event, data) => {
    return await handler.saveBiliLiveAlibabaConfig(data);
  });

  // 保存SoVITS配置
  ipcMain.handle("bililive:save-sovits-config", async (event, data) => {
    return await handler.saveBiliLiveSovitsConfig(data);
  });

  // 测试TTS
  ipcMain.handle("bililive:test-tts", async (event, text) => {
    return await handler.testBiliLiveTTS(text);
  });

  // 获取可用的TTS声音列表
  ipcMain.handle("bililive:get-available-voices", async () => {
    return await handler.getBiliLiveAvailableVoices();
  });

  // 保存本地TTS配置
  ipcMain.handle("bililive:save-local-config", async (event, voice) => {
    return await handler.saveBiliLiveLocalConfig(voice);
  });
}

// 设置小说相关的IPC处理器
function setupNovelHandlers() {
  try {
    // 初始化小说服务
    const { NovelService } = require('./server/services/NovelService');

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
        console.error(`Error in character:get-by-novel for novelId ${novelId}:`, error);
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
        console.error(`Error in chapter:get-by-novel for novelId ${novelId}:`, error);
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
      console.log(`Handling parsed-chapter:get-by-chapter for chapterId: ${chapterId}`);
      try {
        return await novelService.getParsedChapterByChapterId(chapterId);
      } catch (error) {
        console.error(`Error in parsed-chapter:get-by-chapter for chapterId ${chapterId}:`, error);
        return { success: false, error: error.message || "获取解析结果失败" };
      }
    });

    ipcMain.handle("parsed-chapter:update", async (_, id, data) => {
      console.log(`Handling parsed-chapter:update for id: ${id}`);
      try {
        return await novelService.updateParsedChapter(id, data);
      } catch (error) {
        console.error(`Error in parsed-chapter:update for id ${id}:`, error);
        return { success: false, error: error.message || "更新解析结果失败" };
      }
    });

    // LLM解析相关API
    ipcMain.handle("llm:parse-chapter", async (_, chapterId) => {
      console.log(`Handling llm:parse-chapter for chapterId: ${chapterId}`);
      try {
        const { parseChapter } = require('./server/services/LLMService');
        return await parseChapter(chapterId);
      } catch (error) {
        console.error("Error in llm:parse-chapter:", error);
        return { success: false, error: error.message || "解析章节失败" };
      }
    });

    // TTS相关API
    ipcMain.handle("tts:get-results", async (_, chapterId) => {
      console.log(`Handling tts:get-results for chapterId: ${chapterId}`);
      try {
        return await novelService.getTtsResultsByChapterId(chapterId);
      } catch (error) {
        console.error(`Error in tts:get-results for chapterId ${chapterId}:`, error);
        return { success: false, error: error.message || "获取TTS结果失败" };
      }
    });

    // tts:synthesize-segment handler is already registered in SegmentTTSController.js

    // tts:synthesize-full-chapter handler is already registered in SegmentTTSController.js

    console.log("All novel handlers registered successfully");
  } catch (error) {
    console.error("Error setting up novel handlers:", error);
  }
}
