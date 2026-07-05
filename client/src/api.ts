import { useQuery } from "@tanstack/react-query";
import type { Item, RigDetail, RigSummary } from "./types";

// Query keys, one entry per API resource. Mutations invalidate by these keys
// (the order mutation in slice 6 must invalidate both shipments and rigs).
export const queryKeys = {
  rigs: ["rigs"] as const,
  rig: (id: string) => ["rigs", id] as const,
  items: ["items"] as const,
  ports: ["ports"] as const,
  shipments: (rigId?: string) => ["shipments", rigId ?? "all"] as const,
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
