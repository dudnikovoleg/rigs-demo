# rigs-demo — Implementation plan (vertical slices)

Scope is exactly [docs/spec.md](spec.md), within the constraints of
[CLAUDE.md](../CLAUDE.md). Each slice is one complete feature
(fixtures → API → UI), ends in a runnable, demoable state, and gets one
commit. The existing `client/` skeleton validated the UX but its code is
throwaway; slices 1a–1b replace it with the real foundation.

## Slice 1a — Server foundation: workspaces, fixtures, store, `GET /api/rigs`

**Delivers:** npm-workspaces root with `client` + `server`; Express server
scaffold (`index.ts`, `routes.ts`, `store.ts` — the single service module
reading all fixtures); **all five fixture files** authored with realistic
North Sea data (~7 rigs, 2 ports — Aberdeen and Stavanger, item catalog,
per-rig inventory, shipments in mixed statuses); `GET /api/rigs` including
computed `inventorySkuCount` / `inboundCount` / `outboundCount`; root
scripts `dev` / `build` / `typecheck` extended to cover the server
workspace. All five fixtures land here — the schema is the client↔server
contract and must not churn later.

**Files:** `package.json` (root), `server/package.json`,
`server/tsconfig.json`, `server/src/{index,routes,store}.ts`,
`server/fixtures/{rigs,ports,items,inventory,shipments}.json`.

**Verify:**
- Server starts with no errors; `curl /api/rigs` returns 7 rigs with
  plausible North Sea coordinates and correct computed counts (cross-check
  one rig against the fixtures by hand).
- `npm run typecheck` passes in the server workspace.

## Slice 1b — Client on the real API: map from `GET /api/rigs`

**Delivers:** client rebuilt on the API, skeleton data layer removed:
`types.ts` (TS mirror of the fixture contract), `api.ts` (TanStack Query
hooks, relative `/api` paths), `MapView` with rig markers from the real
endpoint on desaturated OSM tiles, header frame (product name, region
label); Vite dev proxy `/api → server`; root `dev` runs both workspaces
concurrently. Skeleton `data.ts` and the old `RigPanel.tsx` deleted.

**Files:** `client/package.json` (add `@tanstack/react-query`),
`client/vite.config.ts`, `client/src/{types,api}.ts`,
`client/src/App.tsx`, `client/src/components/MapView.tsx`,
`client/src/index.css`; delete `client/src/data.ts`,
`client/src/components/RigPanel.tsx`.

**Verify:**
- `npm install && npm run dev` → map shows 7 rig markers sourced from
  `/api/rigs` (visible in the network tab; no imports of `data.ts` remain).
- `npm run typecheck` passes in both workspaces.

## Slice 2 — Rig detail drawer with live inventory

**Delivers:** `GET /api/rigs/:id` (rig + inventory) and `GET /api/items`
(catalog — needed now to resolve item names/units in the inventory table;
reused by the order form later); click a rig marker → drawer detail view
(header: name, operator, status, coordinates); Warehouse tab with the
inventory table (item, quantity, unit, category); Esc / map click closes;
map pans the rig into the area left of the drawer. Drawer state
(`closed | list | detail`) lives in `App.tsx`.

**Files:** `server/src/{routes,store}.ts`, `client/src/{api,types}.ts`,
`client/src/App.tsx`,
`client/src/components/{RigPanel,WarehouseTab,MapView}.tsx`.

**Verify:**
- Click a rig → drawer shows realistic inventory with names/units resolved;
  the map pans on open.
- Esc and map-click both close the drawer.

## Slice 3 — Shipments: API, Shipments tab, Inbound/Outbound

**Delivers:** `GET /api/shipments` with `?rigId=` filter (origin or
destination matches); Shipments tab (direction, contents, vessel, ETA,
status, `ShipmentTimeline` requested → loading → in transit → delivered);
Warehouse tab gains **Inbound** / **Outbound** sections derived client-side
from the rig's undelivered shipments — never stored.

**Files:** `server/src/{routes,store}.ts`, `client/src/api.ts`,
`client/src/components/{ShipmentsTab,ShipmentTimeline,WarehouseTab,RigPanel}.tsx`.

**Verify:**
- A rig with an in-transit fixture shipment shows it in Shipments (correct
  timeline step) and in Inbound.
- `curl /api/shipments?rigId=…` returns only shipments touching that rig.

## Slice 4 — Ports & vessels on the map

**Delivers:** `GET /api/ports` + port markers; vessel markers for
in-transit shipments positioned by linear interpolation
origin→destination using stored `progress`; faint route lines; selecting a
rig highlights the route lines touching it; selecting an in-transit
shipment in the Shipments tab highlights its vessel (selected-shipment
state in `App.tsx`, extending the slice-2 pattern).

**Files:** `server/src/routes.ts`, `client/src/{api,types}.ts`,
`client/src/App.tsx`,
`client/src/components/{MapView,ShipmentsTab,RigPanel}.tsx`
(RigPanel passes the selected-shipment props through to ShipmentsTab),
`client/src/index.css`.

