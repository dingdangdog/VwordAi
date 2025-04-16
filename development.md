# 项目开发规范文档

## 1. **目录结构**

- 项目应遵循模块化和清晰的目录结构，确保各部分职责分明。

### UI

```bash
/ui/src
  /assets          # 静态资源
  /components      # 共享组件
  /views           # 页面组件
  /store           # 状态管理 (Pinia)
  /utils           # 工具类函数
  /services        # API 服务
```

### Main主线程

```bash
main.js          # 主进程代码
preload.js       # 加载后端接口暴露出去
handler.js       # 接口交互处理进程
/server          # 后端逻辑代码
  /controllers   # 后端入口
  /services      # 后端业务逻辑
  /models        # 主要数据类型
  /provider      # 第三方服务调用工具
  /utils         # 后端通用工具函数
/sotrage         # 存储数据文件夹
```

## 2. **代码风格**

- **前端 TypeScript**：所有前端应使用 TypeScript，避免使用 JavaScript。
- **后端 JavaScript**：由于Electron的限制，后端应使用 JavaScript。
- **前端 Vue3 组合式 API**：优先使用组合式 API (`setup`) 来书写组件，避免使用选项式 API。
- **函数命名**：采用 camelCase 风格。
- **类和接口命名**：类和接口使用 PascalCase 风格。

## 3. **技术点**

### 3.1 **文件读取方式**

- 所有文件操作（如读取文件内容、上传/下载文件等）应该优先考虑本地文件路径，而不是从互联网 URL 读取数据。通过 Electron 的主进程使用 `fs` 模块进行文件操作。
- 当需要读取文件时，尽量通过 `file://` 协议或相对路径进行文件读取，而非依赖外部资源的网络路径。

**示例：**

```typescript
import { app } from 'electron';
import fs from 'fs';
import path from 'path';

// 获取本地文件路径
const filePath = path.join(app.getPath('userData'), 'myFile.txt');

// 读取文件内容
fs.readFile(filePath, 'utf-8', (err, data) => {
  if (err) throw err;
  console.log(data);
});
```

### 3.2 **本地存储与数据库**

- 本地存储应优先使用 Electron 的本地存储 API，如 `localStorage`，以避免不必要的网络请求。
- 需要存储大量数据或持久化数据时时，使用本地 JSON 文件来存储，而不是依赖于云端数据库。

### 3.3 **性能优化**

- **懒加载组件**：使用 `Vue3` 的异步组件功能来减少页面初次加载的时间。

  **示例：**

  ```typescript
  const MyComponent = defineAsyncComponent(() => import('./MyComponent.vue'));
  ```

- **避免频繁更新状态**：避免在组件内部频繁修改状态，可以通过 Vuex 或 Pinia 来管理跨组件的状态。

- **内存管理**：确保事件监听器和定时器能在不再需要时及时清理，防止内存泄漏。

### 3.4 **UI 与交互**

- **紧凑式设计**：UI设计保持紧凑型！尽量减少UI间的空白！
- **简洁UI设计**：UI要尽可能采取简单化，按钮应尽可能采用文字类型！
- **避免长时间阻塞 UI**：不要在主进程中执行长时间的计算任务，应通过 `setTimeout`、`setInterval` 或 `worker` 等方式将任务拆分成小块，避免冻结 UI。

### 3.5 **安全性**

- **防止 XSS 攻击**：在渲染进程中加载 `HTML` 内容时，避免使用 `innerHTML` 或 `v-html`，如果必须使用，确保已对数据进行彻底清理。
- **避免执行不信任的代码**：避免直接执行从网络下载的 `JavaScript` 文件或不可信的代码。
- **限制 Electron 权限**：通过 `electron-builder` 配置只暴露必要的 Electron API，减少不必要的权限暴露。

### 3.6 **API 调用与网络请求**

- 在与远程服务器交互时，使用 `Axios` 或 `Fetch API` 进行网络请求。所有请求应该进行错误处理和超时设置。
- **Token 管理**：`Token` 应通过安全存储进行管理，优先考虑使用 `electron-store` 存储用户凭证。

### 3.7 **跨平台开发**

- 确保应用在 Windows、macOS 和 Linux 上都能够正常运行，注意平台特有的路径分隔符和文件权限。
- 使用 Electron 的 `path` 模块来处理不同操作系统的路径问题。

### 3.8 **自动化构建与发布**

- 使用 `electron-builder` 进行自动化打包和发布。确保在构建前完成所有的依赖和环境设置。
- 构建时，确保生成的二进制文件适配目标操作系统（Windows、macOS、Linux）。

## 4. **注意事项**

- **资源管理**：避免不必要的静态资源加载，图片等资源应使用 WebP 或其他压缩格式以减少应用体积。
- **错误处理**：始终使用 `try-catch` 来捕获异常，并提供用户友好的错误信息。
- **日志记录**：在开发过程中，使用 `console.log` 进行调试；在生产环境中，应通过 Electron 的日志系统或自定义的日志系统记录关键操作和错误。
