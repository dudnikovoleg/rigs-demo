# rigs-demo

Demo app for offshore logistics: a map of oil rigs in the North Sea, each rig acting as a warehouse. Click a rig to see its inventory, inbound/outbound goods, and shipments. Click a vessel to see its delivery details.

**Live demo:** [rigs-demo.onrender.com](https://rigs-demo.onrender.com) (hosted on Render free tier)

## What's here

- Interactive map with oil rigs, supply ports, and vessels in transit
- Rig detail view with live inventory and shipment tracking
- Working order flow: create a shipment with an initial status and see it persist across server restarts (locally; Render's disk is ephemeral, so the DB resets and reseeds on redeploy)
- SQLite as the only data store, auto-seeded from JSON fixtures — no external database, no API keys

Built as a test assignment demonstrating both implementation skill and product vision for offshore logistics.

## Stack

- **Client:** Vite, React, TypeScript, Tailwind CSS, TanStack Query, react-leaflet with OpenStreetMap tiles
- **Server:** Node, Express, TypeScript
- **Database:** SQLite (`better-sqlite3`) at `server/data/rigs.db` (gitignored); on first run it seeds from the JSON fixtures in `server/fixtures/`. All reads and writes go through a single service module

## Run locally

```bash
npm install
npm run dev
```

Client: http://localhost:5173  
Server: http://localhost:4000

Production build:
```bash
npm run build
npm run start
```

Type checking:
```bash
npm run typecheck
```

## In scope

- Map with rig, port, and vessel markers
- Rig detail drawer with inventory and shipments
- Shipment status timeline (requested → loading → in transit → delivered)
- Order flow: create a port→rig shipment with an initial status and progress via POST, persisted to SQLite
- List view: all rigs with quick stats
- Two-way linking: click a vessel to see its shipment, click a shipment to highlight its vessel

## Out of scope

- Editing or canceling shipments
- Live simulation or polling
- Search, filters, pagination
- Mobile layout, i18n
- Automated test suite (manual click-through per assignment definition of done)

## Development approach

Built AI-assisted: discovery → throwaway client-only skeleton to validate the UX → vertical slices (fixtures → API → UI, each ending in a runnable, demoable state) → review passes after each slice. See [docs/spec.md](docs/spec.md) for the implementation spec, [docs/tasks.md](docs/tasks.md) for the slice breakdown, and [docs/decision-log.md](docs/decision-log.md) for the reasoning behind key choices (SQLite over managed Postgres, order form setting initial shipment status).

## Repository

- GitHub: https://github.com/dudnikovoleg/rigs-demo
- Deployed on Render free tier (Node 20, ephemeral disk)
