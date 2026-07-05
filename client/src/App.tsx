import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MapView from "./components/MapView";
import RigPanel from "./components/RigPanel";

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
  const changeDrawer = (next: DrawerState) => {
    setSelectedShipmentId(null);
    setDrawer(next);
  };

  // Keep the last open drawer content so the panel stays populated during
  // the slide-out transition.
  const [shown, setShown] = useState<OpenDrawerState>({ view: "list" });
  useEffect(() => {
    if (drawer.view !== "closed") setShown(drawer);
  }, [drawer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedShipmentId(null);
        setDrawer({ view: "closed" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
              className="rounded border border-seam px-3 py-1 font-display text-[11px] uppercase tracking-widest text-fog transition-colors hover:border-flare hover:text-paper focus-visible:outline focus-visible:outline-flare"
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
          />
          <RigPanel
            open={drawer.view !== "closed"}
            shown={shown}
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
