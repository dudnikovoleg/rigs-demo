# Design

A plan-mode session turned the spec into [tasks.md](../tasks.md) — ordered
vertical slices, and the only design artifact. Closed by [`d89a8c7`](https://github.com/dudnikovoleg/rigs-demo/commit/d89a8c7).

## The prompt (verbatim)

```
Context: repo has CLAUDE.md, docs/spec.md (final), and a disposable
UX skeleton in client/ — the skeleton validated the layout but its
code is throwaway.
Goal: an implementation plan as vertical slices.
Constraints: see CLAUDE.md. Scope is exactly docs/spec.md — items
Output: docs/tasks.md

Based on docs/spec.md, produce docs/tasks.md: an ordered list of
vertical slices. Each slice is one complete feature (fixtures → API →
UI), ends in a runnable, demoable state, and gets one commit. For
each slice: name, what it delivers, files it touches, and how to
verify it works (one or two manual checks).

Rules:
- First slice replaces the skeleton with the real foundation (scaffold,
  workspaces, fixtures, the service module, map with real GET /api/rigs).
- The write flow (order form + POST) and deploy are separate slices,
  not afterthoughts — deploy is a slice with its own verification.
- Flag any slice that looks bigger than the others; propose how to
  split it.
- Before writing the file, review your own plan: what ordering risk
  or hidden dependency would a senior engineer flag?

Do not generate code.
```

## The slice breakdown

Eight slices at first (1a, 1b, 2–7); slices 8–10 were added later through
spec-first changes (see [04-implementation.md](04-implementation.md)).

**The Slice 1 split.** The foundation slice was flagged as bigger than the
rest and split: **1a** — server foundation with workspaces, `store.ts`, and
*all five* fixture files authored final ([`7fd6d43`](https://github.com/dudnikovoleg/rigs-demo/commit/7fd6d43)); **1b** — client rebuilt
on the real API, skeleton data layer deleted ([`2c43d48`](https://github.com/dudnikovoleg/rigs-demo/commit/2c43d48)). This kept the most
fragile seam of the project (proxy, types, client↔server glue) in its own
session.

## Ordering risks flagged in the self-review

Recorded in the [tasks.md "Ordering risks" section](../tasks.md) and baked
into the ordering:

1. **Fixture schema churn** — `GET /api/rigs` counts read inventory *and*
   shipments from day one, so every fixture schema had to be final in 1a,
   even though shipment UI only lands in slices 3–4.
2. **Deploy-driven refactor** — relative `/api` paths + Vite proxy locked in
   1b so the deploy slice touches only server and configs, never client code.
3. **Ports deferred to slice 4** — only route/vessel geometry actually needs
   port coordinates.
4. **Selection state** — established in `App.tsx` in slice 2 so slice 4 is an
   extension, not a refactor.
5. **Mutation invalidation** — the order mutation must invalidate shipments
   *and* rigs, made a one-liner by the query-key structure from 1b.
6. **Back arrow** — needs the list view, so it arrives with slice 5.
