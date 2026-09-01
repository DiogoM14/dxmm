#!/usr/bin/env bash
# Commit content (and any other staged/unstaged tracked changes) and push to GitHub.
set -euo pipefail
cd "$(dirname "$0")/.."

node build.mjs

git add content src build.mjs serve.mjs package.json package-lock.json
if [[ -z "$(git status --porcelain)" ]]; then
  echo "nothing to publish"
  git push -u origin HEAD
  exit 0
fi

msg="${*:-publish $(date +%F)}"
git commit -m "$msg"
git push -u origin HEAD
echo "published → origin"
