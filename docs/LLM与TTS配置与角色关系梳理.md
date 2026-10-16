# LLM 与 TTS 配置及角色关系梳理

本文档梳理本系统中 **LLM 配置** 与 **TTS 配置/角色** 的存储、管理入口、查询位置及使用位置，便于理清「哪里可设置可选项（添加/删除/管理）」「哪里查询这些配置」「哪里使用这些配置」。

---

## 一、LLM 配置关系

### 1.1 数据存储

| 项目 | 说明 |
|------|------|
| **存储键** | `server/models/Settings.js` 中 `LLM_CONFIG_KEY = "llm"`，通过 storage 持久化 |
| **结构** | `{ providers: { [providerId]: { id, name, protocol, key?, appkey?, token?, endpoint?, model?, temperature?, maxTokens?, topP?, status? } } }` |
| **默认** | `DEFAULT_LLM_SETTINGS = { providers: {} }` |

- **providerId**：由前端生成，如 `openai-xxx`、`volcengine-xxx`，或协议+时间戳。
- **协议 (protocol)**：openai、azure、volcengine、aliyun、gemini、claude 等，见 `LLM_PROTOCOLS`。

### 1.2 可选项管理（添加 / 删除 / 编辑）

| 能力 | 位置 | 说明 |
|------|------|------|
| **列表展示 + 选择/添加/删除** | `ui/src/components/settings/LLMSettings.vue` | 左侧展示 `providersList`，点击「添加」或某服务商进入表单 |
| **单条编辑/新增表单** | `ui/src/components/settings/llm/LLMProviderForm.vue` | 编辑名称、协议、API Key、endpoint、model、temperature 等；保存、测试连接、删除 |
| **添加** | Store: `settingsStore.addLLMProvider(data)` → API: `updateLLMProviderSettings(id, provider)` | IPC: `update-llm-provider-settings`（SettingsController） |
| **编辑** | Store: `settingsStore.updateLLMProvider(id, data)` → 同上 API | 同上 IPC |
| **删除** | Store: `settingsStore.deleteLLMProvider(providerId)` → API: `deleteLLMProvider(providerId)` | IPC: `delete-llm-provider`（SettingsController） |
| **测试连接** | Store: `settingsStore.testLLMProviderConnection(providerId, data)` | IPC: `llm:test-provider-connection`（LLMController） |

后端：

- **SettingsController.js**：`get-llm-settings`、`update-llm-settings`、`get-llm-provider-settings`、`update-llm-provider-settings`、`delete-llm-provider`。
- **LLMController.js**：仅负责 `llm:test-provider-connection`（根据 provider 的 protocol 调用对应 LLM 客户端测试）。

### 1.3 查询 LLM 配置与提供商列表

| 用途 | 位置 | 方式 |
|------|------|------|
| 设置页列表与表单 | `LLMSettings.vue`、`LLMProviderForm.vue` | `settingsStore.getLLMProviders()`、`settingsStore.getLLMProviderConfig(selectedId)` |
| 读章页选择解析用 LLM | `ui/src/views/ReadNovelsChapter.vue` | `llmProviders = settingsStore.getLLMProviders()`，下拉 `selectedLLMProvider` |
| 章节解析时确定用哪个 LLM | `server/controllers/ChapterProcessingController.js` | `Settings.getLLMSettings()` → `providers`，`providerId = chapter.llmProvider \|\| Object.keys(providers)[0]` |
| Store 内部 | `ui/src/stores/settings.ts` | `loadLLMSettings()` → `settingsApi.getLLMSettings()` → IPC `get-llm-settings` |

### 1.4 使用 LLM 提供商（业务）

| 场景 | 位置 | 说明 |
|------|------|------|
| 章节解析 | `ChapterProcessingController.js`（`llm:parse-chapter`） | 取 `chapter.llmProvider` 或第一个已配置的 provider，调 `LLMService.parseText(content, providerId, providerConfig)` |
| 章节绑定 LLM | `ReadNovelsChapter.vue` | 切换下拉时 `novelApi.updateChapter(chapterId, { llmProvider: selectedLLMProvider })`，并写回 `chapter.llmProvider` |
| 解析前写入 | `ReadNovelsChapter.vue` | 解析/批量解析前可把当前选择的 `selectedLLMProvider` 写入章节再请求解析 |

