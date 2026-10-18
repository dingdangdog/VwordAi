export interface RoleTone {
  text: string;
  bg: string;
  border: string;
  dot: string;
}

const NARRATOR_NAMES = new Set(["旁白", "narrator", "narration", "叙述"]);

const NARRATOR_TONE: RoleTone = {
  text: "text-ink-muted",
  bg: "bg-soft",
  border: "border-line-strong",
  dot: "bg-ink-subtle",
};

const ROLE_TONES: RoleTone[] = [
  { text: "text-role-1", bg: "bg-role-1/10", border: "border-role-1", dot: "bg-role-1" },
  { text: "text-role-2", bg: "bg-role-2/10", border: "border-role-2", dot: "bg-role-2" },
  { text: "text-role-3", bg: "bg-role-3/10", border: "border-role-3", dot: "bg-role-3" },
  { text: "text-role-4", bg: "bg-role-4/10", border: "border-role-4", dot: "bg-role-4" },
  { text: "text-role-5", bg: "bg-role-5/10", border: "border-role-5", dot: "bg-role-5" },
  { text: "text-role-6", bg: "bg-role-6/10", border: "border-role-6", dot: "bg-role-6" },
  { text: "text-role-7", bg: "bg-role-7/10", border: "border-role-7", dot: "bg-role-7" },
  { text: "text-role-8", bg: "bg-role-8/10", border: "border-role-8", dot: "bg-role-8" },
];

export function isNarrator(name?: string | null) {
  return !name || NARRATOR_NAMES.has(name.trim().toLowerCase());
}

/** 按角色名稳定哈希到 8 个角色色之一，旁白固定为中性色。 */
export function roleTone(name?: string | null): RoleTone {
  if (isNarrator(name)) return NARRATOR_TONE;
  let hash = 0;
  for (const ch of name!.trim()) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
  return ROLE_TONES[hash % ROLE_TONES.length];
}
