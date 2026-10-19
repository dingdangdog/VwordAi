/** 与 home/shared/emotions.ts 保持同一套代码。桌面端本地合成使用。 */
const EMOTIONS = [
  { code: "dft", name: "默认" },
  { code: "cheerful", name: "愉快" },
  { code: "calm", name: "平静" },
  { code: "gentle", name: "温柔" },
  { code: "affectionate", name: "亲切" },
  { code: "serious", name: "严肃" },
  { code: "sad", name: "悲伤" },
  { code: "angry", name: "生气" },
  { code: "fearful", name: "害怕" },
  { code: "excited", name: "兴奋" },
  { code: "chat", name: "随意" },
  { code: "newscast", name: "新闻" },
  { code: "narration-professional", name: "解说" },
  { code: "customerservice", name: "客服" },
  { code: "whispering", name: "低语" },
  { code: "disgruntled", name: "不满" },
];

const CODES = new Set(EMOTIONS.map((item) => item.code));

const ALIASES = {
  default: "dft",
  general: "dft",
  neutral: "dft",
  默认: "dft",
  中性: "dft",
  happy: "cheerful",
  快乐: "cheerful",
  开心: "cheerful",
  高兴: "cheerful",
  愉快: "cheerful",
  冷静: "calm",
  平静: "calm",
  温和: "gentle",
  温柔: "gentle",
  温暖: "affectionate",
  亲切: "affectionate",
  喜爱: "affectionate",
  正经: "serious",
  严肃: "serious",
  难过: "sad",
  伤心: "sad",
  沮丧: "sad",
  悲伤: "sad",
  anger: "angry",
  愤怒: "angry",
  生气: "angry",
  fear: "fearful",
  恐惧: "fearful",
  害怕: "fearful",
  紧张: "fearful",
  激动: "excited",
  兴奋: "excited",
  轻松: "chat",
  聊天: "chat",
  随意: "chat",
  新闻: "newscast",
  解说: "narration-professional",
  客服: "customerservice",
  耳语: "whispering",
  低语: "whispering",
  抱怨: "disgruntled",
  厌恶: "disgruntled",
  不满: "disgruntled",
};

function canonicalEmotion(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const key = raw.toLowerCase();
  if (CODES.has(key)) return key;
  return ALIASES[raw] || ALIASES[key] || "";
}

function speakingStyle(value) {
  const canonical = canonicalEmotion(value);
  if (canonical === "dft") return "";
  if (canonical) return canonical;
  const raw = String(value ?? "").trim();
  if (/^[a-z0-9_-]{1,40}$/i.test(raw)) return raw;
  return "";
}

function emotionName(code) {
  return EMOTIONS.find((item) => item.code === code)?.name || code;
}

const ROLE_CODES = new Set([
  "Girl",
  "Boy",
  "YoungAdultFemale",
  "YoungAdultMale",
  "OlderAdultFemale",
  "OlderAdultMale",
  "SeniorFemale",
  "SeniorMale",
]);

const ROLE_ALIASES = {
  default: "dft",
  默认: "dft",
  女孩: "Girl",
  男孩: "Boy",
  年轻女性: "YoungAdultFemale",
  年轻男性: "YoungAdultMale",
  年长女性: "OlderAdultFemale",
  年长男性: "OlderAdultMale",
  年老女性: "SeniorFemale",
  年老男性: "SeniorMale",
  "female-child": "Girl",
  "male-child": "Boy",
  "female-youth": "YoungAdultFemale",
  "male-youth": "YoungAdultMale",
  "female-middle": "OlderAdultFemale",
  "male-middle": "OlderAdultMale",
  "female-elder": "SeniorFemale",
  "male-elder": "SeniorMale",
};

function speakingRole(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "dft" || raw.toLowerCase() === "default" || raw === "默认") return "";
  if (ROLE_CODES.has(raw)) return raw;
  return ROLE_ALIASES[raw] || ROLE_ALIASES[raw.toLowerCase()] || "";
}

module.exports = { EMOTIONS, canonicalEmotion, speakingStyle, speakingRole, emotionName };
