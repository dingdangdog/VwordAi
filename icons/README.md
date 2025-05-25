# VwordAi 图标文件

本目录包含 VwordAi 应用程序的所有图标文件，支持 Windows、macOS 和 Linux 平台。

## 文件说明

### 平台特定图标

- `icon.ico` - Windows 平台图标
- `icon.icns` - macOS 平台图标  
- `icon.png` - Linux 平台图标 (1024x1024)

### 源文件

- `icon.svg` - 原始 SVG 矢量图标 (1024x1024)

### 多尺寸文件

生成的不同尺寸的图标文件：

- SVG 格式：`icon-16.svg` 到 `icon-1024.svg`
- PNG 格式：`icon-16.png` 到 `icon-1024.png`

### 历史文件

- `win.ico` - 原有的 Windows 图标文件（已被 icon.ico 替代）

## 使用方式

这些图标文件已在 `package.json` 中正确配置：

```json
{
  "build": {
    "linux": {
      "icon": "icons/icon.png"
    },
    "mac": {
      "icon": "icons/icon.icns"
    },
    "win": {
      "icon": "icons/icon.ico"
    }
  }
}
```

## 重新生成图标

如果需要重新生成图标文件，可以运行：

```bash
# 生成所有尺寸的 SVG 和 PNG 文件
node scripts/generate-icons.js

# 生成平台特定的图标文件 (.ico, .icns)
node scripts/generate-platform-icons.js
```

## 图标设计

图标采用蓝色圆形背景 (#1E40AF)，中央是白色的音频波形图案，象征着文本转语音的功能。

## 技术规格

- **Windows (.ico)**: 多尺寸图标，包含 16x16 到 256x256
- **macOS (.icns)**: 多尺寸图标，包含 16x16 到 1024x1024  
- **Linux (.png)**: 1024x1024 高分辨率 PNG
- **所有格式**: 支持透明背景，适配各种主题
