const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

let win

// 设置应用程序的默认语言为中文
// app.locale = 'zh-CN';
// app.commandLine.appendSwitch('--lang', 'zh-CN')

function createWindow() {
  // 创建浏览器窗口
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    // resizable: false, // 设置为 false 禁止缩小
    //绝对路径
    // icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false, // 关闭 Node.js 集成以增强安全性
      contextIsolation: true, // 启用上下文隔离
      preload: path.join(__dirname, 'preload.js') // 预加载脚本
    },
    frame: false, // 无边框窗口
    transparent: true // 透明窗口
  })
  // 初始最大化窗口
  // win.maximize()
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000/')
    // 打开开发者工具
  } else {
    win.loadFile(path.join(__dirname, 'ui/index.html'))
  }
  win.webContents.openDevTools({ mode: 'detach' })

  // 加载应用程序

  // 关闭窗口时
  win.on('close', () => {})
}

// 当 Electron 完成初始化时，创建窗口
app.whenReady().then(async () => {
  createWindow()

  app.on('activate', () => {
    // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  app.on('before-quit', () => {
    nuxt.close()
  })
})

// 在所有窗口关闭时退出应用程序。
app.on('window-all-closed', () => {
  // 在 macOS 上，应用程序和它们的菜单栏是常见的
  // 保持活动状态，直到用户使用 Cmd + Q 显式退出。
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('window-control', (event, action) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return

  switch (action) {
    case 'minimize':
      win.minimize()
      break
    case 'maximize':
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
      break
    case 'close':
      win.close()
      break
    case 'restore-window':
      win.restore()
      break
  }
})
ipcMain.handle('is-maximized', () => {
  return win.isMaximized()
})
