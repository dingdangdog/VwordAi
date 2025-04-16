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
 * 检查结果接口
 */
export interface CheckResult {
  status: VersionCompareResult;
  updateInfo?: UpdateInfo;
  error?: string;
}

/**
 * 保存最后检查更新的时间
 */
export function saveLastUpdateCheck() {
  try {
    localStorage.setItem('lastUpdateCheck', Date.now().toString());
  } catch (error) {
    console.error('Failed to save last update check time:', error);
  }
}

/**
 * 是否应该检查更新
 * 根据上次检查时间和配置的检查间隔决定
 */
export function shouldCheckForUpdates(): boolean {
  try {
    const lastCheck = localStorage.getItem('lastUpdateCheck');
    
    // 如果未开启自动更新，则不自动检查
    if (!appConfig.enableAutoUpdate) {
      return false;
    }
    
    // 如果没有上次检查记录，应该检查
    if (!lastCheck) {
      return true;
    }
    
    const lastCheckTime = parseInt(lastCheck, 10);
    const now = Date.now();
    const interval = appConfig.updateCheckInterval || 7 * 24 * 60 * 60 * 1000; // 默认7天
    
    return (now - lastCheckTime) > interval;
  } catch (error) {
    console.error('Error checking update schedule:', error);
    return false;
  }
}

/**
 * 更新服务
 * 提供检查更新和下载更新的功能
 */
export class UpdateService {
  /**
   * 检查更新
   */
  static async checkForUpdates(): Promise<CheckResult> {
    try {
      // 电子应用优先使用 electron-updater
      if (window.electron) {
        // 仅发起检查请求，结果会通过事件来通知
        await window.electron.checkForUpdates();
        return { status: VersionCompareResult.NewerAvailable };
      }
      
      // 降级到HTTP API检查
      const response = await fetch(appConfig.updateURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentVersion: appConfig.version,
          platform: getOSPlatform(),
          appId: 'vwordai'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 比较版本
      const comparison = compareVersions(data.version, appConfig.version);
      
      if (comparison > 0) {
        // 有新版本
        return {
          status: VersionCompareResult.NewerAvailable,
          updateInfo: {
            version: data.version,
            releaseDate: data.releaseDate || new Date().toLocaleDateString(),
            downloadUrl: data.downloadUrl || '',
            releaseNotes: data.releaseNotes || ''
          }
        };
      } else {
        // 已是最新版本
        return { status: VersionCompareResult.UpToDate };
      }
    } catch (error) {
      console.error('Update check failed:', error);
      return { 
        status: VersionCompareResult.Error,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 下载更新
   * 注意：此方法仅在没有electron时作为备用方案
   */
  static async downloadUpdate(updateInfo: UpdateInfo): Promise<boolean> {
    try {
      if (window.electron) {
        // 使用electron-updater下载
        await window.electron.downloadUpdate();
        return true;
      }
      
      // 如果不在Electron环境中，直接打开下载链接
      if (updateInfo.downloadUrl) {
        window.open(updateInfo.downloadUrl, '_blank');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Download update failed:', error);
      return false;
    }
  }
}

/**
 * 比较版本号
 * @param version1 第一个版本 
 * @param version2 第二个版本
 * @returns 如果version1 > version2，返回1；如果version1 < version2，返回-1；相等返回0
 */
function compareVersions(version1: string, version2: string): number {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);
  
  const maxLength = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const part1 = i < parts1.length ? parts1[i] : 0;
    const part2 = i < parts2.length ? parts2[i] : 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

/**
 * 获取当前操作系统平台
 */
function getOSPlatform(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('mac')) return 'macos';
  if (userAgent.includes('linux')) return 'linux';
  
  return 'unknown';
} 