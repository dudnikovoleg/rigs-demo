import { useItems, useShipments } from "../api";
import type { Item, Shipment } from "../types";
import ShipmentTimeline from "./ShipmentTimeline";

interface Props {
  rigId: string;
  /** Selected in-transit shipment — its vessel is highlighted on the map. */
  selectedShipmentId: string | null;
  onSelectShipment: (id: string | null) => void;
}

export function formatEta(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ShipmentCard({
  shipment,
  rigId,
  catalog,
  selected,
  onToggleSelect,
}: {
  shipment: Shipment;
  rigId: string;
  catalog: Map<string, Item>;
  selected: boolean;
  /** Set for in-transit shipments only — they have a vessel on the map. */
  onToggleSelect?: () => void;
}) {
  const inbound = shipment.destination.type === "rig" && shipment.destination.id === rigId;

  return (
    <article
      onClick={onToggleSelect}
      className={`rounded border p-3 transition-colors ${
        selected ? "border-sky-400/70 bg-deck/70" : "border-seam bg-deck/40"
      } ${onToggleSelect ? "cursor-pointer hover:border-sky-400/40" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-semibold uppercase tracking-widest ${
            inbound ? "text-emerald-400" : "text-sky-400"
          }`}
        >
          {inbound ? "▼ Inbound" : "▲ Outbound"}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-fog">
          ETA {formatEta(shipment.eta)}
        </span>
      </div>

      <div className="mt-1 flex items-baseline justify-between text-sm text-paper">
        {shipment.vessel}
        {onToggleSelect && (
          <span className="text-[10px] uppercase tracking-wider text-fog">
            {selected ? "◉ on map" : "○ show on map"}
          </span>
        )}
      </div>

      <ul className="mt-1.5 space-y-0.5">
        {shipment.items.map((line) => {
          const item = catalog.get(line.itemId);
          return (
            <li key={line.itemId} className="flex justify-between text-xs text-paper/80">
              <span>{item?.name ?? line.itemId}</span>
              <span className="font-mono">
                {line.quantity} <span className="text-fog">{item?.unit ?? ""}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3">
        <ShipmentTimeline status={shipment.status} />
      </div>
    </article>
  );
}

export default function ShipmentsTab({ rigId, selectedShipmentId, onSelectShipment }: Props) {
  const { data: shipments, isLoading, isError } = useShipments(rigId);
  const { data: items } = useItems();
  const catalog = new Map((items ?? []).map((item) => [item.id, item]));

  if (isLoading) return <p className="text-xs text-fog">Loading…</p>;
  if (isError) return <p className="text-xs text-fog">Couldn't load shipments.</p>;

  // Active shipments first (soonest ETA on top), delivered history last.
  const sorted = [...(shipments ?? [])].sort((a, b) => {
    const doneA = a.status === "delivered" ? 1 : 0;
    const doneB = b.status === "delivered" ? 1 : 0;
    if (doneA !== doneB) return doneA - doneB;
    return a.eta.localeCompare(b.eta);
  });

  return (
    <section>
      <h3 className="font-display text-[11px] uppercase tracking-[0.25em] text-fog">
        Shipments · {sorted.length}
      </h3>
      <div className="mt-2 space-y-3">
        {sorted.map((shipment) => (
          <ShipmentCard
            key={shipment.id}
            shipment={shipment}
            rigId={rigId}
            catalog={catalog}
            selected={shipment.id === selectedShipmentId}
            onToggleSelect={
              shipment.status === "in_transit"
                ? () =>
                    onSelectShipment(shipment.id === selectedShipmentId ? null : shipment.id)
                : undefined
            }
          />
        ))}
        {sorted.length === 0 && (
          <p className="py-2 text-xs text-fog">No shipments touching this installation.</p>
        )}
      </div>
    </section>
  );
}
