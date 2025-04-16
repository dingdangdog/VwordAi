import { appConfig } from '@/config/appConfig';

/**
 * 版本比较结果
 */
export enum VersionCompareResult {
  NewerAvailable = 'newer',
  UpToDate = 'upToDate',
  Error = 'error'
}

/**
 * 更新信息接口
 */
export interface UpdateInfo {
  version: string;
  releaseDate: string;
  downloadUrl: string;
  releaseNotes: string;
}

/**
 * 检查更新结果
 */
export interface CheckUpdateResult {
  status: VersionCompareResult;
  currentVersion: string;
  latestVersion?: string;
  updateInfo?: UpdateInfo;
  error?: string;
}

/**
 * 是否为Electron环境
 */
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.electron !== 'undefined';
}

/**
 * 更新服务类
 */
export class UpdateService {
  /**
   * 检查最新版本
   */
  static async checkForUpdates(): Promise<CheckUpdateResult> {
    try {
      // 获取当前应用版本
      const currentVersion = appConfig.version;
      
      let updateData: any;
      
      // 根据环境选择不同的更新方式
      if (isElectron()) {
        // 在Electron环境中使用IPC通信
        updateData = await window.electron.checkForUpdates();
      } else {
        // 在Web环境中使用HTTP请求
        const response = await fetch(appConfig.updateURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentVersion,
            platform: this.getPlatform(),
            appId: 'vwordai'
          })
        });

        if (!response.ok) {
          throw new Error(`网络请求失败: ${response.status}`);
        }

        updateData = await response.json();
      }
      
      // 检查是否有错误
      if (updateData.error) {
        throw new Error(updateData.error);
      }
      
      // 比较版本
      if (this.compareVersions(updateData.version, currentVersion) > 0) {
        // 有新版本
        return {
          status: VersionCompareResult.NewerAvailable,
          currentVersion,
          latestVersion: updateData.version,
          updateInfo: {
            version: updateData.version,
            releaseDate: updateData.releaseDate,
            downloadUrl: updateData.downloadUrl,
            releaseNotes: updateData.releaseNotes
          }
        };
      } else {
        // 当前已是最新版本
        return {
          status: VersionCompareResult.UpToDate,
          currentVersion
        };
      }
    } catch (error) {
      console.error('检查更新失败:', error);
      return {
        status: VersionCompareResult.Error,
        currentVersion: appConfig.version,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 下载更新
   */
  static async downloadUpdate(updateInfo: UpdateInfo): Promise<boolean> {
    try {
      if (isElectron()) {
        // 在Electron环境中使用IPC通信
        const result = await window.electron.downloadUpdate(updateInfo);
        return result.success;
      } else {
        // 在Web环境中直接打开下载链接
        window.open(updateInfo.downloadUrl, '_blank');
        return true;
      }
    } catch (error) {
      console.error('下载更新失败:', error);
      return false;
    }
  }

  /**
   * 获取当前平台
   */
  static getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    
    return 'unknown';
  }

  /**
   * 比较版本号
   * @param v1 版本1
   * @param v2 版本2
   * @returns 如果v1>v2返回1，如果v1<v2返回-1，如果相等返回0
   */
  static compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    const maxLength = Math.max(parts1.length, parts2.length);
    
    for (let i = 0; i < maxLength; i++) {
      const part1 = i < parts1.length ? parts1[i] : 0;
      const part2 = i < parts2.length ? parts2[i] : 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }
}

/**
 * 保存最后检查更新的时间
 */
export function saveLastUpdateCheck(): void {
  localStorage.setItem('lastUpdateCheck', Date.now().toString());
}

/**
 * 获取上次检查更新的时间
 */
export function getLastUpdateCheck(): number {
  const lastCheck = localStorage.getItem('lastUpdateCheck');
  return lastCheck ? parseInt(lastCheck, 10) : 0;
}

/**
 * 是否应该检查更新
 */
export function shouldCheckForUpdates(): boolean {
  if (!appConfig.enableAutoUpdate) return false;
  
  const lastCheck = getLastUpdateCheck();
  const now = Date.now();
  
  return (now - lastCheck) > appConfig.updateCheckInterval;
} 