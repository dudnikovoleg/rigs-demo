-- Normalized schema mirroring the fixture JSON contract.
-- Seeded from server/fixtures/*.json on first run (see seed.ts).

CREATE TABLE IF NOT EXISTS ports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rigs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  operator TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'maintenance'))
);

CREATE TABLE IF NOT EXISTS inventory (
  rig_id TEXT NOT NULL REFERENCES rigs(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  quantity INTEGER NOT NULL,
  PRIMARY KEY (rig_id, item_id)
);

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  origin_type TEXT NOT NULL CHECK(origin_type IN ('port', 'rig')),
  origin_id TEXT NOT NULL,
  destination_type TEXT NOT NULL CHECK(destination_type IN ('port', 'rig')),
  destination_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('requested', 'loading', 'in_transit', 'delivered')),
  vessel TEXT NOT NULL,
  created_at TEXT NOT NULL,
  eta TEXT NOT NULL,
  progress REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS shipment_items (
  shipment_id TEXT NOT NULL REFERENCES shipments(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  quantity INTEGER NOT NULL,
  PRIMARY KEY (shipment_id, item_id)
);
