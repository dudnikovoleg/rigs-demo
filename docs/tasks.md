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
`client/src/App.tsx`, `client/src/components/{MapView,ShipmentsTab}.tsx`,
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
