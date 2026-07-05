import { useEffect } from "react";
import {
  AttributionControl,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useRigs } from "../api";

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

export default function MapView({ selectedRigId, onSelectRig }: Props) {
  const { data: rigs } = useRigs();
  const selected = (rigs ?? []).find((rig) => rig.id === selectedRigId) ?? null;

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
