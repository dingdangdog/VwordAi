# 文声AI (VwordAi) 自动更新系统 - 基于 electron-updater

本文档提供了如何使用 electron-updater 设置和配置 VwordAi 的自动更新系统的详细指南。

## 概述

VwordAi 的自动更新系统使用 electron-updater 库，支持以下功能：

1. **自动检查更新** - 应用程序会定期检查是否有新版本可用
2. **自动下载更新** - 用户确认后，更新会在后台下载
3. **安装更新** - 更新下载完成后，用户可以选择立即安装
4. **多平台支持** - 支持 Windows、macOS 和 Linux 平台

## 技术栈

- **electron-updater**: 用于管理更新过程
- **electron-builder**: 用于构建和发布应用程序
- **GitHub/自有服务器**: 作为更新发布平台

## 安装和配置

### 1. 依赖安装

确保项目中已安装以下依赖：

```bash
npm install electron-updater electron-log --save
```

### 2. 配置 package.json

在 `package.json` 文件中添加或更新以下配置：

```json
{
  "build": {
    "appId": "com.vwordai",
    "productName": "VwordAi",
    "publish": [
      {
        "provider": "github",
        "owner": "dingdangdog",
        "repo": "vwordai"
      }
    ],
    "win": {
      "target": ["nsis"],
      "artifactName": "${productName}-Setup-${version}.${ext}"
    },
    "mac": {
      "target": ["dmg", "zip"],
      "artifactName": "${productName}-${version}.${ext}"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "artifactName": "${productName}-${version}.${ext}"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "perMachine": false,
      "deleteAppDataOnUninstall": false
    }
  },
  "scripts": {
    "publish": "electron-builder --publish always"
  }
}
```

### 3. 配置 main.js

在主进程文件 (main.js) 中添加以下代码：

```javascript
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// 配置日志
log.transports.file.level = "debug";
autoUpdater.logger = log;
autoUpdater.autoDownload = false;

// 设置自动更新事件处理
function setupAutoUpdater() {
  // 发送更新消息到渲染进程
  function sendStatusToWindow(text, data = null) {
    if (win) {
      win.webContents.send('update-message', { message: text, data });
    }
  }

  // 检查到更新
  autoUpdater.on('update-available', (info) => {
    log.info('发现更新:', info);
    sendStatusToWindow('update-available', info);
  });

  // 未检查到更新
  autoUpdater.on('update-not-available', (info) => {
    log.info('已是最新版本', info);
    sendStatusToWindow('update-not-available', info);
  });

  // 更新下载进度
  autoUpdater.on('download-progress', (progressObj) => {
    let message = `下载速度: ${progressObj.bytesPerSecond} - 已下载 ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    log.info(message);
    sendStatusToWindow('download-progress', progressObj);
  });

  // 更新下载完成
  autoUpdater.on('update-downloaded', (info) => {
    log.info('更新已下载', info);
    sendStatusToWindow('update-downloaded', info);
  });

  // 更新错误
  autoUpdater.on('error', (err) => {
    log.error('自动更新错误:', err);
    sendStatusToWindow('error', err.toString());
  });
}

// 应用就绪后初始化更新
app.whenReady().then(() => {
  // 创建窗口和其他初始化...
  
  // 设置自动更新
  setupAutoUpdater();
  
  // 在开发环境下不检查更新
  if (process.env.NODE_ENV !== "development") {
    // 应用启动时检查更新，延迟3秒让应用完全加载
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => {
        log.error('自动检查更新失败:', err);
      });
    }, 3000);
  }
});

// IPC 处理更新相关的事件
ipcMain.handle("check-updates", async () => {
  try {
    log.info('手动检查更新');
    const result = await autoUpdater.checkForUpdates();
    return { checking: true };
  } catch (err) {
    log.error('检查更新失败:', err);
    return { error: err.message || "检查更新失败" };
  }
});

ipcMain.handle("download-update", async () => {
  try {
    log.info('开始下载更新');
    autoUpdater.downloadUpdate();
    return { success: true, message: "更新下载已开始" };
  } catch (err) {
    log.error('下载更新失败:', err);
    return { success: false, error: err.message || "下载更新失败" };
  }
});

