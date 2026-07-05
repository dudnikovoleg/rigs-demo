import { useItems } from "../api";
import type { ItemQuantity } from "../types";

interface Props {
  inventory: ItemQuantity[];
}

export default function WarehouseTab({ inventory }: Props) {
  const { data: items } = useItems();
  const catalog = new Map((items ?? []).map((item) => [item.id, item]));

  return (
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
          <p className="py-2 text-xs text-fog">No inventory recorded for this installation.</p>
        )}
      </div>
    </section>
  );
}
