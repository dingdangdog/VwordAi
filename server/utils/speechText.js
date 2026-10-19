/**
 * 用户常从网页、文档、AI 对话粘贴内容。原文照常保存，送去朗读前统一转成纯文本，
 * 避免语音把 #、*、标签等格式符号读出来。规则与官网 home/shared/speech-text.ts 保持一致。
 */

/** 转义字符的占位，防止 `\*` 之类被当成格式符号删掉，最后再移除。 */
const ESCAPE_MARK = "\uE000";

const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF]/g;
const HTML_HINT =
  /<\/?(?:p|br|div|span|h[1-6]|li|ul|ol|strong|b|em|i|u|s|a|img|table|thead|tbody|tr|td|th|blockquote|pre|code|section|article|font|hr|html|body|style|script)\b[^<>]*>/i;
const HTML_BLOCK =
  /<\/?(?:p|div|h[1-6]|li|ul|ol|tr|table|thead|tbody|blockquote|pre|section|article|header|footer|hr|html|body)\b[^<>]*>/gi;
const HTML_TAG = /<\/?[a-z][\w:-]*(?:\s[^<>]*)?\/?>/gi;
const NAMED_ENTITIES = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  middot: "·",
  times: "×",
};

const HORIZONTAL_RULE = /^(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,}|=+)$/;
const SETEXT_UNDERLINE = /^(?:=+|-+)$/;
const TABLE_DIVIDER = /^\|?(?:\s*:?-+:?\s*\|)+\s*(?::?-+:?\s*)?$/;
const TABLE_ROW = /^\|.+\|$/;
const LINK_DEFINITION = /^\[[^\]]+\]:\s*\S/;
const HEADING = /^#{1,6}(?:\s+|(?=[^\s#\d]))(.*?)(?:\s+#+)?$/;
const LIST_MARKER = /^(?:[-*+]\s+(?:\[[ xX]\]\s+)?|[•·●○■□◆◇★☆▶►➤✓✔▪◦‣]\s*)/u;
const SENTENCE_END = /[。！？!?.…；;：:，,、"”'’）)\]】」』》]$/;

function normalizeChars(text) {
  return text
    .replace(/\r\n?|[\u2028\u2029\f\v]/g, "\n")
    .replace(ZERO_WIDTH, "")
    .replace(/[\u00A0\t]/g, " ");
}

function stripHtml(text) {
  if (!HTML_HINT.test(text)) return text;
  return text
    .replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<img\b[^>]*?\balt\s*=\s*(["'])(.*?)\1[^>]*>/gi, "$2")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/t[dh]>\s*(?=<t[dh]\b)/gi, "，")
    .replace(HTML_BLOCK, "\n")
    .replace(HTML_TAG, "");
}

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body) => {
    if (!body.startsWith("#")) return NAMED_ENTITIES[body.toLowerCase()] ?? match;
    const code = /^#x/i.test(body) ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

function parseBlocks(text) {
  const lines = [];
  let fence = "";
  for (const raw of text.split("\n")) {
    const trimmed = raw.trim();
    const marker = /^(`{3,}|~{3,})/.exec(trimmed)?.[1];
    if (fence) {
      if (marker?.[0] === fence && !trimmed.slice(marker.length).trim()) fence = "";
      else lines.push({ text: trimmed, kind: "code" });
      continue;
    }
    if (marker) {
      fence = marker[0];
      continue;
    }

    const line = trimmed.replace(/^(?:>\s*)+/, "");
    const previous = lines[lines.length - 1];
    if (SETEXT_UNDERLINE.test(line) && previous?.kind === "text" && previous.text) {
      previous.kind = "heading";
      continue;
    }
    if (HORIZONTAL_RULE.test(line) || TABLE_DIVIDER.test(line) || LINK_DEFINITION.test(line)) continue;

    const heading = HEADING.exec(line);
    if (heading) {
      lines.push({ text: heading[1] ?? "", kind: "heading" });
      continue;
    }
    if (TABLE_ROW.test(line)) {
      const cells = line.slice(1, -1).split("|").map((cell) => cell.trim()).filter(Boolean);
      lines.push({ text: cells.join("，"), kind: "item" });
      continue;
    }
    const item = line.replace(LIST_MARKER, "");
    lines.push({ text: item, kind: item === line ? "text" : "item" });
  }
  return lines;
}

function stripInline(line) {
  return line
    .replace(/\\([\\`*_{}[\]()#+\-.!|~<>=])/g, `${ESCAPE_MARK}$1`)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[\^[^\]]+\]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/<(?:https?|ftp|mailto):[^<>\s]+>/gi, "")
    .replace(/(`+)(.+?)\1/g, "$2")
    .replace(/\*\*(?=\S)(.+?)(?<=[^\s\uE000])\*\*/g, "$1")
    .replace(/(?<![A-Za-z0-9_])__(?=\S)(.+?)(?<=\S)__(?![A-Za-z0-9_])/g, "$1")
    .replace(/~~(?=\S)(.+?)(?<=\S)~~/g, "$1")
    .replace(/==(?=\S)([^=]+?)(?<=\S)==/g, "$1")
    .replace(/(?<![*\w\uE000])\*(?=[^\s*])([^*]+?)(?<=[^\s*\uE000])\*(?![*\w])/g, "$1")
    .replace(/(?<![_A-Za-z0-9\uE000])_(?=[^\s_])([^_]+?)(?<=[^\s_\uE000])_(?![_A-Za-z0-9])/g, "$1");
}

/** 兜底：落单的 * 和 #、emoji 都不适合朗读；2*3、C#、#1 这类保留。 */
function stripSymbols(line) {
  return line
    .replace(/(?<!\d\s?|\uE000)\*+(?!\s?\d)/g, "")
    .replace(/(?<![A-Za-z0-9&\uE000])#+(?!\d)/g, "")
    .replace(/[\p{Extended_Pictographic}\uFE0F\u20E3]/gu, "");
}

/** 标题、列表项朗读时需要停顿，没有句末标点就补一个。 */
function withPause(text) {
  if (!text || SENTENCE_END.test(text)) return text;
  return text + (/[\u3400-\u9fff]/.test(text) ? "。" : ".");
}

function tidyWhitespace(text) {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \u00A0\u3000]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 把 Markdown、HTML 或富文本粘贴内容转成适合语音合成的纯文本。 */
function toSpeechText(input) {
  const text = decodeEntities(stripHtml(normalizeChars(String(input ?? ""))));
  const lines = parseBlocks(text).map(({ text: line, kind }) => {
    const plain = stripSymbols(stripInline(line)).trim();
    return kind === "heading" || kind === "item" ? withPause(plain) : plain;
  });
  return tidyWhitespace(lines.join("\n").replaceAll(ESCAPE_MARK, ""));
}

module.exports = { toSpeechText };
