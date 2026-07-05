import { useEffect, useState } from "react";
import { inventoryByRig, rigs, shipments, sites } from "../data";
import type { Rig, Shipment, ShipmentStatus } from "../data";

export type DrawerContent = { view: "list" } | { view: "detail"; rigId: string };

interface Props {
  open: boolean;
  content: DrawerContent | null;
  onClose: () => void;
  onBack: () => void;
  onOpenRig: (id: string) => void;
}

const STATUS: Record<ShipmentStatus, { label: string; cls: string }> = {
  requested: { label: "Requested", cls: "border-fog/40 text-fog" },
  loading: { label: "Loading", cls: "border-amber-400/40 text-amber-400" },
  in_transit: { label: "In transit", cls: "border-flare/50 text-flare" },
  delivered: { label: "Delivered", cls: "border-emerald-400/40 text-emerald-400" },
};

const STATUS_ORDER: ShipmentStatus[] = ["requested", "loading", "in_transit", "delivered"];

function activeShipmentsFor(rigId: string) {
  const touching = shipments.filter((s) => s.originId === rigId || s.destinationId === rigId);
  return {
    touching,
    inbound: touching.filter((s) => s.destinationId === rigId && s.status !== "delivered"),
    outbound: touching.filter((s) => s.originId === rigId && s.status !== "delivered"),
  };
}

function StatusChip({ status }: { status: ShipmentStatus }) {
  const s = STATUS[status];
  return (
    <span
      className={`shrink-0 rounded-sm border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

function RigStatusDot({ status }: { status: Rig["status"] }) {
  const active = status === "active";
  return (
    <span
      className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest ${
        active ? "text-emerald-400" : "text-amber-400"
      }`}
    >
      <i className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-amber-400"}`} />
      {status}
    </span>
  );
}

