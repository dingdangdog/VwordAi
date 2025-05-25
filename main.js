const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const handler = require("./handler.js");
const chardet = require("chardet");
const iconv = require("iconv-lite");
const fs = require("fs");
const { error, success } = require("./server/utils/result");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const os = require("os");

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
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "ui/dist/index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  setupMenu();
  setupIPCHandlers();
  setupAutoUpdater();

  handler.setBaseDir(
    app.isPackaged ? path.dirname(app.getPath("exe")) : process.cwd()
  );

  console.log("Current working directory:", process.cwd());
  console.log("__dirname:", __dirname);
  console.log("app.isPackaged:", app.isPackaged);
  console.log("process.resourcesPath:", process.resourcesPath);
}

function setupMenu() {
  // 设置应用菜单
}

function setupIPCHandlers() {
  try {
    const serverUtil = require("./server/utils/result.js");
    console.log("server/utils/result.js loaded successfully");
  } catch (err) {
    console.error("Failed to load server/utils/result.js:", err);
  }

  ipcMain.handle("is-maximized", () => {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    return win ? win.isMaximized() : false;
  });

  ipcMain.handle("select-folder", async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ["openDirectory"],
        title: "选择文件夹",
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
          { name: "所有文件", extensions: ["*"] },
        ],
      });

      if (result.canceled || !result.filePaths.length) {
        return success(null, "用户取消选择");
      }

      return success({ path: result.filePaths[0] });
    } catch (err) {
      return error(err.message);
    }
  });

  ipcMain.handle("get-app-info", async () => {
    try {
      return success({
        version: app.getVersion(),
        name: app.getName(),
        isPackaged: app.isPackaged,
        platform: process.platform,
        arch: process.arch,
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
        downloads: app.getPath("downloads"),
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
        cpus: os.cpus().length,
      });
    } catch (err) {
      return error(err.message);
    }
  });

  ipcMain.handle("read-file", async (_, filePath, encoding) => {
    try {
      const detectedEncoding = await chardet.detectFile(filePath);
      const fileEncoding = encoding || detectedEncoding || "utf8";
      const buffer = fs.readFileSync(filePath);
      const content = iconv.decode(buffer, fileEncoding);
      return success({ content, encoding: fileEncoding });
    } catch (err) {
      return error(err.message);
    }
  });

  ipcMain.handle("save-file", async (event, filePath, content, encoding = "utf8") => {
    try {
      const buffer = iconv.encode(content, encoding);
      fs.writeFileSync(filePath, buffer);
      return success(null, "文件保存成功");
    } catch (err) {
      return error(err.message);
    }
  });

  // Azure TTS测试处理器
  ipcMain.handle("test-azure-tts", async (_, data) => {
    try {
      console.log("[main.js] 测试Azure TTS连接:", data);

      // 调用Azure TTS模块进行测试
      const azureTTS = require("./server/tts/azure");
      const tempFilePath = path.join(os.tmpdir(), `azure_test_${Date.now()}.wav`);

      const result = await azureTTS.synthesize(
        "这是一个测试文本",
        tempFilePath,
        {
          voice: data.voice || "zh-CN-XiaoxiaoNeural",
          speed: 1.0,
          pitch: 0,
          volume: 50
        },
        {
          key: data.key,
          region: data.region,
          endpoint: data.endpoint
        }
      );

      // 清理临时文件
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      if (result.success) {
        return success({
          message: "Azure TTS连接测试成功",
          status: "success"
        });
      } else {
        return error(result.message || "Azure TTS连接测试失败");
      }
    } catch (err) {
      console.error("[main.js] Azure TTS测试失败:", err);
      return error(err.message || "Azure TTS连接测试失败");
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  console.log("Electron app is ready");

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

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

ipcMain.handle("get-media-url", async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return error(`文件不存在: ${filePath}`);
    }

    const mediaUrl = `file://${filePath
      .replace(/\\/g, "/")
      .replace(/#/g, "%23")
      .replace(/\?/g, "%3F")}`;

    return success({ url: mediaUrl });
  } catch (err) {
    return error(err.message);
  }
});

ipcMain.handle("open-folder", (event, dir) => {
  const dirs = dir.split("/");
  const folder = path.join(...dirs);
  shell.openPath(folder);
  return success(null, "已打开文件夹");
});

function setupAutoUpdater() {
  autoUpdater.on("error", (err) => {
    log.error("Update error:", err);
    if (mainWindow) {
      mainWindow.webContents.send("update-error", err.message);
    }
  });

  autoUpdater.on("update-available", (info) => {
    log.info("Update available:", info);
    if (mainWindow) {
      mainWindow.webContents.send("update-available", info);
    }
  });

  autoUpdater.on("update-not-available", (info) => {
    log.info("Update not available:", info);
    if (mainWindow) {
      mainWindow.webContents.send("update-not-available", info);
    }
  });

  autoUpdater.on("download-progress", (progressObj) => {
    log.info("Download progress:", progressObj);
    if (mainWindow) {
      mainWindow.webContents.send("download-progress", progressObj);
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded:", info);
    if (mainWindow) {
      mainWindow.webContents.send("update-downloaded", info);
    }
  });

  app.whenReady().then(() => {
    if (!app.isPackaged && !process.env.FORCE_UPDATE_CHECK) {
      log.info("Skip checkForUpdates because application is not packed");
      return;
    }

    setTimeout(() => {
      try {
        log.info("Checking for updates...");
        autoUpdater.checkForUpdates();
      } catch (err) {
        log.error("Failed to check for updates:", err);
      }
    }, 3000);
  });
}

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
