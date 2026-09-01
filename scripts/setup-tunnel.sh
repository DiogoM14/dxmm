#!/usr/bin/env bash
# Named Cloudflare Tunnel → http://127.0.0.1:8765
# Requires: cloudflared in ~/.local/bin, a Cloudflare account, and dxmm.pt added as a zone.
set -euo pipefail

bin="$HOME/.local/bin/cloudflared"
cfg_dir="$HOME/.cloudflared"
name="dxmm"
origin="http://127.0.0.1:8765"

if [[ ! -x "$bin" ]]; then
  echo "cloudflared missing — install it first (see README)" >&2
  exit 1
fi

mkdir -p "$cfg_dir"

if [[ ! -f "$cfg_dir/cert.pem" ]]; then
  echo "No Cloudflare cert yet. A browser window / URL will open — log in and authorize the domain."
  echo
  "$bin" tunnel login
fi

if ! "$bin" tunnel list 2>/dev/null | awk 'NR>1 {print $2}' | grep -qx "$name"; then
  echo "creating tunnel '$name'"
  "$bin" tunnel create "$name"
fi

id="$("$bin" tunnel list --output json | python3 -c "
import json,sys
tunnels=json.load(sys.stdin)
for t in tunnels:
    if t.get('name')=='$name':
        print(t['id']); break
else:
    sys.exit('tunnel $name not found')
")"
cred="$cfg_dir/$id.json"
if [[ ! -f "$cred" ]]; then
  echo "credentials file missing: $cred" >&2
  exit 1
fi

cat > "$cfg_dir/config.yml" <<EOF
tunnel: $id
credentials-file: $cred
ingress:
  - hostname: dxmm.pt
    service: $origin
  - hostname: www.dxmm.pt
    service: $origin
  - service: http_status:404
EOF
echo "wrote $cfg_dir/config.yml  (tunnel $id)"

route() {
  local host="$1"
  if "$bin" tunnel route dns "$name" "$host"; then
    echo "DNS: $host → $id.cfargotunnel.com"
  else
    echo "Could not create DNS for $host."
    echo "  Add dxmm.pt to Cloudflare first, then point nameservers at site.eu to the two"
    echo "  Cloudflare nameservers, wait until 'dig NS dxmm.pt' shows them, and re-run this script."
    echo "  Or create a CNAME in the Cloudflare dashboard: $host → $id.cfargotunnel.com (proxied)."
  fi
}

route dxmm.pt
route www.dxmm.pt

systemctl --user daemon-reload
systemctl --user enable --now dxmm-tunnel.service
echo
echo "tunnel: systemctl --user status dxmm-tunnel"
echo "once DNS is live: https://dxmm.pt"
