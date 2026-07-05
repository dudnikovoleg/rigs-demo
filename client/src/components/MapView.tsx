import { AttributionControl, MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import { useRigs } from "../api";

const rigIcon = L.divIcon({
  className: "",
  html: `<div class="rig-pin"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function MapView() {
  const { data: rigs } = useRigs();

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

        {(rigs ?? []).map((rig) => (
          <Marker key={rig.id} position={[rig.lat, rig.lon]} icon={rigIcon}>
            <Tooltip direction="top" offset={[0, -10]}>
              {rig.name}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
