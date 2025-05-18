// 小说
export interface Novel {
  id: string;
  title: string;
  author: string;
  cover?: string;
  description?: string;
  characters: Character[];
  createdAt: string;
  updatedAt: string;
}

// 角色
export interface Character {
  id: string;
  novelId: string;
  name: string;
  type: "main" | "secondary" | "extra";
  gender: "male" | "female";
  age: "child" | "youth" | "middle" | "elder";
  description?: string;
  voiceModel?: string;
  aliases?: string[];
}

// 章节
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
}

export interface ParsedDialogue {
  text: string;
  character: string;
  tone?: string;
  voice?: string;
}

export interface ParsedChapter {
  id: string;
  chapterId: string;
  title: string;
  segments: Array<ParsedSegment>;
  processedAt: string;
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
  provider?: string;
  model?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface ParsedSegment {
  text: string;
  character?: string;
  tone?: string;
  voice?: string;
  ttsConfig?: SegmentTtsConfig;
  synthesisStatus?: 'unsynthesized' | 'synthesized';
  audioPath?: string;
  audioUrl?: string;
}
