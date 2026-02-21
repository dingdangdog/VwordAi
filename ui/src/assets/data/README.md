# TTS 本地数据说明

本目录用于 TTS 模型与情感的**展示与兜底**，与后端分工如下。

## 数据职责

- **后端**：通过官方 API 同步模型列表（如 Azure），存储 `code/name/emotions` 等；情感来自 API 的 style 列表，多为英文 code。
- **前端**：用本目录数据做**本地化展示**和**无缓存时的兜底**。

## 文件说明

| 文件 | 用途 |
|------|------|
| `models.json` | 各服务商的**静态模型列表**。当某服务商尚未同步或缓存为空时，作为兜底展示；同步后以「设置 → 语音模型」中缓存的列表为准。 |
| `emotions.json` | **情感 code → 中文名** 的映射，用于界面友好展示。Azure 等 API 只返回英文 code，此处提供中文名（如 `cheerful` → 愉快）。 |
| `roles.json` | **角色/风格 code → 中文名** 的映射，用于需要展示角色名称的场景。 |

## 为何放前端

- 展示与多语言/本地化强相关，放在前端便于随 UI 迭代。
- 后端只负责拉取并存储官方结构；前端用本目录做「code → 展示名」的增强，避免在接口里写死多语言。

结论：**模型列表的权威数据由后端同步并缓存；本目录负责兜底与本地化展示。**

---

## 同步后的模型数据存在哪里？如何确认？

同步 Azure（或后续其他服务商）的语音模型后，数据写在后端**同一份 TTS 配置**里，和 Azure 的 key、region 等放在一起。

- **存储键名**：`voiceModelsCache`（在 TTS 配置对象里）
- **配置文件**：`config/tts.json`
  - **开发环境**：项目根目录下的 `config/tts.json`（即 `e:\Code\VwordAi\config\tts.json`）
  - **打包后**：Electron 的 userData 目录下的 `config/tts.json`（如 Windows：`C:\Users\<用户名>\AppData\Roaming\VwordAi\config\tts.json`，以实际应用名为准）

**如何确认同步是否生效：**

1. 在应用内：设置 → 语音服务 → 选 Azure → 点「同步模型」，等待提示成功。
2. 打开上述 `config/tts.json`，应能看到顶层有 `"voiceModelsCache"` 字段，其下按服务商分 key，例如：
   - `"voiceModelsCache": { "azure": [ { "code": "zh-CN-XiaoxiaoNeural", "name": "晓晓", "provider": "azure", "lang": "zh-CN", "gender": "0", "emotions": [ { "code": "cheerful", "name": "cheerful" }, ... ] }, ... ] }`
3. 若 `voiceModelsCache.azure` 是数组且长度 > 0，说明已正确写入；前端「语音模型」列表和读小说里的角色选模型，都会优先用这里的缓存。
