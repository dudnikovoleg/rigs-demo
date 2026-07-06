# Review cycles

After the slices, review ran as separate sessions: integration/code cleanup,
a UX pass, and focused reviews after the two late slices. Findings were
ranked; only ranked findings were fixed.

## The cleanup prompt (verbatim)

```
Context: All vertical slices are complete.

Goal: full repository cleanup and consistency check.

Constraints: no new features, no scope changes, no redesign of architecture. Prefer deletion over abstraction. Keep changes minimal and local.

Check:
- consistency across frontend and backend
- data flow correctness (API ↔ client ↔ fixtures)
- duplicated or inconsistent patterns
- dead code and unused files
- unnecessary complexity
- UI consistency (loading / error / empty states)
- unnecessary or outdated comments

Output:
- Critical issues
- Medium issues
- Low issues

For each issue: what is wrong, why it matters, exact fix.
```

## What was found and fixed

**Integration/code cleanup** ([`360b433`](https://github.com/dudnikovoleg/rigs-demo/commit/360b433)): queries that failed rendered an
eternal "Loading…" — replaced with real error states; the closed drawer used
`aria-hidden` but stayed in the tab order — switched to `inert`; duplicated
status-label maps collapsed into one owner; two real map bugs — interrupting
`flyTo`'s zoom arc left route highlights detached (switched to `panTo`), and
lerping vessel positions in lat/lon drifted off the straight projected route
at high zoom (re-lerped in Web Mercator); route lines deduped by unordered
endpoint pair; dead types and over-exported store internals removed.

**UX review** ([`9025608`](https://github.com/dudnikovoleg/rigs-demo/commit/9025608)): text "Loading…" replaced with a spinner; empty
states got actionable copy; vessel markers became direction arrows rotated by
route bearing, with a pulse animation on selection; back button and "All
rigs" made visually discoverable; favicon added.

**SQLite migration review** ([`67ed471`](https://github.com/dudnikovoleg/rigs-demo/commit/67ed471), focused on `store.ts` only): the
`MAX(id)` query for sequential IDs moved inside the insert transaction
(duplicate-ID race); prepared statements cached at module scope; ~60 lines of
duplication extracted into a `reconstructShipments()` helper; error handling
added across store/seed/connection with context logged before re-throw.

**Slice 10 follow-up** ([`a802a47`](https://github.com/dudnikovoleg/rigs-demo/commit/a802a47)): the shipment status list was hand-copied
in four places — now exported once per side (`store.ts`, `types.ts`) with the
type derived from it; new orders get `createdAt`/`eta` consistent with their
initial status instead of a nonsensical future ETA on a `delivered` order.
