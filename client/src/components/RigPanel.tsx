import { useRig } from "../api";
import type { Rig } from "../types";
import WarehouseTab from "./WarehouseTab";

interface Props {
  open: boolean;
  /** Last selected rig; kept during the slide-out transition. */
  rigId: string | null;
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

export default function RigPanel({ open, rigId, onClose }: Props) {
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

      {/* Tabs — Shipments joins in slice 3 */}
      <div className="flex border-b border-seam px-5">
        <span className="-mb-px border-b-2 border-flare px-3 py-2.5 font-display text-[12px] uppercase tracking-[0.2em] text-paper">
          Warehouse
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {rig ? (
          <WarehouseTab inventory={rig.inventory} />
        ) : (
          <p className="text-xs text-fog">Loading…</p>
        )}
      </div>
    </aside>
  );
}
