---
title: Labels that don't collide
date: 2026-03-19
tags: [typescript, maps]
---

Map labels are a packing problem you have to solve sixty times a second. Every zoom, every pan, every label wants the same corner of the screen.

MapLibre handles the built-in symbol layers well. The trouble starts when your labels are custom DOM markers and you're the one responsible for deciding who wins.

## The approach

Project every label to screen space once per frame, bucket them into a coarse grid, and only test collisions inside a bucket and its neighbours. Priority is a number on the feature, so the data decides what survives, not the render order.

```js
const cell = 64;
const key = (x, y) =>
  `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
```

That took a 30ms frame down to under 4ms with ~2,000 labels. The grid is the whole trick; everything else is bookkeeping.
