# 文本转语音软件功能设计文档

- **版本：** 1.0
- **日期：** 2025年4月14日
- **编写人：** Gemini

## 1. 概述

本软件旨在提供一个基于 Electron 的跨平台文本转语音解决方案。用户可以方便地以项目和章节为单位管理需要进行语音合成的文本内容，并针对每个章节进行详细的语音参数设置。通过配置第三方语音服务商的密钥，用户可以免费使用各种高质量的语音合成服务。同时，软件提供基础的亮暗主题切换功能，以满足不同用户的视觉偏好。

## 2. 功能需求

本节将详细描述软件的各项功能需求。

### 2.1 项目与章节管理

#### **2.1.1 项目管理**

- **创建项目：** 用户可以创建新的项目，每个项目代表一个独立的文本转语音任务集合。
- **项目名称：** 每个项目需要有唯一的名称。
- **项目描述（可选）：** 用户可以为项目添加描述信息。
- 项目默认设置：
  - 用户可以在创建或编辑项目时设置默认的语音合成参数，包括：
    - **服务商：** 下拉选择已配置的第三方语音服务商（初始为空）。
    - **声音角色：** 下拉选择该服务商提供的可用声音角色（初始为空）。
    - **语速：** 滑动条或数字输入框，允许用户设置语速（例如：0.5 - 2.0，默认值为 1.0）。
    - **音调：** 滑动条或数字输入框，允许用户设置音调（例如：-10 - 10，默认值为 0）。
    - **音量：** 滑动条或数字输入框，允许用户设置音量（例如：0 - 100，默认值为 100）。
    - **情感（可选）：** 下拉选择该服务商支持的情感选项（初始为空）。
    - **其他高级参数（可选）：** 预留接口，方便后续扩展。
  - 项目默认设置为空时，新建章节的语音参数也将为空，需要用户手动设置。
- **查看项目列表：** 用户可以查看所有已创建的项目，列表应显示项目名称和创建时间等基本信息。
- **编辑项目：** 用户可以修改已创建项目的名称、描述和默认设置。
- **删除项目：** 用户可以删除不再需要的项目。删除项目时应有二次确认提示。

#### **2.1.2 章节管理**

- **创建章节：** 用户可以在选定的项目下创建新的章节。
- **章节名称：** 每个章节需要有唯一的名称（在当前项目下）。
- **章节文本：** 用户可以在文本编辑器中输入或粘贴需要进行语音合成的文本内容。
- 章节语音设置：
  - **继承项目设置：** 新建章节时，默认继承当前项目的语音合成设置。
  - **独立设置：** 用户可以修改当前章节的语音合成参数，覆盖项目默认设置。可设置的参数与项目默认设置相同（服务商、声音角色、语速、音调、音量、情感等）。
  - 如果项目没有设置，则这些参数初始为空，需要用户手动选择。
- **查看章节列表：** 用户可以在选定的项目下查看所有已创建的章节，列表应显示章节名称和创建时间等基本信息。
- **编辑章节：** 用户可以修改已创建章节的名称、文本内容和语音设置。
- **删除章节：** 用户可以删除不再需要的章节。删除章节时应有二次确认提示。
- **章节排序（可选）：** 允许用户在项目中对章节进行排序，以便按顺序进行语音合成。

### 2.2 语音合成

- **选择章节：** 用户可以选择一个或多个章节进行语音合成。
- **开始合成：** 用户点击"合成"按钮后，软件将根据所选章节的语音设置，调用相应的第三方语音服务商 API 进行语音合成。
- **合成状态显示：** 在合成过程中，应显示合成的进度和状态（例如：排队中、合成中、已完成、失败）。
- **合成结果预览（可选）：** 合成完成后，允许用户在线播放合成的语音。
- **合成结果导出：** 用户可以将合成的语音导出为音频文件（例如：MP3、WAV 等，导出格式应可配置）。
- **批量合成：** 支持用户选择多个章节进行批量语音合成，并按照章节顺序或用户指定的顺序进行。
- **错误处理：** 当语音合成失败时，应显示详细的错误信息，方便用户排查问题（例如：API 密钥错误、网络错误、文本内容不合法等）。

### 2.3 服务商配置

- **添加服务商：** 用户可以在设置中添加新的第三方语音服务商。
- **服务商选择：** 提供一个下拉列表，列出软件支持的常见语音服务商（例如：阿里云、腾讯云、百度智能云、Azure Speech Service 等）。
- **密钥配置：** 用户需要为每个添加的服务商配置必要的 API 密钥（例如：API Key、Secret Key 等）。
- **密钥存储：** 用户的密钥应安全地存储在本地，例如使用 Electron 的 `node-keytar` 或其他加密方式。
- **测试连接：** 提供一个"测试连接"按钮，用于验证用户配置的密钥是否有效。
- **编辑和删除服务商：** 用户可以编辑已添加服务商的密钥信息或删除不再使用的服务商配置。

