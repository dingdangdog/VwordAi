# AI自动读小说工作流程设计

## 小说整体维护

1. 新建小说（base）
2. 小说角色维护：主要角色、次要角色、路人甲（男/女，儿童、青年、中年、老年）（base）

## 单个章节维护

1. 新建章节
2. 章节文本输入
3. 章节文本llm自动解析json（文本、角色、语气、模仿音）（按照设计好的提示词工程，传入文本，调用llm接口，获得解析后的json）
4. 解析后json预览/编辑/选择声音模型（自动、手动）
5. 开出处理（tts）（json 转 ssml，随后调用tts接口）
6. 处理结果播放，不满意则可重新执行上述任意步骤
