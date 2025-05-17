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

export interface Character {
  id: string;
  novelId: string;
  name: string;
  type: "main" | "secondary" | "extra";
  gender: "male" | "female";
  age: "child" | "youth" | "middle" | "elder";
  description?: string;
  voiceModel?: string;
}

export interface Chapter {
  id: string;
  novelId: string;
  title: string;
  content: string;
  order: number;
  processed: boolean;
  createdAt: string;
  updatedAt: string;
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
  segments: Array<{
    text: string;
    character?: string;
    tone?: string;
    voice?: string;
  }>;
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
