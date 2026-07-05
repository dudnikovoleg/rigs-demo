import { useState } from "react";
import { useRig } from "../api";
import type { Rig, RigDetail } from "../types";
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
  /** Last selected rig; kept during the slide-out transition. */
  rigId: string | null;
  /** Selected in-transit shipment; passed through to the Shipments tab. */
  selectedShipmentId: string | null;
  onSelectShipment: (id: string | null) => void;
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

export default function RigPanel({
  open,
  rigId,
  selectedShipmentId,
  onSelectShipment,
  onClose,
}: Props) {
  const { data: rig } = useRig(rigId);

  return (
    <aside
      aria-hidden={!open}
      className={`absolute inset-y-0 right-0 z-[1100] flex w-[400px] transform flex-col border-l border-seam bg-hull/95 shadow-2xl backdrop-blur-sm transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header — installation data plate */}
      <div className="border-b border-seam px-5 pb-4 pt-5">
        <div className="flex items-start justify-between">
          <p className="text-[10px] uppercase tracking-[0.3em] text-fog">
            Offshore installation{rig ? ` · ${rig.operator}` : ""}
          </p>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="-mr-1 -mt-1 rounded px-2 py-0.5 text-fog transition-colors hover:text-paper focus-visible:outline focus-visible:outline-flare"
          >
            ✕
          </button>
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
    </aside>
  );
}
