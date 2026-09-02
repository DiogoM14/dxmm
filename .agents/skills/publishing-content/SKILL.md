---
name: publishing-content
description: Turns a supplied Markdown writing or note into a publication for this site, including classification, frontmatter, filename, validation, and optional GitHub publication. Use when a user sends an .md publication or asks to add, prepare, or publish content.
---

# Publishing Content

Prepare a supplied Markdown document for the `dxmm.pt` static site. The site has
two content types: `content/writings/` for longer, polished pieces and
`content/notes/` for personal notes, short observations, and rough thoughts.

## Workflow

1. Read the supplied Markdown file completely before editing it. Treat its prose
   and voice as intentional. Do not rewrite, summarize, or “improve” the prose
   unless the user asks for editing.
2. Inspect its frontmatter and determine the destination:
   - Use `writings/` when the document is presented as an essay, article, or
     finished piece.
   - Use `notes/` for a note, journal-like entry, idea dump, or explicitly
     requested note.
   - If the type is genuinely ambiguous and cannot be inferred from the user's
     wording, ask which one they want rather than guessing.
3. Ensure the document has the required frontmatter at the top:

   ```yaml
   ---
   title: The document title
   date: YYYY-MM-DD
   tags: []
   ---
   ```

   Preserve existing `title`, `date`, `tags`, `slug`, and `draft` values when
   they are valid. Infer a missing title from the first top-level Markdown
   heading or the supplied filename; if neither gives a sensible title, ask the
   user. Use today's date for a missing date. Keep tags as a simple list and
   choose no tags (`tags: []`) rather than inventing uncertain ones. Keep
   `draft: true` when the user supplied it; otherwise do not add it.
4. Choose a lowercase kebab-case filename based on the title. Remove punctuation
   and accents where practical, collapse repeated separators, and write the
   file as `content/<writings|notes>/<slug>.md`. If that path already exists,
   do not overwrite it: report the collision and ask whether to use a different
   slug or replace the existing publication.
5. Keep the Markdown body intact apart from removing a duplicate title heading
   when the title is already represented by frontmatter. Do not add decorative
   sections, metadata, or links just to make the document look more structured.
6. Run `npm run build` from the repository root. This validates frontmatter,
   dates, Markdown parsing, and duplicate slugs, and regenerates
   `dist/index.html`. Fix only issues caused by the supplied publication.
7. Report the created path, detected type, title, date, tags, and build result.

## Formatting rules

- Frontmatter must be the first block and use the exact `---` delimiters.
- `date` must be an ISO date in `YYYY-MM-DD` format; do not use a timestamp.
- `tags` may be `[]` or a comma-separated/list value accepted by
  `build.mjs`.
- `slug` is optional and defaults to the filename. If an existing valid slug is
  supplied, preserve it and use it when checking for collisions.
- A draft is valid content but is intentionally omitted from the generated
  site. Mention that in the report.

## Publishing to GitHub

“Prepare,” “add,” or “create” means make the local content file and run the
build only. Run `scripts/publish.sh` only when the user explicitly asks to
publish, push, or deploy the publication. Before doing so, show the intended
file and commit scope if there are unrelated worktree changes, and never stage
or alter unrelated changes. Pass a concise commit message such as
`publish: <title>`. Report the push result honestly; a successful local build
is not a successful GitHub publication.

## Expected response

Keep the response concise and include:

- destination path and whether it is a note or writing;
- title/date/tags and whether it is a draft;
- validation command and result;
- if requested, the GitHub push result.

If the source document has no clear title, type, or safe destination, ask one
focused question before creating a file.
