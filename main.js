const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const handler = require("./handler.js"); // 函数封装在handler.js中
const chardet = require("chardet");
const iconv = require("iconv-lite");
const fs = require("fs");
const { error, success } = require("./server/util.js");
const https = require("https");
const http = require("http");

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
    win.loadFile(path.join(__dirname, "ui/dist/index.html"));
  }
  win.webContents.on("did-finish-load", () => {
    if (process.env.NODE_ENV === "development") {
      console.log("process.env.NODE_ENV", process.env.NODE_ENV);
      // 打开开发者工具
      win.webContents.openDevTools({ mode: "detach" });
    }
    win.webContents.openDevTools({ mode: "detach" });
  });
  // 加载应用程序

  // 关闭窗口时
  win.on("close", () => {});
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

// 检查更新
ipcMain.handle("check-updates", async (event, currentVersion) => {
  try {
    const appInfo = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
    const appVersion = appInfo.version || "1.0.0";
    
    // 这里应该调用您的更新服务器API
    // 以下是一个模拟实现，实际应用中应该连接到真实的更新服务器
    
    // 如果您有真实的更新服务器，取消注释以下代码并进行修改
    /*
    const updateUrl = "https://api.example.com/vwordai/check-update";
    const response = await new Promise((resolve, reject) => {
      const req = https.request(
        updateUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }
      );
      
      req.on("error", reject);
      req.write(JSON.stringify({
        currentVersion: appVersion,
        platform: process.platform,
        appId: "vwordai"
      }));
      req.end();
    });
    
    return response;
    */
    
    // 模拟更新检查结果 - 仅用于开发测试
    // 实际生产环境应该连接到实际更新服务器
    const mockResponse = {
      version: "1.1.0", // 模拟有新版本
      releaseDate: "2024年7月15日",
      downloadUrl: "https://example.com/downloads/vwordai-1.1.0.exe",
      releaseNotes: "**新功能**\n- 增加批量导出功能\n- 支持更多语音服务\n\n**修复**\n- 修复界面显示问题\n- 提高转换速度",
    };
    
    return mockResponse;
  } catch (err) {
    console.error("检查更新失败:", err);
    return { error: err.message || "检查更新失败" };
  }
});

// 下载和安装更新
ipcMain.handle("download-update", async (event, updateInfo) => {
  try {
    // 在实际应用中，这里应该下载并安装更新
    // 以下是打开下载链接的简单实现
    // 如果您需要自动更新，可以考虑使用 electron-updater 等库
    
    shell.openExternal(updateInfo.downloadUrl);
    
    return { success: true, message: "已打开下载页面" };
  } catch (err) {
    console.error("下载更新失败:", err);
    return { success: false, error: err.message || "下载更新失败" };
  }
});