小结：**LLM 的“可选项”即“服务商”**，在设置页增删改；在读章页被**查询**并**选择**为当前章节的解析引擎；在**章节解析**时由服务端按 `chapter.llmProvider` 或默认取一个 provider 真正**调用**。

---

## 二、TTS 配置与“角色”关系

TTS 侧有两层概念：

1. **TTS 服务商配置**：azure、aliyun、tencent 等账号级配置（key、region、appkey、token 等）。
2. **TTS“角色”**：小说角色 + 绑定到该角色的**默认语音**（服务商 + 语音模型）。段落/直播等再按“角色”或默认规则选用语音。

### 2.1 TTS 服务商配置（账号级）

#### 数据存储

| 项目 | 说明 |
|------|------|
| **存储键** | `TTS_CONFIG_KEY = "tts"`（Settings 模型） |
| **结构** | 按服务商 key 平铺：`{ azure: {...}, aliyun: {...}, tencent: {...}, baidu: {...}, openai: {...}, voiceModelsCache: {...} }` |
| **voiceModelsCache** | `tts:get-voice-models` / `tts:sync-voice-models` 读写，结构为 `{ [provider]: VoiceModel[] }`，供前端“语音模型”下拉等使用 |

前端**可用的服务商列表**来自常量，不是从后端动态增删：

- `ui/src/stores/settings.ts`：`SUPPORTED_TTS_PROVIDERS = [ { id: "azure", name: "Azure", type: "azure" }, { id: "aliyun", name: "阿里云", type: "aliyun" }, ... ]`  
- 当前仅 azure、aliyun 未注释；tencent、openai 等可被注释掉，相当于“不可选”。

#### 可选项管理（仅“配置”，不增删服务商类型）

| 能力 | 位置 | 说明 |
|------|------|------|
| 选择服务商类型 + 配置/语音模型 Tab | `ui/src/components/settings/VoiceServiceSettings.vue` | 左侧列表来自 `SUPPORTED_TTS_PROVIDERS`，右侧按类型展示 Azure/Aliyun/Tencent/Openai 的表单组件 |
| 单类型配置表单 | `ui/src/components/settings/tts/` 下各 `*ProviderForm.vue` | 填写 key、region、appkey、token 等；保存、测试连接 |
| 保存 | `settingsStore.updateTTSProvider(type, config)` | → `settingsApi.updateTTSProviderSettings(provider, data)` → IPC `update-tts-provider-settings`（SettingsController） |
| 测试 | `settingsStore.testTTSProviderConnection(type, config)` | IPC `tts:test-provider-connection`（TTSController） |
| 语音模型同步 | `VoiceServiceSettings.vue` 内「同步模型」 | `ttsApi.syncVoiceModels('azure', locale)` → IPC `tts:sync-voice-models`（仅 Azure） |

后端：

- **SettingsController.js**：`get-tts-settings`、`update-tts-settings`、`get-tts-provider-settings`、`update-tts-provider-settings`。
- **TTSController.js**：`tts:get-config`、`tts:update-config`、`tts:get-provider-config`、`tts:update-provider-config`、`tts:test-provider-connection`、`tts:get-voice-models`、`tts:sync-voice-models`；以及 `service-provider:*` 一组（与上面部分重叠，兼容用）。

说明：**TTS 服务商类型**（azure/aliyun/…）是前端常量，没有“添加/删除服务商类型”的入口；只能在这些固定类型下**编辑配置**和**同步语音模型**。

### 2.2 查询 TTS 服务商配置

| 用途 | 位置 | 方式 |
|------|------|------|
| 设置页 | `VoiceServiceSettings.vue` | `settingsStore.getTTSProviderConfig(type)`、`settingsStore.getTTSProviders()` |
| 当前使用的 TTS 类型 | Store：`activeTTSProviderType` | 读章页、角色弹窗等用其做默认 provider |
| 读章页段落默认/角色映射 | `ReadNovelsChapter.vue` | `settingsStore.activeTTSProviderType`、`getEffectiveTtsForSegment`（结合角色 ttsConfig） |
| 角色弹窗 | `CharacterModal.vue` | `settingsStore.getTTSProviders()` 得到“TTS 服务商”下拉选项；`settingsStore.activeTTSProviderType` 作默认 |
| 直播 TTS | `BiliveView.vue` | 固定用 `settingsStore.getTTSProviderConfig("azure")` 取 Azure 配置 |
| 段落合成 | `SegmentTTSController.js` | `Settings.getTTSSettings()`，再按 segment 的 `ttsConfig.provider` 取 `ttsSettings[providerType]` |

