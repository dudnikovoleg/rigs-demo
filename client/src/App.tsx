import { useCallback, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MapView from "./components/MapView";
import RigPanel, { type Tab } from "./components/RigPanel";

const queryClient = new QueryClient();

// Drawer UI state (spec §5).
type DrawerState =
  | { view: "closed" }
  | { view: "list" }
  | { view: "detail"; rigId: string };

type OpenDrawerState = Exclude<DrawerState, { view: "closed" }>;

export default function App() {
  const [drawer, setDrawer] = useState<DrawerState>({ view: "closed" });

  // Selected in-transit shipment (Shipments tab ↔ vessel marker), same
  // App-owned pattern as the selected rig. Scoped to one rig's tab, so any
  // drawer change drops it.
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);

  // Tab the detail view opens on; `seq` bumps per open action so a vessel
  // click switches to Shipments even when its rig is already shown.
  const [detailTab, setDetailTab] = useState<{ tab: Tab; seq: number }>({
    tab: "warehouse",
    seq: 0,
  });

  const changeDrawer = useCallback((next: DrawerState) => {
    setSelectedShipmentId(null);
    if (next.view !== "closed")
      setDetailTab((prev) => ({ tab: "warehouse", seq: prev.seq + 1 }));
    setDrawer(next);
  }, []);

  // Vessel click (spec §2): open the shipment's rig on the Shipments tab with
  // that shipment selected — one combined action, since changeDrawer clears
  // the selection.
  const openShipment = (rigId: string, shipmentId: string) => {
    setDrawer({ view: "detail", rigId });
    setSelectedShipmentId(shipmentId);
    setDetailTab((prev) => ({ tab: "shipments", seq: prev.seq + 1 }));
  };

  // Keep the last open drawer content so the panel stays populated during
  // the slide-out transition.
  const [shown, setShown] = useState<OpenDrawerState>({ view: "list" });
  useEffect(() => {
    if (drawer.view !== "closed") setShown(drawer);
  }, [drawer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") changeDrawer({ view: "closed" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeDrawer]);

  const selectedRigId = drawer.view === "detail" ? drawer.rigId : null;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-sea text-paper">
        <header className="z-[1100] flex h-14 shrink-0 items-center justify-between border-b border-seam bg-hull px-5 shadow-lg">
          <h1 className="font-display text-[16px] uppercase tracking-[0.3em]">
            Rigs <span className="text-flare">·</span> Offshore Logistics
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => changeDrawer({ view: "list" })}
              className="cursor-pointer rounded border border-seam px-3 py-1 font-display text-[11px] uppercase tracking-widest text-flare transition-colors hover:border-flare hover:bg-flare/10 focus-visible:outline focus-visible:outline-flare"
            >
              All rigs
            </button>
            <span className="font-display text-[11px] uppercase tracking-widest text-fog">
              North Sea
            </span>
          </div>
        </header>

        <main className="relative flex-1">
          <MapView
            selectedRigId={selectedRigId}
            selectedShipmentId={selectedShipmentId}
            onSelectRig={(id) =>
              changeDrawer(id ? { view: "detail", rigId: id } : { view: "closed" })
            }
            onOpenShipment={openShipment}
          />
          <RigPanel
            open={drawer.view !== "closed"}
            shown={shown}
            detailTab={detailTab}
            selectedShipmentId={selectedShipmentId}
            onSelectShipment={setSelectedShipmentId}
            onSelectRig={(id) => changeDrawer({ view: "detail", rigId: id })}
            onShowList={() => changeDrawer({ view: "list" })}
            onClose={() => changeDrawer({ view: "closed" })}
          />
        </main>
      </div>
    </QueryClientProvider>
  );
}
