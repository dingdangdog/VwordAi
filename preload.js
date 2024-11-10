const { contextBridge, ipcRenderer } = require("electron");

// 系统API
contextBridge.exposeInMainWorld("electron", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  openFolder: (dir) => ipcRenderer.invoke("open-folder", dir),
  openFile: () => ipcRenderer.invoke("open-file"),
  isMaximized: () => ipcRenderer.invoke("is-maximized"),
  minimize: () => ipcRenderer.send("window-control", "minimize"),
  maximize: () => ipcRenderer.send("window-control", "maximize"),
  close: () => ipcRenderer.send("window-control", "close"),
  restoreWindow: () => ipcRenderer.send("window-control", "restore-window"),
});

// 业务API
contextBridge.exposeInMainWorld("api", {
  invokeHandler: async (functionName, args) => {
    return await ipcRenderer.invoke("data-handler", functionName, args);
  },
});
