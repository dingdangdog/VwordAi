#!/usr/bin/env bash
# 把本次填写的版本号变成 vX.Y.Z。不查找仓库里已有的标签。
# 标签由安装包上传前的步骤写到当前提交。
set -euo pipefail

RAW="${INPUT_VERSION:-}"
if [[ "$RAW" == *$'\n'* || "$RAW" == *$'\r'* ]]; then
  echo "版本号不能换行。"
  exit 1
fi
RAW="${RAW#"${RAW%%[![:space:]]*}"}"
RAW="${RAW%"${RAW##*[![:space:]]}"}"
if [[ "$RAW" == v* ]]; then
  RAW="${RAW#v}"
fi

semver='^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'
if [[ -z "$RAW" ]]; then
  echo "请填写版本号，例如 1.1.2。工作流会在当前提交上创建 v1.1.2。"
  exit 1
fi
if [[ ! "$RAW" =~ $semver ]]; then
  echo "版本号必须是主版本.次版本.修订号，例如 1.1.2。当前是：${RAW}"
  exit 1
fi

VERSION="$RAW"
TAG="v${VERSION}"
if [[ "${GITHUB_REF_TYPE:-}" == "tag" && "${GITHUB_REF_NAME:-}" != "$TAG" ]]; then
  echo "所选标签是 ${GITHUB_REF_NAME}，与填写的版本 ${TAG} 不一致。"
  exit 1
fi

{
  echo "version=${VERSION}"
  echo "tag=${TAG}"
} >> "${GITHUB_OUTPUT:?}"

echo "版本 ${TAG}，提交 ${GITHUB_SHA:-未设置}"
