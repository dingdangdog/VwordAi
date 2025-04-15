interface ElectronAPI {
  // 文件系统相关
  selectFolder: () => Promise<string>;
  openFolder: (dir: string) => Promise<void>;
  openFile: () => Promise<string>;
  
  // 窗口控制
  isMaximized: () => Promise<boolean>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  restoreWindow: () => void;
  
  // 主进程通用通信API
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

interface ApiInterface {
  // 通用处理器调用方法
  invokeHandler: (functionName: string, args: any[]) => Promise<any>;
  
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
    getVoiceRoles: (id: string) => Promise<any>;
  };
  
  // TTS相关API
  tts: {
    synthesize: (chapterId: string) => Promise<any>;
    synthesizeMultiple: (chapterIds: string[]) => Promise<any>;
    getVoiceRoles: (providerId: string) => Promise<any>;
    getEmotions: (providerId: string) => Promise<any>;
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
}

declare interface Window {
  electron: ElectronAPI;
  api: ApiInterface;
} 