### 2.4 设置

- 主题切换：
  - 提供亮色（Light）和暗色（Dark）两种主题供用户选择。
  - 用户的主题选择应保存在本地，并在下次启动时自动应用。
- **默认导出路径配置：** 允许用户设置合成语音文件的默认导出路径。
- **语言设置（可选）：** 如果需要支持多语言，可以在设置中添加语言选择功能。
- **关于软件：** 显示软件的版本信息和开发者信息。

## 3. 技术设计

本节将概述软件的技术架构和关键组件。

### 3.1 架构

软件采用典型的 Electron 应用架构，分为主进程和渲染进程。

- 主进程 (Main Process):
  - 负责管理应用程序的生命周期。
  - 创建和管理浏览器窗口。
  - 处理系统级别的操作，例如文件读写、与操作系统交互等。
  - 与渲染进程进行通信。
  - 集成第三方语音服务商的 SDK 或通过 Axios 发送 API 请求。
  - 负责存储和管理应用程序的配置数据（例如：服务商密钥、主题设置等）。
- 渲染进程 (Renderer Process):
  - 负责用户界面的渲染和用户交互逻辑。
  - 使用 Vue3、TypeScript 和 Tailwind CSS 构建用户界面。
  - 通过 Electron 提供的 IPC (Inter-Process Communication) 机制与主进程进行通信。
  - 使用 Vue Router 进行页面导航。
  - 使用 Pinia 进行状态管理。

### 3.2 关键组件

- 项目管理模块 (Main & Renderer):
  - 负责项目的创建、读取、更新和删除操作。
  - UI 界面用于展示和操作项目列表。
- 章节管理模块 (Main & Renderer):
  - 负责章节的创建、读取、更新和删除操作。
  - UI 界面包含文本编辑器和章节列表。
- 语音合成模块 (Main):
  - 接收渲染进程的合成请求。
  - 根据章节的语音设置选择相应的服务商 API 进行调用。
  - 处理 API 响应，包括成功和失败的情况。
  - 将合成的音频数据返回给渲染进程或保存到本地文件。
- 服务商配置模块 (Main & Renderer):
  - 负责存储和管理第三方服务商的配置信息（密钥等）。
  - UI 界面用于添加、编辑和删除服务商配置。
- 设置模块 (Main & Renderer):
  - 负责存储和管理应用程序的各种设置（主题、导出路径等）。
  - UI 界面用于修改应用程序的设置。
- 数据存储模块 (Main):
  - 负责将应用程序的数据持久化存储到本地文件（例如：JSON 文件或使用更专业的本地数据库如 SQLite）。

### 3.3 主要流程

1. **用户创建项目并设置默认参数（可选）。**
2. **用户在项目中创建章节，章节默认继承项目设置。**
3. **用户编辑章节文本内容，并可根据需要修改章节的语音参数。**
4. **用户在设置中配置第三方语音服务商的 API 密钥。**
5. **用户选择需要合成的章节。**
6. **渲染进程通过 IPC 向主进程发送合成请求，包含章节文本和语音设置。**
7. **主进程根据章节的语音设置，选择对应的服务商，并使用配置的密钥调用其 API 进行语音合成。**
8. **主进程将合成结果（音频数据或文件路径）通过 IPC 返回给渲染进程。**
9. **渲染进程提示用户合成完成，并允许用户预览或导出音频文件。**
10. **用户可以在设置中切换亮暗主题。**

## 4. UI 设计 (概念)

本节将描述主要的 UI 界面和用户交互方式。

### 4.1 整体布局

软件界面可以采用经典的侧边栏布局或顶部导航栏布局。

- 侧边栏布局 (推荐):

  - **左侧边栏：** 用于显示项目列表和章节列表。用户可以在这里进行项目和章节的创建、选择和管理。

  - 右侧主内容区域：

     根据用户在左侧选择的内容显示不同的界面，例如：

    - 项目详情页：显示项目名称、描述和默认设置。
    - 章节编辑页：包含文本编辑器和章节语音设置。
    - 设置页：用于配置服务商信息和应用程序设置。

- 顶部导航栏布局:

  - **顶部导航栏：** 包含主要功能模块的入口，例如"项目"、"设置"等。
  - **主内容区域：** 显示当前所选模块的内容。

### 4.2 主要页面

- 项目列表页：
  - 显示所有已创建的项目，可以进行搜索和排序。
  - 提供"新建项目"按钮。
  - 点击项目可以展开显示该项目下的章节列表。
