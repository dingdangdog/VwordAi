# AI 读小说功能架构设计

## 一、核心功能目标

通过 AI 大模型解析小说文本，将文字按顺序解析为「对话剧本」（含旁白）；每句话解析出：**角色、情感、语速、模仿音**（装小孩、装老人等）。再将**角色名**与**角色设置的语音模型**合并，整理为各 TTS 服务所需参数（角色 code、情感 code、语速等），调用第三方 TTS（普通 API 或 SSML），最后将一章内所有语音合并为整章音频。

**流程概括**：小说章节原文 → 大模型解析 → **本软件中间通用数据（剧本）** → 角色映射 + TTS 参数整理 → 各厂商 TTS 调用 → 段落音频合并 → 整章音频。

---

## 二、整体功能逻辑（数据流）

```
┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────────────┐
│  章节原文        │ ──► │  LLM 适配层               │ ──► │  中间通用数据（剧本）    │
│  (raw content)   │     │  各厂商 → 统一剧本格式     │     │  Script / ScriptSegment │
└─────────────────┘     └──────────────────────────┘     └────────────┬────────────┘
                                                                       │
                                                                       ▼
┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────────────┐
│  整章音频        │ ◄── │  音频合并服务              │ ◄── │  段落音频文件列表        │
│  (merged audio)  │     │  mergeAudioFiles           │     │  (每段 TTS 输出)         │
└─────────────────┘     └──────────────────────────┘     └────────────┬────────────┘
                                                                       │
                                                                       ▼
┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────────────┐
│  角色列表        │ ──► │  角色映射层               │ ──► │  TTS 就绪段落            │
│  (Character[])  │     │  剧本 + 角色 → TTS 参数   │     │  TtsReadySegment[]      │
└─────────────────┘     └──────────────────────────┘     └────────────┬────────────┘
                                                                       │
                                                                       ▼
                                                                 ┌─────────────────────────┐
                                                                 │  TTS 适配层              │
                                                                 │  统一输入 → 各厂商       │
                                                                 │  SSML/API → 单段音频    │
                                                                 └─────────────────────────┘
```

- **LLM 适配层**：输入 = 章节原文 + LLM 配置；输出 = **中间剧本**（仅含角色、情感、语速、模仿音、文本，不包含任何厂商 TTS code）。
- **角色映射层**：输入 = 剧本 + 小说角色列表（含每角色 TTS 配置）；输出 = **TTS 就绪段落**（含 provider、voice/model、emotion、speed 等各厂商所需字段）。
- **TTS 适配层**：输入 = 单条 TTS 就绪段落；输出 = 单段音频文件路径；内部按 provider 转 SSML 或调 API。
- **音频合并**：输入 = 段落音频路径列表（顺序）；输出 = 整章音频文件。

---

## 三、数据结构设计

### 3.1 中间通用数据（剧本）— 与厂商无关

**设计原则**：只描述「谁在什么情绪下以什么语速/模仿音说了什么」，不包含任何 TTS 厂商的 code（如 voice code、emotion code）。

```ts
// 剧本中的单条（LLM 输出统一转换为此格式）
interface ScriptSegment {
  index: number;           // 顺序
  text: string;           // 待朗读文本
  character: string;       // 角色名，如 "旁白"、"张三"
  emotion?: string;       // 情感描述，如 "平静"、"愤怒"、"悲伤"
  speed?: number;         // 语速相对值，如 -20 ~ 20，0 为正常
  mimicry?: string;       // 模仿音/情景，如 "女孩"、"男孩"、"年长男性"、"dft" 表示默认
}

// 一章的剧本（持久化在章节 parsedData 中）
interface Script {
  title: string;
  segments: ScriptSegment[];
  createdAt: string;
  updatedAt: string;
  llmProvider?: string;    // 用于记录解析时使用的 LLM
}
```

- **character**：直接使用小说中的角色名或「旁白」，便于与「角色列表」按名称/别名匹配。
- **emotion**：统一用中文或约定枚举（如平静/愤怒/悲伤等），由 TTS 适配层再映射到各厂商的 emotion/style code。
- **speed**：统一相对值（如 -50~50），由 TTS 适配层转换为各厂商的 speed 参数。
- **mimicry**：如「女孩」「男孩」「年长男性」等，用于未绑定角色时的默认声音倾向；若段落已通过角色绑定到具体 voice，可忽略或作为 hint。

