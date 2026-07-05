import { useState } from "react";
import { useRig, useRigs } from "../api";
import type { Rig, RigDetail, RigSummary } from "../types";
import ShipmentsTab from "./ShipmentsTab";
import WarehouseTab from "./WarehouseTab";

type Tab = "warehouse" | "shipments";

/** Rendered with `key={rig.id}` so the active tab resets to Warehouse per rig. */
function PanelBody({
  rig,
  selectedShipmentId,
  onSelectShipment,
}: {
  rig: RigDetail;
  selectedShipmentId: string | null;
  onSelectShipment: (id: string | null) => void;
}) {
  const [tab, setTab] = useState<Tab>("warehouse");

  return (
    <>
      <div role="tablist" className="flex border-b border-seam px-5">
        {(["warehouse", "shipments"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2.5 font-display text-[12px] uppercase tracking-[0.2em] transition-colors focus-visible:outline focus-visible:outline-flare ${
              tab === t
                ? "border-flare text-paper"
                : "border-transparent text-fog hover:text-paper"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "warehouse" ? (
          <WarehouseTab rigId={rig.id} inventory={rig.inventory} />
        ) : (
          <ShipmentsTab
            rigId={rig.id}
            selectedShipmentId={selectedShipmentId}
            onSelectShipment={onSelectShipment}
          />
        )}
      </div>
    </>
  );
}

interface Props {
  open: boolean;
  /** Last open drawer content; kept during the slide-out transition. */
  shown: { view: "list" } | { view: "detail"; rigId: string };
  /** Selected in-transit shipment; passed through to the Shipments tab. */
  selectedShipmentId: string | null;
  onSelectShipment: (id: string | null) => void;
  onSelectRig: (id: string) => void;
  onShowList: () => void;
  onClose: () => void;
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

function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(2)}°N ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
}

function RigRow({ rig, onSelect }: { rig: RigSummary; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full border-b border-seam px-5 py-3 text-left transition-colors hover:bg-seam/40 focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-flare"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-[14px] uppercase tracking-[0.08em]">
          {rig.name}
        </span>
        <RigStatusDot status={rig.status} />
      </div>
      <p className="mt-0.5 text-[11px] text-fog">{rig.operator}</p>
      <div className="mt-1.5 flex gap-4 font-mono text-[11px] text-fog">
        <span>
          <span className="text-paper">{rig.inventorySkuCount}</span> SKUs
        </span>
        <span>
          <span className="text-paper">{rig.inboundCount}</span> inbound
        </span>
        <span>
          <span className="text-paper">{rig.outboundCount}</span> outbound
        </span>
      </div>
    </button>
  );
}

function RigList({ onSelectRig }: { onSelectRig: (id: string) => void }) {
  const { data: rigs } = useRigs();

  if (!rigs) return <p className="flex-1 px-5 py-4 text-xs text-fog">Loading…</p>;

  return (
    <div className="flex-1 overflow-y-auto">
      {rigs.map((rig) => (
        <RigRow key={rig.id} rig={rig} onSelect={() => onSelectRig(rig.id)} />
      ))}
    </div>
  );
}

export default function RigPanel({
  open,
  shown,
  selectedShipmentId,
  onSelectShipment,
  onSelectRig,
  onShowList,
  onClose,
}: Props) {
  const rigId = shown.view === "detail" ? shown.rigId : null;
  const { data: rig } = useRig(rigId);

  const closeButton = (
    <button
      onClick={onClose}
      aria-label="Close panel"
      className="-mr-1 -mt-1 rounded px-2 py-0.5 text-fog transition-colors hover:text-paper focus-visible:outline focus-visible:outline-flare"
    >
      ✕
    </button>
  );

  return (
    <aside
      aria-hidden={!open}
      className={`absolute inset-y-0 right-0 z-[1100] flex w-[400px] transform flex-col border-l border-seam bg-hull/95 shadow-2xl backdrop-blur-sm transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {shown.view === "list" ? (
        <>
          {/* Header — fleet roster */}
          <div className="border-b border-seam px-5 pb-4 pt-5">
            <div className="flex items-start justify-between">
              <p className="text-[10px] uppercase tracking-[0.3em] text-fog">
                Fleet overview · North Sea
              </p>
              {closeButton}
            </div>
            <h2 className="mt-1 font-display text-2xl uppercase tracking-[0.08em]">
              All rigs
            </h2>
          </div>
          <RigList onSelectRig={onSelectRig} />
        </>
      ) : (
        <>
          {/* Header — installation data plate */}
          <div className="border-b border-seam px-5 pb-4 pt-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={onShowList}
                  aria-label="Back to all rigs"
                  className="-ml-1 -mt-1 rounded px-1.5 py-0.5 text-fog transition-colors hover:text-paper focus-visible:outline focus-visible:outline-flare"
                >
                  ←
                </button>
                <p className="text-[10px] uppercase tracking-[0.3em] text-fog">
                  Offshore installation{rig ? ` · ${rig.operator}` : ""}
                </p>
              </div>
              {closeButton}
            </div>
            <h2 className="mt-1 font-display text-2xl uppercase tracking-[0.08em]">
              {rig?.name ?? "…"}
            </h2>
            {rig && (
              <div className="mt-1.5 flex items-center gap-3 text-[11px]">
                <RigStatusDot status={rig.status} />
                <span className="font-mono text-fog">{formatCoords(rig.lat, rig.lon)}</span>
              </div>
            )}
          </div>

          {rig ? (
            <PanelBody
              key={rig.id}
              rig={rig}
              selectedShipmentId={selectedShipmentId}
              onSelectShipment={onSelectShipment}
            />
          ) : (
            <p className="flex-1 px-5 py-4 text-xs text-fog">Loading…</p>
          )}
        </>
      )}
    </aside>
  );
}
