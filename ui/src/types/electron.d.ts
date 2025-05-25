/**
 * Electron API 类型定义
 * 这个文件定义了Electron暴露给渲染进程的API
 */

export interface ElectronAPI {
  // 窗口控制
  closeApp: () => void;
  minimizeApp: () => void;
  maximizeApp: () => void;

  // 文件系统相关
  selectFolder: () => Promise<string>;
  openFolder: (dir: string) => Promise<any>;
  openFile: () => Promise<string>;

  // 数据处理
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  dataHandler: (functionName: string, args: any[]) => Promise<any>;

  // 媒体URL
  getMediaUrl: (filePath: string) => Promise<string>;

  // 更新相关
  checkForUpdates: () => Promise<any>;
  downloadUpdate: () => Promise<any>;
  installUpdate: () => Promise<any>;
  onUpdateMessage: (callback: (data: any) => void) => void;
  removeUpdateListener: () => void;

  // 调试相关
  getAppInfo: () => Promise<any>;
  getStoragePaths: () => Promise<any>;
  getSystemInfo: () => Promise<any>;
}

interface ApiInterface {
  // 项目相关API
  project: {
    getAll: () => Promise<any>;
    getById: (id: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
  };

  // 章节相关API
  chapter: {
    getByProjectId: (projectId: string) => Promise<any>;
    getById: (id: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
  };

  // 服务商相关API
  serviceProvider: {
    getAll: () => Promise<any>;
    getById: (id: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    testConnection: (id: string) => Promise<any>;
  };

  // TTS相关API
  tts: {
    synthesize: (chapterId: string) => Promise<any>;
    synthesizeMultiple: (chapterIds: string[]) => Promise<any>;
    synthesizeSegment: (chapterId: string, segmentData: { text: string, voice: string, tone?: string }) => Promise<any>;
    synthesizeFullChapter: (chapterId: string, parsedChapterId: string, audioUrls: string[]) => Promise<any>;
    getEmotions: (providerId: string) => Promise<any>;
    testProviderConnection: (type: string) => Promise<any>;
    testAzureTTS: (data: any) => Promise<any>;
  };

  // 设置相关API
  settings: {
    getAll: () => Promise<any>;
    get: (key: string) => Promise<any>;
    update: (data: any) => Promise<any>;
    getDefaultExportPath: () => Promise<any>;
    setDefaultExportPath: (path: string) => Promise<any>;
    reset: () => Promise<any>;
  };

  // LLM相关API
  llm: {
    parseChapter: (chapterId: string) => Promise<any>;
    testProviderConnection: (type: string, data?: any) => Promise<any>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: ApiInterface;
  }
}
