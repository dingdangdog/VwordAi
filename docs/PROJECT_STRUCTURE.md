# 项目结构说明

本文档详细说明项目的目录结构和各文件/文件夹的用途。

## 根目录文件

### 核心文件
- **`main.js`** - Electron 主进程入口文件，负责创建窗口、配置 IPC、处理应用生命周期
- **`preload.js`** - 预加载脚本，作为主进程和渲染进程之间的桥梁，安全暴露 API
- **`handler.js`** - IPC 请求处理器，路由请求到对应的 Controller
- **`package.json`** - 主进程的依赖配置和构建脚本

### 配置文件
- **`config/`** - 配置文件目录
  - `vwordai.json` - 应用主配置
  - `tts.json` - TTS 相关配置
  - `llm.json` - LLM 相关配置
  - `models.json` - 模型配置
  - `roles.json` - 角色配置
  - `emotions.json` - 情感配置
  - `bilive.json` / `blive.json` - B站直播相关配置

### 数据目录
- **`storage/`** - 数据存储目录（JSON 文件）
  - `projects.json` - 项目数据
  - `chapters.json` - 章节数据（可能按项目ID组织）
  - `azure.json` - Azure 服务商配置
  - `bili.json` - B站相关配置
  - `novels.json` - 小说数据
  - `novel-chapters.json` - 小说章节数据
  - `novel-characters.json` - 小说角色数据
  - `novel-parsed-chapters.json` - 解析后的章节数据
  - `chapters.json` - 章节数据
  - 其他项目ID命名的文件夹 - 项目特定数据

- **`output/`** - 输出文件目录
  - TTS 生成的音频文件
  - 导出的项目文件

### 资源目录
- **`icons/`** - 应用图标文件（各种尺寸和格式）
- **`logo.svg`** - 应用 Logo

### 文档目录
- **`docs/`** - 项目文档
  - `development.md` - 开发规范
  - `Design.md` - 功能设计文档
  - `Electron.md` - Electron 相关说明
  - `AI_DEVELOPMENT.md` - AI 开发指南
  - `ARCHITECTURE.md` - 架构文档
  - `PROJECT_STRUCTURE.md` - 本文件
  - 其他功能相关文档

## 后端目录 (`server/`)

### 控制器层 (`server/controllers/`)
处理 IPC 请求的入口点，负责参数验证和调用 Service。

- **`ProjectController.js`** - 项目管理相关接口
- **`TTSController.js`** - 文本转语音相关接口
- **`SegmentTTSController.js`** - 分段 TTS 相关接口
- **`SettingsController.js`** - 设置相关接口
- **`BiliLiveController.js`** - B站直播相关接口
- **`LLMController.js`** - LLM 相关接口
- **`NovelController.js`** - 小说相关接口
- **`ChapterProcessingController.js`** - 章节处理相关接口

### 服务层 (`server/services/`)
实现业务逻辑的核心层。

- **`TTSService.js`** - TTS 服务核心逻辑，协调各个 TTS 服务商
- **`FileService.js`** - 文件操作服务
- **`LLMService.js`** - LLM 服务核心逻辑
- **`NovelService.js`** - 小说处理服务
- **`BiliLiveService.js`** - B站直播服务

### 数据模型 (`server/models/`)
定义数据结构。

- **`Project.js`** - 项目数据模型
- **`ProjectChapter.js`** - 章节数据模型
- **`Settings.js`** - 设置数据模型
- **`Novel.js`** - 小说数据模型
- **`NovelChapter.js`** - 小说章节数据模型

### TTS 服务商实现 (`server/tts/`)
各个 TTS 服务商的具体实现。

- **`azure.js`** - Microsoft Azure Speech Service
- **`aliyun.js`** - 阿里云语音服务
- **`baidu.js`** - 百度智能云语音服务
- **`tencent.js`** - 腾讯云语音服务
- **`local.js`** - 本地 TTS（如系统 TTS）
- **`sovits.js`** - So-VITS 相关实现

