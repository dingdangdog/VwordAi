import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("用法：node sha256-dir.mjs <目录>");
  process.exit(1);
}

const names = readdirSync(dir)
  .filter((name) => statSync(join(dir, name)).isFile())
  .sort();
if (names.length === 0) {
  console.error("目录里没有文件。");
  process.exit(1);
}

for (const name of names) {
  const hash = createHash("sha256").update(readFileSync(join(dir, name))).digest("hex");
  console.log(`${hash}  ${name}`);
}
