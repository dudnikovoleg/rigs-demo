import { SHIPMENT_STATUSES, type ShipmentStatus } from "../types";

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  requested: "Requested",
  loading: "Loading",
  in_transit: "In transit",
  delivered: "Delivered",
};

export default function ShipmentTimeline({ status }: { status: ShipmentStatus }) {
  const current = SHIPMENT_STATUSES.indexOf(status);

  return (
    <ol className="flex">
      {SHIPMENT_STATUSES.map((step, i) => {
        const reached = i <= current;
        const active = i === current;
        return (
          <li key={step} className="relative flex flex-1 flex-col items-center">
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute right-1/2 top-[4px] h-px w-full ${
                  reached ? "bg-flare/60" : "bg-seam"
                }`}
              />
            )}
            <span
              className={`relative z-10 h-2 w-2 rounded-full border ${
                active
                  ? "border-flare bg-flare shadow-[0_0_0_3px_rgba(255,107,44,0.25)]"
                  : reached
                    ? "border-flare/60 bg-flare/60"
                    : "border-seam bg-hull"
              }`}
            />
            <span
              className={`mt-1.5 text-[9px] uppercase tracking-widest ${
                active ? "text-paper" : "text-fog"
              }`}
            >
              {STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
