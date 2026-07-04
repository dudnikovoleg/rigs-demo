# rigs-demo — Spec

## 1. Purpose

Test assignment for a client whose real product is offshore goods-delivery
logistics. It demonstrates: (a) ability to implement, (b) product vision for how
rig-as-warehouse logistics could look. Judged as a click-through demo — data
realism and smoothness over breadth (see CLAUDE.md). Deliverable: public repo +
hosted URL.

## 2. What we're building

A single-page app: a full-screen Leaflet map of the **North Sea** showing ~7 oil
rigs and 2 shore supply bases (e.g., Aberdeen, Stavanger). One real write flow
proves the backend is not a mock.

**Map screen (baseline screen).** Rig markers and port markers on OSM tiles.
In-transit shipments render as vessel markers positioned along the origin→destination
line, with a faint route line. Clicking a rig opens the rig panel.

**Rig panel (side drawer over the map, not a separate route).** Header: rig name,
operator, status. Two tabs:

- **Warehouse** — current inventory (item, quantity, unit, category); plus
  *Inbound* (undelivered shipments heading to this rig) and *Outbound*
  (undelivered shipments leaving it). Inbound/outbound are **derived from
  shipments** — never stored separately, so they can't drift.
- **Shipments** — all shipments touching this rig: direction, contents, vessel,
  ETA, status, and a step timeline (requested → loading → in transit → delivered).
  Selecting an in-transit shipment highlights its vessel on the map.

**Order flow (the real write).** "Order goods" button in the rig panel → small
form: pick item from catalog, quantity. Submit → `POST /api/shipments` creates a
port→rig shipment with status `requested`, persisted by rewriting the fixture
file. It immediately appears in the Shipments tab and in Inbound.

## 3. Data model & fixtures

Fixture files in `server/fixtures/` are the database; all reads/writes go through
one service module. Field lists are deliberately minimal (client's instruction) —
enough for a coherent demo, no more.

- `rigs.json` — id, name, lat, lon, operator, status (e.g., active/maintenance)
- `ports.json` — id, name, lat, lon
- `items.json` — shared catalog: id, name, unit, category (drill pipe, casing,
  cement, diesel, provisions, spare parts, chemicals, fresh water…)
- `inventory.json` — per rig: rigId → [{ itemId, quantity }]
- `shipments.json` — id, origin {type: port|rig, id}, destination {type, id},
  status (`requested | loading | in_transit | delivered`), vessel name,
  createdAt, eta, progress (0–1, meaningful when in transit), items
  [{ itemId, quantity }]

The JSON shape is the client↔server contract (CLAUDE.md); any change happens on
both sides in one step.

## 4. API (Express, JSON)

- `GET /api/rigs` — all rigs (map markers)
- `GET /api/rigs/:id` — rig + its inventory
- `GET /api/ports` — shore bases
- `GET /api/items` — catalog (order form)
- `GET /api/shipments` — all shipments (map vessels); `?rigId=` filters to
  shipments whose origin or destination is that rig
- `POST /api/shipments` — body { rigId, itemId, quantity } → creates a
  port→rig shipment, status `requested`, writes `shipments.json` to disk,
  returns the created shipment

## 5. Repo layout

```
client/               Vite + React + TS + Tailwind + TanStack Query + react-leaflet
  src/api.ts            fetch wrappers + query/mutation hooks (all server state)
  src/types.ts          TS mirror of the fixture JSON contract
  src/App.tsx           layout: map + drawer
  src/components/       MapView, RigPanel, WarehouseTab, ShipmentsTab,
                        ShipmentTimeline, OrderForm
server/               Node + Express + TS
  src/index.ts          app bootstrap; serves built client in production
  src/routes.ts         endpoints above
  src/store.ts          the single service module: read/validate/write fixtures
  fixtures/*.json       the database
package.json          npm workspaces root; scripts: dev, build, start, typecheck
```

## 6. Decisions made at developer discretion

- **North Sea** as the region — the iconic offshore logistics theater; realistic
  rig names/coordinates are easy to make plausible.
- **Side drawer** instead of popup/separate page — keeps map context, smoothest
  click-through.
- Vessel map position = linear interpolation origin→destination by stored
  `progress`; static per page load (no live simulation).
- Inbound/outbound derived from shipments rather than stored (single source of truth).
- **Hosting: Render free tier**, one Node service serving API + built client.
  Caveat: Render's disk is ephemeral, so a hosted write survives a process
  restart but not a redeploy — acceptable for the demo; the CLAUDE.md
  restart-persistence criterion is verified locally.

## 7. Assumptions

- English UI; desktop browser; no auth (single user, per CLAUDE.md).
- Demo data is static except user-created orders; no background simulation.
- No concurrent writers — naive read-modify-write of fixture files is fine.
- Node 20+, npm workspaces.

## 8. Out of scope

- Editing/cancelling shipments; advancing shipment status from the UI
- Rig↔rig transfers
- Live movement, polling/websockets
- Search, filters, pagination; mobile layout; i18n
- Automated test suite (typecheck + manual click-through per CLAUDE.md DoD)

## 9. End-to-end verification

1. `npm install && npm run dev` — client and server start with no errors.
2. `npm run typecheck` passes in both workspaces.
3. In the browser: map shows North Sea with rig, port, and vessel markers →
   click a rig → drawer shows inventory with realistic items, Inbound/Outbound
   lists, Shipments tab with statuses and timelines.
4. Order flow: order an item → new shipment appears as `requested` in Shipments
   and Inbound → `GET /api/shipments?rigId=…` returns it → stop and restart the
   server → it is still there (fixture file was rewritten).
5. `npm run build && npm run start` serves the built client and API from one
   process.
6. Deployed to Render; public URL opened and steps 3–4 (minus restart) clicked
   through end-to-end.
