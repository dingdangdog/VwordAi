# 001 - LLM 配置可拉取模型并修改协议

**日期：** 2026-10-17

## 背景 / 问题

LLM 配置里的模型只能手填，编辑已有服务商时协议也不能改。

## 变更内容

- 新增 `llm:list-models`。按当前表单里的协议、密钥和 Endpoint 向服务商拉取模型；OpenAI、Azure、Gemini、Claude、火山引擎、阿里云百炼会尝试对应的列表接口。
- 拉取成功后用下拉选择模型，并保留「手动输入」。接口不存在、返回空列表或请求失败时，仍可直接填写模型名称。
- 打开已保存且密钥齐全的服务商时自动拉取一次；新建或改过连接信息后，用「获取模型」重新拉取。
- 编辑配置时可以修改协议，保存后按新协议调用。

## 影响范围

- `server/llm/listModels.js`
- `server/controllers/LLMController.js`
- `ui/src/api/settingsApi.ts`
- `ui/src/stores/settings.ts`
- `ui/src/types/index.ts`
- `ui/src/components/settings/llm/LLMProviderForm.vue`

## 数据库与兼容性

- 无数据库变更。模型列表不落盘，仍只保存用户选中的 `model` 和 `protocol`。
- 已有服务商配置可直接编辑协议，不需要迁移。

## 验证

- `node --check` 与模型列表辅助函数检查：通过。覆盖模型名归一、未知协议、缺少密钥。
- `vue-tsc --noEmit`：本次改动文件无新增类型错误。项目原有错误仍在 `ChapterProcessor.vue`、`ChapterEditor.vue`、`ReadNovels.vue`、`AboutView.vue` 和 `settings.ts` 的既有写法上。
- 浏览器打开设置页的 LLM 表单：协议可切换，字段随协议变化；模型可手填；未填密钥时提示先填写密钥。明暗主题下「获取模型」与输入框对齐。
- 未在 Electron 中用真实服务商密钥验证列表接口。

## 未做事项

- 未对真实 OpenAI、Azure、Gemini、Claude、火山引擎、阿里云账号做联调。
