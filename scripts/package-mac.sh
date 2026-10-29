#!/usr/bin/env bash
# 只打包当前 Mac 的架构。Apple 芯片打 arm64，Intel 打 x64。
set -euo pipefail

cd "$(dirname "$0")/.."

case "$(uname -m)" in
  arm64|aarch64) target="arm64" ;;
  x86_64|amd64) target="x64" ;;
  *)
    echo "不支持的架构: $(uname -m)" >&2
    exit 1
    ;;
esac

exec npx electron-builder --mac dmg zip --"$target" --publish never
