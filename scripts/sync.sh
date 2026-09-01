#!/usr/bin/env bash
# Pull remote commits if the working tree is clean. The file watcher rebuilds.
set -euo pipefail
export PATH="$HOME/.local/bin:$HOME/.local/share/mise/shims:/usr/bin:$PATH"
cd "$(dirname "$0")/.."

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi
if ! git remote get-url origin >/dev/null 2>&1; then
  exit 0
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "local changes, skip pull"
  exit 0
fi

git fetch origin
branch="$(git rev-parse --abbrev-ref HEAD)"
upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
if [[ -z "$upstream" ]]; then
  upstream="origin/$branch"
  git rev-parse "$upstream" >/dev/null 2>&1 || exit 0
fi

local_rev="$(git rev-parse HEAD)"
remote_rev="$(git rev-parse "$upstream")"
if [[ "$local_rev" == "$remote_rev" ]]; then
  exit 0
fi

git pull --ff-only
echo "pulled $(git rev-parse --short "$local_rev") → $(git rev-parse --short HEAD)"
