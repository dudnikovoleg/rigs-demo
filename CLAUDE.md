# rigs-demo

Demo app for offshore logistics: a map of oil rigs, each rig acting as a
warehouse. Selecting a rig shows its inventory, inbound/outbound goods, and
shipments. It is a demo: data realism and a smooth click-through matter more
than feature breadth or production hardening.

## Stack

- `client/` — Vite + React + TypeScript, Tailwind CSS, TanStack Query,
  react-leaflet with OpenStreetMap tiles
- `server/` — Node + Express + TypeScript, SQLite (`better-sqlite3`)
- Data store: SQLite file (`server/data/rigs.db`, gitignored). On startup, if
  the DB is empty, it seeds from JSON fixtures in `server/fixtures/`. Fixtures
  remain in the repo as the source of truth for seeding. All reads and writes
  go through a single service module (`store.ts`).

## Hard constraints

- SQLite is the only data store — no external database, no API keys. At least
  one write endpoint must work for real: it persists to the DB, so the change
  survives a server restart (process restart within a dyno session).
- No services that need an API key or account (that's why Leaflet + OSM, not
  Mapbox/Google Maps). No auth — the demo is single-user.
- Server state lives in TanStack Query (queries + mutations); don't mirror it
  into useState/context. Keep other dependencies minimal.
- The DB schema mirrors the fixture JSON shape and is the API contract between
  client and server. Change it in one deliberate step on both sides, never drift.

## Plan before coding when

- Adding a new entity type
- Changing the DB schema (and fixture schema if seeding changes)
Everything else (UI tweaks, styling, copy) — just do it.

## Definition of done (checkable)

- [ ] `npm run dev` starts client + server with no errors
      (DB seeds from fixtures on first run if empty)
- [ ] `npm run typecheck` passes in both workspaces
- [ ] Demo flow works end-to-end in a browser: open map → click a rig →
      inventory and shipments render
- [ ] At least one write flow works: a change made in the UI is visible in a
      repeat GET and after a server process restart
- [ ] Deployed; public URL opened and clicked through end-to-end
      (ephemeral disk: DB resets on redeploy, auto-seeds from fixtures)

## Commands

- `npm install` (root, uses workspaces)
- `npm run dev` — client + server concurrently
- `npm run build` — builds both workspaces
- `npm run start` — production server (serves API + built client)
- `npm run typecheck`
