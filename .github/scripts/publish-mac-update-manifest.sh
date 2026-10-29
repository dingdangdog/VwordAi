#!/usr/bin/env bash
# 把两台 Mac 分别生成的更新清单合成一份 latest-mac.yml。
set -euo pipefail

: "${TAG:?}"
: "${GH_TOKEN:?}"

DEST="$(mktemp -d)"
trap 'rm -rf "$DEST"' EXIT

if ! gh release download "$TAG" --pattern "update-mac-*.yml" --dir "$DEST"; then
  echo "没有下载到 macOS 更新清单。"
  exit 1
fi

shopt -s nullglob
files=( "$DEST"/update-mac-*.yml )
if [[ ${#files[@]} -eq 0 ]]; then
  echo "Release ${TAG} 里没有 update-mac-*.yml。"
  exit 1
fi

node .github/scripts/merge-update-yml.mjs "$DEST/latest-mac.yml" "${files[@]}"
gh release upload "$TAG" "$DEST/latest-mac.yml" --clobber
echo "已上传 latest-mac.yml，来源 ${#files[@]} 份。"
