# rigs-demo

Demo app for offshore logistics: a map of oil rigs in the North Sea, each rig acting as a warehouse. Click a rig to see its inventory, inbound/outbound goods, and shipments. Click a vessel to see its delivery details.

**Live demo:** [rigs-demo.onrender.com](https://rigs-demo.onrender.com) (hosted on Render free tier)

## What's here

- Interactive map with oil rigs, supply ports, and vessels in transit
- Rig detail view with live inventory and shipment tracking
- Working order flow: create a shipment and see it persist across server restarts (locally; Render's disk is ephemeral)
- All data in JSON fixtures — no external database

Built as a test assignment demonstrating both implementation skill and product vision for offshore logistics.

## Stack

- **Client:** Vite, React, TypeScript, Tailwind CSS, TanStack Query, react-leaflet with OpenStreetMap tiles
- **Server:** Node, Express, TypeScript serving JSON fixtures over HTTP
- **Database:** JSON files in `server/fixtures/` — all reads and writes go through a single service module

## Run locally

```bash
npm install
npm run dev
```

Client: http://localhost:5173  
Server: http://localhost:3000

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
- Order flow: create a port→rig shipment via POST, persisted to fixture file
- List view: all rigs with quick stats
- Two-way linking: click a vessel to see its shipment, click a shipment to highlight its vessel

## Out of scope

- Editing or canceling shipments
- Live simulation or polling
- Search, filters, pagination
- Mobile layout, i18n
- Automated test suite (manual click-through per assignment definition of done)

## Development approach

Built using AI-assisted vertical slicing: discovery → skeleton → 8 vertical slices (fixtures → API → UI), each ending in a runnable, demoable state. See [docs/spec.md](docs/spec.md) for the full implementation spec and [docs/tasks.md](docs/tasks.md) for the slice breakdown.

## Repository

- GitHub: https://github.com/dudnikovoleg/rigs-demo
- Deployed on Render free tier (Node 20, ephemeral disk)
