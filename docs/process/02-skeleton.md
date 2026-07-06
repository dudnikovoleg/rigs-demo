# Skeleton checkpoint

A disposable, client-only layout with inline fake data — no backend, no
TanStack Query — built to validate the UX shape. Closed by [`23cfefe`](https://github.com/dudnikovoleg/rigs-demo/commit/23cfefe).

## The prompt (verbatim)

```
Context: repo has CLAUDE.md and docs/spec.md. No code yet.
Goal: disposable visual skeleton to validate the UX shape.
Constraints: see CLAUDE.md. This code is throwaway.
Output: a runnable client-only layout.

Based on docs/spec.md, build the thinnest visual skeleton: the map
with a few hardcoded rigs and ports, a click opens the rig drawer
with placeholder inventory and shipments. No backend, no TanStack
Query, no real data flow — static data inline, pure layout.
```

## What the checkpoint changed

Looking at the running skeleton settled UX questions the spec had left open:

- **App frame** — a slim header with product name, region label, and an
  "All rigs" button; header stats and a marker legend were deferred.
- **Rig list** — "All rigs" opens the drawer in a list view; a row click
  switches to detail.
- **Back arrow** — the detail header always returns to the list view,
  regardless of whether detail was opened from the map or the list.
- **Map look** — default OSM tiles desaturated with a CSS filter; markers as
  CSS-styled Leaflet divIcons, no image assets.

## Spec sync

The spec was updated to the validated UX in the **same commit** as the
skeleton ([`23cfefe`](https://github.com/dudnikovoleg/rigs-demo/commit/23cfefe) — its message documents both). The skeleton code itself
was throwaway by design: `data.ts` and the placeholder `RigPanel.tsx` were
deleted in slice 1b ([`2c43d48`](https://github.com/dudnikovoleg/rigs-demo/commit/2c43d48)) when the client was rebuilt on the real API.
