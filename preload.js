const { contextBridge, ipcRenderer } = require("electron");

// 系统API
contextBridge.exposeInMainWorld("electron", {
  // 文件系统相关
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  openFolder: (dir) => ipcRenderer.invoke("open-folder", dir),
  openFile: () => ipcRenderer.invoke("open-file"),
  
  // 窗口控制
  isMaximized: () => ipcRenderer.invoke("is-maximized"),
  minimize: () => ipcRenderer.send("window-control", "minimize"),
  maximize: () => ipcRenderer.send("window-control", "maximize"),
  close: () => ipcRenderer.send("window-control", "close"),
  restoreWindow: () => ipcRenderer.send("window-control", "restore-window"),
  
  // 主进程通用通信API
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  
  // 设置相关
  getSettings: () => ipcRenderer.invoke("get-settings"),
  updateSettings: (settings) => ipcRenderer.invoke("update-settings", settings),
  getDefaultExportPath: () => ipcRenderer.invoke("get-default-export-path"),
  setDefaultExportPath: (path) => ipcRenderer.invoke("set-default-export-path", path),
});

// 业务API
contextBridge.exposeInMainWorld("api", {
  invokeHandler: async (functionName, args) => {
    return await ipcRenderer.invoke("data-handler", functionName, args);
  },
});