### 2.3 TTS“角色”——小说角色 + 默认语音

这里的“角色”指：**小说角色**（可添加/删除/编辑），并为每个角色绑定**默认 TTS 服务商 + 语音模型**。段落/合成时按“谁在说话”匹配到角色，再用该角色的语音。

#### 角色数据存储与 API

| 项目 | 说明 |
|------|------|
| 存储 | 按小说维度：`novel.characters` 或通过 Novel 相关 API 读写角色列表 |
| 单角色结构 | 含 `name, type, gender, age, description, ttsConfig: { provider, model }` 等；`ttsConfig` 即该角色默认语音 |
| 前端 API | `novelApi.getCharacters(novelId)`、`novelApi.createCharacter(data)`、更新角色（如通过 novel 或单独接口） |

#### 可选项管理（角色的增删改 + 语音绑定）

| 能力 | 位置 | 说明 |
|------|------|------|
| 角色列表与入口 | `ReadNovelsChapter.vue`（及可能存在的角色管理入口） | 打开角色管理/弹窗，列出该小说角色 |
| 添加/编辑角色 + 绑定语音 | `ui/src/components/ReadNovels/CharacterModal.vue` | 表单：角色名、类型、性别、年龄、描述；**角色声音配置**：TTS 服务商下拉（`getTTSProviders()`）、语音模型下拉（来自 `tts:get-voice-models` 的 voiceModelsCache），试听 |
| 保存角色 | CharacterModal 内 | 调用 novel 相关 API 创建/更新角色（含 `ttsConfig`） |
| 解析后自动加角色 | `ReadNovelsChapter.vue` 的 `extractAndAddCharacters` | 从解析结果中提取角色名，若不存在则自动 `createCharacter`，并按性别用 `pickDefaultModelByGender` 选默认语音写入 `ttsConfig` |

说明：**角色的增删改**在角色管理/CharacterModal 中；**语音模型可选列表**来自 `tts:get-voice-models`（即设置里同步后的 voiceModelsCache），不是在本页动态增删“模型”，而是选已有模型绑定到角色。

### 2.4 查询“角色”与语音

| 用途 | 位置 | 方式 |
|------|------|------|
| 读章页匹配段落→角色→语音 | `ReadNovelsChapter.vue` | `characters = novelApi.getCharacters(novelId)`；`matchingCharacters(segment.character)`；`getEffectiveTtsForSegment(segment)` 用角色 `ttsConfig.provider/model` |
| 情感等选项 | `ReadNovelsChapter.vue` | `getEmotionsForSegment` 用 `voiceModelsCache[provider]`（来自 `ttsApi.getVoiceModels()`） |
| 角色弹窗内模型列表 | `CharacterModal.vue` | `cachedVoiceModels` ← `ttsApi.getVoiceModels()`，按 `form.ttsConfig.provider` 过滤出 `availableVoiceModels` |
| 全段应用角色语音 | `ReadNovelsChapter.vue` | `ensureAllSegmentsTtsFromCharacters`、`reapplyCharacterTtsConfigs`、`autoConfigureTts` 等，把角色的 provider/model 写入各 segment 的 `ttsConfig` |

### 2.5 使用 TTS 配置与角色（业务）

| 场景 | 位置 | 说明 |
|------|------|------|
| 单段合成 | `SegmentTTSController.synthesizeSegment` | 用 `segmentData.ttsConfig.provider` 和 `ttsConfig.model/voice`，从 `Settings.getTTSSettings()` 取对应 provider 配置再调用 TTS |
| 全章分段合成 | `SegmentTTSController.synthesizeAllSegments` | 用 `ScriptToTtsMapper.scriptToTtsReadySegments(script, characters, parsedData.segments, defaultProvider)` 把“剧本+角色”转成每段的 provider/voice/volume/speed 等，再逐段合成 |
| 读章页单段/整章生成 | `ReadNovelsChapter.vue` | 调用 `tts:synthesize-segment` / `tts:synthesize-all-segments` 等，段落上的 `ttsConfig` 已由角色或默认填好 |
| 直播朗读 | `BiliveView.vue` | 使用 Azure 配置 `getTTSProviderConfig("azure")` 做 TTS 播报 |

