# Process overview

How this repo was built: short, single-purpose Claude Code sessions, each
opened with a Session Brief (Context / Goal / Constraints / Output) and closed
with a commit. Expensive decisions ran in plan mode, cheap ones didn't.

**Git workflow:** For simplicity, all work was done directly on the `main` branch
with one commit per slice, rather than creating separate feature branches. Each
commit represents a complete, verified slice.

## Phases

1. **CLAUDE.md** — goal, stack, hard constraints, when to plan before coding,
   and a checkable definition of done; drafted by the agent, reviewed by hand.
   → [CLAUDE.md](../../CLAUDE.md)
   - Closed by [`c1427a0`](https://github.com/dudnikovoleg/rigs-demo/commit/c1427a0)

2. **[Discovery](01-discovery.md)** — a plan-mode interview session, no code,
   producing the spec with what was confirmed vs. decided at developer
   discretion. → [spec.md](../spec.md)
   - Closed by [`ea40c72`](https://github.com/dudnikovoleg/rigs-demo/commit/ea40c72)

3. **[Skeleton checkpoint](02-skeleton.md)** — a disposable client-only layout
   that validated the UX shape before any backend: header, drawer list ↔ detail
   navigation, back-arrow behavior. Spec synced in the same commit.
   - Closed by [`23cfefe`](https://github.com/dudnikovoleg/rigs-demo/commit/23cfefe)

4. **[Design](03-design.md)** — a plan-mode session producing the
   implementation plan: ordered vertical slices, the 1a/1b split, a self-review
   of ordering risks. → [tasks.md](../tasks.md)
   - Closed by [`d89a8c7`](https://github.com/dudnikovoleg/rigs-demo/commit/d89a8c7)

5. **[Vertical slices](04-implementation.md)** — one fresh session per slice,
   a template prompt, manual verification, one commit per slice (table below).

6. **[Review cycles](05-review.md)** — separate sessions, ranked findings:
   - Integration/code cleanup — [`360b433`](https://github.com/dudnikovoleg/rigs-demo/commit/360b433)
   - UX review — [`9025608`](https://github.com/dudnikovoleg/rigs-demo/commit/9025608)

7. **Docs** — README and [decision-log.md](../decision-log.md) finalized and
   condensed at the end.
   - Closed by [`9d2a8b4`](https://github.com/dudnikovoleg/rigs-demo/commit/9d2a8b4), [`57abe2f`](https://github.com/dudnikovoleg/rigs-demo/commit/57abe2f)

## Slices

| Slice | What | Commit |
|---|---|---|
| 1a | Server foundation: workspaces, fixtures, store, `GET /api/rigs` | [`7fd6d43`](https://github.com/dudnikovoleg/rigs-demo/commit/7fd6d43) |
| 1b | Client on the real API: types, query hooks, map | [`2c43d48`](https://github.com/dudnikovoleg/rigs-demo/commit/2c43d48) |
| 2 | Rig detail drawer with live inventory | [`5f1aa9d`](https://github.com/dudnikovoleg/rigs-demo/commit/5f1aa9d) |
| 3 | Shipments: API, Shipments tab, Inbound/Outbound | [`0dc6f7b`](https://github.com/dudnikovoleg/rigs-demo/commit/0dc6f7b) |
| 4 | Ports & vessels on the map | [`ffc51c2`](https://github.com/dudnikovoleg/rigs-demo/commit/ffc51c2) |
| 5 | "All rigs" list view | [`f8f518a`](https://github.com/dudnikovoleg/rigs-demo/commit/f8f518a) |
| 6 | Order flow: the real write | [`b5ee283`](https://github.com/dudnikovoleg/rigs-demo/commit/b5ee283) |
| 7 | Production build + Render deploy | [`66b6e5d`](https://github.com/dudnikovoleg/rigs-demo/commit/66b6e5d) |
| 8 | Vessel click opens the shipment in the drawer | [`4175b1e`](https://github.com/dudnikovoleg/rigs-demo/commit/4175b1e) |
| 9 | SQLite migration | [`acc0e25`](https://github.com/dudnikovoleg/rigs-demo/commit/acc0e25) |
| 10 | Order form sets initial status and progress | [`083f135`](https://github.com/dudnikovoleg/rigs-demo/commit/083f135) |

Scope changes went through the docs first:

- Slice 8 — spec [`5d7b19c`](https://github.com/dudnikovoleg/rigs-demo/commit/5d7b19c), tasks [`a79c2e2`](https://github.com/dudnikovoleg/rigs-demo/commit/a79c2e2)
- Slice 9 — ADR-001 [`32bdcc2`](https://github.com/dudnikovoleg/rigs-demo/commit/32bdcc2), tasks [`839a028`](https://github.com/dudnikovoleg/rigs-demo/commit/839a028)
- Slice 10 — ADR-002 + spec/tasks [`ccf5303`](https://github.com/dudnikovoleg/rigs-demo/commit/ccf5303)

Slice-focused review follow-ups: slice 9 — [`67ed471`](https://github.com/dudnikovoleg/rigs-demo/commit/67ed471), slice 10 — [`a802a47`](https://github.com/dudnikovoleg/rigs-demo/commit/a802a47).

## Claude Code skills used

- `superpowers:brainstorming` — explore intent and requirements before
  creative work
- `superpowers:executing-plans` — execute the slice plan with checkpoints
- `frontend-design:frontend-design` — visual direction for the UI
- `commit-commands:commit` — structured commits
- `/code-review` — the review passes
- project `verify` skill — launch-and-drive recipe for runtime checks,
  added mid-stream ([`35827ba`](https://github.com/dudnikovoleg/rigs-demo/commit/35827ba))

Lessons learned are in [06-retrospective.md](06-retrospective.md).
