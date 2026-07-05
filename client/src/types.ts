// TS mirror of the fixture contract served by `server/src/store.ts`
// (docs/spec.md §3). Change both sides in one deliberate step, never drift.

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

/** `GET /api/rigs` — rig plus counts computed server-side. */
export interface RigSummary extends Rig {
  inventorySkuCount: number;
  inboundCount: number;
  outboundCount: number;
}
