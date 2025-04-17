/**
 * 应用程序配置信息
 * 集中管理应用的元数据，便于升级时统一更新
 */

export const appConfig = {
  // 基本信息
  name: "文声AI",
  nameEn: "VwordAi",
  version: "0.0.6",
  releaseDate: "2025年4月16日",
  copyright: "© 2025 VwordAi.com 保留所有权利。",
  
  // 描述信息
  description: "VwordAi 是一款文本转语音工具，支持多种语音服务提供商，让您轻松将文本转为自然流畅的语音。",
  
  // 外部链接
  website: "https://vwordai.com",
  github: "https://github.com/dingdangdog/vwordai",
  
  // 更新相关配置
  updateURL: "https://api.github.com/repos/dingdangdog/vwordai/releases/latest",
  // 是否启用自动检查更新
  enableAutoUpdate: true,
  // 自动检查更新的间隔 (毫秒), 默认为7天
  updateCheckInterval: 7 * 24 * 60 * 60 * 1000
}; 