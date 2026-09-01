Drop a `.md` file in `writings/` or `notes/`. The site rebuilds on save.

```
---
title: The title
date: 2026-09-01
tags: [zig, tooling]
slug: optional-url-slug
draft: true
---

Markdown body.
```

`draft: true` keeps the post off the site. `slug` defaults to the filename.

```
scripts/new.sh notes "Palatino on a dark background"
scripts/publish.sh
```
