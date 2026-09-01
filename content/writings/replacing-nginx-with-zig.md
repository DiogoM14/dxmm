---
title: Replacing nginx with 400 lines of Zig
date: 2026-08-14
tags: [zig, tooling]
---

Every NX monorepo I've worked on eventually grows a local reverse proxy. It starts as a Caddyfile, becomes an nginx config nobody wants to touch, and ends up as folklore. Someone leaves, the config stays, and every new app gets a port number chosen by superstition.

So I wrote one. Not because nginx is bad, but because the thing I actually need is tiny: read a list of hostnames, map each to a port, forward the request, and don't crash when a dev server restarts.

## What it does

- reads a plain text file with `host port` pairs
- listens on 80 and forwards by `Host` header
- reloads the file on change, no restart
- passes websockets through untouched

The config file is the whole interface:

```
app.local      4200
admin.local    4201
api.local      3000
```

## What I learned

HTTP/1.1 is friendlier than its reputation. The parts that matter for a proxy fit on one page of the RFC: request line, headers, `Content-Length` or chunked, done. Everything else I could ignore because I control both ends.

I also stopped caring about speed early. It's a dev tool. The bottleneck is Angular's dev server, not a few allocations per request. Zig made it easy to be correct first; the allocator you pass in is the allocator you get, and nothing happens behind your back.

Next up: TLS, because Safari has opinions about `.local` over plain HTTP.