**Verify:**
- Vessels sit along their origin→destination lines at plausible positions;
  clicking a rig highlights its routes.
- Clicking an in-transit shipment in the tab highlights its vessel.

## Slice 5 — "All rigs" list view

**Delivers:** header "All rigs" button opens the drawer in list view: one
row per rig (name, operator, status, quick stats from the slice-1a
computed counts); row click → detail; back arrow in the detail header
always returns to the list, regardless of how detail was opened.

**Files:** `client/src/App.tsx`, `client/src/components/RigPanel.tsx`.

**Verify:**
- "All rigs" → rows with correct counts → click a row → detail → back
  arrow → list.
- The back arrow also works after opening detail from a map marker.

## Slice 6 — Order flow: the real write

**Delivers:** `POST /api/shipments` `{ rigId, itemId, quantity }` → creates
a port→rig shipment, status `requested`, persisted by `store.ts` rewriting
`shipments.json`; "Order goods" button + `OrderForm` (item select from
catalog, quantity); TanStack mutation invalidates shipments **and** rigs
(counts change); the new shipment appears immediately in Shipments and
Inbound.

**Files:** `server/src/{routes,store}.ts`, `client/src/{api,types}.ts`,
`client/src/components/{OrderForm,RigPanel,WarehouseTab,ShipmentsTab}.tsx`.

**Verify:**
- Order an item → shipment appears as `requested` in Shipments and
  Inbound; a repeat `GET /api/shipments?rigId=…` returns it.
- Stop and restart the server → the shipment is still there (fixture file
  was rewritten on disk).

## Slice 7 — Production build + Render deploy

**Delivers:** server serves the built client in production
(`express.static` + fallback); root `build` / `start` finalized; Render
config (one free-tier Node service, Node 20 pinned); deployed and clicked
through.

**Files:** `server/src/index.ts`, root `package.json`, `render.yaml`.

**Verify:**
- Locally, `npm run build && npm run start` serves API + client from one
  port and the full flow works.
- On the public URL: map → rig → tabs → order → shipment appears
  (restart-persistence is verified locally in slice 6 — Render's disk is
  ephemeral, per spec §6).

## Slice 8 — Vessel click opens the shipment in the rig drawer

**Delivers:** clicking a vessel marker opens the rig panel in detail view on
that shipment's rig — the destination for port→rig shipments, the origin for
rig→port — with the Shipments tab active and the clicked shipment selected
(spec §2). This completes the two-way tab ↔ map link started in slice 4.
Concretely: `MapView` vessel markers gain a click handler that resolves the
target rig from the shipment's `origin`/`destination` and reports
`(rigId, shipmentId)` up to App; `App.tsx` gets a combined open action
(`changeDrawer` currently clears `selectedShipmentId` on every drawer change,
so vessel click must set drawer detail **and** the selected shipment
together); `RigPanel`'s local tab state (defaults to Warehouse, reset per rig
via `key={rig.id}`) gets an initial-tab mechanism so a vessel click lands on
Shipments while a plain rig click still defaults to Warehouse. `ShipmentsTab`
highlighting already keys off `selectedShipmentId` — reused as-is.

**Files:** `client/src/App.tsx`,
`client/src/components/{MapView,RigPanel}.tsx`.

**Verify:**
- Click a vessel → drawer opens on the correct rig (destination for inbound;
  pick an outbound rig→port fixture shipment and confirm the **origin** rig
  opens), Shipments tab active, that shipment highlighted in the list and its
  vessel/route highlighted on the map.
- Regression: rig-marker click still opens the Warehouse tab; selecting a
  shipment in the tab still highlights its vessel; Esc / map click still
  closes and clears selection.
- `npm run typecheck` passes.

## Slice 9 — SQLite migration: fixtures → database, store.ts rewrite

**Delivers:** `better-sqlite3` dependency; normalized DB schema (8 tables:
ports, items, rigs, inventory — denormalized from object structure —
shipments with flattened origin/destination columns, shipment_items junction
table); `server/src/db/` module (schema.sql DDL, connection.ts singleton
with lazy init + foreign-key pragma, seed.ts reading all five fixtures and
populating the DB in a transaction respecting FK order); `store.ts`
completely rewritten — every exported function (`getPorts`, `getItems`,
`getShipments`, `getShipmentsForRig`, `getRigDetail`, `getRigSummaries`,
`createShipment`) replaced with SQL queries reconstructing the exact same
return types (shipments query flattens then rebuilds nested
origin/destination and items array; summaries use GROUP BY for counts);
`index.ts` initializes DB and seeds if empty before starting server; DB file
(`server/data/rigs.db`) gitignored; **routes.ts unchanged** (proves API
contract preserved); all TypeScript type exports in store.ts **unchanged**;
fixtures remain in repo as source of truth for seeding. The schema
normalizes `inventory.json` from `{rigId: [{itemId, quantity}]}` to rows
with composite PK `(rig_id, item_id)` and denormalizes `shipments.json`
items arrays into the shipment_items junction table. `createShipment` uses
`db.transaction()` for atomic insert into shipments + shipment_items and
queries `MAX(id)` for sequential IDs. Seeding is idempotent (checks rig
count, skips if >0).

