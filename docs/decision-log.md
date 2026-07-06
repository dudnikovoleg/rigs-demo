# Decision Log

## ADR-001: SQLite with startup seeding over managed PostgreSQL

**Date:** 2026-07-06  
**Status:** Accepted

### Context

The baseline demo used JSON fixture files as the data store, rewriting them on
writes. Migrating to a real database improves realism, but must keep the
demo's zero-config, no-API-key constraint.

### Decision

Adopt **SQLite** (`better-sqlite3`, file at `server/data/rigs.db`, gitignored)
with **idempotent startup seeding**: if the DB is empty on server start, seed
it from the JSON fixtures, which stay in the repo as the source of truth. The
schema mirrors the fixture shape; all reads and writes go through `store.ts`.

**Rejected alternative:** Managed PostgreSQL (e.g. Render free-tier Postgres
with 90-day expiry).

### Rationale

- **Zero-config local dev** — no connection strings, no external service
- **Stays close to the fixture spirit** — file-based, portable, inspectable
- **Minimal footprint** — one new dependency, one dyno, no separate DB service;
  `better-sqlite3` over `node-sqlite3` for its synchronous API
- **Demo-appropriate** — single-user, so concurrency is not a concern

### Hosting consequence

On Render free tier the disk is **ephemeral**: the SQLite file resets on every
deploy. Writes still persist across server process restarts within a dyno
session — the "survives a restart" DoD criterion — and auto-seeding turns the
reset into a feature: every deploy starts from clean, known demo data. If
longer-lived persistence becomes necessary: Render persistent disk
(~$1/GB/month), a platform with free persistent storage, or managed Postgres.

## ADR-002: Order form sets initial shipment status and progress

**Date:** 2026-07-06  
**Status:** Accepted

### Context

The single write flow (`POST /api/shipments`) always created shipments with
status `requested`, so the timeline steps beyond *requested* and the vessel
markers on the map were only reachable via fixture data, never via user action.

### Decision

Extend the order form with a **status dropdown**
(`requested | loading | in_transit | delivered`, default `requested`) and a
**progress input (0–1)** shown only when status is `in_transit`. Extend
`POST /api/shipments` to accept both as optional fields:
`{ rigId, itemId, quantity, status?, progress? }`. Invalid status values are
rejected; progress is validated to 0–1 and ignored (stored as 0) unless
status is `in_transit`.

### Rationale

1. **Richer click-through** — a single order can demo the full timeline and
   drop a vessel onto the map at a chosen position, the demo's most visual
   payoff.
2. **Backward compatible** — both fields are optional with defaults, so the
   original three-field body remains valid.
3. **No DB schema change** — `status` and `progress` columns already exist on
   shipments; the POST body and the form change together on both sides, per
   the CLAUDE.md contract rule.

Advancing the status of an *existing* shipment remains out of scope (spec §8)
— the status is chosen once, at creation.
