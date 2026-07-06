# rigs-demo — Spec

## 1. Purpose

Test assignment for a client whose real product is offshore goods-delivery
logistics. It demonstrates: (a) ability to implement, (b) product vision for how
rig-as-warehouse logistics could look. Judged as a click-through demo — data
realism and smoothness over breadth (see CLAUDE.md). Deliverable: public repo +
hosted URL.

## 2. What we're building

A single-page app with a Leaflet map of the **North Sea** showing ~7 oil
rigs and 2 shore supply bases (e.g., Aberdeen, Stavanger). One real write flow
proves the backend is not a mock.

**App frame.** A slim header bar above the map: product name, region label,
and an **"All rigs"** button that opens the rig panel in list view.
*Deferred / nice-to-have:* fleet stats (installations · supply bases · vessels
under way) and a marker legend in the header.

**Map screen (baseline screen).** Rig markers and port markers on OSM tiles.
In-transit shipments render as vessel markers positioned along the origin→destination
line, with a faint route line. Clicking a rig marker opens the rig panel in
detail view; clicking a vessel marker opens the rig panel on that shipment's
rig — the destination, or the origin for outbound rig→port runs — with the
Shipments tab active and that shipment selected. Clicking the map or pressing
Esc closes the panel. On selection the map
pans the rig into the area left of the drawer, and the route lines of shipments
touching it are highlighted.

**Rig panel (side drawer over the map, not a separate route).** Two views:

- **List ("All rigs")** — every rig as a row: name, operator, status, quick
  stats (inventory SKUs, inbound/outbound counts). Clicking a row opens the
  detail view.
- **Detail** — header: rig name, operator, status, coordinates, and a back
  arrow that always switches to the list view, regardless of how the detail
  was opened. Two tabs:

  - **Warehouse** — current inventory (item, quantity, unit, category); plus
    *Inbound* (undelivered shipments heading to this rig) and *Outbound*
    (undelivered shipments leaving it). Inbound/outbound are **derived from
    shipments** — never stored separately, so they can't drift.
  - **Shipments** — all shipments touching this rig: direction, contents, vessel,
    ETA, status, and a step timeline (requested → loading → in transit → delivered).
    Selecting an in-transit shipment highlights its vessel on the map; the link
    is two-way — clicking a vessel on the map lands here with that shipment
    selected.

**Order flow (the real write).** "Order goods" button in the rig panel → small
form: pick item from catalog, quantity, and a **status** dropdown
(`requested | loading | in_transit | delivered`, default `requested`); when
status is `in_transit`, a **progress** input (0–1) appears — hidden for all
other statuses. Submit → `POST /api/shipments` creates a port→rig shipment
with the chosen status, persisted to the SQLite DB. It immediately appears in
the Shipments tab (at the matching timeline step); in Inbound if undelivered;
and, when created as `in_transit`, as a vessel marker on the map positioned by
its progress — so a single order can demo the full lifecycle visuals.

## 3. Data model & fixtures

SQLite file at `server/data/rigs.db` (gitignored) is the database. On startup,
if the DB is empty, it seeds from JSON fixtures in `server/fixtures/`. Fixtures
remain in the repo as the source of truth for seeding. All reads/writes go
through one service module (`store.ts`).

