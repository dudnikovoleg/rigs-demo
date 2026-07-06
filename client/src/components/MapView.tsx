import { useEffect, useMemo } from "react";
import {
  AttributionControl,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useAllShipments, usePorts, useRigs } from "../api";
import type { Shipment, ShipmentEndpoint } from "../types";

interface Props {
  selectedRigId: string | null;
  /** Selected in-transit shipment (from the Shipments tab) — its vessel glows. */
  selectedShipmentId: string | null;
  onSelectRig: (id: string | null) => void;
  /** Vessel click: open the shipment on its rig, Shipments tab active (spec §2). */
  onOpenShipment: (rigId: string, shipmentId: string) => void;
}

const rigIcon = (selected: boolean) =>
  L.divIcon({
    className: "",
    html: `<div class="rig-pin${selected ? " rig-pin--selected" : ""}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const portIcon = L.divIcon({
  className: "",
  html: `<div class="port-pin"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const vesselIcon = (selected: boolean) =>
  L.divIcon({
    className: "",
    html: `<div class="vessel-pin${selected ? " vessel-pin--selected" : ""}"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

interface Route {
  shipment: Shipment;
  from: [number, number];
  to: [number, number];
  /** Vessel position: from→to by stored progress, lerped in projected space. */
  vessel: [number, number];
}

/** Rig a vessel click opens: destination for port→rig, origin for rig→port. */
function shipmentRigId({ origin, destination }: Shipment): string | null {
  if (destination.type === "rig") return destination.id;
  if (origin.type === "rig") return origin.id;
  return null;
}

function touchesRig(shipment: Shipment, rigId: string): boolean {
  const { origin, destination } = shipment;
  return (
    (origin.type === "rig" && origin.id === rigId) ||
    (destination.type === "rig" && destination.id === rigId)
  );
}

/** Pan the selected rig into the center of the area left of the drawer. */
function FlyToRig({ lat, lon }: { lat: number | null; lon: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat === null || lon === null) return;
    const zoom = map.getZoom();
    const point = map.project([lat, lon], zoom).add([200, 0]);
    // panTo, not flyTo: flyTo's zoom arc leaves the SVG overlay (route lines)
    // misplaced when the user grabs the map mid-animation.
    map.panTo(map.unproject(point, zoom), { duration: 0.6 });
  }, [lat, lon, map]);
  return null;
}

function DeselectOnMapClick({ onSelectRig }: Pick<Props, "onSelectRig">) {
  useMapEvents({ click: () => onSelectRig(null) });
  return null;
}

export default function MapView({
  selectedRigId,
  selectedShipmentId,
  onSelectRig,
  onOpenShipment,
}: Props) {
  const { data: rigs } = useRigs();
  const { data: ports } = usePorts();
  const { data: shipments } = useAllShipments();
  const selected = (rigs ?? []).find((rig) => rig.id === selectedRigId) ?? null;

  // One route (line + vessel) per in-transit shipment.
  const routes = useMemo<Route[]>(() => {
    const coords = new Map<string, [number, number]>();
    for (const rig of rigs ?? []) coords.set(`rig:${rig.id}`, [rig.lat, rig.lon]);
    for (const port of ports ?? []) coords.set(`port:${port.id}`, [port.lat, port.lon]);
    const at = (e: ShipmentEndpoint) => coords.get(`${e.type}:${e.id}`);

    return (shipments ?? [])
      .filter((s) => s.status === "in_transit")
      .flatMap((shipment) => {
        const from = at(shipment.origin);
        const to = at(shipment.destination);
        if (!from || !to) return [];
        // Lerp in Web Mercator, not lat/lon: the line is straight on screen,
        // and lat-space interpolation drifts below it as zoom increases.
        const t = shipment.progress;
        const p0 = L.CRS.EPSG3857.project(L.latLng(from));
        const p1 = L.CRS.EPSG3857.project(L.latLng(to));
        const v = L.CRS.EPSG3857.unproject(p0.add(p1.subtract(p0).multiplyBy(t)));
        const vessel: [number, number] = [v.lat, v.lng];
        return [{ shipment, from, to, vessel }];
      });
  }, [rigs, ports, shipments]);

  // One line per unordered endpoint pair: opposite-direction or repeat runs
  // (e.g. two vessels between the same port and rig) share a single segment
  // instead of stacking offset dashes.
  const segments = useMemo(() => {
    const byKey = new Map<
      string,
      { from: [number, number]; to: [number, number]; shipments: Shipment[] }
    >();
    for (const { shipment, from, to } of routes) {
      const key = [shipment.origin, shipment.destination]
        .map((e) => `${e.type}:${e.id}`)
        .sort()
        .join("|");
      const seg = byKey.get(key);
      if (seg) seg.shipments.push(shipment);
      else byKey.set(key, { from, to, shipments: [shipment] });
    }
    return [...byKey.entries()].map(([key, seg]) => ({ key, ...seg }));
  }, [routes]);

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={[58.7, 1.6]}
        zoom={6}
        minZoom={5}
        className="h-full w-full"
        attributionControl={false}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <AttributionControl position="bottomleft" prefix={false} />
        <FlyToRig lat={selected?.lat ?? null} lon={selected?.lon ?? null} />
        <DeselectOnMapClick onSelectRig={onSelectRig} />

        {segments.map(({ key, from, to, shipments: onSegment }) => {
          const highlighted = onSegment.some(
            (shipment) =>
              (selectedRigId !== null && touchesRig(shipment, selectedRigId)) ||
              shipment.id === selectedShipmentId,
          );
          return (
            <Polyline
              key={key}
              positions={[from, to]}
              interactive={false}
              pathOptions={
                highlighted
                  ? { color: "#ff6b2c", weight: 2, opacity: 0.85, dashArray: "6 6" }
                  : { color: "#33546b", weight: 1.5, opacity: 0.3, dashArray: "6 6" }
              }
            />
          );
        })}

        {(ports ?? []).map((port) => (
          <Marker key={port.id} position={[port.lat, port.lon]} icon={portIcon}>
            <Tooltip direction="top" offset={[0, -9]}>
              {port.name}
            </Tooltip>
          </Marker>
        ))}

        {routes.map(({ shipment, vessel }) => {
          const rigId = shipmentRigId(shipment);
          return (
            <Marker
              key={shipment.id}
              position={vessel}
              icon={vesselIcon(shipment.id === selectedShipmentId)}
              eventHandlers={
                rigId ? { click: () => onOpenShipment(rigId, shipment.id) } : undefined
              }
            >
              <Tooltip direction="top" offset={[0, -8]}>
                {shipment.vessel}
              </Tooltip>
            </Marker>
          );
        })}

        {(rigs ?? []).map((rig) => (
          <Marker
            key={rig.id}
            position={[rig.lat, rig.lon]}
            icon={rigIcon(rig.id === selectedRigId)}
            eventHandlers={{ click: () => onSelectRig(rig.id) }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              {rig.name}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
