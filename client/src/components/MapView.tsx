import { useEffect } from "react";
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
import { ports, rigs, shipments, sites } from "../data";

interface Props {
  selectedRigId: string | null;
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
  iconSize: [13, 13],
  iconAnchor: [7, 7],
});

const vesselIcon = (bearing: number) =>
  L.divIcon({
    className: "",
    html: `<div class="vessel-pin" style="transform:rotate(${bearing.toFixed(1)}deg)">
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path d="M9 1 L15 16 L9 12.5 L3 16 Z" fill="#0f1d28" stroke="#e9f0f4" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

// Vessel position = linear interpolation origin→destination by progress (spec §6).
const underway = shipments
  .filter((s) => s.status === "in_transit")
  .map((s) => {
    const o = sites[s.originId];
    const d = sites[s.destinationId];
    return {
      shipment: s,
      origin: o,
      destination: d,
      lat: o.lat + (d.lat - o.lat) * s.progress,
      lon: o.lon + (d.lon - o.lon) * s.progress,
      bearing: (Math.atan2(d.lon - o.lon, d.lat - o.lat) * 180) / Math.PI,
    };
  });

/** Pan the selected rig into the center of the area left of the drawer. */
function FlyToRig({ rigId }: { rigId: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!rigId) return;
    const rig = sites[rigId];
    const zoom = map.getZoom();
    const point = map.project([rig.lat, rig.lon], zoom).add([200, 0]);
    map.flyTo(map.unproject(point, zoom), zoom, { duration: 0.6 });
  }, [rigId, map]);
  return null;
}

function DeselectOnMapClick({ onSelectRig }: Pick<Props, "onSelectRig">) {
  useMapEvents({ click: () => onSelectRig(null) });
  return null;
}

export default function MapView({ selectedRigId, onSelectRig }: Props) {
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
        <FlyToRig rigId={selectedRigId} />
        <DeselectOnMapClick onSelectRig={onSelectRig} />

        {underway.map(({ shipment, origin, destination }) => {
          const touchesSelected =
            selectedRigId !== null &&
            (shipment.originId === selectedRigId || shipment.destinationId === selectedRigId);
          return (
            <Polyline
              key={`route-${shipment.id}`}
              positions={[
                [origin.lat, origin.lon],
                [destination.lat, destination.lon],
              ]}
              pathOptions={{
                color: touchesSelected ? "#ff6b2c" : "#5b7891",
                weight: touchesSelected ? 2 : 1.5,
                opacity: touchesSelected ? 0.8 : 0.45,
                dashArray: "4 6",
              }}
            />
          );
        })}

        {underway.map(({ shipment, destination, lat, lon, bearing }) => (
          <Marker key={shipment.id} position={[lat, lon]} icon={vesselIcon(bearing)}>
            <Tooltip direction="top" offset={[0, -8]}>
              {shipment.vessel} → {destination.name}
            </Tooltip>
          </Marker>
        ))}

        {ports.map((port) => (
          <Marker key={port.id} position={[port.lat, port.lon]} icon={portIcon}>
            <Tooltip direction="top" offset={[0, -8]}>
              {port.name}
            </Tooltip>
          </Marker>
        ))}

        {rigs.map((rig) => (
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
