const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const handler = require("./handler.js"); // 函数封装在handler.js中
const chardet = require("chardet");
const iconv = require("iconv-lite");
const fs = require("fs");
const { error, success } = require("./server/util.js");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

// 配置日志
log.transports.file.level = "debug";
autoUpdater.logger = log;
autoUpdater.autoDownload = false;

require("dotenv").config(); // Load environment variables from .env file

if (process.env.NODE_ENV === "development") {
  // const devPath = path.join(__dirname, "config");
  console.log(__dirname);
  handler.setBaseDir(__dirname);
} else {
  const defaultPath = app.getPath("userData");
  handler.setBaseDir(defaultPath);
}

let win;

// 设置应用程序的默认语言为中文
// app.locale = 'zh-CN';
// app.commandLine.appendSwitch('--lang', 'zh-CN')

function createWindow() {
  // 创建浏览器窗口
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1280, // 设置最小宽度
    minHeight: 800, // 设置最小高度
    // resizable: false, // 设置为 false 禁止缩小
    //绝对路径
    // icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      // devTools: true,
      nodeIntegration: true, // 启用 Node.js 集成以便访问本地文件
      contextIsolation: true, // 启用上下文隔离
      preload: path.join(__dirname, "preload.js"), // 预加载脚本
      webSecurity: false, // 允许加载不安全的内容
      allowRunningInsecureContent: true, // 允许运行不安全的内容
    },
    frame: false, // 无边框窗口
    transparent: true, // 透明窗口
  });
  // 初始最大化窗口
  // win.maximize()
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173/");
  } else {
    win.loadFile(path.join(__dirname, "ui/index.html"));
  }
  win.webContents.on("did-finish-load", () => {
    // 打开开发者工具
    win.webContents.openDevTools({ mode: "detach" });
    if (process.env.NODE_ENV === "development") {
      console.log("process.env.NODE_ENV", process.env.NODE_ENV);
      // 打开开发者工具
      win.webContents.openDevTools({ mode: "detach" });
    }
  });
  // 加载应用程序

  // 关闭窗口时
  win.on("close", () => {});
}

