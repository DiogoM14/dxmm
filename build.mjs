#!/usr/bin/env node
// Builds dist/index.html from src/template.html + content/**/*.md
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const root = dirname(fileURLToPath(import.meta.url));
const SECTIONS = ["writings", "notes"];

marked.setOptions({ gfm: true });

// --- frontmatter -----------------------------------------------------------
// Supports:  key: value  |  tags: [a, b]  |  tags: a, b  |  draft: true
function parseFrontmatter(raw, file) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing --- frontmatter block at the top`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const i = line.indexOf(":");
    if (i < 0) throw new Error(`${file}: bad frontmatter line: ${line}`);
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (key === "tags") {
      val = val.replace(/^\[|\]$/g, "").split(",").map(s => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else if (val === "true" || val === "false") {
      val = val === "true";
    }
    meta[key] = val;
  }
  return { meta, body: m[2] };
}

function loadSection(section) {
  const dir = join(root, "content", section);
  if (!existsSync(dir)) return [];
  const posts = [];
  for (const file of readdirSync(dir).filter(f => f.endsWith(".md")).sort()) {
    const path = join(dir, file);
    const { meta, body } = parseFrontmatter(readFileSync(path, "utf8"), `content/${section}/${file}`);
    if (meta.draft) { console.log(`  · skipped (draft) ${section}/${file}`); continue; }
    if (!meta.title) throw new Error(`content/${section}/${file}: frontmatter needs a "title"`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date || "")) {
      throw new Error(`content/${section}/${file}: frontmatter needs "date: YYYY-MM-DD" (got ${JSON.stringify(meta.date)})`);
    }
    posts.push({
      slug: meta.slug || basename(file, ".md"),
      date: meta.date,
      tags: meta.tags || [],
      title: meta.title,
      html: marked.parse(body.trim()).trim().replace(/<\/blockquote>\s*<blockquote>/g, "\n"),
    });
  }
  // newest first — the template's pager assumes index-1 = newer, index+1 = older
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));
  const seen = new Set();
  for (const p of posts) {
    if (seen.has(p.slug)) throw new Error(`duplicate slug "${p.slug}" in content/${section}`);
    seen.add(p.slug);
  }
  return posts;
}

const template = readFileSync(join(root, "src", "template.html"), "utf8");
if (!template.includes("/*__CONTENT__*/")) {
  throw new Error("src/template.html is missing the /*__CONTENT__*/ placeholder");
}

const data = {};
let total = 0;
for (const s of SECTIONS) { data[s] = loadSection(s); total += data[s].length; }

// </script> inside post content would close the tag early
const js = SECTIONS
  .map(s => `const ${s} = ${JSON.stringify(data[s], null, 2).replace(/<\/script/gi, "<\\/script")};`)
  .join("\n");

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "index.html"), template.replace("/*__CONTENT__*/", js));

console.log(`built dist/index.html — ${SECTIONS.map(s => `${data[s].length} ${s}`).join(", ")} (${total} total)`);
