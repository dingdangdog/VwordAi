# AI 开发指南

本文档旨在帮助 AI 助手（如 Cursor AI）快速理解项目结构、开发规范和常见开发任务。

## 快速开始

### 项目类型
- **框架**: Electron + Vue3
- **前端**: Vue3 + TypeScript + Tailwind CSS + Pinia
- **后端**: Node.js (JavaScript)
- **通信**: Electron IPC

### 关键理解点

1. **这不是纯 Web 项目**，而是 Electron 桌面应用
2. **数据存储在后端**，使用 JSON 文件存储在 `storage/` 目录
3. **前后端通过 IPC 通信**，不直接访问文件系统

## 项目架构

### 通信流程
```
前端 Vue 组件
  ↓ (调用)
ui/src/utils/apiBase.ts (invoke)
  ↓ (IPC)
preload.js (window.electron.invoke)
  ↓ (IPC)
main.js (ipcMain.handle)
  ↓ (路由)
handler.js
  ↓ (调用)
server/controllers/*.js
  ↓ (调用)
server/services/*.js
  ↓ (读写)
storage/ (JSON 文件)
```

### 数据流向
- **读取**: storage/ → Service → Controller → IPC → Frontend
- **写入**: Frontend → IPC → Controller → Service → storage/

## 常见开发任务

### 1. 添加新的 API 接口

#### 步骤 1: 在 preload.js 中暴露 API
```javascript
// preload.js
contextBridge.exposeInMainWorld("api", {
  // ... 现有 API
  yourModule: {
    getData: (id) => ipcRenderer.invoke("your-module:get", id),
    create: (data) => ipcRenderer.invoke("your-module:create", data),
  },
});
```

#### 步骤 2: 在 handler.js 中注册处理器
```javascript
// handler.js
function init() {
  // ... 现有注册
  ipcMain.handle("your-module:get", async (event, id) => {
    return await YourController.get(id);
  });
  ipcMain.handle("your-module:create", async (event, data) => {
    return await YourController.create(data);
  });
}
```

#### 步骤 3: 创建 Controller
```javascript
// server/controllers/YourController.js
const YourService = require("../services/YourService");
const { success, error } = require("../utils/result");

async function get(id) {
  try {
    const data = await YourService.getById(id);
    return success(data);
  } catch (err) {
    return error(err.message);
  }
}

async function create(data) {
  try {
    const result = await YourService.create(data);
    return success(result);
  } catch (err) {
    return error(err.message);
  }
}

module.exports = { get, create };
```

#### 步骤 4: 创建 Service
```javascript
// server/services/YourService.js
const storage = require("../utils/storage");
const { success, error } = require("../utils/result");

async function getById(id) {
  const data = storage.readJson("your-data.json");
  return data.find(item => item.id === id);
}

async function create(data) {
  const allData = storage.readJson("your-data.json") || [];
  const newItem = { id: generateId(), ...data, createAt: new Date() };
  allData.push(newItem);
  storage.writeJson("your-data.json", allData);
  return newItem;
}

module.exports = { getById, create };
```

#### 步骤 5: 在前端调用
```typescript
// ui/src/utils/apiBase.ts 或 stores
import { invoke } from '@/utils/apiBase';

export async function getYourData(id: string) {
  return await invoke('your-module:get', id);
}
```

### 2. 添加新的 TTS 服务商

#### 步骤 1: 创建服务商实现
```javascript
// server/tts/yourprovider.js
async function synthesize(text, options) {
  // 实现 TTS 合成逻辑
  // options 包含: voiceRole, speed, pitch, volume 等
  // 返回音频数据或文件路径
}

module.exports = { synthesize };
```

#### 步骤 2: 在 TTSService 中注册
```javascript
// server/services/TTSService.js
const yourProvider = require("../tts/yourprovider");

async function synthesize(provider, text, options) {
  switch (provider) {
    // ... 现有服务商
    case "yourprovider":
      return await yourProvider.synthesize(text, options);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
```

### 3. 添加新的 Vue 组件

#### 组件结构
```vue
<!-- ui/src/components/YourComponent.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { invoke } from '@/utils/apiBase';

const data = ref(null);

async function loadData() {
  data.value = await invoke('your-module:get-all');
}
</script>

<template>
  <div class="p-4">
    <!-- 使用 Tailwind CSS 类 -->
  </div>
</template>
```

### 4. 添加新的 Pinia Store

```typescript
// ui/src/stores/yourStore.ts
import { defineStore } from 'pinia';
import { invoke } from '@/utils/apiBase';

export const useYourStore = defineStore('your', {
  state: () => ({
    items: [],
    loading: false,
  }),
  actions: {
    async fetchAll() {
      this.loading = true;
      try {
        const result = await invoke('your-module:get-all');
        this.items = result.data;
      } finally {
        this.loading = false;
      }
    },
  },
});
```

## 数据模型

### 项目 (Project)
```javascript
{
  id: string,
  name: string,
  description?: string,
  defaultSettings: {
    serviceProvider?: string,
    voiceRole?: string,
    speed?: number,
    pitch?: number,
    volume?: number,
    emotion?: string,
  },
  createAt: Date,
  updateAt: Date,
}
```

### 章节 (Chapter)
```javascript
{
  id: string,
  projectId: string,
  name: string,
  text: string,
  settings: { /* 同项目默认设置 */ },
  createAt: Date,
  updateAt: Date,
}
```

### 服务商配置 (ServiceProvider)
```javascript
{
  id: string,
  name: string, // 'azure', 'aliyun', 'tencent' 等
  apiKey: string,
  secretKey?: string,
  region?: string,
  // 其他服务商特定字段
}
```

## 存储位置

- **项目数据**: `storage/projects.json`
- **章节数据**: `storage/chapters.json` (按项目ID组织)
- **服务商配置**: `storage/azure.json`, `storage/bili.json` 等
- **应用设置**: `storage/settings.json`
- **输出文件**: `output/` 目录

## 错误处理模式

### 后端
```javascript
const { success, error } = require("../utils/result");

try {
  const result = await someOperation();
  return success(result);
} catch (err) {
  return error(err.message);
}
```

### 前端
```typescript
try {
  const result = await invoke('some-channel', params);
  if (result.success) {
    // 处理成功
  } else {
    // 处理错误: result.message
  }
} catch (err) {
  // 处理异常
}
```

## 调试技巧

### 查看 IPC 通信
- 在 `handler.js` 中添加 `console.log` 查看请求
- 在 `preload.js` 中查看暴露的 API
- 使用 Electron DevTools 查看渲染进程日志

### 查看数据存储
- 直接查看 `storage/` 目录下的 JSON 文件
- 使用 `server/utils/storage.js` 的工具函数

### 测试后端逻辑
- 可以在 `server/test.js` 中编写测试代码
- 直接运行: `node server/test.js`

## 常见问题

### Q: 如何在前端访问文件系统？
A: 不能直接访问。必须通过 IPC 调用后端 API，由后端处理文件操作。

### Q: 如何添加新的配置项？
A: 在 `server/models/Settings.js` 中定义，在 `server/controllers/SettingsController.js` 中处理，使用 `storage/settings.json` 存储。

### Q: 如何修改 UI 样式？
A: 使用 Tailwind CSS 类名，配置文件在 `ui/tailwind.config.js`。

### Q: 如何添加新的路由？
A: 在 `ui/src/router/` 中配置 Vue Router 路由。

## 参考文档

- `docs/development.md` - 详细开发规范
- `docs/Design.md` - 功能设计文档
- `docs/Electron.md` - Electron 相关说明
- `.cursorrules` - Cursor AI 规则文件
