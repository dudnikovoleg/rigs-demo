---
name: verify
description: How to launch and drive rigs-demo for runtime verification — dev stack ports, stale-server gotcha, Playwright-via-Edge recipe for driving the map UI without installed browsers.
---

# Verifying rigs-demo

## Launch

```bash
npm run dev   # concurrently: server (tsx watch, port 4000) + client (Vite, port 5173)
```

**Gotcha — stale dev servers.** A previous session's `npm run dev` often
survives and squats ports 4000/5173; the server then crashes with
`EADDRINUSE` and Vite silently falls back to 5174. Before launching, check
and kill:

```powershell
Get-NetTCPConnection -LocalPort 4000,5173,5174 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -Confirm:$false }
```

## API surface

Curl the server directly on port 4000 (no proxy hop):

```bash
curl -s http://localhost:4000/api/rigs
curl -s "http://localhost:4000/api/shipments?rigId=rig-statfjord-b"
```

Fixture ground truth lives in `server/fixtures/*.json` — cross-check
responses against it by hand. Useful fixture rigs: `rig-statfjord-b`
(one inbound + one outbound in-transit shipment), `rig-elgin` (mixed
`loading` + `delivered` statuses).

## GUI surface (Playwright, no browser download)

No Playwright browsers are installed on this machine, but headless Edge
works via the channel option:

```js
const { chromium } = require("playwright"); // resolve from npx cache if not local:
// path.join(process.env.LOCALAPPDATA, "npm-cache/_npx/<hash>/node_modules/playwright")
const browser = await chromium.launch({ channel: "msedge", headless: true });
```

Find the npx cache copy with:

```bash
for d in ~/AppData/Local/npm-cache/_npx/*/; do
  [ -d "$d/node_modules/playwright" ] && echo "$d"
done
```

Driving the map:

- Rig markers are Leaflet divIcons with class `.rig-pin`; their DOM order
  matches the `/api/rigs` array order, so `page.evaluate(() =>
  fetch("/api/rigs").then(r => r.json()))`, find the target rig's index,
  then `page.locator(".rig-pin").nth(idx).click()`.
- The drawer is the `aside` element; `aria-hidden` flips to `"true"` when
  closed (Esc or map click). Wait ~1200ms after marker click for the
  fly-to pan + slide-in transition before screenshotting.
- Tabs are `button[role='tab']`; active one has `aria-selected='true'`.

Known noise: every page load logs one 404 for `/favicon.ico`
(`client/index.html` declares no icon) — pre-existing, ignore it.

## Flows worth driving

1. Map → click rig marker → drawer header (name/operator/status/coords).
2. Warehouse tab: inventory with resolved names/units + Inbound/Outbound
   sections (derived from undelivered shipments — cross-check against
   `shipments.json`).
3. Shipments tab: direction badge, vessel, ETA, contents, timeline step
   matches shipment `status`; delivered shipments sort last.
4. Esc and map click both close the drawer.
5. Write flow (slice 6+): order an item → appears in Shipments/Inbound →
   repeat GET returns it → restart server → still there.