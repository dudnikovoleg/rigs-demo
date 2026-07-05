// Static placeholder data for the visual skeleton. Throwaway — the real app
// reads this shape from the server fixtures instead.

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

export interface InventoryLine {
  item: string;
  category: string;
  quantity: number;
  unit: string;
}

export type ShipmentStatus = "requested" | "loading" | "in_transit" | "delivered";

export interface Shipment {
  id: string;
  originId: string;
  destinationId: string;
  vessel: string;
  status: ShipmentStatus;
  eta: string;
  progress: number;
  items: { item: string; quantity: number; unit: string }[];
}

export const rigs: Rig[] = [
  { id: "forties-charlie", name: "Forties Charlie", lat: 57.72, lon: 0.87, operator: "Apache North Sea", status: "active" },
  { id: "ekofisk-bravo", name: "Ekofisk Bravo", lat: 56.54, lon: 3.21, operator: "ConocoPhillips", status: "active" },
  { id: "brent-delta", name: "Brent Delta", lat: 61.06, lon: 1.71, operator: "Shell U.K.", status: "maintenance" },
  { id: "sleipner-vest", name: "Sleipner Vest", lat: 58.44, lon: 1.72, operator: "Equinor", status: "active" },
  { id: "valhall-flank", name: "Valhall Flank North", lat: 56.28, lon: 3.39, operator: "Aker BP", status: "active" },
  { id: "ninian-south", name: "Ninian South", lat: 60.8, lon: 1.45, operator: "EnQuest", status: "active" },
  { id: "beryl-alpha", name: "Beryl Alpha", lat: 59.55, lon: 1.53, operator: "Apache North Sea", status: "active" },
];

export const ports: Port[] = [
  { id: "aberdeen", name: "Aberdeen Base", lat: 57.144, lon: -2.078 },
  { id: "stavanger", name: "Stavanger Base", lat: 58.972, lon: 5.731 },
];

export const sites: Record<string, { id: string; name: string; lat: number; lon: number }> =
  Object.fromEntries([...rigs, ...ports].map((s) => [s.id, s]));

const baseStock: InventoryLine[] = [
  { item: 'Drill pipe 5½"', category: "Tubulars", quantity: 96, unit: "joints" },
  { item: 'Casing 9⅝"', category: "Tubulars", quantity: 48, unit: "joints" },
  { item: "Cement, Class G", category: "Bulk", quantity: 110, unit: "t" },
  { item: "Barite", category: "Bulk", quantity: 85, unit: "t" },
  { item: "Diesel (MGO)", category: "Fuel", quantity: 620, unit: "m³" },
  { item: "Fresh water", category: "Utilities", quantity: 940, unit: "m³" },
  { item: "Provisions", category: "Catering", quantity: 26, unit: "pallets" },
  { item: "Corrosion inhibitor", category: "Chemicals", quantity: 18, unit: "drums" },
];

// Same placeholder list per rig, with deterministic variation so it doesn't
// read as copy-pasted during the click-through.
export const inventoryByRig: Record<string, InventoryLine[]> = Object.fromEntries(
  rigs.map((rig, i) => [
    rig.id,
    baseStock.map((line, j) => ({
      ...line,
      quantity: Math.max(2, Math.round(line.quantity * (0.55 + (((i * 3 + j) % 5) * 0.2)))),
    })),
  ]),
);

export const shipments: Shipment[] = [
  {
    id: "S-1041",
    originId: "aberdeen",
    destinationId: "forties-charlie",
    vessel: "Skandi Buchan",
    status: "in_transit",
    eta: "05 Jul, 06:30",
    progress: 0.55,
    items: [
      { item: 'Drill pipe 5½"', quantity: 36, unit: "joints" },
      { item: "Cement, Class G", quantity: 40, unit: "t" },
      { item: "Provisions", quantity: 12, unit: "pallets" },
    ],
  },
  {
    id: "S-1042",
    originId: "stavanger",
    destinationId: "ekofisk-bravo",
    vessel: "Havila Comet",
    status: "in_transit",
    eta: "05 Jul, 18:00",
    progress: 0.3,
    items: [
      { item: "Diesel (MGO)", quantity: 380, unit: "m³" },
      { item: "Barite", quantity: 60, unit: "t" },
    ],
  },
  {
    id: "S-1043",
    originId: "sleipner-vest",
    destinationId: "stavanger",
    vessel: "Rem Server",
    status: "in_transit",
    eta: "04 Jul, 21:15",
    progress: 0.78,
    items: [
      { item: "Empty CCUs (backload)", quantity: 14, unit: "ea" },
      { item: "Scrap steel", quantity: 8, unit: "t" },
    ],
  },
  {
    id: "S-1044",
    originId: "aberdeen",
    destinationId: "brent-delta",
    vessel: "North Purpose",
    status: "loading",
    eta: "06 Jul, 14:00",
    progress: 0,
    items: [
      { item: "BOP seal kits", quantity: 4, unit: "ea" },
      { item: "Corrosion inhibitor", quantity: 10, unit: "drums" },
    ],
  },
  {
    id: "S-1045",
    originId: "stavanger",
    destinationId: "ekofisk-bravo",
    vessel: "Island Contender",
    status: "requested",
    eta: "08 Jul",
    progress: 0,
    items: [{ item: "Fresh water", quantity: 200, unit: "m³" }],
  },
  {
    id: "S-1038",
    originId: "aberdeen",
    destinationId: "forties-charlie",
    vessel: "Skandi Buchan",
    status: "delivered",
    eta: "01 Jul, 09:45",
    progress: 1,
    items: [{ item: 'Casing 9⅝"', quantity: 60, unit: "joints" }],
  },
];
