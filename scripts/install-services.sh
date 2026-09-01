#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
unit_dir="$HOME/.config/systemd/user"
mkdir -p "$unit_dir"

for f in dxmm.service dxmm-sync.service dxmm-sync.timer dxmm-tunnel.service; do
  ln -sfn "$root/deploy/$f" "$unit_dir/$f"
done

chmod +x "$root/scripts/"*.sh
systemctl --user daemon-reload
systemctl --user enable --now dxmm.service
systemctl --user enable --now dxmm-sync.timer

# linger: keep the site up after logout / on boot
if command -v loginctl >/dev/null; then
  loginctl enable-linger "$USER" 2>/dev/null || true
fi

echo "site service:  systemctl --user status dxmm"
echo "local preview: http://127.0.0.1:8765"
echo "github sync:   systemctl --user status dxmm-sync.timer"
echo
echo "tunnel is not started yet — run scripts/setup-tunnel.sh after Cloudflare login"
