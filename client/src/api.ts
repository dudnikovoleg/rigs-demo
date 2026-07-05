import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Item, NewShipmentInput, Port, RigDetail, RigSummary, Shipment } from "./types";

// Query keys, one entry per API resource. Mutations invalidate by these keys
// (the order mutation invalidates both shipments and rigs).
export const queryKeys = {
  rigs: ["rigs"] as const,
  rig: (id: string) => ["rigs", id] as const,
  items: ["items"] as const,
  ports: ["ports"] as const,
  shipments: (rigId?: string) => ["shipments", rigId ?? "all"] as const,
  /** Prefix matching every shipments query — what mutations invalidate. */
  shipmentsRoot: ["shipments"] as const,
};

// Relative paths only — the Vite dev proxy forwards /api to the server, and
// in production the server serves both (keeps slice 7 a server-only change).
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function useRigs() {
  return useQuery({
    queryKey: queryKeys.rigs,
    queryFn: () => fetchJson<RigSummary[]>("/api/rigs"),
  });
}

export function useRig(id: string | null) {
  return useQuery({
    queryKey: queryKeys.rig(id ?? ""),
    queryFn: () => fetchJson<RigDetail>(`/api/rigs/${id}`),
    enabled: id !== null,
  });
}

export function useItems() {
  return useQuery({
    queryKey: queryKeys.items,
    queryFn: () => fetchJson<Item[]>("/api/items"),
  });
}

export function usePorts() {
  return useQuery({
    queryKey: queryKeys.ports,
    queryFn: () => fetchJson<Port[]>("/api/ports"),
  });
}

/** All shipments — feeds vessel markers and route lines on the map. */
export function useAllShipments() {
  return useQuery({
    queryKey: queryKeys.shipments(),
    queryFn: () => fetchJson<Shipment[]>("/api/shipments"),
  });
}

/** Shipments touching one rig (origin or destination). */
export function useShipments(rigId: string | null) {
  return useQuery({
    queryKey: queryKeys.shipments(rigId ?? undefined),
    queryFn: () => fetchJson<Shipment[]>(`/api/shipments?rigId=${rigId}`),
    enabled: rigId !== null,
  });
}

/**
 * Order goods for a rig — the one real write. Invalidates shipments and
 * rigs (list-view counts change) so the new shipment shows up everywhere.
 */
export function useCreateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewShipmentInput) => {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`POST /api/shipments failed: ${res.status} ${res.statusText}`);
      return res.json() as Promise<Shipment>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.shipmentsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rigs });
    },
  });
}
