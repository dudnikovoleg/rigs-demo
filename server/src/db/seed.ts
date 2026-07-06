import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Database } from "better-sqlite3";

interface Rig {
  id: string;
  name: string;
  lat: number;
  lon: number;
  operator: string;
  status: string;
}

interface Port {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface Item {
  id: string;
  name: string;
  unit: string;
  category: string;
}

interface ItemQuantity {
  itemId: string;
  quantity: number;
}

type Inventory = Record<string, ItemQuantity[]>;

interface ShipmentEndpoint {
  type: string;
  id: string;
}

interface Shipment {
  id: string;
  origin: ShipmentEndpoint;
  destination: ShipmentEndpoint;
  status: string;
  vessel: string;
  createdAt: string;
  eta: string;
  progress: number;
  items: ItemQuantity[];
}

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "fixtures",
);

function readFixture<T>(name: string): T {
  const file = path.join(fixturesDir, `${name}.json`);
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

/**
 * Seeds the database from fixtures if empty (idempotent: checks rig count,
 * skips if >0). Respects FK order: items → ports/rigs → inventory/shipments →
 * shipment_items. Runs in a transaction for atomicity.
 */
export function seedDatabase(db: Database): void {
  const rigCount = db.prepare("SELECT COUNT(*) as count FROM rigs").get() as { count: number };
  if (rigCount.count > 0) {
    return;
  }

  console.log("Seeding database from fixtures...");

  const items = readFixture<Item[]>("items");
  const ports = readFixture<Port[]>("ports");
  const rigs = readFixture<Rig[]>("rigs");
  const inventory = readFixture<Inventory>("inventory");
  const shipments = readFixture<Shipment[]>("shipments");

  const transaction = db.transaction(() => {
    const insertItem = db.prepare(
      "INSERT INTO items (id, name, unit, category) VALUES (?, ?, ?, ?)",
    );
    for (const item of items) {
      insertItem.run(item.id, item.name, item.unit, item.category);
    }

    const insertPort = db.prepare(
      "INSERT INTO ports (id, name, lat, lon) VALUES (?, ?, ?, ?)",
    );
    for (const port of ports) {
      insertPort.run(port.id, port.name, port.lat, port.lon);
    }

    const insertRig = db.prepare(
      "INSERT INTO rigs (id, name, lat, lon, operator, status) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const rig of rigs) {
      insertRig.run(rig.id, rig.name, rig.lat, rig.lon, rig.operator, rig.status);
    }

    const insertInventory = db.prepare(
      "INSERT INTO inventory (rig_id, item_id, quantity) VALUES (?, ?, ?)",
    );
    for (const [rigId, items] of Object.entries(inventory)) {
      for (const { itemId, quantity } of items) {
        insertInventory.run(rigId, itemId, quantity);
      }
    }

    const insertShipment = db.prepare(
      "INSERT INTO shipments (id, origin_type, origin_id, destination_type, destination_id, status, vessel, created_at, eta, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const insertShipmentItem = db.prepare(
      "INSERT INTO shipment_items (shipment_id, item_id, quantity) VALUES (?, ?, ?)",
    );
    for (const shipment of shipments) {
      insertShipment.run(
        shipment.id,
        shipment.origin.type,
        shipment.origin.id,
        shipment.destination.type,
        shipment.destination.id,
        shipment.status,
        shipment.vessel,
        shipment.createdAt,
        shipment.eta,
        shipment.progress,
      );
      for (const { itemId, quantity } of shipment.items) {
        insertShipmentItem.run(shipment.id, itemId, quantity);
      }
    }
  });

  transaction();
  console.log("Database seeded successfully");
}
