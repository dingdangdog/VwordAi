const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const handler = require("./handler.js"); // 函数封装在handler.js中
const chardet = require("chardet");
const iconv = require("iconv-lite");
const fs = require("fs");

require("dotenv").config(); // Load environment variables from .env file

if (process.env.NODE_ENV === "development") {
  // const devPath = path.join(__dirname, "config");
  handler.setBaseDir(__dirname);
} else {
  // const defaultPath = path.join(app.getPath("userData"), "config");
  handler.setBaseDir(app.getPath("userData"));
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
    // resizable: false, // 设置为 false 禁止缩小
    //绝对路径
    // icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      // devTools: true,
      nodeIntegration: false, // 关闭 Node.js 集成以增强安全性
      contextIsolation: true, // 启用上下文隔离
      preload: path.join(__dirname, "preload.js"), // 预加载脚本
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
  });
  // 加载应用程序

  // 关闭窗口时
  win.on("close", () => {});
}

// 当 Electron 完成初始化时，创建窗口
app.whenReady().then(async () => {
  createWindow();

  app.on("activate", () => {
    // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on("before-quit", () => {
    nuxt.close();
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

// 处理从渲染进程发来的请求
ipcMain.handle("data-handler", async (event, functionName, args) => {
  let argarr = [];
  // console.log("1--", functionName, args);
  if (args) {
    argarr = args.map((item) => {
      try {
        return JSON.parse(item);
      } catch (error) {
        return item;
      }
    });
  }
  if (process.env.NODE_ENV === "development") {
    console.log("server", functionName);
  }
  if (handler[functionName]) {
    // console.log("handler");
    return await handler[functionName](...argarr); // 调用 handler.js 中的函数
  } else {
    return { c: 500, m: `Function ${functionName} not found` };
  }
});

// 监听渲染进程的事件，弹出选择文件夹对话框
ipcMain.handle("select-folder", async () => {
  const { filePaths } = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"], // 仅允许选择文件夹
  });
  return filePaths[0]; // 返回选中的文件夹路径
});

// 监听渲染进程的事件，弹出选择文件夹对话框
ipcMain.handle("open-folder", (event, dir) => {
  // 打开文件夹
  const dirs = dir.split("/");
  const filePath = path.join(...dirs);
  shell
    .openPath(filePath)
    .then(() => {
      console.log("Folder opened successfully");
    })
    .catch((error) => {
      console.error("Error opening folder:", error);
    });
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
    console.log(`Detected encoding: ${encoding}`);

    // Read file with the detected encoding
    const contentBuffer = fs.readFileSync(filePath);
    const content = iconv.decode(contentBuffer, encoding || "utf-8");

    // Send file content to renderer
    return content;
  }
});
