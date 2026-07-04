# rigs-demo

Demo app for offshore logistics: a map of oil rigs, each rig acting as a
warehouse. Selecting a rig shows its inventory, inbound/outbound goods, and
shipments. It is a demo: data realism and a smooth click-through matter more
than feature breadth or production hardening.

## Stack

- `client/` — Vite + React + TypeScript, Tailwind CSS, TanStack Query,
  react-leaflet with OpenStreetMap tiles
- `server/` — Node + Express + TypeScript, serving JSON fixtures over HTTP
- The JSON fixture files in `server/fixtures/` are the database — all reads
  and writes go through a single service module.

## Hard constraints

- The fixture files are the only data store — no external database. At least
  one write endpoint must work for real: it persists by rewriting the fixture
  file through the service module, so the change survives a server restart.
- No services that need an API key or account (that's why Leaflet + OSM, not
  Mapbox/Google Maps). No auth — the demo is single-user.
- Server state lives in TanStack Query (queries + mutations); don't mirror it
  into useState/context. Keep other dependencies minimal.
- The fixture JSON shape is the API contract between client and server. Change
  it in one deliberate step on both sides, never drift.

## Plan before coding when

- Adding a new entity type
- Changing the fixture schema
Everything else (UI tweaks, styling, copy) — just do it.

## Definition of done (checkable)

- [ ] `npm run dev` starts client + server with no errors
- [ ] `npm run typecheck` passes in both workspaces
- [ ] Demo flow works end-to-end in a browser: open map → click a rig →
      inventory and shipments render
- [ ] At least one write flow works: a change made in the UI is visible in a
      repeat GET and after a server restart
- [ ] Deployed; public URL opened and clicked through end-to-end

## Commands

- `npm install` (root, uses workspaces)
- `npm run dev` — client + server concurrently
- `npm run build` — builds both workspaces
- `npm run start` — production server (serves API + built client)
- `npm run typecheck`