- 项目详情页：
  - 显示当前选定项目的名称、描述和默认语音设置。
  - 提供"编辑项目"和"删除项目"按钮。
  - 提供"新建章节"按钮。
- 章节编辑页：
  - **章节信息：** 显示当前章节的名称。
  - **文本编辑器：** 用于输入和编辑章节文本内容。
  - **语音设置区域：** 显示当前章节的语音合成参数，包括服务商选择、声音角色选择、语速、音调、音量、情感等。允许用户修改这些参数。
  - **合成按钮：** 点击开始合成当前章节的语音。
- 设置页：
  - 服务商配置：
    - 显示已添加的服务商列表。
    - 提供"添加服务商"按钮。
    - 点击服务商可以编辑其密钥信息。
    - 提供"删除"按钮用于删除服务商配置。
  - 应用设置：
    - 主题切换（亮/暗）。
    - 默认导出路径设置。
    - 其他可选设置。
  - **关于：** 显示软件版本和开发者信息。

### 4.3 UI 组件

- **文本编辑器：** 用于输入和编辑文本内容。
- **下拉选择框 (Select):** 用于选择服务商、声音角色、情感等。
- **滑动条 (Slider):** 用于设置语速、音调、音量等。
- **输入框 (Input):** 用于输入项目名称、章节名称、API 密钥等。
- **按钮 (Button):** 用于执行各种操作，例如创建、编辑、删除、合成、保存等。
- **列表 (List):** 用于显示项目列表、章节列表、服务商列表等。
- **模态框 (Modal):** 用于显示确认对话框、错误提示等。
- **加载指示器 (Loader):** 在语音合成等耗时操作时显示加载状态。

## 5. 数据模型示例

本节定义应用程序需要存储的数据结构。

TypeScript

```ts
interface Project {
  id: string; // 项目ID (可以使用 UUID)
  name: string; // 项目名称
  description?: string; // 项目描述 (可选)
  defaultSettings: {
    serviceProvider?: string;
    voiceRole?: string;
    speed?: number; // 语速
    pitch?: number; // 音调
    volume?: number; // 音量
    emotion?: string; // 情感 (可选)
    [key: string]: any; // 其他服务商特定的参数
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Chapter {
  id: string; // 章节ID (可以使用 UUID)
  projectId: string; // 所属项目ID
  name: string; // 章节名称
  text: string; // 章节文本内容
  settings: {
    serviceProvider?: string;
    voiceRole?: string;
    speed?: number; // 语速
    pitch?: number; // 音调
    volume?: number; // 音量
    emotion?: string; // 情感 (可选)
    [key: string]: any; // 其他服务商特定的参数
  };
  createdAt: Date;
  updatedAt: Date;
}

// 服务商配置信息，基于各自服务商配置不同字段
interface ServiceProviderConfig {
  id: string; // 服务商配置ID (可以使用 UUID)
  name: string; // 服务商名称 (例如：阿里云)
  apiKey: string; // API 密钥
  secretKey?: string; // Secret 密钥 (可选)
  // 其他服务商需要的密钥字段
  [key: string]: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

interface AppSettings {
  theme: 'light' | 'dark'; // 主题
  defaultExportPath?: string; // 默认导出路径
  // 其他应用设置
  [key: string]: any;
}
```

## 6. API 设计 (概念)

本节描述渲染进程和主进程之间的通信接口。

### 6.1 渲染进程 -> 主进程

- `ipcRenderer.send('project:create', projectData)`: 创建新项目。
- `ipcRenderer.send('project:get-all')`: 获取所有项目列表。
- `ipcRenderer.send('project:get', projectId)`: 获取指定项目信息。
- `ipcRenderer.send('project:update', projectId, projectData)`: 更新项目信息。
- `ipcRenderer.send('project:delete', projectId)`: 删除项目。
- `ipcRenderer.send('chapter:create', chapterData)`: 创建新章节。
- `ipcRenderer.send('chapter:get-all', projectId)`: 获取指定项目下的所有章节列表。
- `ipcRenderer.send('chapter:get', chapterId)`: 获取指定章节信息。
- `ipcRenderer.send('chapter:update', chapterId, chapterData)`: 更新章节信息。
- `ipcRenderer.send('chapter:delete', chapterId)`: 删除章节。
- `ipcRenderer.send('tts:synthesize', chapterId)`: 请求合成指定章节的语音。
- `ipcRenderer.send('tts:synthesize-multiple', chapterIds)`: 请求批量合成多个章节的语音。
- `ipcRenderer.send('service-provider:create', configData)`: 添加新的服务商配置。
- `ipcRenderer.send('service-provider:get-all')`: 获取所有服务商配置列表。
- `ipcRenderer.send('service-provider:update', configId, configData)`: 更新服务商配置。
- `ipcRenderer.send('service-provider:delete', configId)`: 删除服务商配置。
- `ipcRenderer.send('settings:get')`: 获取所有应用设置。
- `ipcRenderer.send('settings:update', settingsData)`: 更新应用设置。
- `ipcRenderer.send('settings:get-default-export-path')`: 获取默认导出路径。
- `ipcRenderer.send('settings:set-default-export-path', path)`: 设置默认导出路径.