---

## 三、语音模型缓存（voiceModelsCache）

| 项目 | 说明 |
|------|------|
| 存储 | 在 TTS 配置下：`Settings.getTTSSettings()[voiceModelsCacheKey]`，键名见 TTSController 内常量 |
| 同步 | 设置页「语音模型」Tab 内「同步模型」→ `tts:sync-voice-models`，当前仅支持 Azure |
| 查询 | `tts:get-voice-models` → 前端 `ttsApi.getVoiceModels()`，供 VoiceServiceSettings、CharacterModal、ReadNovelsChapter 等使用 |
| 使用 | 角色弹窗选“语音模型”、读章页情感/模型展示、自动为新角色按性别选默认模型等 |

---

## 四、汇总表

| 配置/角色类型 | 可设置/管理入口 | 查询位置 | 使用位置 |
|---------------|-----------------|----------|----------|
| **LLM 服务商** | 设置 → LLM：LLMSettings + LLMProviderForm（添加/编辑/删除/测试） | ReadNovelsChapter（下拉）、Store（getLLMProviders/getLLMProviderConfig）、ChapterProcessingController（解析时） | ChapterProcessingController（llm:parse-chapter）、章节 llmProvider 绑定 |
| **TTS 服务商配置** | 设置 → 语音服务：VoiceServiceSettings + 各 *ProviderForm（仅编辑、测试；类型为常量） | VoiceServiceSettings、CharacterModal、ReadNovelsChapter、BiliveView、SegmentTTSController | SegmentTTSController、TTSService、BiliveView |
| **TTS 语音模型列表** | 设置 → 语音服务 → 语音模型 Tab：同步模型（Azure） | CharacterModal、ReadNovelsChapter（情感/模型选项）、extractAndAddCharacters 默认选音 | 角色 ttsConfig.model、段落 ttsConfig.model、合成时 voice/model 参数 |
| **小说角色（含 TTS 绑定）** | 读章页角色管理 + CharacterModal（添加/编辑角色，绑定服务商+语音模型） | ReadNovelsChapter（matchingCharacters、getEffectiveTtsForSegment）、SegmentTTSController（ScriptToTtsMapper 用 novel.characters） | ReadNovelsChapter（段落展示与生成）、SegmentTTSController（synthesizeAllSegments）、ScriptToTtsMapper |
| **段落级 TTS 参数** | ReadNovelsChapter：段落 TTS 弹窗（语速、情感、音调、音量）；服务商与模型沿用角色 | 同页 displaySegments、currentTtsConfig | 合成时 segment.ttsConfig 传给 tts:synthesize-segment / synthesize-all-segments |

---

## 五、IPC / API 速查

- **LLM**  
  - 配置：`get-llm-settings`、`update-llm-settings`、`get-llm-provider-settings`、`update-llm-provider-settings`、`delete-llm-provider`（SettingsController）  
  - 测试：`llm:test-provider-connection`（LLMController）  
  - 业务：`llm:parse-chapter`、`llm:parse-chapters-batch`（ChapterProcessingController）

- **TTS**  
  - 配置：`get-tts-settings`、`update-tts-settings`、`get-tts-provider-settings`、`update-tts-provider-settings`（SettingsController）；`tts:get-config`、`tts:update-config`、`tts:get-provider-config`、`tts:update-provider-config`（TTSController）  
  - 测试：`tts:test-provider-connection`（TTSController）  
  - 语音模型：`tts:get-voice-models`、`tts:sync-voice-models`（TTSController）  
  - 合成：`tts:synthesize-segment`、`tts:synthesize-all-segments`、`tts:synthesize-full-chapter`（SegmentTTSController）；`tts:synthesize`、`tts:synthesize-multiple`（ChapterProcessingController / TTSService，若仍使用）

以上即本系统中 LLM 配置与 TTS 配置/角色关系的完整梳理。
