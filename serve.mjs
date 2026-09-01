#!/usr/bin/env node
// Serves dist/ and rebuilds when content/ or src/ change.
import { createServer } from "node:http";
import { readFileSync, watch, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "dist");
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 8765);
const liveReload =
  process.env.LIVE_RELOAD === "1" ||
  (process.stdout.isTTY && process.env.LIVE_RELOAD !== "0");

const clients = new Set();
let building = false;
let pending = false;
let debounce;

function rebuild(reason) {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    if (building) { pending = true; return; }
    building = true;
    pending = false;
    const t = Date.now();
    const child = spawn(process.execPath, ["build.mjs"], { cwd: root, stdio: "inherit" });
    child.on("exit", (code) => {
      building = false;
      if (code === 0) {
        console.log(`rebuilt in ${Date.now() - t}ms${reason ? ` (${reason})` : ""}`);
        for (const res of clients) res.write("data: reload\n\n");
      } else {
        console.error(`build failed (exit ${code})`);
      }
      if (pending) rebuild("queued");
    });
  }, 120);
}

function interesting(dir, filename) {
  if (!filename) return false;
  const base = filename.split("/").pop();
  if (base.startsWith(".") || base.endsWith("~") || base.endsWith(".swp")) return false;
  if (dir === "content") return filename.endsWith(".md");
  if (dir === "src") return filename.endsWith(".html");
  return false;
}

for (const dir of ["content", "src"]) {
  const path = join(root, dir);
  if (!existsSync(path)) continue;
  watch(path, { recursive: true }, (_event, filename) => {
    if (interesting(dir, filename)) rebuild(filename);
  });
}

const RELOAD_SNIPPET = `<script>
new EventSource("/__reload").onmessage = () => location.reload();
</script>`;

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);

  if (url === "/__reload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(":\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  if (url !== "/" && url !== "/index.html") {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("not found");
    return;
  }

  const file = join(dist, "index.html");
  if (!existsSync(file)) {
    res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("site not built yet");
    return;
  }

  let html = readFileSync(file, "utf8");
  if (liveReload) html = html.replace("</body>", `${RELOAD_SNIPPET}\n</body>`);
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  res.end(html);
});

server.listen(PORT, HOST, () => {
  console.log(`dxmm → http://${HOST}:${PORT}${liveReload ? "  (live reload)" : ""}`);
  if (!existsSync(join(dist, "index.html"))) rebuild("startup");
});