### 3.2 角色配置（现有扩展）

沿用现有 `Character`，关键字段：

- `name`, `aliases`：用于与 `ScriptSegment.character` 匹配。
- `ttsConfig`：`{ provider, model, speed, pitch, volume, emotion?, style? }`（各厂商 code 由前端/设置页选择后写入）。

无需新增结构，仅保证「角色映射层」读取的是同一份 Character 列表。

### 3.3 TTS 就绪段落 — 送入 TTS 适配层的输入

角色映射层输出：把「剧本段」+「匹配到的角色」合并成每条 TTS 所需全部参数（含厂商 code）。

```ts
interface TtsReadySegment {
  index: number;
  text: string;
  provider: TTSProviderType;   // 如 "azure" | "aliyun" | ...
  voice: string;              // 厂商 voice/model code
  emotion?: string;           // 厂商 emotion/style code（可选）
  style?: string;
  speed: number;               // 已转换为厂商可用的数值
  pitch: number;
  volume: number;
  // 若厂商需要 SSML，由适配层内部根据以上字段生成 SSML
}
```

- 前端/业务层不关心 SSML 长什么样，只提供 `TtsReadySegment`；各厂商的 SSML 生成封装在 TTS 适配层内部。

### 3.4 解析结果持久化（与现有章节兼容）

章节的 `parsedData` 存 **Script**（即中间通用数据）。为兼容现有前端展示与编辑，可在同一份数据上保留「可编辑」扩展字段（如每段的 ttsConfig 覆盖、audioUrl 等），但**核心交换格式**是 Script：

- 从 LLM 出来 → 先转成 Script 再落库。
- 角色映射层读取：章节 `parsedData`（Script）+ 小说角色列表 → 生成 `TtsReadySegment[]`（可不落库，仅用于调用 TTS）。
- 若需要「每段已选 voice/情感」的持久化，可在 `ScriptSegment` 上增加可选字段 `ttsOverride?: Partial<TtsReadySegment>`，角色映射时优先使用 override，否则用角色配置 + 剧本默认。

### 3.5 前端展示用「段落」结构（与 Script 一致 + 覆盖与音频）

为减少前端心智负担，页面展示的「解析结果」可直接用 Script + 每段的可选覆盖与音频状态：

```ts
interface ParsedSegmentDisplay {
  ...ScriptSegment;           // index, text, character, emotion?, speed?, mimicry?
  ttsConfig?: SegmentTtsConfig;  // 可选：用户在本段上覆盖的 TTS 配置（含 provider/model/emotion/speed 等）
  synthesisStatus?: "unsynthesized" | "synthesized";
  audioUrl?: string;
  audioPath?: string;
}
```

- 存储上：`parsedData.segments` 存为 `ParsedSegmentDisplay[]`，其中 `ttsConfig` 为可选覆盖；若没有则角色映射时完全依赖角色列表。
- 这样「中间数据」仍然是 Script 语义（角色名 + 情感 + 语速 + 模仿音），仅多了一层可选覆盖与音频状态，便于编辑和回放。

---

## 四、模块划分与职责

| 模块 | 职责 | 输入 | 输出 |
|------|------|------|------|
| **LLM 适配层** | 调用各厂商 LLM，将原始响应转为统一 Script | 章节原文、LLM provider 配置 | `Script`（segments 为 ScriptSegment[]） |
| **中间数据存储** | 持久化/读取 Script（章节 parsedData） | Script / chapterId | Script |
| **角色映射层** | 剧本 + 角色列表 → TTS 就绪段落 | Script、Character[]、可选 per-segment ttsOverride | TtsReadySegment[] |
| **TTS 适配层** | 按 provider 将 TtsReadySegment 转为 SSML 或 API 调用，生成单段音频 | TtsReadySegment、输出路径、provider 配置 | 单段音频文件路径 |
| **音频合并** | 按顺序合并多段音频为整章 | 段落音频路径列表 | 整章音频文件路径 |

