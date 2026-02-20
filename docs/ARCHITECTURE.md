# 项目架构文档

## 系统架构概览

VwordAi 采用典型的 Electron 应用架构，分为主进程和渲染进程两部分。

```
┌─────────────────────────────────────────────────┐
│            Electron 应用                          │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────┐      ┌─────────────────┐ │
│  │   渲染进程        │      │   主进程         │ │
│  │  (Vue3 + TS)     │◄────►│  (Node.js)      │ │
│  │                  │ IPC  │                 │ │
│  │  - UI 渲染       │      │  - 文件操作      │ │
│  │  - 用户交互      │      │  - API 调用      │ │
│  │  - 状态管理      │      │  - 数据存储      │ │
│  └──────────────────┘      └─────────────────┘ │
│         │                          │            │
│         │                          │            │
│         └──────────┬───────────────┘            │
│                    │                            │
│              ┌─────▼─────┐                      │
│              │ preload.js │                      │
│              │  (桥梁)    │                      │
│              └────────────┘                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 目录结构详解

### 根目录
```
VwordAi/
├── main.js              # Electron 主进程入口
├── preload.js           # 预加载脚本，暴露 API
├── handler.js           # IPC 请求处理器
├── package.json         # 主进程依赖
├── config/              # 配置文件目录
├── storage/             # 数据存储目录 (JSON 文件)
├── output/              # 输出文件目录
├── server/              # 后端代码
└── ui/                  # 前端代码
```

### 后端结构 (`server/`)
```
server/
├── controllers/         # 控制器层 - 处理 IPC 请求
│   ├── ProjectController.js
│   ├── TTSController.js
│   ├── SettingsController.js
│   └── ...
├── services/            # 服务层 - 业务逻辑
│   ├── TTSService.js
│   ├── FileService.js
│   └── ...
├── models/              # 数据模型
│   ├── Project.js
│   ├── ProjectChapter.js
│   └── ...
├── tts/                 # TTS 服务商实现
│   ├── azure.js
│   ├── aliyun.js
│   └── ...
├── llm/                 # LLM 服务商实现
│   ├── openai.js
│   └── ...
└── utils/               # 工具函数
    ├── storage.js        # 数据持久化
    ├── result.js        # 统一响应格式
    └── audioUtils.js    # 音频处理
```

### 前端结构 (`ui/src/`)
```
ui/src/
├── components/          # 共享组件
├── views/               # 页面组件
├── stores/              # Pinia 状态管理
│   ├── projects.ts
│   ├── settings.ts
│   └── ...
├── utils/               # 工具函数
│   ├── apiBase.ts       # IPC 通信封装
│   └── ...
├── types/               # TypeScript 类型定义
│   └── electron.d.ts   # Electron API 类型
├── router/              # Vue Router 配置
└── assets/              # 静态资源
```

## 数据流

### 读取数据流程
```
用户操作
  ↓
Vue 组件
  ↓
Pinia Store / 直接调用
  ↓
apiBase.invoke()
  ↓
window.electron.invoke() (preload.js)
  ↓
IPC 通信
  ↓
ipcMain.handle() (main.js)
  ↓
handler.js 路由
  ↓
Controller
  ↓
Service
  ↓
storage.readJson()
  ↓
返回数据
```

### 写入数据流程
```
用户操作
  ↓
Vue 组件
  ↓
Pinia Store / 直接调用
  ↓
apiBase.invoke('xxx:create', data)
  ↓
IPC 通信
  ↓
Controller.create(data)
  ↓
Service.create(data)
  ↓
storage.writeJson()
  ↓
返回结果
```

## 核心模块

### 1. 主进程 (main.js)

**职责**:
- 创建和管理应用窗口
- 配置 Electron 安全设置
- 注册 IPC 处理器
- 处理应用生命周期事件
- 配置自动更新

**关键代码**:
```javascript
// 创建窗口
function createWindow() {
  win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
}

// 注册 IPC 处理器
ipcMain.handle("project:get-all", async () => {
  return await handler.handle("project:get-all");
});
```

### 2. 预加载脚本 (preload.js)

**职责**:
- 作为主进程和渲染进程之间的桥梁
- 安全地暴露 API 到渲染进程
- 使用 `contextBridge` 确保安全性

**关键代码**:
```javascript
contextBridge.exposeInMainWorld("electron", {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});

