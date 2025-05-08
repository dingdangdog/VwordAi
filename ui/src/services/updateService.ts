import { appConfig } from "@/stores/appConfig";

/**
 * 版本比较结果
 */
export enum VersionCompareResult {
  NewerAvailable = "newer",
  UpToDate = "upToDate",
  Error = "error",
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
 * GitHub API 资源文件接口
 */
interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
  created_at: string;
  updated_at: string;
  content_type: string;
}

/**
 * GitHub API 发布信息接口
 */
interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
  assets: GitHubAsset[];
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
    localStorage.setItem("lastUpdateCheck", Date.now().toString());
  } catch (error) {
    console.error("Failed to save last update check time:", error);
  }
}

/**
 * 是否应该检查更新
 * 根据上次检查时间和配置的检查间隔决定
 */
export function shouldCheckForUpdates(): boolean {
  try {
    const lastCheck = localStorage.getItem("lastUpdateCheck");

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

    return now - lastCheckTime > interval;
  } catch (error) {
    console.error("Error checking update schedule:", error);
    return false;
  }
}

/**
 * 更新服务
 * 提供检查更新和下载更新功能
 */
export class UpdateService {
  private static instance: UpdateService;

  private constructor() {
    console.log("UpdateService 实例已创建");
  }

  /**
   * 获取实例（单例模式）
   */
  public static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  /**
   * 检查更新
   */
  public async checkForUpdates(): Promise<CheckResult> {
    try {
      // 电子应用优先使用 electron-updater
      if (window.electron) {
        // 仅发起检查请求，结果会通过事件来通知
        await window.electron.checkForUpdates();
        return { status: VersionCompareResult.NewerAvailable };
      }

      // 降级到GitHub API检查
      console.log("正在从GitHub API检查更新:", appConfig.updateURL);
      const response = await fetch(appConfig.updateURL, {
        method: "GET",
        headers: {
          "Accept": "application/vnd.github.v3+json"
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("GitHub API 响应错误:", response.status, errorText);
        throw new Error(
          `GitHub API 返回 ${response.status}: ${response.statusText}. ${errorText}`
        );
      }

      const data = await response.json() as GitHubRelease;
      console.log("GitHub API 返回数据:", data);

      // 格式化GitHub API返回的版本号（去掉可能的v前缀）
      const latestVersion = data.tag_name ? data.tag_name.replace(/^v/, '') : data.name?.replace(/^v/, '');
      
      if (!latestVersion) {
        throw new Error("无法从GitHub API响应中提取版本号");
      }

      // 比较版本
      const comparison = this.compareVersions(latestVersion, appConfig.version);
      console.log(`版本比较: ${latestVersion} vs ${appConfig.version} = ${comparison}`);

      if (comparison > 0) {
        // 有新版本
        // 查找对应的下载URL
        let downloadUrl = "";
        if (data.assets && data.assets.length > 0) {
          // 查找针对当前平台的安装包
          const platform = this.getOSPlatform();
          const platformExtensions = this.getPlatformExtensions(platform);
          
          const asset = data.assets.find(asset => 
            platformExtensions.some(ext => asset.name.toLowerCase().endsWith(ext))
          ) || data.assets[0]; // 如果没找到针对当前平台的，就用第一个
          
          downloadUrl = asset.browser_download_url;
        } else {
          // 如果没有资源文件，使用发布页面URL
          downloadUrl = data.html_url;
        }

        return {
          status: VersionCompareResult.NewerAvailable,
          updateInfo: {
            version: latestVersion,
            releaseDate: new Date(data.published_at || Date.now()).toLocaleDateString(),
            downloadUrl: downloadUrl,
            releaseNotes: data.body || "无详细更新说明",
          },
        };
      } else {
        // 已是最新版本
        return { status: VersionCompareResult.UpToDate };
      }
    } catch (error) {
      console.error("Update check failed:", error);
      return {
        status: VersionCompareResult.Error,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 下载更新
   * 注意：此方法仅在没有electron时作为备用方案
   */
  public async downloadUpdate(updateInfo: UpdateInfo): Promise<boolean> {
    try {
      if (window.electron) {
        // 使用electron-updater下载
        await window.electron.downloadUpdate();
        return true;
      }

      // 如果不在Electron环境中，直接打开下载链接
      if (updateInfo.downloadUrl) {
        window.open(updateInfo.downloadUrl, "_blank");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Download update failed:", error);
      return false;
    }
  }

  /**
   * 比较版本号
   * @param version1 第一个版本
   * @param version2 第二个版本
   * @returns 如果version1 > version2，返回1；如果version1 < version2，返回-1；相等返回0
   */
  private compareVersions(version1: string, version2: string): number {
    const parts1 = version1.split(".").map(Number);
    const parts2 = version2.split(".").map(Number);

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
  private getOSPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes("win")) return "windows";
    if (userAgent.includes("mac")) return "macos";
    if (userAgent.includes("linux")) return "linux";

    return "unknown";
  }

  /**
   * 获取平台对应的安装包扩展名
   */
  private getPlatformExtensions(platform: string): string[] {
    switch (platform) {
      case "windows":
        return [".exe", ".msi", ".appx"];
      case "macos":
        return [".dmg", ".pkg", ".zip"];
      case "linux":
        return [".AppImage", ".deb", ".rpm", ".snap", ".tar.gz"];
      default:
        return [".zip", ".exe", ".dmg", ".deb"];
    }
  }
}

// 创建单例实例
const updateService = UpdateService.getInstance();
export default updateService;