### 6.2 主进程 -> 渲染进程

- `ipcRenderer.on('project:created', (event, newProject))`：通知渲染进程项目已创建。
- `ipcRenderer.on('project:all', (event, projects))`：向渲染进程发送所有项目列表。
- `ipcRenderer.on('project:updated', (event, updatedProject))`：通知渲染进程项目已更新。
- `ipcRenderer.on('project:deleted', (event, projectId))`：通知渲染进程项目已删除。
- `ipcRenderer.on('chapter:created', (event, newChapter))`：通知渲染进程章节已创建。
- `ipcRenderer.on('chapter:all', (event, chapters))`：向渲染进程发送指定项目下的所有章节列表。
- `ipcRenderer.on('chapter:updated', (event, updatedChapter))`：通知渲染进程章节已更新。
- `ipcRenderer.on('chapter:deleted', (event, chapterId))`：通知渲染进程章节已删除。
- `ipcRenderer.on('tts:synthesis-started', (event, chapterId))`：通知渲染进程指定章节的合成已开始。
- `ipcRenderer.on('tts:synthesis-progress', (event, chapterId, progress))`：通知渲染进程指定章节的合成进度。
- `ipcRenderer.on('tts:synthesis-completed', (event, chapterId, audioFilePath))`：通知渲染进程指定章节的合成已完成，并提供音频文件路径。
- `ipcRenderer.on('tts:synthesis-failed', (event, chapterId, error))`：通知渲染进程指定章节的合成失败，并提供错误信息。
- `ipcRenderer.on('service-provider:created', (event, newConfig))`：通知渲染进程服务商配置已创建。
- `ipcRenderer.on('service-provider:all', (event, configs))`：向渲染进程发送所有服务商配置列表。
- `ipcRenderer.on('service-provider:updated', (event, updatedConfig))`：通知渲染进程服务商配置已更新。
- `ipcRenderer.on('service-provider:deleted', (event, configId))`：通知渲染进程服务商配置已删除。
- `ipcRenderer.on('settings:updated', (event, settings))`：通知渲染进程应用设置已更新。
- `ipcRenderer.on('settings:all', (event, settings))`：向渲染进程发送所有应用设置。

## 7. 关键任务和注意事项

- **第三方语音服务商 API 集成：** TODO: 需要研究各服务商的 API 文档，实现文本到语音的转换功能。可能需要处理不同的认证方式和请求参数。
- **API 密钥的安全存储：** TODO: 确保用户配置的 API 密钥以安全的方式存储在本地，防止泄露。可以考虑使用Electron的keytar或其他加密方式。
- **错误处理机制：** TODO: 完善错误处理机制，以便在语音合成失败或其他操作出错时，能够向用户提供清晰的错误提示。
- **数据持久化：** 已实现基础功能，使用JSON文件存储数据。TODO: 考虑添加数据备份和恢复功能。
- **用户界面开发：** 已实现基础功能，使用 Vue3、TypeScript 和 Tailwind CSS 构建了用户友好的界面。TODO: 添加语音播放功能的UI组件。
- **主进程和渲染进程的通信：** 已实现基础功能，使用Electron的IPC机制确保了两个进程之间的数据传递。TODO: 添加进度通知机制。
- **主题切换功能的实现：** 已实现基础功能，通过Tailwind CSS的暗色模式支持实现了主题切换。
- **文件导出功能：** TODO: 完善生成的音频文件导出功能，支持不同格式和质量设置。
- **测试和调试：** TODO: 编写单元测试和集成测试，确保软件的各项功能正常工作。
- **考虑不同服务商的差异：** TODO: 针对不同的语音服务商在UI上进行适当的适配和提示。

## 8. 依赖项审查

您提供的依赖项基本满足需求，可以补充一些可能需要的依赖：

**主进程依赖：**

- Electron
- Axios
- electron-updater： 实现自动更新功能。
- **`fs-extra` 或 `node:fs/promises`：** 用于文件系统操作，例如保存合成的音频文件、读写配置文件等。
- **`ffmpeg`：** 高级功能：进行更复杂的音频处理，例如格式转换等。

**UI 页面依赖：**

- Vue3
- vue-router
- TypeScript
- Pinia
- Tailwindcss
- **`vue-toastification` 或其他通知库：** 用于显示操作成功的提示或错误消息。