- **LLM 适配层**：保留现有 `LLMService.parseText`，在内部或在其调用方统一用 `formatResults` 产出 `ScriptSegment[]`（即现有 character/tone/voice 等可映射到 emotion/speed/mimicry），再组装为 `Script` 写入章节 `parsedData`。
- **角色映射层**：新模块；输入为 `parsedData`（Script）+ `Character[]`；匹配规则：`segment.character` 与 `c.name` 或 `c.aliases` 匹配；输出 `TtsReadySegment[]`（其中 provider/voice/emotion 等来自角色 ttsConfig 或 segment 上的 ttsOverride）。
- **TTS 适配层**：可保留现有 `TTSService.synthesizeWithProvider`，但入参改为接收「统一 TtsReadySegment」；内部按 provider 选择具体 TTS 客户端并传入 voice、emotion、speed 等（若某厂商需要 SSML，在该厂商的 client 内生成 SSML 再请求）。

---

## 五、页面数量与页面内容

### 5.1 页面总览

| 页面 | 路由 | 主要内容 |
|------|------|----------|
| 小说列表与详情 | `/read-novels` | 小说列表、当前小说基本信息、角色管理、章节列表、入口到章节编辑 |
| 章节编辑与合成 | `/read-novels/chapter/:chapterId` | 章节原文、解析结果（剧本）、一键解析、一键应用角色 TTS、分段/整章 TTS、整章音频播放 |

共 **2 个主页面**（列表页 + 章节页），不新增页面，通过「流程清晰、操作简化」减少步骤。

### 5.2 页面 1：小说列表与详情（ReadNovels.vue）

- **数据**：`novels`、`currentNovel`、`characters`、`chapters`、`currentChapter`。
- **内容**：
  - 左侧：小说列表，选中即 `currentNovel`。
  - 右侧：当前小说基本信息、**角色管理**（列表 + 添加/编辑/删除，角色含 TTS 配置）、**章节列表**（选中即 `currentChapter`）。
- **交互**：
  - 选章节后，提供「进入章节编辑」按钮，跳转 `/read-novels/chapter/:chapterId`。
  - 不在此页做解析/TTS，只做管理与导航。

### 5.3 页面 2：章节编辑与合成（ReadNovelsChapter.vue）

- **数据**：`chapter`（含 content、parsedData）、`characters`、`parsedData.segments`（即 ParsedSegmentDisplay[]）、TTS 结果（整章音频 URL 等）。
- **内容**：
  - **上：章节原文**（可编辑）+ **解析结果（剧本）**（每段：角色、情感、语速、模仿音、文本；可编辑文本与可选 TTS 覆盖）。
  - **操作栏**：选择 LLM 服务商 → 「解析」→ 解析后「应用角色 TTS」→ 「全部分段合成」→ 「合成整章音频」。
  - **下**：整章音频播放与历史结果列表。
- **交互与数据**：
  1. **解析**：调用 LLM 适配层（现有 parseChapter 流程），后端将结果转为 Script 写入 `chapter.parsedData`；前端展示 `parsedData.segments`（ParsedSegmentDisplay）。
  2. **应用角色 TTS**：前端或后端用「角色映射层」逻辑，把当前剧本 + 角色列表算出每段应使用的 provider/voice/emotion，写回每段的 `ttsConfig`（或仅前端展示用，实际合成时再算）。若希望简化，可只在「全部分段合成」时由后端按剧本+角色实时计算 TtsReadySegment，不强制持久化每段 ttsConfig。
  3. **全部分段合成**：对每一段，用角色映射层得到 TtsReadySegment，调用 TTS 适配层生成音频，保存每段 audioUrl/audioPath 到 segment 并写回 parsedData。
  4. **合成整章音频**：用当前段落顺序的 audioPath 列表调用音频合并，结果写入章节 ttsResults，前端展示整章音频。

简化策略：  
- 若用户不编辑某段 TTS，则完全依赖「角色映射」结果；  
- 若用户在某段上改了 voice/情感（即 ttsOverride），则角色映射时该段优先用 ttsOverride。  
这样页面只需保留「解析 → 应用角色 TTS（可选）→ 全部分段合成 → 合成整章」一条主流程，减少多步配置。

---

## 六、页面与数据结构的对应关系

