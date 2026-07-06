import { getDb } from "./db/connection.js";

// Type exports unchanged — the fixture JSON shape is the client<->server contract.

export interface Rig {
  id: string;
  name: string;
  lat: number;
  lon: number;
  operator: string;
  status: "active" | "maintenance";
}

export interface Port {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface Item {
  id: string;
  name: string;
  unit: string;
  category: string;
}

export interface ItemQuantity {
  itemId: string;
  quantity: number;
}

export type ShipmentStatus = "requested" | "loading" | "in_transit" | "delivered";

export interface ShipmentEndpoint {
  type: "port" | "rig";
  id: string;
}

export interface Shipment {
  id: string;
  origin: ShipmentEndpoint;
  destination: ShipmentEndpoint;
  status: ShipmentStatus;
  vessel: string;
  createdAt: string;
  eta: string;
  progress: number;
  items: ItemQuantity[];
}

export interface NewShipmentInput {
  rigId: string;
  itemId: string;
  quantity: number;
}

export interface RigSummary extends Rig {
  inventorySkuCount: number;
  inboundCount: number;
  outboundCount: number;
}

export interface RigDetail extends Rig {
  inventory: ItemQuantity[];
}

export function getPorts(): Port[] {
  const db = getDb();
  return db.prepare("SELECT id, name, lat, lon FROM ports").all() as Port[];
}

export function getItems(): Item[] {
  const db = getDb();
  return db.prepare("SELECT id, name, unit, category FROM items").all() as Item[];
}

export function getShipments(): Shipment[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      s.id,
      s.origin_type,
      s.origin_id,
      s.destination_type,
      s.destination_id,
      s.status,
      s.vessel,
      s.created_at,
      s.eta,
      s.progress,
      si.item_id,
      si.quantity
    FROM shipments s
    LEFT JOIN shipment_items si ON s.id = si.shipment_id
    ORDER BY s.id, si.item_id
  `).all() as Array<{
    id: string;
    origin_type: string;
    origin_id: string;
    destination_type: string;
    destination_id: string;
    status: string;
    vessel: string;
    created_at: string;
    eta: string;
    progress: number;
    item_id: string | null;
    quantity: number | null;
  }>;

  const shipmentsMap = new Map<string, Shipment>();
  for (const row of rows) {
    if (!shipmentsMap.has(row.id)) {
      shipmentsMap.set(row.id, {
        id: row.id,
        origin: { type: row.origin_type as "port" | "rig", id: row.origin_id },
        destination: { type: row.destination_type as "port" | "rig", id: row.destination_id },
        status: row.status as ShipmentStatus,
        vessel: row.vessel,
        createdAt: row.created_at,
        eta: row.eta,
        progress: row.progress,
        items: [],
      });
    }
    if (row.item_id && row.quantity !== null) {
      shipmentsMap.get(row.id)!.items.push({
        itemId: row.item_id,
        quantity: row.quantity,
      });
    }
  }

  return Array.from(shipmentsMap.values());
}

export function getShipmentsForRig(rigId: string): Shipment[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      s.id,
      s.origin_type,
      s.origin_id,
      s.destination_type,
      s.destination_id,
      s.status,
      s.vessel,
      s.created_at,
      s.eta,
      s.progress,
      si.item_id,
      si.quantity
    FROM shipments s
    LEFT JOIN shipment_items si ON s.id = si.shipment_id
    WHERE (s.origin_type = 'rig' AND s.origin_id = ?)
       OR (s.destination_type = 'rig' AND s.destination_id = ?)
    ORDER BY s.id, si.item_id
  `).all(rigId, rigId) as Array<{
    id: string;
    origin_type: string;
    origin_id: string;
    destination_type: string;
    destination_id: string;
    status: string;
    vessel: string;
    created_at: string;
    eta: string;
    progress: number;
    item_id: string | null;
    quantity: number | null;
  }>;

  const shipmentsMap = new Map<string, Shipment>();
  for (const row of rows) {
    if (!shipmentsMap.has(row.id)) {
      shipmentsMap.set(row.id, {
        id: row.id,
        origin: { type: row.origin_type as "port" | "rig", id: row.origin_id },
        destination: { type: row.destination_type as "port" | "rig", id: row.destination_id },
        status: row.status as ShipmentStatus,
        vessel: row.vessel,
        createdAt: row.created_at,
        eta: row.eta,
        progress: row.progress,
        items: [],
      });
    }
    if (row.item_id && row.quantity !== null) {
      shipmentsMap.get(row.id)!.items.push({
        itemId: row.item_id,
        quantity: row.quantity,
      });
    }
  }

