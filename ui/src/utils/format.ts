import { toSpeechText } from "./speechText";

/** 中文朗读约 260 字/分钟，用于估算时长。 */
const CHARS_PER_MINUTE = 260;

const countCache = new Map<string, number>();

/** 按实际朗读的纯文本计数，格式符号不算。 */
export function countChars(text?: string | null) {
  const source = text || "";
  const cached = countCache.get(source);
  if (cached !== undefined) return cached;
  const count = toSpeechText(source).replace(/\s/g, "").length;
  if (countCache.size >= 200) countCache.clear();
  countCache.set(source, count);
  return count;
}

export function estimateDuration(text?: string | null) {
  const seconds = Math.round((countChars(text) / CHARS_PER_MINUTE) * 60);
  if (seconds <= 0) return "0 秒";
  if (seconds < 60) return `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes} 分 ${rest} 秒` : `${minutes} 分钟`;
}

export function formatRelative(input?: string | number | Date | null) {
  if (!input) return "";
  const date = new Date(input);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return "";
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  return date.toLocaleDateString();
}

export function folderOf(filePath: string) {
  const index = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
  return index > 0 ? filePath.slice(0, index) : filePath;
}

export async function toMediaUrl(filePath?: string | null) {
  if (!filePath) return "";
  try {
    const url = await window.electron?.invoke("get-media-url", filePath);
    if (url) return url as string;
  } catch (error) {
    console.error("获取媒体地址失败:", error);
  }
  const encoded = filePath.replace(/\\/g, "/").replace(/#/g, "%23").replace(/\?/g, "%3F").replace(/\s/g, "%20");
  return `file://${encoded}`;
}
