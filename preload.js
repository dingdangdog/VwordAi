const { contextBridge, ipcRenderer } = require("electron");

// 系统API
contextBridge.exposeInMainWorld("electron", {
  // 文件系统相关
  selectFolder: async () => {
    return await ipcRenderer.invoke("select-folder");
  },
  openFolder: (dir) => ipcRenderer.invoke("open-folder", dir),
  openFile: () => ipcRenderer.invoke("open-file"),
  showItemInFolder: (filePath) => ipcRenderer.invoke("show-item-in-folder", filePath),

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

  // 取消下载更新
  cancelUpdate: async () => {
    return await ipcRenderer.invoke("cancel-update");
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
  // 项目相关API
  project: {
    getAll: () => ipcRenderer.invoke("project:get-all"),
    getById: (id) => ipcRenderer.invoke("project:get", id),
    create: (data) => ipcRenderer.invoke("project:create", data),
    update: (id, data) => ipcRenderer.invoke("project:update", id, data),
    delete: (id) => ipcRenderer.invoke("project:delete", id),
  },

  // 章节相关API
  chapter: {
    getByProjectId: (projectId) =>
      ipcRenderer.invoke("project-chapter:get-by-project", projectId),
    getById: (id) => ipcRenderer.invoke("project-chapter:get", id),
    create: (data) => ipcRenderer.invoke("project-chapter:create", data),
    update: (id, data) => ipcRenderer.invoke("project-chapter:update", id, data),
    delete: (id) => ipcRenderer.invoke("project-chapter:delete", id),
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
  },

  // TTS相关API
  tts: {
    synthesize: (chapterId) => ipcRenderer.invoke("tts:synthesize", chapterId),
    synthesizeMultiple: (chapterIds) =>
      ipcRenderer.invoke("tts:synthesize-multiple", chapterIds),
    synthesizeSegment: (chapterId, segmentData) =>
      ipcRenderer.invoke("tts:synthesize-segment", chapterId, segmentData),
    synthesizeAllSegments: (chapterId) =>
      ipcRenderer.invoke("tts:synthesize-all-segments", chapterId),
    synthesizeFullChapter: (chapterId, parsedChapterId, audioUrls) =>
      ipcRenderer.invoke("tts:synthesize-full-chapter", chapterId, parsedChapterId, audioUrls),
    testProviderConnection: (type) =>
      ipcRenderer.invoke("tts:test-provider-connection", type),
    // 注意: Azure TTS测试功能已移至 settings.testProviderConnection
    testAzureTTS: (data) => ipcRenderer.invoke("test-azure-tts", data),
  },

  // 设置相关API
  settings: {
    getAll: () => ipcRenderer.invoke("get-settings"),
    get: (key, type) => ipcRenderer.invoke("get-setting", key, type),
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
    saveBiliConfig: (data) =>
      ipcRenderer.invoke("bililive:save-bili-config", data),
    saveTTSMode: (mode) => ipcRenderer.invoke("bililive:save-tts-mode", mode),
    saveAzureConfig: (data) =>
      ipcRenderer.invoke("bililive:save-azure-config", data),
    saveAlibabaConfig: (data) =>
      ipcRenderer.invoke("bililive:save-alibaba-config", data),
    saveSovitsConfig: (data) =>
      ipcRenderer.invoke("bililive:save-sovits-config", data),
    testTTS: (text) => ipcRenderer.invoke("bililive:test-tts", text),
    getAvailableVoices: () =>
      ipcRenderer.invoke("bililive:get-available-voices"),
    checkChineseSupport: () =>
      ipcRenderer.invoke("bililive:check-chinese-support"),
    saveLocalConfig: (voice) =>
      ipcRenderer.invoke("bililive:save-local-config", voice),
  },

  // LLM 相关 API
  llm: {
    parseChapter: (chapterId) => ipcRenderer.invoke("llm:parse-chapter", chapterId),
    testProviderConnection: (type, data) =>
      ipcRenderer.invoke("llm:test-provider-connection", type, data),
  },

  // 小说相关 API
  novel: {
    // 小说管理
    getAllNovels: () => ipcRenderer.invoke("novel:get-all"),
    getNovel: (id) => ipcRenderer.invoke("novel:get", id),
    createNovel: (data) => ipcRenderer.invoke("novel:create", data),
    updateNovel: (id, data) => ipcRenderer.invoke("novel:update", id, data),
    deleteNovel: (id) => ipcRenderer.invoke("novel:delete", id),

    // 角色管理
    getCharactersByNovel: (novelId) => ipcRenderer.invoke("character:get-by-novel", novelId),
    createCharacter: (data) => ipcRenderer.invoke("character:create", data),
    updateCharacter: (id, data) => ipcRenderer.invoke("character:update", id, data),
    deleteCharacter: (id) => ipcRenderer.invoke("character:delete", id),

    // 章节管理
    getChaptersByNovel: (novelId) => ipcRenderer.invoke("chapter:get-by-novel", novelId),
    getChapter: (id) => ipcRenderer.invoke("chapter:get", id),
    createChapter: (data) => ipcRenderer.invoke("chapter:create", data),
    updateChapter: (id, data) => ipcRenderer.invoke("chapter:update", id, data),
    deleteChapter: (id) => ipcRenderer.invoke("chapter:delete", id),

    // 解析章节
    getParsedChapter: (chapterId) => ipcRenderer.invoke("parsed-chapter:get-by-chapter", chapterId),
    updateParsedChapter: (id, data) => ipcRenderer.invoke("parsed-chapter:update", id, data),

    // TTS相关
    getTtsResults: (chapterId) => ipcRenderer.invoke("tts:get-results", chapterId),
  },
});