Field lists are deliberately minimal (client's instruction) —
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

The DB schema mirrors this JSON shape and is the client↔server contract
(CLAUDE.md); any change happens on both sides in one step.

## 4. API (Express, JSON)

- `GET /api/rigs` — all rigs (map markers); each rig includes computed
  `inventorySkuCount`, `inboundCount`, and `outboundCount` (derived
  server-side from inventory and undelivered shipments) — feeds the list
  view quick stats (§2)
- `GET /api/rigs/:id` — rig + its inventory
- `GET /api/ports` — shore bases
- `GET /api/items` — catalog (order form)
- `GET /api/shipments` — all shipments (map vessels); `?rigId=` filters to
  shipments whose origin or destination is that rig
- `POST /api/shipments` — body { rigId, itemId, quantity, status?, progress? }
  → creates a port→rig shipment, writes to SQLite, returns the created
  shipment. `status` is one of
  `requested | loading | in_transit | delivered`, default `requested`;
  `progress` (0–1) applies only when `status` is `in_transit` and defaults
  to 0 — for any other status it is ignored and stored as 0

## 5. Repo layout

```
client/               Vite + React + TS + Tailwind + TanStack Query + react-leaflet
  src/api.ts            fetch wrappers + query/mutation hooks (all server state)
  src/types.ts          TS mirror of the fixture JSON contract
  src/App.tsx           layout: header + map + drawer; drawer state
                        (closed | list | detail)
  src/components/       MapView, RigPanel (drawer shell: list + detail),
                        WarehouseTab, ShipmentsTab, ShipmentTimeline, OrderForm
server/               Node + Express + TS
  src/index.ts          app bootstrap; serves built client in production
  src/routes.ts         endpoints above
  src/db.ts             schema init, seed logic, query helpers (SQLite)
  src/store.ts          the single service module: wraps db.ts queries
  data/rigs.db          SQLite file (gitignored)
  fixtures/*.json       source of truth for seeding
package.json          npm workspaces root; scripts: dev, build, start, typecheck
```

## 6. Decisions made at developer discretion

- **North Sea** as the region — the iconic offshore logistics theater; realistic
  rig names/coordinates are easy to make plausible.
- **Side drawer** instead of popup/separate page — keeps map context, smoothest
  click-through. Validated in the skeleton: header "All rigs" button opens a
  list view; list ↔ detail navigation with an always-present back arrow in
  detail; Esc or a map click closes the drawer.
- Map look (validated in the skeleton): default OSM tiles desaturated via a CSS
  filter to a chart-like ground; rig/port/vessel markers are Leaflet divIcons
  styled in CSS — no image assets, no extra map plugins.
- Vessel map position = linear interpolation origin→destination by stored
  `progress`; static per page load (no live simulation).
- Inbound/outbound derived from shipments rather than stored (single source of truth).
- **Hosting: Render free tier**, one Node service serving API + built client.
  **Ephemeral disk caveat:** Render free tier resets the SQLite file on every
  deploy or dyno restart. Writes persist during a dyno session (survives process
  restarts), but the DB resets to the seeded fixture state on redeploy. This is
  acceptable for the demo — the DB auto-seeds from fixtures on startup. See
  `docs/decision-log.md` ADR-001 for rationale.

## 7. Assumptions

- English UI; desktop browser; no auth (single user, per CLAUDE.md).
- Demo data is static except user-created orders; no background simulation.
- No concurrent writers — naive read-modify-write of fixture files is fine.
- Node 24+, npm workspaces.

## 8. Out of scope

- Editing/cancelling shipments; advancing the status of an *existing*
  shipment from the UI (the initial status is chosen at creation in the
  order form, §2 — after that it's immutable)
- Rig↔rig transfers
- Live movement, polling/websockets
- Search, filters, pagination; mobile layout; i18n
- Automated test suite (typecheck + manual click-through per CLAUDE.md DoD)

## 9. End-to-end verification

1. `npm install && npm run dev` — client and server start with no errors.
2. `npm run typecheck` passes in both workspaces.
3. In the browser: map shows North Sea with rig, port, and vessel markers →
   click a rig marker (or "All rigs" → a row) → drawer shows inventory with
   realistic items, Inbound/Outbound lists, Shipments tab with statuses and
   timelines; the back arrow returns to the All rigs list; clicking a vessel
   marker opens the drawer on that shipment's rig with the Shipments tab
   active and the shipment highlighted.
4. Order flow: order an item with the default status → new shipment appears as
   `requested` in Shipments and Inbound → `GET /api/shipments?rigId=…` returns
   it → stop and restart the server process → it is still there (persisted to
   SQLite). Then order another item with status `in_transit` and a progress
   value → it appears at the *in transit* timeline step in Shipments and as a
   vessel marker positioned along its route on the map.
5. `npm run build && npm run start` serves the built client and API from one
   process.
6. Deployed to Render; public URL opened and steps 3–4 (minus restart) clicked
   through end-to-end.
