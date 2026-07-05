import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The fixture JSON shape is the client<->server contract (see docs/spec.md §3).

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

/** rigId -> inventory lines */
export type Inventory = Record<string, ItemQuantity[]>;

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
  /** 0–1, meaningful when in_transit */
  progress: number;
  items: ItemQuantity[];
}

/** `POST /api/shipments` request body. */
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

/** `GET /api/rigs/:id` — rig plus its inventory lines. */
export interface RigDetail extends Rig {
  inventory: ItemQuantity[];
}

// Resolves to server/fixtures from both src/ (dev) and dist/ (build).
const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
);

function readFixture<T>(name: string): T {
  const file = path.join(fixturesDir, `${name}.json`);
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function writeFixture(name: string, data: unknown): void {
  const file = path.join(fixturesDir, `${name}.json`);
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export function getRigs(): Rig[] {
  return readFixture<Rig[]>("rigs");
}

export function getPorts(): Port[] {
  return readFixture<Port[]>("ports");
}

export function getItems(): Item[] {
  return readFixture<Item[]>("items");
}

export function getInventory(): Inventory {
  return readFixture<Inventory>("inventory");
}

export function getShipments(): Shipment[] {
  return readFixture<Shipment[]>("shipments");
}

/** Shipments whose origin or destination is the given rig. */
export function getShipmentsForRig(rigId: string): Shipment[] {
  return getShipments().filter(
    (s) =>
      (s.origin.type === "rig" && s.origin.id === rigId) ||
      (s.destination.type === "rig" && s.destination.id === rigId),
  );
}

export function getRigDetail(id: string): RigDetail | undefined {
  const rig = getRigs().find((r) => r.id === id);
  if (!rig) return undefined;
  return { ...rig, inventory: getInventory()[id] ?? [] };
}

// Supply vessels assignable to new orders; rotated so consecutive orders vary.
const ORDER_VESSELS = [
  "North Sea Atlantic",
  "Skandi Vega",
  "Normand Serval",
  "Stril Mariner",
  "Edda Ferd",
];

const ORDER_TRANSIT_HOURS = 72;

/**
 * Order goods for a rig: appends a `requested` port→rig shipment (origin =
 * nearest supply base) and rewrites `shipments.json`, so the order survives
 * a server restart. Throws on unknown rig/item or non-positive quantity.
 */
export function createShipment({ rigId, itemId, quantity }: NewShipmentInput): Shipment {
  const rig = getRigs().find((r) => r.id === rigId);
  if (!rig) throw new Error(`unknown rig: ${rigId}`);
  if (!getItems().some((i) => i.id === itemId)) throw new Error(`unknown item: ${itemId}`);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error(`quantity must be a positive integer, got: ${quantity}`);
  }

  const origin = getPorts().reduce((a, b) =>
    (a.lat - rig.lat) ** 2 + (a.lon - rig.lon) ** 2 <=
    (b.lat - rig.lat) ** 2 + (b.lon - rig.lon) ** 2
      ? a
      : b,
  );

  const shipments = getShipments();
  const nextNum =
    Math.max(1000, ...shipments.map((s) => Number(s.id.replace("shp-", "")) || 0)) + 1;
  const now = new Date();

  const shipment: Shipment = {
    id: `shp-${nextNum}`,
    origin: { type: "port", id: origin.id },
    destination: { type: "rig", id: rigId },
    status: "requested",
    vessel: ORDER_VESSELS[nextNum % ORDER_VESSELS.length],
    createdAt: now.toISOString(),
    eta: new Date(now.getTime() + ORDER_TRANSIT_HOURS * 3_600_000).toISOString(),
    progress: 0,
    items: [{ itemId, quantity }],
  };

  writeFixture("shipments", [...shipments, shipment]);
  return shipment;
}

export function getRigSummaries(): RigSummary[] {
  const inventory = getInventory();
  const undelivered = getShipments().filter((s) => s.status !== "delivered");

  return getRigs().map((rig) => ({
    ...rig,
    inventorySkuCount: (inventory[rig.id] ?? []).length,
    inboundCount: undelivered.filter(
      (s) => s.destination.type === "rig" && s.destination.id === rig.id,
    ).length,
    outboundCount: undelivered.filter(
      (s) => s.origin.type === "rig" && s.origin.id === rig.id,
    ).length,
  }));
}
