import { useEffect, useState } from "react";
import MapView from "./components/MapView";
import RigPanel from "./components/RigPanel";
import type { DrawerContent } from "./components/RigPanel";

type DrawerState = { view: "closed" } | DrawerContent;

export default function App() {
  const [drawer, setDrawer] = useState<DrawerState>({ view: "closed" });

  // Keep the last open content so the drawer stays populated during the
  // slide-out transition.
  const [shown, setShown] = useState<DrawerContent | null>(null);
  useEffect(() => {
    if (drawer.view !== "closed") setShown(drawer);
  }, [drawer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer({ view: "closed" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectedRigId = drawer.view === "detail" ? drawer.rigId : null;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-sea text-paper">
      <header className="z-[1100] flex h-14 shrink-0 items-center justify-between border-b border-seam bg-hull px-5 shadow-lg">
        <h1 className="font-display text-[16px] uppercase tracking-[0.3em]">
          Rigs <span className="text-flare">·</span> North Sea
        </h1>
        <button
          onClick={() => setDrawer({ view: "list" })}
          className="rounded border border-seam px-3 py-1.5 font-display text-[11px] uppercase tracking-widest text-fog transition-colors hover:border-flare hover:text-paper focus-visible:outline focus-visible:outline-flare"
        >
          All rigs
        </button>
      </header>

      <main className="relative flex-1">
        <MapView
          selectedRigId={selectedRigId}
          onSelectRig={(id) => setDrawer(id ? { view: "detail", rigId: id } : { view: "closed" })}
        />
        <RigPanel
          open={drawer.view !== "closed"}
          content={shown}
          onClose={() => setDrawer({ view: "closed" })}
          onBack={() => setDrawer({ view: "list" })}
          onOpenRig={(id) => setDrawer({ view: "detail", rigId: id })}
        />
      </main>
    </div>
  );
}
