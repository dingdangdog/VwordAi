import { readFileSync, writeFileSync } from "node:fs";

const version = process.env.VERSION ?? "";
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
  console.error(`版本号无效：${version}`);
  process.exit(1);
}

const path = "ui/src/stores/appConfig.ts";
const source = readFileSync(path, "utf8");
const pattern = /version:\s*"(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)"/g;
const matches = source.match(pattern);
if (!matches || matches.length !== 1) {
  console.error("ui/src/stores/appConfig.ts 里应只有一处语义化版本。");
  process.exit(1);
}

writeFileSync(path, source.replace(pattern, `version: "${version}"`));
console.log(`界面版本已写成 ${version}`);
