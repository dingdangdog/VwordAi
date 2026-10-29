import { readFileSync, writeFileSync } from "node:fs";

export function parseUpdateYml(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const top = [];
  const files = [];
  let current = null;
  let inFiles = false;

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (line === "files:" || line.startsWith("files:")) {
      inFiles = true;
      continue;
    }
    if (inFiles && line.startsWith("  - ")) {
      current = {};
      files.push(current);
      assign(current, line.slice(4));
      continue;
    }
    if (inFiles && line.startsWith("    ")) {
      if (!current) throw new Error(`更新清单格式无效：${line}`);
      assign(current, line.trim());
      continue;
    }
    if (/^\S/.test(line)) {
      inFiles = false;
      current = null;
      const index = line.indexOf(":");
      if (index <= 0) throw new Error(`无法解析：${line}`);
      top.push([line.slice(0, index), parseScalar(line.slice(index + 1))]);
      continue;
    }
    throw new Error(`无法解析：${line}`);
  }

  if (files.length === 0) throw new Error("更新清单里没有文件。");
  return { top, files };
}

export function mergeUpdateYml(parts) {
  if (parts.length === 0) throw new Error("没有更新清单。");
  const version = scalar(parts[0], "version");
  if (!version) throw new Error("更新清单缺少版本号。");
  for (const part of parts) {
    if (scalar(part, "version") !== version) {
      throw new Error(`更新清单版本不一致：${version} 与 ${scalar(part, "version")}`);
    }
  }

  const byUrl = new Map();
  for (const part of parts) {
    for (const file of part.files) {
      if (!file.url) throw new Error("更新项缺少 url。");
      byUrl.set(String(file.url), file);
    }
  }
  const files = [...byUrl.values()];
  const zip = files.find((file) => String(file.url).endsWith(".zip")) ?? files[0];
  const top = parts[parts.length - 1].top
    .filter(([key]) => key !== "files")
    .map(([key, value]) => [key, value]);
  setTop(top, "path", zip.url);
  if (zip.sha512) setTop(top, "sha512", zip.sha512);
  return { top, files };
}

export function stringifyUpdateYml(doc) {
  const lines = [`version: ${formatScalar(scalar(doc, "version"))}`, "files:"];
  for (const file of doc.files) {
    const keys = Object.keys(file);
    if (keys.length === 0) throw new Error("更新项是空的。");
    lines.push(`  - ${keys[0]}: ${formatScalar(file[keys[0]])}`);
    for (const key of keys.slice(1)) lines.push(`    ${key}: ${formatScalar(file[key])}`);
  }
  for (const [key, value] of doc.top) {
    if (key === "version" || key === "files") continue;
    lines.push(`${key}: ${formatScalar(value)}`);
  }
  lines.push("");
  return lines.join("\n");
}

function assign(target, text) {
  const index = text.indexOf(":");
  if (index <= 0) throw new Error(`无法解析：${text}`);
  target[text.slice(0, index).trim()] = parseScalar(text.slice(index + 1));
}

function parseScalar(raw) {
  const value = raw.trim();
  if (value.startsWith('"') && value.endsWith('"')) return JSON.parse(value);
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
  if (/^-?\d+$/.test(value)) return Number(value);
  return value;
}

function formatScalar(value) {
  if (typeof value === "number") return String(value);
  return JSON.stringify(String(value));
}

function scalar(doc, key) {
  const found = doc.top.find(([name]) => name === key);
  return found ? found[1] : undefined;
}

function setTop(top, key, value) {
  const index = top.findIndex(([name]) => name === key);
  if (index === -1) top.push([key, value]);
  else top[index][1] = value;
}

function readDoc(path) {
  return parseUpdateYml(readFileSync(path, "utf8"));
}

if (process.argv[1] && process.argv[1].replaceAll("\\", "/").endsWith("/merge-update-yml.mjs")) {
  const output = process.argv[2];
  const inputs = process.argv.slice(3);
  if (!output || inputs.length === 0) {
    console.error("用法：node merge-update-yml.mjs <输出> <输入...>");
    process.exit(1);
  }
  writeFileSync(output, stringifyUpdateYml(mergeUpdateYml(inputs.map(readDoc))));
}
