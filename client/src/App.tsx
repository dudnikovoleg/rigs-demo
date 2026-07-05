import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MapView from "./components/MapView";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-sea text-paper">
        <header className="z-[1100] flex h-14 shrink-0 items-center justify-between border-b border-seam bg-hull px-5 shadow-lg">
          <h1 className="font-display text-[16px] uppercase tracking-[0.3em]">
            Rigs <span className="text-flare">·</span> Offshore Logistics
          </h1>
          <span className="font-display text-[11px] uppercase tracking-widest text-fog">
            North Sea
          </span>
        </header>

        <main className="relative flex-1">
          <MapView />
        </main>
      </div>
    </QueryClientProvider>
  );
}