// 应用更新相关事件处理
function setupAutoUpdater() {
  // 发送更新消息到渲染进程
  function sendStatusToWindow(text, data = null) {
    if (win) {
      win.webContents.send('update-message', { message: text, data });
    }
  }

  // 检查到更新
  autoUpdater.on('update-available', (info) => {
    log.info('发现更新:', info);
    sendStatusToWindow('update-available', info);
  });

  // 未检查到更新
  autoUpdater.on('update-not-available', (info) => {
    log.info('已是最新版本', info);
    sendStatusToWindow('update-not-available', info);
  });

  // 更新下载进度
  autoUpdater.on('download-progress', (progressObj) => {
    let message = `下载速度: ${progressObj.bytesPerSecond} - 已下载 ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    log.info(message);
    sendStatusToWindow('download-progress', progressObj);
  });

  // 更新下载完成
  autoUpdater.on('update-downloaded', (info) => {
    log.info('更新已下载', info);
    sendStatusToWindow('update-downloaded', info);
  });

  // 更新错误
  autoUpdater.on('error', (err) => {
    log.error('自动更新错误:', err);
    sendStatusToWindow('error', err.toString());
  });
}

// 当 Electron 完成初始化时，创建窗口
app.whenReady().then(async () => {
  console.log("Electron app is ready");
  console.log("Current working directory:", process.cwd());
  console.log("__dirname:", __dirname);

  // 尝试加载server/util.js文件
  try {
    const serverUtil = require("./server/util.js");
    console.log("server/util.js loaded successfully");
  } catch (err) {
    console.error("Failed to load server/util.js:", err);
  }

  createWindow();
  setupAutoUpdater();
  
  // 在开发环境下不检查更新
  if (process.env.NODE_ENV !== "development") {
    // 应用启动时检查更新，延迟3秒让应用完全加载
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => {
        log.error('自动检查更新失败:', err);
      });
    }, 3000);
  }

  app.on("activate", () => {
    // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on("before-quit", () => {
    // nuxt.close();
  });
});

// 在所有窗口关闭时退出应用程序。
app.on("window-all-closed", () => {
  // 在 macOS 上，应用程序和它们的菜单栏是常见的
  // 保持活动状态，直到用户使用 Cmd + Q 显式退出。
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
    case "restore-window":
      win.restore();
      break;
  }
});
ipcMain.handle("is-maximized", () => {
  return win.isMaximized();
});

// 实现data-handler调用
ipcMain.handle("data-handler", async (event, functionName, args) => {
  console.log(`调用处理器: ${functionName}, 参数:`, args);

  // 检查处理器是否存在
  if (typeof handler[functionName] !== "function") {
    console.error(`处理器函数不存在: ${functionName}`);
    return { success: false, error: `处理器函数不存在: ${functionName}` };
  }

  try {
    // 解析参数
    const parsedArgs = args.map((arg) => {
      if (typeof arg === "string") {
        try {
          // 尝试解析JSON字符串
          return JSON.parse(arg);
        } catch (e) {
          // 如果不是有效的JSON，则保留原始字符串
          return arg;
        }
      }
      return arg;
    });

    // 调用处理器函数
    return await handler[functionName](...parsedArgs);
  } catch (error) {
    console.error(`处理器调用失败: ${functionName}`, error);
    return { success: false, error: error.message };
  }
});

// 监听渲染进程的事件，弹出选择文件夹对话框
ipcMain.handle("select-folder", async () => {
  const { filePaths } = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"], // 仅允许选择文件夹
  });
  return filePaths[0]; // 返回选中的文件夹路径
});

// 处理媒体文件URL请求
ipcMain.handle("get-media-url", async (event, filePath) => {
  try {
    // 验证文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error(`媒体文件不存在: ${filePath}`);
      return null;
    }

    // 确保路径中特殊字符被正确编码
    const encodedPath = filePath
      .replace(/\\/g, "/")
      .replace(/#/g, "%23")
      .replace(/\?/g, "%3F")
      .replace(/\s/g, "%20");

    // 返回正确的file://协议URL
    return `file://${encodedPath}`;
  } catch (err) {
    console.error("处理媒体URL时出错:", err);
    return null;
  }
});

// 监听渲染进程的事件，弹出选择文件夹对话框
ipcMain.handle("open-folder", (event, dir) => {
  // 打开文件夹
  const dirs = dir.split("/");
  const folder = path.join(...dirs);
  if (fs.existsSync(folder)) {
    shell.openPath(folder);
    return success("文件夹已打开");
  } else {
    return error("本地项目不存在，请先下载！");
  }
});

// 监听渲染进程的事件，弹出选择文件夹对话框
ipcMain.handle("open-file", async () => {
  // 打开文件
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: "Text Files", extensions: ["txt"] }],
    properties: ["openFile"],
  });
  // 读取文件内容
  if (!canceled && filePaths.length > 0) {
    const filePath = filePaths[0];

    // Detect encoding of the file
    const encoding = chardet.detectFileSync(filePath);
    // console.log(`Detected encoding: ${encoding}`);

    // Read file with the detected encoding
    const contentBuffer = fs.readFileSync(filePath);
    const content = iconv.decode(contentBuffer, encoding || "utf-8");

    // Send file content to renderer
    return content;
  }
});

// 更新相关的IPC处理
// 检查更新
ipcMain.handle("check-updates", async () => {
  try {
    log.info('手动检查更新');
    const result = await autoUpdater.checkForUpdates();
    return { checking: true };
  } catch (err) {
    log.error('检查更新失败:', err);
    return { error: err.message || "检查更新失败" };
  }
});

// 下载更新
ipcMain.handle("download-update", async () => {
  try {
    log.info('开始下载更新');
    autoUpdater.downloadUpdate();
    return { success: true, message: "更新下载已开始" };
  } catch (err) {
    log.error('下载更新失败:', err);
    return { success: false, error: err.message || "下载更新失败" };
  }
});

// 安装更新
ipcMain.handle("install-update", async () => {
  try {
    log.info('安装更新');
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  } catch (err) {
    log.error('安装更新失败:', err);
    return { success: false, error: err.message || "安装更新失败" };
  }
});
