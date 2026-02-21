import type { TTSProviderType } from "@/types";

// ========== 中间通用数据（剧本）- 与厂商无关 ==========
/** 剧本单条：仅描述谁、情感、语速、模仿音、文本，不含任何 TTS 厂商 code */
export interface ScriptSegment {
  index?: number;
  text: string;
  character: string;
  emotion?: string;
  speed?: number;
  mimicry?: string;
}

/** 一章的剧本（LLM 输出统一转换为此格式后持久化） */
export interface Script {
  title: string;
  segments: ScriptSegment[];
  createdAt: string;
  updatedAt: string;
  llmProvider?: string;
}

/** 送入 TTS 适配层的单段参数（角色映射层输出） */
export interface TtsReadySegment {
  index: number;
  text: string;
  provider: TTSProviderType;
  voice: string;
  emotion?: string;
  style?: string;
  speed: number;
  pitch: number;
  volume: number;
}

// 小说
export interface Novel {
  id: string;
  title: string;
  author: string;
  cover?: string;
  description?: string;
  // 内嵌角色列表
  characters: Character[];
  createdAt: string;
  updatedAt: string;
  // 小说级别配置
  settings?: {
    defaultLLMProvider?: string;
    defaultTTSProvider?: string;
    defaultVoiceSettings?: {
      speed?: number;
      pitch?: number;
      volume?: number;
      emotion?: string;
      style?: string;
    };
  };
}

// 角色（内嵌在小说中）
export interface Character {
  id: string;
  name: string;
  type: "main" | "secondary" | "minor";
  gender: "male" | "female" | "unknown";
  age: "child" | "youth" | "middle" | "elder" | "unknown";
  description?: string;
  voiceModel?: string;
  aliases?: string[];
  // TTS配置
  ttsConfig?: {
    provider?: TTSProviderType;
    model?: string;
    speed?: number;
    pitch?: number;
    volume?: number;
    emotion?: string;
    style?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

// TTS结果数据结构
export interface ChapterTTSResults {
  segments: Array<{
    index: number;
    audioPath?: string;
    audioUrl?: string;
    duration?: number;
    synthesisStatus: "pending" | "processing" | "completed" | "failed";
  }>;
  audioFiles: string[];
  mergedAudioFile?: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt?: string;
  completedAt?: string;
  updatedAt?: string;
}

// 章节（包含内嵌的解析结果和TTS结果）
export interface Chapter {
  id: string;
  novelId: string;
  title: string;
  content: string;
  order: number;
  processed: boolean;
  createdAt: string;
  updatedAt: string;
  llmProvider: string;
  // 内嵌解析结果
  parsedData?: ParsedChapter;
  // 内嵌TTS结果
  ttsResults?: ChapterTTSResults;
}

export interface ParsedDialogue {
  text: string;
  character: string;
  tone?: string;
  voice?: string;
}

export interface ParsedChapter {
  title: string;
  segments: Array<ParsedSegment>;
  createdAt: string;
  updatedAt: string;
}

export interface TtsResult {
  id: string;
  chapterId: string;
  audioUrl: string;
  duration: number;
  createdAt: string;
}

export interface VoiceModel {
  id: string;
  name: string;
  gender: "male" | "female";
  age: "child" | "youth" | "middle" | "elder";
  type: "narration" | "character";
  sampleUrl?: string;
}

export interface SegmentTtsConfig {
  provider?: TTSProviderType | null;
  model?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  emotion?: string;
  style?: string;
}

/** 解析结果单段展示/持久化：Script 语义 + 可选 TTS 覆盖与音频状态 */
export interface ParsedSegment extends ScriptSegment {
  /** 兼容旧字段：情感描述，与 emotion 等价 */
  tone?: string;
  /** 兼容旧字段：模仿音或已绑定的 voice code */
  voice?: string;
  ttsConfig?: SegmentTtsConfig;
  synthesisStatus?: "unsynthesized" | "synthesized";
  audioPath?: string;
  audioUrl?: string;
}

/** 将 ParsedChapter.segments 转为纯 Script（用于角色映射） */
export function scriptFromParsedChapter(parsed: ParsedChapter): Script {
  return {
    title: parsed.title,
    segments: parsed.segments.map((s, i) => ({
      index: s.index ?? i,
      text: s.text,
      character: s.character ?? "旁白",
      emotion: s.emotion ?? s.tone,
      speed: s.speed,
      mimicry: s.mimicry ?? (s.voice && !s.ttsConfig?.model ? s.voice : undefined),
    })),
    createdAt: parsed.createdAt,
    updatedAt: parsed.updatedAt,
    llmProvider: (parsed as any).llmProvider,
  };
}
