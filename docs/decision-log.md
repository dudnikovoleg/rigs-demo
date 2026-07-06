# Decision Log

## ADR-001: SQLite with startup seeding over managed PostgreSQL

**Date:** 2026-07-06  
**Status:** Proposed

### Context

The baseline demo uses JSON fixture files as the data store, rewriting them on
writes. This works but is not representative of a production data layer.
Evaluating a migration to a real database for improved realism while maintaining
the demo's zero-config, no-API-key constraint.

### Decision

Adopt **SQLite** as an embedded database with **idempotent startup seeding** from
the existing JSON fixtures.

**Chosen:**
- SQLite file-based database
- Fixtures remain in the repo as source of truth
- On server startup: if DB is empty, seed from fixtures
- Writes go to SQLite during runtime
- At least one write endpoint persists changes to the DB

**Rejected alternative:**
Managed PostgreSQL (e.g., Render free tier Postgres with 90-day expiry).

### Rationale

**Why SQLite over PostgreSQL:**
1. **Zero-config local dev** — no connection strings, no external service setup
2. **Stays close to the fixture spirit** — file-based, portable, inspectable
3. **Minimal dependencies** — `better-sqlite3` is the only new dep
4. **Simpler hosting** — one dyno, no separate DB service
5. **Demo-appropriate** — the app is not multi-tenant; concurrency is not a concern

**Why seeding from fixtures:**
- Fixtures are already realistic, curated demo data
- Seeding is idempotent: safe to run on every startup
- Supports ephemeral disk (see below) by auto-regenerating DB

### Hosting consequence

On **Render free tier**, the disk is **ephemeral**: the SQLite file resets on
every deploy or dyno restart. This means:

- **During a dyno session:** writes persist across server process restarts
  (`Ctrl+C` / `npm run start` again), satisfying the "survives a restart" DoD
  criterion locally and in CI
- **Across deploys:** the DB resets to the seeded fixture state

**Accepted trade-off:** For a demo, ephemeral persistence is fine. The data
regenerates automatically on startup from the checked-in fixtures. If
longer-lived persistence becomes necessary, options include:
- Upgrading to Render's persistent disk (~$1/GB/month)
- Switching to a platform with free persistent storage (Railway, Fly.io, VPS)
- Adopting managed PostgreSQL

For now, the auto-seed behavior makes the ephemeral disk a feature, not a bug:
every deploy starts with clean, known demo data.

### Implementation notes

- SQLite file location: `server/data/rigs.db` (gitignored)
- `better-sqlite3` for synchronous API (simpler than `node-sqlite3`)
- Schema: 5 tables mirroring the fixture JSON structure (`rigs`, `ports`,
  `items`, `inventory`, `shipments`)
- `server/src/db.ts` — schema init, seed logic, query helpers
- `server/src/store.ts` — refactor from fixture I/O to SQL queries
- Startup: check `SELECT COUNT(*) FROM rigs`; if 0, seed from
  `fixtures/*.json`
- Fixtures stay in the repo; `store.ts` stops writing to them

### Verification

Same DoD as baseline:
1. `npm run dev` starts with no errors; DB seeds on first run
2. `npm run typecheck` passes
3. Order flow: create a shipment → visible in UI → restart server → still there
4. Deploy to Render → click through → DB resets on redeploy (expected)

## ADR-002: Order form sets initial shipment status and progress

**Date:** 2026-07-06  
**Status:** Proposed

### Context

The single write flow (`POST /api/shipments`) always created shipments with
status `requested`. The demo therefore could not showcase the shipment
lifecycle through a write: the timeline steps beyond *requested* and the
vessel markers on the map were only reachable via fixture data, never via
user action.

### Decision

Extend the order form with a **status dropdown**
(`requested | loading | in_transit | delivered`, default `requested`) and a
**progress input (0–1)** shown only when status is `in_transit`. Extend
`POST /api/shipments` to accept both as optional fields:
`{ rigId, itemId, quantity, status?, progress? }`.

### Rationale

1. **Richer click-through** — a single order can now demo the full timeline
   and drop a vessel onto the map at a chosen position, the demo's most
   visual payoff.
2. **Backward compatible** — both fields are optional with defaults
   (`status: requested`, `progress: 0`), so the original three-field body
   remains valid.
3. **No DB schema change** — `status` and `progress` columns already exist on
   shipments; only the POST body and the form grow. The CLAUDE.md contract
   rule (change schema/contract in one deliberate step on both sides) is
   satisfied by updating the POST body on client and server together, per
   spec §2 and §4.

### Implementation notes

- `status` must be one of the four enum values; anything else is rejected.
- `progress` is validated to 0–1 and applies only when `status` is
  `in_transit`; for any other status it is ignored and stored as 0.
- Advancing the status of an *existing* shipment remains out of scope
  (spec §8) — the status is chosen once, at creation.