- **parsedData** 存的是 **Script** 语义 + 每段可选的 **ttsConfig 覆盖** 与 **audioUrl/audioPath**。即 `parsedData.segments` 类型为 `ParsedSegmentDisplay[]`，与 3.1、3.5 一致。
- **角色列表** 来自 `currentNovel.characters`，角色映射层读取此列表与 `parsedData.segments`（ScriptSegment 部分）产出 TtsReadySegment。
- **整章音频** 来自章节的 `ttsResults`（如 `mergedAudioFile` 或数组），与现有结构兼容。

---

## 七、实现顺序建议

1. **定义并落地中间数据结构**：前端 `ReadNovels.ts` 增加 `ScriptSegment`、`Script`、`TtsReadySegment`、`ParsedSegmentDisplay`；后端如需可加对应 JSDoc 或简单校验。
2. **LLM 适配层**：在现有 `formatResults` 或调用链中保证输出为 ScriptSegment 数组并组装为 Script；写入章节时只写 Script 结构（含可选 emotion/speed/mimicry）。
3. **角色映射层**：新建 `server/services/ScriptToTtsMapper.js`（或等价名），输入 Script + Character[]，输出 TtsReadySegment[]；匹配规则与默认旁白/未匹配角色策略写死在此模块。
4. **TTS 适配层**：现有 `synthesizeWithProvider` 的调用方改为传入 TtsReadySegment；必要时在各 TTS client 内根据 TtsReadySegment 生成 SSML 再请求。
5. **段落合成与整章合并**：SegmentTTSController 先通过角色映射层得到 TtsReadySegment[]，再逐段调用 TTS 适配层，最后合并；整章合并逻辑保持现有 mergeAudioFiles。
6. **前端简化**：ReadNovelsChapter 保留「解析 → 应用角色 TTS → 全部分段合成 → 合成整章」主流程，列表展示与 per-segment 覆盖与现有 ParsedSegmentDisplay 一致。

按此设计，大模型、中间数据、各家 TTS 转换与合并均解耦，通过固定数据格式传递，用户操作集中在「解析 → 应用角色 → 合成」少量步骤。

---

## 八、问题与修复：角色声音未正确应用

### 8.1 根因

- **旁白标识不一致**：LLM 各厂商（如火山、阿里、OpenAI）对「旁白/叙述」返回的说话者字段为 `"dft"`，而角色映射与前端判断旁白时只判断 `character === "旁白"`。因此：
  - 后端保存的 `segment.character` 为 `"dft"`；
  - 前端 `getEffectiveTtsForSegment` 中 `segment.character !== "旁白"` 为 true，会把 `"dft"` 当角色名去匹配；
  - 后端 `ScriptToTtsMapper.matchCharacter("dft")` 也未将 `"dft"` 视为旁白，可能错误参与匹配。
- 结果是：旁白段可能被误用默认男声或错误逻辑；若存在其它命名/时序问题，也会导致**角色维护的语音模型在合成时未正确应用**。

### 8.2 修复要点

1. **统一旁白语义**：凡表示「旁白/叙述」的，在存储与计算中统一视为 `"旁白"`。
2. **持久化时归一化**（后端）  
   - 在 **ChapterProcessingController** 写入解析结果时：  
     `character: (seg.character === "dft" || !seg.character) ? "旁白" : (seg.character || "旁白")`  
   - 在 **SegmentTTSController** 构建 script 时：  
     `character: (s.character === "dft" || !s.character) ? "旁白" : (s.character || "旁白")`
3. **角色匹配层**（后端 **ScriptToTtsMapper.matchCharacter**）：  
   `if (name === "旁白" || name === "dft") return null;`  
   旁白不匹配任何角色，使用默认旁白音。
4. **前端**（**ReadNovelsChapter.vue**）：  
   - 抽 `isNarrator(character)`：`c === "旁白" || c === "dft" || !c`。  
   - 所有「是否旁白」判断（getEffectiveTtsForSegment、匹配角色、默认声音）均用 `isNarrator(segment.character)`，不再单独判断 `!== "旁白"`。  
   - 展示时：`isNarrator(segment.character) ? "旁白" : segment.character`。

按上述修改后，旁白与角色段区分明确，角色维护的语音模型会在「角色映射层」和单段/全段合成时被正确应用。
