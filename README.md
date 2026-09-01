Personal site for [dxmm.pt](https://dxmm.pt). Markdown in `content/`, one HTML file out.

## Write

```
scripts/new.sh notes "Title"
# edit content/notes/title.md
# local preview reloads at http://127.0.0.1:8765
scripts/publish.sh          # commit + push to GitHub
```

Editing the same files on GitHub also works: this machine pulls every 2 minutes and rebuilds. Don't leave uncommitted local edits if you plan to write from GitHub — the pull is skipped while the tree is dirty.

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
settings; the DNS records and a `CNAME` file can be added at that point.

## Hosted on this PC

User systemd units (linger enabled so they survive logout):

| unit | what |
|---|---|
| `dxmm.service` | serves `dist/` on `127.0.0.1:8765`, rebuilds on file change |
| `dxmm-sync.timer` | `git pull --ff-only` every 2 minutes |
| `dxmm-tunnel.service` | Cloudflare Tunnel → that port |

```
scripts/install-services.sh
scripts/setup-tunnel.sh     # after Cloudflare login + domain on Cloudflare
```

## Point dxmm.pt here

The domain is registered at site.eu. A Cloudflare Tunnel needs the zone on Cloudflare:

1. Add `dxmm.pt` at [dash.cloudflare.com](https://dash.cloudflare.com) (free plan is enough). Copy the two nameservers it shows (`something.ns.cloudflare.com`).
2. If DNSSEC is on at site.eu, turn it off first — changing nameservers with DNSSEC still active can make the domain vanish.
3. At [site.eu](https://site.eu): domain → Advanced settings → switch **off** “Use default Site.eu settings” → disable DNS management → paste the two Cloudflare nameservers → save. (You cannot keep Site.eu DNS and custom nameservers at the same time.)
4. Wait until `dig NS dxmm.pt` returns the Cloudflare nameservers (minutes, sometimes hours).
5. `scripts/setup-tunnel.sh` — browser login, creates the tunnel, CNAME records, starts the user service.

Until then the site is on `http://127.0.0.1:8765` and the markdown is on GitHub.
