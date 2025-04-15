interface ElectronAPI {
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
  
  // 设置相关
  getSettings: () => Promise<any>;
  updateSettings: (settings: any) => Promise<any>;
  getDefaultExportPath: () => Promise<string>;
  setDefaultExportPath: (path: string) => Promise<boolean>;
}

declare interface Window {
  electron: ElectronAPI;
  api: {
    invokeHandler: (functionName: string, args: any) => Promise<any>;
  };
} 