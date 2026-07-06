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
  /** Defaults to "requested" (ADR-002). */
  status?: ShipmentStatus;
  /** 0–1; applies only when status is "in_transit", otherwise stored as 0. */
  progress?: number;
}

export interface RigSummary extends Rig {
  inventorySkuCount: number;
  inboundCount: number;
  outboundCount: number;
}

export interface RigDetail extends Rig {
  inventory: ItemQuantity[];
}

// Prepared statements cached at module scope for performance
const db = getDb();

const stmts = {
  getPorts: db.prepare("SELECT id, name, lat, lon FROM ports"),
  getItems: db.prepare("SELECT id, name, unit, category FROM items"),
  getShipments: db.prepare(`
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
  `),
  getShipmentsForRig: db.prepare(`
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
  `),
  getRig: db.prepare("SELECT id, name, lat, lon, operator, status FROM rigs WHERE id = ?"),
  getRigInventory: db.prepare(`
    SELECT item_id as itemId, quantity
    FROM inventory
    WHERE rig_id = ?
  `),
  getRigs: db.prepare("SELECT id, name, lat, lon, operator, status FROM rigs"),
  getInventoryCounts: db.prepare(`
    SELECT rig_id, COUNT(*) as count
    FROM inventory
    GROUP BY rig_id
  `),
  getInboundCounts: db.prepare(`
    SELECT destination_id, COUNT(*) as count
    FROM shipments
    WHERE destination_type = 'rig' AND status != 'delivered'
    GROUP BY destination_id
  `),
  getOutboundCounts: db.prepare(`
    SELECT origin_id, COUNT(*) as count
    FROM shipments
    WHERE origin_type = 'rig' AND status != 'delivered'
    GROUP BY origin_id
  `),
  getRigForShipment: db.prepare("SELECT id, lat, lon FROM rigs WHERE id = ?"),
  getItem: db.prepare("SELECT id FROM items WHERE id = ?"),
  getMaxShipmentId: db.prepare("SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) as maxNum FROM shipments"),
  insertShipment: db.prepare(`
    INSERT INTO shipments
    (id, origin_type, origin_id, destination_type, destination_id, status, vessel, created_at, eta, progress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  insertShipmentItem: db.prepare(`
    INSERT INTO shipment_items (shipment_id, item_id, quantity)
    VALUES (?, ?, ?)
  `),
};

interface RawShipmentRow {
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
}

function reconstructShipments(rows: RawShipmentRow[]): Shipment[] {
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

export function getPorts(): Port[] {
  try {
    return stmts.getPorts.all() as Port[];
  } catch (err) {
    throw new Error(`Failed to fetch ports: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function getItems(): Item[] {
  try {
    return stmts.getItems.all() as Item[];
  } catch (err) {
    throw new Error(`Failed to fetch items: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function getShipments(): Shipment[] {
  try {
    const rows = stmts.getShipments.all() as RawShipmentRow[];
    return reconstructShipments(rows);
  } catch (err) {
    throw new Error(`Failed to fetch shipments: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function getShipmentsForRig(rigId: string): Shipment[] {
  try {
    const rows = stmts.getShipmentsForRig.all(rigId, rigId) as RawShipmentRow[];
    return reconstructShipments(rows);
  } catch (err) {
    throw new Error(`Failed to fetch shipments for rig ${rigId}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function getRigDetail(id: string): RigDetail | undefined {
  try {
    const rig = stmts.getRig.get(id) as Rig | undefined;
    if (!rig) return undefined;

    const inventory = stmts.getRigInventory.all(id) as ItemQuantity[];
    return { ...rig, inventory };
  } catch (err) {
    throw new Error(`Failed to fetch rig detail for ${id}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function getRigSummaries(): RigSummary[] {
  try {
    const rigs = stmts.getRigs.all() as Rig[];
    const inventoryCounts = stmts.getInventoryCounts.all() as Array<{ rig_id: string; count: number }>;
    const inboundCounts = stmts.getInboundCounts.all() as Array<{ destination_id: string; count: number }>;
    const outboundCounts = stmts.getOutboundCounts.all() as Array<{ origin_id: string; count: number }>;

    const inventoryMap = new Map(inventoryCounts.map(r => [r.rig_id, r.count]));
    const inboundMap = new Map(inboundCounts.map(r => [r.destination_id, r.count]));
    const outboundMap = new Map(outboundCounts.map(r => [r.origin_id, r.count]));

    return rigs.map(rig => ({
      ...rig,
      inventorySkuCount: inventoryMap.get(rig.id) ?? 0,
      inboundCount: inboundMap.get(rig.id) ?? 0,
      outboundCount: outboundMap.get(rig.id) ?? 0,
    }));
  } catch (err) {
    throw new Error(`Failed to fetch rig summaries: ${err instanceof Error ? err.message : String(err)}`);
  }
}

const ORDER_VESSELS = [
  "North Sea Atlantic",
  "Skandi Vega",
  "Normand Serval",
  "Stril Mariner",
  "Edda Ferd",
];

const ORDER_TRANSIT_HOURS = 72;

export function createShipment({ rigId, itemId, quantity, status, progress }: NewShipmentInput): Shipment {
  try {
    const shipmentStatus: ShipmentStatus = status ?? "requested";
    const shipmentProgress = shipmentStatus === "in_transit" ? progress ?? 0 : 0;

    const rig = stmts.getRigForShipment.get(rigId) as
      { id: string; lat: number; lon: number } | undefined;
    if (!rig) throw new Error(`unknown rig: ${rigId}`);

    const item = stmts.getItem.get(itemId) as { id: string } | undefined;
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

    const now = new Date();
    const createdAt = now.toISOString();
    const eta = new Date(now.getTime() + ORDER_TRANSIT_HOURS * 3_600_000).toISOString();

    let shipmentId: string;
    let vessel: string;

    const transaction = db.transaction(() => {
      const maxIdRow = stmts.getMaxShipmentId.get() as { maxNum: number | null };
      const nextNum = Math.max(1000, (maxIdRow.maxNum ?? 0)) + 1;

      shipmentId = `shp-${nextNum}`;
      vessel = ORDER_VESSELS[nextNum % ORDER_VESSELS.length];

      stmts.insertShipment.run(
        shipmentId,
        "port",
        origin.id,
        "rig",
        rigId,
        shipmentStatus,
        vessel,
        createdAt,
        eta,
        shipmentProgress,
      );

      stmts.insertShipmentItem.run(shipmentId, itemId, quantity);
    });

    transaction();

    return {
      id: shipmentId!,
      origin: { type: "port", id: origin.id },
      destination: { type: "rig", id: rigId },
      status: shipmentStatus,
      vessel: vessel!,
      createdAt,
      eta,
      progress: shipmentProgress,
      items: [{ itemId, quantity }],
    };
  } catch (err) {
    throw new Error(`Failed to create shipment: ${err instanceof Error ? err.message : String(err)}`);
  }
}