ipcMain.handle("install-update", async () => {
  try {
    log.info('安装更新');
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  } catch (err) {
    log.error('安装更新失败:', err);
    return { success: false, error: err.message || "安装更新失败" };
  }
});
```

### 4. 配置预加载脚本 (preload.js)

在预加载脚本中添加以下代码，以便渲染进程可以访问更新功能：

```javascript
// 更新相关
checkForUpdates: async () => {
  return await ipcRenderer.invoke("check-updates");
},
downloadUpdate: async () => {
  return await ipcRenderer.invoke("download-update");
},
installUpdate: async () => {
  return await ipcRenderer.invoke("install-update");
},
onUpdateMessage: (callback) => {
  ipcRenderer.on('update-message', (event, data) => {
    callback(data);
  });
},
removeUpdateListener: () => {
  ipcRenderer.removeAllListeners('update-message');
}
```

## 发布流程

### 使用 GitHub 作为更新服务器

1. **创建 GitHub 仓库** - 确保您有一个可用的 GitHub 仓库来托管应用程序更新。

2. **生成访问令牌** - 创建一个具有 `repo` 权限的个人访问令牌 (PAT)。

3. **配置环境变量** - 在构建环境中设置 `GH_TOKEN` 环境变量：

   ```bash
   export GH_TOKEN=your_github_token
   ```

   或在 Windows 中：

   ```
   set GH_TOKEN=your_github_token
   ```

4. **构建并发布**:

   ```bash
   npm run publish
   ```

### 使用自有服务器作为更新服务器

1. **修改 package.json 的 publish 配置**:

   ```json
   "publish": [
     {
       "provider": "generic",
       "url": "https://your-server.com/downloads/"
     }
   ]
   ```

2. **设置服务器目录结构**:

   ```
   /downloads/
     /latest/
       latest-mac.yml    # macOS更新信息
       latest-linux.yml  # Linux更新信息
       latest.yml        # Windows更新信息
     /v1.0.0/
       VwordAi-1.0.0.dmg
       VwordAi-1.0.0.AppImage
       VwordAi-Setup-1.0.0.exe
   ```

3. **发布更新**:

   每次发布新版本后，将构建好的安装包和 YAML 文件上传到服务器对应目录。

## 更新流程说明

1. **检查更新** - 应用程序定期或在用户点击"检查更新"按钮时，向更新服务器查询是否有新版本可用。

2. **提示用户** - 如果发现更新，应用程序会显示更新对话框，用户可以选择下载更新或稍后再说。

3. **下载更新** - 用户确认后，应用程序开始在后台下载更新，并显示下载进度。

4. **安装更新** - 下载完成后，用户可以选择立即安装或下次启动时安装。

5. **应用更新** - 应用程序会关闭，然后安装新版本并重新启动。

## 测试更新系统

1. **版本变更** - 修改 `package.json` 和 `ui/src/config/appConfig.ts` 中的版本号，确保新版本大于当前版本。

2. **本地测试** - 使用 `electron-builder` 的开发模式测试更新流程：

   ```bash
   # 首先构建和发布一个版本
   npm run publish
   
   # 修改版本号后再发布一个新版本
   npm run publish
   
   # 安装旧版本，然后测试更新到新版本
   ```

3. **调试问题** - 查看 electron-log 创建的日志文件，位置通常在：
   - Windows: `%USERPROFILE%\AppData\Roaming\{app name}\logs\`
   - macOS: `~/Library/Logs/{app name}/`
   - Linux: `~/.config/{app name}/logs/`

## 常见问题

1. **更新检查失败** - 通常是由于网络问题或 GitHub 令牌权限不足导致。请检查网络连接和令牌权限。

2. **下载更新失败** - 可能是网络问题或磁盘空间不足。

3. **安装更新失败** - 可能是权限问题或文件被占用。建议重启应用程序后再尝试安装。

4. **签名问题** - 如果使用代码签名，确保签名证书有效且被正确应用到安装包。

## 安全注意事项

1. **HTTPS** - 确保所有更新请求和下载都通过 HTTPS 进行，以防止中间人攻击。

2. **代码签名** - 对于生产环境，强烈建议对应用程序进行代码签名，以验证更新包的完整性和来源。

3. **令牌安全** - 不要在源代码中硬编码 GitHub 令牌，使用环境变量或 CI/CD 系统的秘密管理功能。

## 结论

使用 electron-updater 实现的自动更新系统大大简化了应用程序的更新流程，提高了用户体验。通过合理配置和持续维护，可以确保用户始终使用最新版本的 VwordAi 应用程序。 