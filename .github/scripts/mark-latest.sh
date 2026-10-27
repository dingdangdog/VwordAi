#!/usr/bin/env bash
# 决定 GitHub Release 是否标成最新。auto：已有更高版本标签时不标成最新。
# 比较只用 bash，便于在 macOS 自带的 bash 3.2 上运行。
set -euo pipefail

: "${VERSION:?}"
choice="${INPUT_LATEST:-auto}"
case "$choice" in
  true|yes) choice=always ;;
  false|no) choice=never ;;
esac
case "$choice" in
  auto|always|never) ;;
  *)
    echo "latest 只能是 auto、always 或 never。当前是：${choice}"
    exit 1
    ;;
esac

is_newer() {
  local left="$1"
  local right="$2"
  local IFS=.
  local -a left_parts right_parts
  local index
  read -r -a left_parts <<< "$left"
  read -r -a right_parts <<< "$right"
  for index in 0 1 2; do
    if (( 10#${left_parts[$index]} > 10#${right_parts[$index]} )); then
      return 0
    fi
    if (( 10#${left_parts[$index]} < 10#${right_parts[$index]} )); then
      return 1
    fi
  done
  return 1
}

mark=false
if [[ "$choice" == "always" ]]; then
  mark=true
elif [[ "$choice" == "auto" ]]; then
  mark=true
  tags="$(git ls-remote --tags origin 'refs/tags/v*')"
  while IFS=$'\t' read -r _ ref; do
    [[ -n "${ref:-}" ]] || continue
    name="${ref##*/}"
    name="${name%%^*}"
    if [[ ! "$name" =~ ^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
      continue
    fi
    other="${name#v}"
    if is_newer "$other" "$VERSION"; then
      mark=false
      echo "已有更高版本标签 v${other}，这次不把 GitHub Release 标成最新。"
      break
    fi
  done <<< "$tags"
fi

echo "mark_latest=${mark}" >> "${GITHUB_OUTPUT:?}"
echo "GitHub Release latest=${mark}"
