# Electron前后端交互说明

再次强调：这是一个electron项目！项目得基本架构是：vue3+tailwindcss编写前端，electron主进程（js）编写后端，存储所有重要数据都应该使用后端，存储为持久化得数据文件，存储到硬盘上！包括但不限于：系统配置信息、服务商配置信息、项目信息、文章信息等等！

目前规划的前后端交互流程是：

1. 前端需要调用的接口，全部封装到 @[api.ts](./ui/src/utils/api.ts) 中，业务封装如： [project](./ui/src/stores/projects.ts)和[settings](./ui/src/stores/settings.ts) ，随后在前端任意页面中调用即可；
2. @[handler.js](./handler.js) 文件与 @[main.js](./main.js) 主进程配置，确保接收到前端发过来的所有请求；
3. @[preload.js](./preload.js) 中加载后端所有接口，并在  @main.js 中将前端请求动态路由到不同的后端实际接口；
4. @server 文件夹中编写全部的后端接口与功能，包括但不限于：配置保存、文件读取、第三方接口调用、文本转语音并保存、语音文件格式转换(基于ffmpeg)等等！比如 [TTS](./server/services/TTSService.js)；
