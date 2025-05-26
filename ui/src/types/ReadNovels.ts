import type { TTSProviderType } from "@/types";

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

export interface ParsedSegment {
  text: string;
  character?: string;
  tone?: string;
  voice?: string;
  ttsConfig: SegmentTtsConfig;
  synthesisStatus?: "unsynthesized" | "synthesized";
  audioPath?: string;
  audioUrl?: string;
}
