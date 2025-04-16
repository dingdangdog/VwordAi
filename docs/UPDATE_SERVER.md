# 文声AI (VwordAI) 更新服务配置指南

本文档提供了如何设置和配置 文声AI (VwordAI) 的自动更新系统的详细说明。

## 概述

VwordAI 的自动更新系统由以下部分组成：

1. **客户端更新检查逻辑** - 已集成到应用程序中
2. **更新服务器** - 需要您自行搭建
3. **发布流程** - 用于发布新版本的步骤

## 更新服务器配置

### 选项 1: 简单的静态文件服务器

最简单的方法是使用静态 JSON 文件来提供更新信息。

#### 步骤:

1. 在您的网站或服务器上创建一个目录结构:
   ```
   /updates/
     latest.json
     /downloads/
       vwordai-1.0.0.exe
       vwordai-1.0.0.dmg
       vwordai-1.0.0.AppImage
   ```

2. 编辑 `latest.json` 文件，包含最新版本的信息:
   ```json
   {
     "version": "1.0.0",
     "releaseDate": "2024年7月1日",
     "downloadUrl": {
       "windows": "https://yourserver.com/updates/downloads/vwordai-1.0.0.exe",
       "macos": "https://yourserver.com/updates/downloads/vwordai-1.0.0.dmg",
       "linux": "https://yourserver.com/updates/downloads/vwordai-1.0.0.AppImage"
     },
     "releaseNotes": "**新功能**\n- 功能1\n- 功能2\n\n**修复**\n- 修复1\n- 修复2"
   }
   ```

3. 更新 VwordAI 应用程序中的 `appConfig.ts` 文件，将 `updateURL` 指向您的 JSON 文件:
   ```typescript
   updateURL: "https://yourserver.com/updates/latest.json",
   ```

4. 修改 `main.js` 中的 `check-updates` 处理程序，使用 HTTP 请求获取 JSON 文件而不是模拟数据。

### 选项 2: 动态更新服务器 (推荐)

对于更复杂和安全的更新系统，建议设置一个专用的更新服务器。

#### 步骤:

1. 创建一个 Node.js 服务器 (示例使用 Express):

```javascript
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 存储不同版本的信息
const releases = {
  '1.0.0': {
    version: '1.0.0',
    releaseDate: '2024年7月1日',
    downloadUrl: {
      windows: 'https://yourserver.com/downloads/vwordai-1.0.0.exe',
      macos: 'https://yourserver.com/downloads/vwordai-1.0.0.dmg',
      linux: 'https://yourserver.com/downloads/vwordai-1.0.0.AppImage'
    },
    releaseNotes: '首次发布版本'
  },
  '1.1.0': {
    version: '1.1.0',
    releaseDate: '2024年7月15日',
    downloadUrl: {
      windows: 'https://yourserver.com/downloads/vwordai-1.1.0.exe',
      macos: 'https://yourserver.com/downloads/vwordai-1.1.0.dmg',
      linux: 'https://yourserver.com/downloads/vwordai-1.1.0.AppImage'
    },
    releaseNotes: '**新功能**\n- 增加批量导出功能\n- 支持更多语音服务\n\n**修复**\n- 修复界面显示问题\n- 提高转换速度'
  }
};

// 获取最新版本
const getLatestVersion = () => {
  return Object.values(releases).reduce((latest, current) => {
    if (!latest || compareVersions(current.version, latest.version) > 0) {
      return current;
    }
    return latest;
  }, null);
};

// 比较版本号
function compareVersions(v1, v2) {
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

// 检查更新的接口
app.post('/check-update', (req, res) => {
  try {
    const { currentVersion, platform, appId } = req.body;
    
    // 验证请求
    if (!currentVersion || !platform || appId !== 'vwordai') {
      return res.status(400).json({ error: '无效的请求参数' });
    }
    
    // 获取最新版本
    const latestVersion = getLatestVersion();
    
    if (!latestVersion) {
      return res.status(404).json({ error: '未找到版本信息' });
    }
    
    // 准备响应
    const response = {
      version: latestVersion.version,
      releaseDate: latestVersion.releaseDate,
      releaseNotes: latestVersion.releaseNotes
    };
    
    // 根据平台提供下载链接
    if (typeof latestVersion.downloadUrl === 'object') {
      response.downloadUrl = latestVersion.downloadUrl[platform] || latestVersion.downloadUrl.windows;
    } else {
      response.downloadUrl = latestVersion.downloadUrl;
    }
    
    res.json(response);
  } catch (error) {
    console.error('处理更新请求出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`更新服务器运行在端口 ${port}`);
});
```

2. 部署此服务器到您的云服务提供商 (例如 Vercel, Netlify, AWS, Azure 等)。

3. 更新 VwordAI 应用程序中的 `appConfig.ts` 文件，将 `updateURL` 指向您的 API 端点:
   ```typescript
   updateURL: "https://your-update-server.com/check-update",
   ```

4. 确保修改 `main.js` 中的 `check-updates` 处理程序以正确处理您的 API 响应。

## 发布新版本的步骤

当您准备发布新版本时，请按照以下步骤操作:

1. 更新应用程序的 `package.json` 中的版本号
2. 更新 `ui/src/config/appConfig.ts` 中的版本信息
3. 构建应用程序的新版本
4. 更新您的更新服务器配置，添加新版本的信息
5. 将构建好的应用程序上传到您的下载服务器
6. 测试自动更新功能

## 使用 electron-updater (可选)

对于更先进的自动更新功能，可以考虑集成 `electron-updater` 库:

1. 安装依赖:
   ```bash
   npm install electron-updater
   ```

2. 修改 `main.js` 以使用 `electron-updater`:
   ```javascript
   const { autoUpdater } = require('electron-updater');
   
   // 配置自动更新
   autoUpdater.setFeedURL({
     provider: 'generic',
     url: 'https://yourserver.com/updates/'
   });
   
   // 检查更新
   autoUpdater.checkForUpdates();
   
   // 自动更新事件
   autoUpdater.on('update-available', () => {
     // 通知渲染进程有可用更新
   });
   
   autoUpdater.on('update-downloaded', () => {
     // 更新已下载，可以安装
   });
   ```

3. 参考 electron-updater 文档进行更详细的配置。

## 安全性注意事项

1. **签名验证**: 应用程序更新包应当进行代码签名，以防止恶意软件分发。
2. **HTTPS**: 所有更新请求和下载应当通过 HTTPS 进行，以确保传输安全。
3. **访问控制**: 更新服务器应当有适当的访问控制，防止未授权的版本发布。

## 常见问题解答

**Q: 如何测试更新系统?**
A: 可以通过发布测试版本，并将版本号设置为高于当前版本来测试。也可以临时修改应用程序中的版本检查代码以模拟更新场景。

**Q: 是否需要为不同操作系统提供不同的更新?**
A: 是的，通常需要为 Windows (.exe)、macOS (.dmg) 和 Linux (.AppImage) 提供不同的安装包。我们的更新服务器示例已经考虑了这一点。

**Q: 如何处理强制更新?**
A: 在 API 响应中可以添加一个 `mandatory` 字段，指示是否为强制更新。然后在客户端中实现逻辑，不允许用户继续使用旧版本。

## 技术支持

如有关于更新系统设置的问题，请联系我们的技术支持团队。 