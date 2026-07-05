import { useState, type FormEvent } from "react";
import { useCreateShipment, useItems } from "../api";

interface Props {
  rigId: string;
  /** Called after a successful order or on cancel. */
  onClose: () => void;
}

/** Order goods (spec §2): pick an item from the catalog + quantity → POST /api/shipments. */
export default function OrderForm({ rigId, onClose }: Props) {
  const { data: items } = useItems();
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const createShipment = useCreateShipment();

  // Default to the first catalog item until the user picks one.
  const selectedId = itemId || items?.[0]?.id || "";
  const selectedItem = items?.find((item) => item.id === selectedId);
  const qty = Number(quantity);
  const valid = selectedId !== "" && Number.isInteger(qty) && qty > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid || createShipment.isPending) return;
    createShipment.mutate(
      { rigId, itemId: selectedId, quantity: qty },
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
