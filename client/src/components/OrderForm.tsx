import { useState, type FormEvent } from "react";
import { useCreateShipment, useItems } from "../api";
import { SHIPMENT_STATUSES, type ShipmentStatus } from "../types";
import { STATUS_LABELS } from "./ShipmentTimeline";

interface Props {
  rigId: string;
  /** Called after a successful order or on cancel. */
  onClose: () => void;
}

/** Order goods (spec §2, ADR-002): item + quantity + initial status → POST /api/shipments. */
export default function OrderForm({ rigId, onClose }: Props) {
  const { data: items } = useItems();
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState<ShipmentStatus>("requested");
  const [progress, setProgress] = useState("0.5");
  const createShipment = useCreateShipment();

  // Default to the first catalog item until the user picks one.
  const selectedId = itemId || items?.[0]?.id || "";
  const selectedItem = items?.find((item) => item.id === selectedId);
  const qty = Number(quantity);
  const prog = Number(progress);
  const progressValid =
    status !== "in_transit" || (progress !== "" && Number.isFinite(prog) && prog >= 0 && prog <= 1);
  const valid = selectedId !== "" && Number.isInteger(qty) && qty > 0 && progressValid;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid || createShipment.isPending) return;
    createShipment.mutate(
      {
        rigId,
        itemId: selectedId,
        quantity: qty,
        status,
        ...(status === "in_transit" ? { progress: prog } : {}),
      },
      { onSuccess: onClose },
    );
  }

  const fieldClass =
    "w-full rounded border border-seam bg-deck/60 px-2 py-1.5 text-sm text-paper focus-visible:outline focus-visible:outline-flare";

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-start justify-between">
        <h3 className="font-display text-[11px] uppercase tracking-[0.25em] text-fog">
          Order goods
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel order"
          className="-mr-1 -mt-1 rounded px-2 py-0.5 text-fog transition-colors hover:text-paper focus-visible:outline focus-visible:outline-flare"
        >
          ✕
        </button>
      </div>

      <label className="mt-2 block text-[10px] uppercase tracking-widest text-fog">
        Item
        <select
          value={selectedId}
          onChange={(e) => setItemId(e.target.value)}
          className={`mt-1 ${fieldClass}`}
        >
          {(items ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.category}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 block text-[10px] uppercase tracking-widest text-fog">
        Quantity{selectedItem ? ` (${selectedItem.unit})` : ""}
        <input
          type="number"
          min={1}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className={`mt-1 ${fieldClass} font-mono`}
        />
      </label>

      <label className="mt-3 block text-[10px] uppercase tracking-widest text-fog">
        Status
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
          className={`mt-1 ${fieldClass}`}
        >
          {SHIPMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      {status === "in_transit" && (
        <label className="mt-3 block text-[10px] uppercase tracking-widest text-fog">
          Progress (0–1)
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            className={`mt-1 ${fieldClass} font-mono`}
          />
        </label>
      )}

      <button
        type="submit"
        disabled={!valid || createShipment.isPending}
        className="mt-4 w-full rounded border border-flare/70 py-2 font-display text-[12px] uppercase tracking-[0.2em] text-flare transition-colors hover:bg-flare/10 focus-visible:outline focus-visible:outline-flare disabled:cursor-not-allowed disabled:border-seam disabled:text-fog"
      >
        {createShipment.isPending ? "Placing order…" : "Place order"}
      </button>

      {createShipment.isError && (
        <p className="mt-2 text-xs text-amber-400">
          Order failed: {createShipment.error.message}
        </p>
      )}
    </form>
  );
}
