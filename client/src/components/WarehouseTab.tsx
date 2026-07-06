import { useItems, useShipments } from "../api";
import type { Item, ItemQuantity, Shipment } from "../types";
import { formatEta } from "./ShipmentsTab";
import { STATUS_LABELS } from "./ShipmentTimeline";

interface Props {
  rigId: string;
  inventory: ItemQuantity[];
}

function ShipmentFlowSection({
  title,
  shipments,
  catalog,
  emptyText,
}: {
  title: string;
  shipments: Shipment[];
  catalog: Map<string, Item>;
  emptyText: string;
}) {
  return (
    <section className="mt-6">
      <h3 className="font-display text-[11px] uppercase tracking-[0.25em] text-fog">{title}</h3>
      <div className="mt-2 divide-y divide-seam/60">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-paper">{shipment.vessel}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-fog">
                {STATUS_LABELS[shipment.status]} · ETA {formatEta(shipment.eta)}
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-paper/70">
              {shipment.items
                .map((line) => {
                  const item = catalog.get(line.itemId);
                  return `${line.quantity} ${item?.unit ?? "×"} ${item?.name ?? line.itemId}`;
                })
                .join(" · ")}
            </div>
          </div>
        ))}
        {shipments.length === 0 && <p className="py-2 text-xs text-fog">{emptyText}</p>}
      </div>
    </section>
  );
}

export default function WarehouseTab({ rigId, inventory }: Props) {
  const { data: items } = useItems();
  const catalog = new Map((items ?? []).map((item) => [item.id, item]));

  // Inbound/outbound are derived from undelivered shipments — never stored
  // (spec §2), so they can't drift from the shipments fixture.
  const { data: shipments, isError } = useShipments(rigId);
  const undelivered = (shipments ?? []).filter((s) => s.status !== "delivered");
  const inbound = undelivered.filter(
    (s) => s.destination.type === "rig" && s.destination.id === rigId,
  );
  const outbound = undelivered.filter((s) => s.origin.type === "rig" && s.origin.id === rigId);

  return (
    <>
      <section>
        <h3 className="font-display text-[11px] uppercase tracking-[0.25em] text-fog">
          Inventory on deck
        </h3>
        <div className="mt-2 divide-y divide-seam/60">
          {inventory.map((line) => {
            const item = catalog.get(line.itemId);
            return (
              <div key={line.itemId} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm">{item?.name ?? line.itemId}</div>
                  <div className="text-[10px] uppercase tracking-widest text-fog">
                    {item?.category ?? "—"}
                  </div>
                </div>
                <div className="font-mono text-sm text-paper/90">
                  {line.quantity} <span className="text-fog">{item?.unit ?? ""}</span>
                </div>
              </div>
            );
          })}
          {inventory.length === 0 && (
            <p className="py-2 text-xs text-fog">
              <strong className="text-paper">No inventory on deck.</strong> Order goods below to
              stock this installation.
            </p>
          )}
        </div>
      </section>

      <ShipmentFlowSection
        title="Inbound"
        shipments={inbound}
        catalog={catalog}
        emptyText={isError ? "Couldn't load shipments." : "No goods en route to this installation."}
      />
      <ShipmentFlowSection
        title="Outbound"
        shipments={outbound}
        catalog={catalog}
        emptyText={isError ? "Couldn't load shipments." : "No goods leaving this installation."}
      />
    </>
  );
}
