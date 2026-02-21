/**
 * 角色映射层：剧本（Script）+ 角色列表 → TTS 就绪段落（TtsReadySegment[]）
 * 输入为中间通用数据，输出为各 TTS 适配层可直接使用的参数，与具体厂商解耦
 */
const DEFAULT_NARRATOR_VOICE = "zh-CN-XiaoxiaoNeural";
const DEFAULT_PROVIDER = "azure";

/**
 * 匹配段落角色名到小说角色
 * @param {string} segmentCharacter - 段落中的角色名（如 "旁白"、"张三"）
 * @param {Array} characters - 小说角色列表
 * @returns {Object|null} 匹配到的角色或 null
 */
function matchCharacter(segmentCharacter, characters) {
  if (!segmentCharacter || !characters || characters.length === 0) return null;
  const name = String(segmentCharacter).trim();
  if (!name) return null;
  // 旁白不匹配角色
  if (name === "旁白") return null;
  // 精确匹配
  const exact = characters.find(
    (c) => c.name === name || (c.aliases && c.aliases.includes(name))
  );
  if (exact) return exact;
  // 部分匹配：角色名包含或被包含
  const partial = characters.find(
    (c) =>
      (c.name && (c.name.includes(name) || name.includes(c.name))) ||
      (c.aliases && c.aliases.some((a) => a && (a.includes(name) || name.includes(a))))
  );
  return partial || null;
}

/** 模仿音/情景 → Azure 风格 voice code（含 LLM 返回的英文码） */
const MIMICRY_TO_VOICE = {
  女孩: "zh-CN-XiaoxiaoNeural",
  男孩: "zh-CN-YunxiNeural",
  年轻女性: "zh-CN-XiaoxiaoNeural",
  年轻男性: "zh-CN-YunxiNeural",
  年长女性: "zh-CN-XiaoniNeural",
  年长男性: "zh-CN-YunyangNeural",
  年老女性: "zh-CN-XiaoyanNeural",
  年老男性: "zh-CN-YunyeNeural",
  "female-child": "zh-CN-XiaoxiaoNeural",
  "male-child": "zh-CN-YunxiNeural",
  "female-youth": "zh-CN-XiaoxiaoNeural",
  "male-youth": "zh-CN-YunxiNeural",
  "female-middle": "zh-CN-XiaoniNeural",
  "male-middle": "zh-CN-YunyangNeural",
  "female-elder": "zh-CN-XiaoyanNeural",
  "male-elder": "zh-CN-YunyeNeural",
  "narrator-1": DEFAULT_NARRATOR_VOICE,
};

/**
 * 根据模仿音或角色名推断默认 voice code（仅当无角色配置时使用）
 * @param {string} mimicry - 模仿音，如 "女孩"、"男孩" 或 LLM 返回的 "female-child" 等
 * @param {string} character - 角色名
 * @returns {string} 建议的 voice code（如 Azure 风格）
 */
function inferDefaultVoice(mimicry, character) {
  if (mimicry && mimicry !== "dft" && MIMICRY_TO_VOICE[mimicry]) {
    return MIMICRY_TO_VOICE[mimicry];
  }
  if (character && character !== "旁白") {
    if (/女|妹|姐|娘/.test(character)) return "zh-CN-XiaoxiaoNeural";
    if (/男|哥|弟/.test(character)) return "zh-CN-YunxiNeural";
  }
  return DEFAULT_NARRATOR_VOICE;
}

/**
 * 将剧本段落 + 角色列表 转为 TTS 就绪段落
 * @param {Object} script - { title, segments: Array<ScriptSegment> }
 * @param {Array} characters - 小说角色列表，每项含 name, aliases?, ttsConfig?
 * @param {Object} parsedSegments - 可选，与 script.segments 同序的“解析结果”段，含 ttsConfig 覆盖、voice 等
 * @param {string} defaultTtsProvider - 默认 TTS 服务商
 * @returns {Array<TtsReadySegment>}
 */
function scriptToTtsReadySegments(script, characters, parsedSegments = null, defaultTtsProvider = DEFAULT_PROVIDER) {
  if (!script || !Array.isArray(script.segments)) return [];
  const segments = script.segments;
  const result = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const index = seg.index !== undefined ? seg.index : i;
    const parsed = Array.isArray(parsedSegments) && parsedSegments[i] ? parsedSegments[i] : null;

    // 优先使用该段上的 TTS 覆盖（用户手动选择过）
    const override = parsed && parsed.ttsConfig && (parsed.ttsConfig.provider || parsed.ttsConfig.model)
      ? parsed.ttsConfig
      : null;

    const character = seg.character || "旁白";
    const matched = matchCharacter(character, characters || []);

    let provider = defaultTtsProvider;
    let voice = DEFAULT_NARRATOR_VOICE;
    let emotion = "";
    let style = "";
    let speed = 0;
    let pitch = 0;
    let volume = 100;

    if (override) {
      provider = override.provider || provider;
      voice = (override.model && String(override.model).trim()) ? override.model : ((parsed && parsed.voice) || voice);
      if (override.emotion !== undefined) emotion = override.emotion || "";
      if (override.style !== undefined) style = override.style || "";
      speed = typeof override.speed === "number" ? override.speed : speed;
      pitch = typeof override.pitch === "number" ? override.pitch : pitch;
      volume = typeof override.volume === "number" ? override.volume : volume;
    } else if (matched && matched.ttsConfig) {
      const tc = matched.ttsConfig;
      provider = tc.provider || provider;
      voice = tc.model || inferDefaultVoice(seg.mimicry, character);
      emotion = tc.emotion || "";
      style = tc.style || "";
      speed = typeof tc.speed === "number" ? tc.speed : (typeof seg.speed === "number" ? seg.speed : 0);
      pitch = typeof tc.pitch === "number" ? tc.pitch : 0;
      volume = typeof tc.volume === "number" ? tc.volume : 100;
    } else {
      voice = inferDefaultVoice(seg.mimicry, character);
      speed = typeof seg.speed === "number" ? seg.speed : 0;
    }

    result.push({
      index,
      text: seg.text || "",
      provider,
      voice,
      emotion: emotion || undefined,
      style: style || undefined,
      speed,
      pitch,
      volume,
    });
  }

  return result;
}

module.exports = {
  scriptToTtsReadySegments,
  matchCharacter,
  inferDefaultVoice,
};
