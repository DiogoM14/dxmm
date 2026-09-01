Personal site for [dxmm.pt](https://dxmm.pt). Markdown in `content/`, one HTML file out.

## Write

```
scripts/new.sh notes "Title"
# edit content/notes/title.md
# local preview reloads at http://127.0.0.1:8765
scripts/publish.sh          # commit + push to GitHub
```

Editing the same files on GitHub also works.

Frontmatter: see `content/README.md`.

## Run locally

```
npm install
npm run build          # writes dist/index.html
npm run dev            # serve + live reload + watch
```

## GitHub Pages

The `main` branch deploys automatically through `.github/workflows/pages.yml`.
In the repository on GitHub, open **Settings → Pages** and set **Source** to
**GitHub Actions**. GitHub will then provide a temporary URL like
`https://diogom14.github.io/dxmm/` after the first successful deployment.

When `dxmm.pt` is ready, configure it as the custom domain in the same Pages
settings and follow GitHub’s instructions for the required DNS record.
