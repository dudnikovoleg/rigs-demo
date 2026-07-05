import { readFileSync } from "node:fs";
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

export interface RigSummary extends Rig {
  inventorySkuCount: number;
  inboundCount: number;
  outboundCount: number;
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