function Timeline({ status }: { status: ShipmentStatus }) {
  const current = STATUS_ORDER.indexOf(status);
  return (
    <div className="mt-3 flex">
      {STATUS_ORDER.map((step, i) => {
        const done = i <= current;
        return (
          <div key={step} className="relative flex flex-1 flex-col items-center">
            {i > 0 && (
              <div
                className={`absolute right-1/2 top-[5px] h-px w-full ${done ? "bg-flare/70" : "bg-seam"}`}
              />
            )}
            <div
              className={`relative z-10 h-[11px] w-[11px] rounded-full border-2 ${
                done ? "border-flare bg-flare/30" : "border-seam bg-hull"
              }`}
            />
            <span className="mt-1 text-[8px] uppercase tracking-wider text-fog">
              {STATUS[step].label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function itemsSummary(s: Shipment): string {
  const [first, ...rest] = s.items;
  const head = `${first.quantity} ${first.unit} ${first.item}`;
  return rest.length > 0 ? `${head} +${rest.length} more` : head;
}

function ShipmentRow({ shipment, rigId }: { shipment: Shipment; rigId: string }) {
  const inbound = shipment.destinationId === rigId;
  const counterpart = sites[inbound ? shipment.originId : shipment.destinationId];
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className={`font-display text-[10px] tracking-widest ${inbound ? "text-emerald-400" : "text-flare"}`}>
            {inbound ? "IN" : "OUT"}
          </span>
          <span className="truncate">
            {inbound ? `from ${counterpart.name}` : `to ${counterpart.name}`}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[11px] text-fog">
          {shipment.vessel} · ETA <span className="font-mono">{shipment.eta}</span> · {itemsSummary(shipment)}
        </div>
      </div>
      <StatusChip status={shipment.status} />
    </div>
  );
}

function ShipmentCard({ shipment, rigId }: { shipment: Shipment; rigId: string }) {
  const inbound = shipment.destinationId === rigId;
  const origin = sites[shipment.originId];
  const destination = sites[shipment.destinationId];
  return (
    <div className="rounded-md border border-seam bg-deck/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-fog">
          {shipment.id}
          <span className={`ml-2 font-display tracking-widest ${inbound ? "text-emerald-400" : "text-flare"}`}>
            {inbound ? "IN" : "OUT"}
          </span>
        </span>
        <StatusChip status={shipment.status} />
      </div>
      <div className="mt-1.5 text-sm">
        {origin.name} <span className="text-fog">→</span> {destination.name}
      </div>
      <div className="mt-0.5 text-[11px] text-fog">
        Vessel {shipment.vessel} · ETA <span className="font-mono">{shipment.eta}</span>
      </div>
      <ul className="mt-2 space-y-0.5">
        {shipment.items.map((line) => (
          <li key={line.item} className="flex justify-between text-xs">
            <span className="text-paper/90">{line.item}</span>
            <span className="font-mono text-fog">
              {line.quantity} {line.unit}
            </span>
          </li>
        ))}
      </ul>
      <Timeline status={shipment.status} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-[11px] uppercase tracking-[0.25em] text-fog">{children}</h3>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close panel"
      className="-mr-1 -mt-1 rounded px-2 py-0.5 text-fog transition-colors hover:text-paper focus-visible:outline focus-visible:outline-flare"
    >
      ✕
    </button>
  );
}

function RigListView({ onOpenRig, onClose }: Pick<Props, "onOpenRig" | "onClose">) {
  return (
    <>
      <div className="border-b border-seam px-5 pb-4 pt-5">
        <div className="flex items-start justify-between">
          <p className="text-[10px] uppercase tracking-[0.3em] text-fog">North Sea network</p>
          <CloseButton onClose={onClose} />
        </div>
        <h2 className="mt-1 font-display text-2xl uppercase tracking-[0.08em]">All rigs</h2>
        <p className="mt-1 text-[11px] text-fog">{rigs.length} installations</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-2">
        <div className="divide-y divide-seam/60">
          {rigs.map((rig) => {
            const { inbound, outbound } = activeShipmentsFor(rig.id);
            const skus = (inventoryByRig[rig.id] ?? []).length;
            return (
              <button
                key={rig.id}
                onClick={() => onOpenRig(rig.id)}
                className="-mx-2 flex w-full items-center justify-between gap-3 rounded px-2 py-3 text-left transition-colors hover:bg-deck/50 focus-visible:outline focus-visible:outline-flare"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm">{rig.name}</div>
                  <div className="mt-0.5 truncate text-[10px] uppercase tracking-widest text-fog">
                    {rig.operator}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-[11px] text-fog">
                    {skus} SKUs · {inbound.length} in · {outbound.length} out
                  </span>
                  <RigStatusDot status={rig.status} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function RigDetailView({
  rig,
  onBack,
  onClose,
}: {
  rig: Rig;
  onBack: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"warehouse" | "shipments">("warehouse");
  useEffect(() => {
    setTab("warehouse");
  }, [rig.id]);

  const stock = inventoryByRig[rig.id] ?? [];
  const { touching, inbound, outbound } = activeShipmentsFor(rig.id);

  return (
    <>
      {/* Header — installation data plate */}
      <div className="border-b border-seam px-5 pb-4 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              aria-label="Back to all rigs"
              className="-ml-1 rounded px-1 text-fog transition-colors hover:text-paper focus-visible:outline focus-visible:outline-flare"
            >
              ←
            </button>
            <p className="text-[10px] uppercase tracking-[0.3em] text-fog">
              Offshore installation · {rig.operator}
            </p>
          </div>
          <CloseButton onClose={onClose} />
        </div>
        <h2 className="mt-1 font-display text-2xl uppercase tracking-[0.08em]">{rig.name}</h2>
        <div className="mt-1.5 flex items-center gap-3 text-[11px]">
          <RigStatusDot status={rig.status} />
          <span className="font-mono text-fog">
            {rig.lat.toFixed(2)}°N {Math.abs(rig.lon).toFixed(2)}°{rig.lon >= 0 ? "E" : "W"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-seam px-5">
        {(["warehouse", "shipments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2.5 font-display text-[12px] uppercase tracking-[0.2em] transition-colors focus-visible:outline focus-visible:outline-flare ${
              tab === t
                ? "border-flare text-paper"
                : "border-transparent text-fog hover:text-paper"
            }`}
          >
            {t === "warehouse" ? "Warehouse" : `Shipments (${touching.length})`}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "warehouse" ? (
          <div className="space-y-6">
            <section>
              <SectionLabel>Inventory on deck</SectionLabel>
              <div className="mt-2 divide-y divide-seam/60">
                {stock.map((line) => (
                  <div key={line.item} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm">{line.item}</div>
                      <div className="text-[10px] uppercase tracking-widest text-fog">
                        {line.category}
                      </div>
                    </div>
                    <div className="font-mono text-sm text-paper/90">
                      {line.quantity} <span className="text-fog">{line.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionLabel>Inbound</SectionLabel>
              <div className="mt-1 divide-y divide-seam/60">
                {inbound.length > 0 ? (
                  inbound.map((s) => <ShipmentRow key={s.id} shipment={s} rigId={rig.id} />)
                ) : (
                  <p className="py-2 text-xs text-fog">
                    No inbound shipments. Order goods to resupply.
                  </p>
                )}
              </div>
            </section>

            <section>
              <SectionLabel>Outbound</SectionLabel>
              <div className="mt-1 divide-y divide-seam/60">
                {outbound.length > 0 ? (
                  outbound.map((s) => <ShipmentRow key={s.id} shipment={s} rigId={rig.id} />)
                ) : (
                  <p className="py-2 text-xs text-fog">No outbound shipments scheduled.</p>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-3">
            {touching.length > 0 ? (
              touching.map((s) => <ShipmentCard key={s.id} shipment={s} rigId={rig.id} />)
            ) : (
              <p className="text-xs text-fog">No shipments touch this installation yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Footer — order flow placeholder */}
      <div className="border-t border-seam px-5 py-4">
        <button
          className="w-full rounded-md bg-flare py-2.5 font-display text-[13px] uppercase tracking-[0.2em] text-sea transition-colors hover:bg-flare/90 focus-visible:outline focus-visible:outline-paper"
          title="Not wired in this skeleton"
        >
          Order goods
        </button>
        <p className="mt-1.5 text-center text-[10px] text-fog">
          Placeholder — the order flow arrives with the API.
        </p>
      </div>
    </>
  );
}

export default function RigPanel({ open, content, onClose, onBack, onOpenRig }: Props) {
  if (!content) return null;

  const rig =
    content.view === "detail" ? rigs.find((r) => r.id === content.rigId) ?? null : null;

  return (
    <aside
      aria-hidden={!open}
      className={`absolute inset-y-0 right-0 z-[1100] flex w-[400px] transform flex-col border-l border-seam bg-hull/95 shadow-2xl backdrop-blur-sm transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {content.view === "list" || !rig ? (
        <RigListView onOpenRig={onOpenRig} onClose={onClose} />
      ) : (
        <RigDetailView rig={rig} onBack={onBack} onClose={onClose} />
      )}
    </aside>
  );
}