  return Array.from(shipmentsMap.values());
}

export function getRigDetail(id: string): RigDetail | undefined {
  const db = getDb();
  const rig = db.prepare("SELECT id, name, lat, lon, operator, status FROM rigs WHERE id = ?")
    .get(id) as Rig | undefined;

  if (!rig) return undefined;

  const inventory = db.prepare(`
    SELECT item_id as itemId, quantity
    FROM inventory
    WHERE rig_id = ?
  `).all(id) as ItemQuantity[];

  return { ...rig, inventory };
}

export function getRigSummaries(): RigSummary[] {
  const db = getDb();

  const rigs = db.prepare("SELECT id, name, lat, lon, operator, status FROM rigs")
    .all() as Rig[];

  const inventoryCounts = db.prepare(`
    SELECT rig_id, COUNT(*) as count
    FROM inventory
    GROUP BY rig_id
  `).all() as Array<{ rig_id: string; count: number }>;

  const inboundCounts = db.prepare(`
    SELECT destination_id, COUNT(*) as count
    FROM shipments
    WHERE destination_type = 'rig' AND status != 'delivered'
    GROUP BY destination_id
  `).all() as Array<{ destination_id: string; count: number }>;

  const outboundCounts = db.prepare(`
    SELECT origin_id, COUNT(*) as count
    FROM shipments
    WHERE origin_type = 'rig' AND status != 'delivered'
    GROUP BY origin_id
  `).all() as Array<{ origin_id: string; count: number }>;

  const inventoryMap = new Map(inventoryCounts.map(r => [r.rig_id, r.count]));
  const inboundMap = new Map(inboundCounts.map(r => [r.destination_id, r.count]));
  const outboundMap = new Map(outboundCounts.map(r => [r.origin_id, r.count]));

  return rigs.map(rig => ({
    ...rig,
    inventorySkuCount: inventoryMap.get(rig.id) ?? 0,
    inboundCount: inboundMap.get(rig.id) ?? 0,
    outboundCount: outboundMap.get(rig.id) ?? 0,
  }));
}

const ORDER_VESSELS = [
  "North Sea Atlantic",
  "Skandi Vega",
  "Normand Serval",
  "Stril Mariner",
  "Edda Ferd",
];

const ORDER_TRANSIT_HOURS = 72;

export function createShipment({ rigId, itemId, quantity }: NewShipmentInput): Shipment {
  const db = getDb();

  const rig = db.prepare("SELECT id, lat, lon FROM rigs WHERE id = ?").get(rigId) as
    { id: string; lat: number; lon: number } | undefined;
  if (!rig) throw new Error(`unknown rig: ${rigId}`);

  const item = db.prepare("SELECT id FROM items WHERE id = ?").get(itemId) as
    { id: string } | undefined;
  if (!item) throw new Error(`unknown item: ${itemId}`);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error(`quantity must be a positive integer, got: ${quantity}`);
  }

  const ports = getPorts();
  const origin = ports.reduce((a, b) =>
    (a.lat - rig.lat) ** 2 + (a.lon - rig.lon) ** 2 <=
    (b.lat - rig.lat) ** 2 + (b.lon - rig.lon) ** 2
      ? a
      : b,
  );

  const maxIdRow = db.prepare("SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) as maxNum FROM shipments")
    .get() as { maxNum: number | null };
  const nextNum = Math.max(1000, (maxIdRow.maxNum ?? 0)) + 1;

  const now = new Date();
  const shipmentId = `shp-${nextNum}`;
  const createdAt = now.toISOString();
  const eta = new Date(now.getTime() + ORDER_TRANSIT_HOURS * 3_600_000).toISOString();
  const vessel = ORDER_VESSELS[nextNum % ORDER_VESSELS.length];

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO shipments
      (id, origin_type, origin_id, destination_type, destination_id, status, vessel, created_at, eta, progress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      shipmentId,
      "port",
      origin.id,
      "rig",
      rigId,
      "requested",
      vessel,
      createdAt,
      eta,
      0,
    );

    db.prepare(`
      INSERT INTO shipment_items (shipment_id, item_id, quantity)
      VALUES (?, ?, ?)
    `).run(shipmentId, itemId, quantity);
  });

  transaction();

  return {
    id: shipmentId,
    origin: { type: "port", id: origin.id },
    destination: { type: "rig", id: rigId },
    status: "requested",
    vessel,
    createdAt,
    eta,
    progress: 0,
    items: [{ itemId, quantity }],
  };
}
