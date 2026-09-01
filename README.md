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

1. Add `dxmm.pt` at [dash.cloudflare.com](https://dash.cloudflare.com) (free plan is enough).
2. Copy the two nameservers Cloudflare shows (e.g. `ada.ns.cloudflare.com`).
3. At site.eu, replace the domain's nameservers with those two. Don't touch anything else there.
4. Wait until `dig NS dxmm.pt` returns the Cloudflare nameservers.
5. `scripts/setup-tunnel.sh` — browser login, creates the tunnel, CNAME records, starts the service.

Until then the site is only on localhost (and GitHub as source).
