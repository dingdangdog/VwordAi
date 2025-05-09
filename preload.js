const { contextBridge, ipcRenderer } = require("electron");

// 系统API
contextBridge.exposeInMainWorld("electron", {
  // 文件系统相关
  selectFolder: async () => {
    return await ipcRenderer.invoke("select-folder");
  },
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

  // 获取媒体URL
  getMediaUrl: async (filePath) => {
    return await ipcRenderer.invoke("get-media-url", filePath);
  },

  // 检查更新
  checkForUpdates: async () => {
    return await ipcRenderer.invoke("check-updates");
  },

  // 下载更新
  downloadUpdate: async () => {
    return await ipcRenderer.invoke("download-update");
  },

  // 安装更新
  installUpdate: async () => {
    return await ipcRenderer.invoke("install-update");
  },

  // 监听更新消息
  onUpdateMessage: (callback) => {
    ipcRenderer.on("update-message", (event, data) => {
      callback(data);
    });
  },

  // 移除更新消息监听
  removeUpdateListener: () => {
    ipcRenderer.removeAllListeners("update-message");
  },

  // 监听自定义事件
  listenToChannel: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },

  // 移除特定通道的所有监听器
  removeListener: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // 调试相关API
  getAppInfo: async () => {
    return await ipcRenderer.invoke("get-app-info");
  },

  getStoragePaths: async () => {
    return await ipcRenderer.invoke("get-storage-paths");
  },

  getSystemInfo: async () => {
    return await ipcRenderer.invoke("get-system-info");
  },
});

// 业务API
contextBridge.exposeInMainWorld("api", {
  // 通用处理器调用方法
  invokeHandler: async (functionName, args) => {
    return await ipcRenderer.invoke("data-handler", functionName, args);
  },

  // 项目相关API
  project: {
    getAll: () => ipcRenderer.invoke("get-projects"),
    getById: (id) => ipcRenderer.invoke("get-project", id),
    create: (data) => ipcRenderer.invoke("create-project", data),
    update: (id, data) => ipcRenderer.invoke("update-project", id, data),
    delete: (id) => ipcRenderer.invoke("delete-project", id),
  },

  // 章节相关API
  chapter: {
    getByProjectId: (projectId) =>
      ipcRenderer.invoke("get-chapters-by-project-id", projectId),
    getById: (id) => ipcRenderer.invoke("get-chapter", id),
    create: (data) => ipcRenderer.invoke("create-chapter", data),
    update: (id, data) => ipcRenderer.invoke("update-chapter", id, data),
    delete: (id) => ipcRenderer.invoke("delete-chapter", id),
  },

  // 服务商相关API
  serviceProvider: {
    getAll: () => ipcRenderer.invoke("service-provider:get-all"),
    getById: (id) => ipcRenderer.invoke("service-provider:get", id),
    create: (data) => ipcRenderer.invoke("service-provider:create", data),
    update: (id, data) =>
      ipcRenderer.invoke("service-provider:update", id, data),
    delete: (id) => ipcRenderer.invoke("service-provider:delete", id),
    testConnection: (id) =>
      ipcRenderer.invoke("service-provider:test-connection", id),
    getVoiceRoles: (id) =>
      ipcRenderer.invoke("service-provider:get-voice-roles", id),
  },

  // TTS相关API
  tts: {
    synthesize: (chapterId) => ipcRenderer.invoke("tts:synthesize", chapterId),
    synthesizeMultiple: (chapterIds) =>
      ipcRenderer.invoke("tts:synthesize-multiple", chapterIds),
    getVoiceRoles: (providerId) =>
      ipcRenderer.invoke("tts:get-voice-roles", providerId),
    getEmotions: (providerId) =>
      ipcRenderer.invoke("tts:get-emotions", providerId),
    testProviderConnection: (type) =>
      ipcRenderer.invoke("tts:test-provider-connection", type),
    // 注意: Azure TTS测试功能已移至 settings.testProviderConnection
    testAzureTTS: (data) => ipcRenderer.invoke("test-azure-tts", data),
  },

  // 设置相关API
  settings: {
    getAll: () => ipcRenderer.invoke("get-settings"),
    get: (key) => ipcRenderer.invoke("get-setting", key),
    update: (data) => ipcRenderer.invoke("update-settings", data),
    getDefaultExportPath: () => ipcRenderer.invoke("get-default-export-path"),
    setDefaultExportPath: (path) =>
      ipcRenderer.invoke("set-default-export-path", path),
    reset: () => ipcRenderer.invoke("reset-settings"),
    getProviderSettings: (provider) =>
      ipcRenderer.invoke("get-provider-settings", provider),
    updateProviderSettings: (provider, data) =>
      ipcRenderer.invoke("update-provider-settings", provider, data),
    testProviderConnection: (type) =>
      ipcRenderer.invoke("test-provider-connection", type),
  },

  // BiliLive 相关 API
  biliLive: {
    connect: (roomId) => ipcRenderer.invoke("bililive:connect", roomId),
    disconnect: () => ipcRenderer.invoke("bililive:disconnect"),
    getConfig: () => ipcRenderer.invoke("bililive:get-config"),
    saveBiliConfig: (data) => ipcRenderer.invoke("bililive:save-bili-config", data),
    saveTTSMode: (mode) => ipcRenderer.invoke("bililive:save-tts-mode", mode),
    saveAzureConfig: (data) => ipcRenderer.invoke("bililive:save-azure-config", data),
    saveAlibabaConfig: (data) => ipcRenderer.invoke("bililive:save-alibaba-config", data),
    saveSovitsConfig: (data) => ipcRenderer.invoke("bililive:save-sovits-config", data),
    testTTS: (text) => ipcRenderer.invoke("bililive:test-tts", text),
    getAvailableVoices: () => ipcRenderer.invoke("bililive:get-available-voices"),
    saveLocalConfig: (voice) => ipcRenderer.invoke("bililive:save-local-config", voice),
  },
});