contextBridge.exposeInMainWorld("api", {
  project: {
    getAll: () => ipcRenderer.invoke("project:get-all"),
    create: (data) => ipcRenderer.invoke("project:create", data),
  },
});
```

### 3. 请求处理器 (handler.js)

**职责**:
- 初始化所有控制器
- 路由 IPC 请求到对应的 Controller
- 管理存储目录

**关键代码**:
```javascript
function init() {
  // 初始化控制器
  ProjectController.init();
  TTSController.init();
  // ...
}

// 路由请求
async function handle(channel, ...args) {
  const [module, action] = channel.split(":");
  switch (module) {
    case "project":
      return await ProjectController[action](...args);
    // ...
  }
}
```

### 4. 控制器层 (controllers/)

**职责**:
- 接收 IPC 请求
- 参数验证
- 调用对应的 Service
- 返回统一格式的响应

**示例**:
```javascript
// server/controllers/ProjectController.js
async function getAll() {
  try {
    const projects = await ProjectService.getAll();
    return success(projects);
  } catch (err) {
    return error(err.message);
  }
}
```

### 5. 服务层 (services/)

**职责**:
- 实现业务逻辑
- 调用数据模型和工具函数
- 处理第三方 API 调用

**示例**:
```javascript
// server/services/TTSService.js
async function synthesize(provider, text, options) {
  const providerImpl = getProvider(provider);
  const audioData = await providerImpl.synthesize(text, options);
  // 保存音频文件
  return await FileService.saveAudio(audioData, options);
}
```

### 6. 数据存储 (utils/storage.js)

**职责**:
- 提供统一的文件读写接口
- 管理存储目录
- 处理 JSON 序列化/反序列化

**关键方法**:
```javascript
// 读取 JSON 文件
function readJson(filename) {
  const filePath = path.join(baseDir, "storage", filename);
  return fs.readJsonSync(filePath, { throws: false }) || [];
}

// 写入 JSON 文件
function writeJson(filename, data) {
  const filePath = path.join(baseDir, "storage", filename);
  fs.ensureDirSync(path.dirname(filePath));
  fs.writeJsonSync(filePath, data, { spaces: 2 });
}
```

### 7. 前端通信层 (ui/src/utils/apiBase.ts)

**职责**:
- 封装 IPC 调用
- 提供类型安全的 API
- 统一错误处理

**关键代码**:
```typescript
export async function invoke<T>(channel: string, ...args: any[]): Promise<T> {
  try {
    const result = await window.electron.invoke(channel, ...args);
    return result;
  } catch (error) {
    console.error(`调用[${channel}]失败:`, error);
    throw error;
  }
}
```

## 安全机制

### 1. Context Isolation
- 启用 `contextIsolation: true`
- 防止渲染进程直接访问 Node.js API

### 2. Node Integration
- 禁用 `nodeIntegration: false`
- 所有 Node.js 功能通过 preload.js 安全暴露

### 3. API 暴露
- 只暴露必要的 API
- 使用 `contextBridge` 而不是直接赋值

## 数据持久化

### 存储位置
- **开发环境**: 项目根目录的 `storage/` 文件夹
- **生产环境**: Electron 的 `userData` 目录下的 `storage/` 文件夹

### 存储格式
- 所有数据使用 JSON 文件存储
- 文件命名: `{模块名}.json` (如 `projects.json`, `chapters.json`)

### 数据模型
- 每个模型对应一个 JSON 文件
- 使用数组存储多个记录
- 每个记录包含 `id`, `createAt`, `updateAt` 等字段

## 扩展点

### 添加新的 TTS 服务商
1. 在 `server/tts/` 创建实现文件
2. 在 `TTSService.js` 中注册
3. 在配置文件中添加服务商配置项

### 添加新的功能模块
1. 创建 Controller (`server/controllers/`)
2. 创建 Service (`server/services/`)
3. 创建 Model (`server/models/`)
4. 在 `handler.js` 中注册
5. 在 `preload.js` 中暴露 API
6. 在前端创建对应的 Store 或工具函数

## 性能考虑

### 1. 异步操作
- 所有文件操作使用异步 API
- 避免阻塞主进程

### 2. 数据缓存
- 前端使用 Pinia 缓存数据
- 减少不必要的 IPC 调用

### 3. 批量操作
- 支持批量 TTS 合成
- 使用队列管理任务

## 参考

- [Electron 官方文档](https://www.electronjs.org/docs)
- [Vue 3 文档](https://vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
