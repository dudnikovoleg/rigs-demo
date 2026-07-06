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

/** Ordered lifecycle steps — the one runtime source for dropdowns and the timeline. */
export const SHIPMENT_STATUSES = ["requested", "loading", "in_transit", "delivered"] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

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
  /** Defaults to "requested" (ADR-002). */
  status?: ShipmentStatus;
  /** 0–1; applies only when status is "in_transit", otherwise stored as 0. */
  progress?: number;
}

/** `GET /api/rigs` — rig plus counts computed server-side. */
export interface RigSummary extends Rig {
  inventorySkuCount: number;
  inboundCount: number;
  outboundCount: number;
}

/** `GET /api/rigs/:id` — rig plus its inventory lines. */
export interface RigDetail extends Rig {
  inventory: ItemQuantity[];
}