**Files:** `server/package.json` (add better-sqlite3), `server/src/db/{schema.sql,connection.ts,seed.ts}`, `server/src/store.ts` (full rewrite preserving exports), `server/src/index.ts` (add DB init), `.gitignore` (add server/data/).

**Verify:**
- Delete `server/data/rigs.db` if exists; `npm run dev` → console logs "Seeding database from fixtures..." and "Database seeded successfully".
- `curl /api/rigs` returns 7 rigs with correct inventorySkuCount/inboundCount/outboundCount (compare to a manual fixture count for one rig).
- `curl /api/rigs/rig-forties-alpha | jq '.inventory | length'` matches the fixture inventory entry count.
- `curl /api/shipments | jq 'length'` returns 15 (fixture shipments count); inspect one shipment JSON to confirm origin/destination and items array reconstructed correctly.
- `curl -X POST /api/shipments -H "Content-Type: application/json" -d '{"rigId":"rig-buzzard","itemId":"item-mgo","quantity":100}'` → returns new shipment with `id: "shp-1016"` (next sequential).
- Stop server (Ctrl+C), restart with `npm run dev` → `curl /api/shipments | jq '.[] | select(.id=="shp-1016")'` returns the created shipment (persistence verified).
- Open browser to `http://localhost:5173` → click rig → inventory renders; navigate to Shipments tab → shipments render; order an item → new shipment appears (UI unchanged).
- `npm run typecheck` passes in server workspace.

## Slice 10 — Order form sets initial status and progress

Implements spec §2/§4 as amended by ADR-002 (docs/decision-log.md).

**Delivers:** the order form gains a **status** dropdown
(`requested | loading | in_transit | delivered`, default `requested`) and a
**progress** input (0–1) rendered only when status is `in_transit`;
`POST /api/shipments` accepts both as optional fields —
`{ rigId, itemId, quantity, status?, progress? }` — with validation (status
must be one of the four enum values; progress a number in 0–1; progress
ignored and stored as 0 unless status is `in_transit`). Concretely:
`NewShipmentInput` gains optional `status`/`progress` in **both** mirrors
(`server/src/store.ts`, `client/src/types.ts` — the client↔server contract
changes in one step, per CLAUDE.md); `createShipment` replaces its hardcoded
`status: "requested"` / `progress: 0` with the normalized input; the
`routes.ts` POST handler extends its body validation. Backward compatible —
the old three-field body still works. No DB schema change (`status` and
`progress` columns already exist); no new invalidation work — the slice-6
mutation already invalidates shipments + rigs, so an `in_transit` order
appears as a vessel on the map immediately.

**Files:** `server/src/{routes,store}.ts`, `client/src/types.ts`,
`client/src/components/OrderForm.tsx` (`client/src/api.ts` only if the
mutation input type doesn't flow through unchanged).

**Verify:**
- Order with the default status → behaves exactly as before: `requested` in
  Shipments and Inbound.
- Order with status `in_transit` and progress `0.5` → shipment at the
  *in transit* timeline step and a vessel marker mid-route on the map,
  without a page reload; the progress input is hidden for the other three
  statuses.
- `curl -X POST /api/shipments` with the old three-field body → still 201
  with status `requested`, progress 0 (backward compat).
- `curl` with `"status":"teleported"` or `"progress":1.5` → 400; with
  `"status":"loading","progress":0.7` → 201 with progress stored as 0.
- Stop and restart the server → the created shipments are still there.
- `npm run typecheck` passes in both workspaces.

## Ordering risks (reviewed; baked into the ordering above)

1. **Fixture schema churn** — `GET /api/rigs` counts read inventory *and*
   shipments from day one, so all five fixture schemas (incl. the shipment
   `origin/destination {type,id}` union and `progress`) must be final in
   slice 1a, even though shipment UI lands in slices 3–4. That's why
   slice 1a authors every fixture, not just rigs.
2. **Deploy-driven refactor** — locking relative `/api` paths + Vite proxy
   in slice 1b means slice 7 touches only the server and configs, never
   client code.
3. **Ports deferred to slice 4** — route/vessel geometry is what actually
   needs port coordinates; the map missing 2 port markers until then is
   cosmetic. If it bothers the demo narrative, port markers can trivially
   fold into slice 1b (the data is already there from 1a).
4. **Cross-component selection state** — selected rig (slice 2) and
   selected shipment (slice 4) are client UI state in `App.tsx`, not
   mirrored server state; establishing the pattern in slice 2 keeps
   slice 4 an extension, not a refactor.
5. **Mutation invalidation** — the order mutation must invalidate both the
   shipments and rigs query keys or list-view counts go stale; the key
   structure defined in `api.ts` (slice 1b) makes this a one-liner in
   slice 6.
6. **Back arrow dependency** — the always-back-to-list arrow needs the
   list view, so it arrives in slice 5; until then the detail header
   simply has no back arrow, which is consistent because the list doesn't
   exist yet.
