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
  /** Vessel position: linear interpolation from→to by stored progress. */
  vessel: [number, number];
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
    map.flyTo(map.unproject(point, zoom), zoom, { duration: 0.6 });
  }, [lat, lon, map]);
  return null;
}

function DeselectOnMapClick({ onSelectRig }: Pick<Props, "onSelectRig">) {
  useMapEvents({ click: () => onSelectRig(null) });
  return null;
}

export default function MapView({ selectedRigId, selectedShipmentId, onSelectRig }: Props) {
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
        const t = shipment.progress;
        const vessel: [number, number] = [
          from[0] + (to[0] - from[0]) * t,
          from[1] + (to[1] - from[1]) * t,
        ];
        return [{ shipment, from, to, vessel }];
      });
  }, [rigs, ports, shipments]);

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

        {routes.map(({ shipment, from, to }) => {
          const highlighted =
            (selectedRigId !== null && touchesRig(shipment, selectedRigId)) ||
            shipment.id === selectedShipmentId;
          return (
            <Polyline
              key={shipment.id}
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

        {routes.map(({ shipment, vessel }) => (
          <Marker
            key={shipment.id}
            position={vessel}
            icon={vesselIcon(shipment.id === selectedShipmentId)}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              {shipment.vessel}
            </Tooltip>
          </Marker>
        ))}

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