### LLM 服务商实现 (`server/llm/`)
各个 LLM 服务商的具体实现。

- **`openai.js`** - OpenAI API
- **`aliyun.js`** - 阿里云 LLM
- **`volcengine.js`** - 火山引擎 LLM

### 工具函数 (`server/utils/`)
通用工具函数。

- **`storage.js`** - 数据持久化工具（读写 JSON 文件）
- **`result.js`** - 统一响应格式（success/error）
- **`audioUtils.js`** - 音频处理工具

### 其他 (`server/`)
- **`ai/`** - AI 相关代码
  - `aiclient.js` - AI 客户端
  - `test.js` - 测试文件
- **`azure/`** - Azure 相关工具
  - `filePushStream.js` - 文件推送流
  - `speech.js` - 语音相关
- **`blive/`** - B站直播客户端
  - `client.js` - 直播客户端
- **`assets/`** - 后端资源文件
  - `models.json` - 模型配置
- **`util.js`** - 通用工具函数
- **`test.js`** - 测试文件

## 前端目录 (`ui/`)

### 配置文件
- **`package.json`** - 前端依赖配置
- **`vite.config.ts`** - Vite 构建配置
- **`tsconfig.json`** - TypeScript 配置
- **`tailwind.config.js`** - Tailwind CSS 配置
- **`postcss.config.js`** - PostCSS 配置

### 源代码 (`ui/src/`)

#### 组件 (`ui/src/components/`)
可复用的 Vue 组件。

#### 页面 (`ui/src/views/`)
路由对应的页面组件。

#### 状态管理 (`ui/src/stores/`)
Pinia stores，管理应用状态。

- **`projects.ts`** - 项目相关状态
- **`settings.ts`** - 设置相关状态
- 其他功能相关的 stores

#### 工具函数 (`ui/src/utils/`)
- **`apiBase.ts`** - IPC 通信封装（核心）
- 其他工具函数

#### 类型定义 (`ui/src/types/`)
TypeScript 类型定义。

- **`electron.d.ts`** - Electron API 类型定义
- 其他类型定义文件

#### 路由 (`ui/src/router/`)
Vue Router 配置。

#### 静态资源 (`ui/src/assets/`)
图片、字体等静态资源。

### 公共文件 (`ui/public/`)
不经过构建处理的静态文件。

- `index.html` - HTML 入口文件
- 图标文件

## 脚本目录 (`scripts/`)

- **`generate-icons.js`** - 生成应用图标
- **`generate-platform-icons.js`** - 生成平台特定图标

## 文件命名规范

### 后端文件
- 使用 camelCase: `ProjectController.js`, `TTSService.js`
- 模型文件使用 PascalCase: `Project.js`, `ProjectChapter.js`

### 前端文件
- 组件文件使用 PascalCase: `ProjectList.vue`, `SettingsPage.vue`
- 工具文件使用 camelCase: `apiBase.ts`, `formatUtils.ts`
- Store 文件使用 camelCase: `projects.ts`, `settings.ts`

## 数据存储规范

### JSON 文件命名
- 使用小写字母和连字符: `projects.json`, `novel-chapters.json`
- 服务商配置使用服务商名称: `azure.json`, `bili.json`

### 数据结构
- 数组格式存储多个记录
- 每个记录包含唯一 ID
- 包含时间戳字段: `createAt`, `updateAt`

## 构建输出

### 开发环境
- 前端: `ui/dist/` (Vite 构建输出)
- 后端: 直接运行源文件

### 生产环境
- 使用 `electron-builder` 打包
- 输出到 `package/` 目录
- 包含 `ui/dist/` 和必要的后端文件

## 重要提示

1. **不要直接修改 `storage/` 目录下的 JSON 文件**（除非调试）
2. **所有数据操作必须通过后端 API**
3. **前端不能直接访问文件系统**
4. **新增功能时遵循现有的目录结构**

## 相关文档

- `docs/development.md` - 开发规范
- `docs/ARCHITECTURE.md` - 架构说明
- `docs/AI_DEVELOPMENT.md` - AI 开发指南
