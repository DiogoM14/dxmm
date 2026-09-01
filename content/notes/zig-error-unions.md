---
title: Zig error unions
date: 2026-07-27
tags: [zig]
---

Zig error unions are what I always wanted TypeScript's Result types to be.

```zig
fn readConfig(path: []const u8) ![]Route {
    const file = try std.fs.cwd().openFile(path, .{});
    defer file.close();
    return parse(file);
}
```

The `!` is the whole type system doing what a dozen npm packages tried to do.
