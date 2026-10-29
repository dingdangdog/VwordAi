import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { mergeUpdateYml, parseUpdateYml, stringifyUpdateYml } from "./merge-update-yml.mjs";

test("合并两份 macOS 更新清单", () => {
  const arm = parseUpdateYml(`version: 1.1.2
files:
  - url: VwordAi-1.1.2-arm64.zip
    sha512: arm
    size: 10
path: VwordAi-1.1.2-arm64.zip
sha512: arm
releaseDate: '2026-10-29T00:00:00.000Z'
`);
  const intel = parseUpdateYml(`version: 1.1.2
files:
  - url: VwordAi-1.1.2-x64.zip
    sha512: intel
    size: 12
path: VwordAi-1.1.2-x64.zip
sha512: intel
releaseDate: '2026-10-29T01:00:00.000Z'
`);
  const merged = mergeUpdateYml([arm, intel]);
  const text = stringifyUpdateYml(merged);
  const again = parseUpdateYml(text);
  assert.deepEqual(again.files.map((file) => file.url), [
    "VwordAi-1.1.2-arm64.zip",
    "VwordAi-1.1.2-x64.zip",
  ]);
  assert.equal(again.files[1].size, 12);
  assert.equal(again.top.find(([key]) => key === "releaseDate")[1], "2026-10-29T01:00:00.000Z");
});

test("同一地址以后写入的为准", () => {
  const first = parseUpdateYml(`version: 1.1.2
files:
  - url: VwordAi-1.1.2-arm64.zip
    sha512: old
    size: 1
`);
  const second = parseUpdateYml(`version: 1.1.2
files:
  - url: VwordAi-1.1.2-arm64.zip
    sha512: new
    size: 2
`);
  const merged = mergeUpdateYml([first, second]);
  assert.equal(merged.files.length, 1);
  assert.equal(merged.files[0].sha512, "new");
});

test("版本不一致时拒绝合并", () => {
  const left = parseUpdateYml("version: 1.1.2\nfiles:\n  - url: a.zip\n    sha512: a\n");
  const right = parseUpdateYml("version: 1.1.3\nfiles:\n  - url: b.zip\n    sha512: b\n");
  assert.throws(() => mergeUpdateYml([left, right]), /版本不一致/);
});

test("安装包配置固定 Electron，并且 macOS 不写死两种架构", () => {
  const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.devDependencies.electron, "35.3.0");
  assert.equal(pkg.build.electronVersion, "35.3.0");
  assert.equal(pkg.build.npmRebuild, false);
  assert.equal(pkg.build.mac.identity, null);
  assert.equal(pkg.homepage, "https://github.com/dingdangdog/VwordAi");
  assert.deepEqual(pkg.build.mac.target, ["dmg", "zip"]);
  assert.match(pkg.scripts["package:win"], /--x64/);
  assert.match(pkg.scripts["package:linux"], /AppImage deb --x64/);
});
