#!/usr/bin/env bash
# usage: scripts/new.sh notes|writings "Title"
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
section="${1:-}"
title="${2:-}"

if [[ "$section" != "notes" && "$section" != "writings" ]]; then
  echo "usage: scripts/new.sh notes|writings \"Title\"" >&2
  exit 1
fi
if [[ -z "$title" ]]; then
  echo "usage: scripts/new.sh $section \"Title\"" >&2
  exit 1
fi

slug=$(printf '%s' "$title" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
file="$root/content/$section/$slug.md"
if [[ -e "$file" ]]; then
  echo "already exists: $file" >&2
  exit 1
fi

cat > "$file" <<EOF
---
title: $title
date: $(date +%F)
tags: []
---

EOF

echo "$file"
