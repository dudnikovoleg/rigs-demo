# Implementation

Eleven slices, one fresh session each, one commit each. The prompt was a
template with only the slice number changing; verification was manual, per
the slice's verify section, plus a quick click-regression of earlier slices.

## The template prompt (verbatim)

```
Context: repo has CLAUDE.md, docs/spec.md, docs/tasks.md. Slices
[list the committed slices] are done and committed. This session
implements exactly one slice.
Goal: slice N from docs/tasks.md.
Constraints: see CLAUDE.md; stay within the slice's file list — if
you believe another file must change, stop and tell me why first.
Output: working code, verified per the slice's verify section.

Implement slice N from docs/tasks.md. When done, run its verify
steps and show me the results before committing.
```

The file-list line is the guardrail: a request to touch a file outside the
slice's list is an early detector of drift into a neighboring slice or an
unplanned refactor.

## Notable in-session decisions

- **RigPanel deleted, then rebuilt.** The skeleton's placeholder
  `RigPanel.tsx` was deleted together with `data.ts` in slice 1b ([`2c43d48`](https://github.com/dudnikovoleg/rigs-demo/commit/2c43d48))
  and rebuilt for real against the API in slice 2 ([`5f1aa9d`](https://github.com/dudnikovoleg/rigs-demo/commit/5f1aa9d)) — planned in
  tasks.md, not an accident of the session.
- **`key`-based tab reset.** Slice 3 put the drawer tab state in a
  `PanelBody` rendered with `key={rig.id}`, so switching rigs resets the tab
  to Warehouse without effects or manual state plumbing ([`0dc6f7b`](https://github.com/dudnikovoleg/rigs-demo/commit/0dc6f7b)). Slice 8
  evolved the key to `(rig.id, open-sequence)` plus an `initialTab` prop, so
  a vessel click lands on the Shipments tab while a plain rig click still
  defaults to Warehouse ([`4175b1e`](https://github.com/dudnikovoleg/rigs-demo/commit/4175b1e)).
- **Doc-first scope change.** The vessel-click feature (slice 8) entered
  through the documents: spec updated first ([`5d7b19c`](https://github.com/dudnikovoleg/rigs-demo/commit/5d7b19c)), tasks.md synced in a
  separate session ([`a79c2e2`](https://github.com/dudnikovoleg/rigs-demo/commit/a79c2e2)), only then implemented ([`4175b1e`](https://github.com/dudnikovoleg/rigs-demo/commit/4175b1e)).
- **SQLite migration as a full mini-cycle.** Interview on the DB fork →
  ADR-001 plus CLAUDE.md/spec diffs ([`32bdcc2`](https://github.com/dudnikovoleg/rigs-demo/commit/32bdcc2)) → slice 9 added to tasks.md
  ([`839a028`](https://github.com/dudnikovoleg/rigs-demo/commit/839a028)) → implementation with `routes.ts` untouched, proving the API
  contract survived the store rewrite ([`acc0e25`](https://github.com/dudnikovoleg/rigs-demo/commit/acc0e25)).
- **Slice 10 the same way.** ADR-002 plus spec/tasks updates ([`ccf5303`](https://github.com/dudnikovoleg/rigs-demo/commit/ccf5303)),
  then the order-form status/progress implementation ([`083f135`](https://github.com/dudnikovoleg/rigs-demo/commit/083f135)).
- **Verify skill.** A project skill capturing the launch-and-drive recipe
  (dev ports, stale-server gotcha, Playwright-via-Edge) was added mid-stream
  to make runtime verification repeatable across sessions ([`35827ba`](https://github.com/dudnikovoleg/rigs-demo/commit/35827ba)).
